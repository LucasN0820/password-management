package expo.modules.modeldownload

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.ConnectivityManager
import android.net.Uri
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import okhttp3.Call
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.RandomAccessFile
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

/**
 * Foreground service that performs the actual byte transfer. It keeps an
 * ongoing, low-importance notification with determinate progress and a Cancel
 * action, supports HTTP Range resume against the local partial file, and never
 * deletes the partial unless the user explicitly cancels.
 *
 * On Android 14+ this declares the `dataSync` foreground-service type, which is
 * the supported path for user-initiated downloads. A future refinement can move
 * to a User-Initiated Data Transfer job; the notification/cancel/persistence
 * contract here stays the same.
 */
class ModelDownloadService : Service() {
  companion object {
    const val ACTION_START = "expo.modules.modeldownload.START"
    const val ACTION_RESUME = "expo.modules.modeldownload.RESUME"
    const val ACTION_CANCEL = "expo.modules.modeldownload.CANCEL"

    const val EXTRA_TASK_ID = "taskId"
    const val EXTRA_MODEL_ID = "modelId"
    const val EXTRA_URL = "url"
    const val EXTRA_DESTINATION = "destination"
    const val EXTRA_EXPECTED_BYTES = "expectedBytes"

    private const val CHANNEL_ID = "model_download"
    private const val NOTIFICATION_ID = 0x4D44 // "MD"
    private const val PROGRESS_INTERVAL_MS = 500L
    private const val META_DEEP_LINK = "expo.modules.modeldownload.DEEP_LINK"
  }

  private val client = OkHttpClient.Builder()
    .connectTimeout(30, TimeUnit.SECONDS)
    .readTimeout(60, TimeUnit.SECONDS)
    .build()

  private var worker: Thread? = null

  @Volatile
  private var activeCall: Call? = null

  @Volatile
  private var cancelRequested = false

  // Incremented every time a new worker supersedes the previous one. A worker
  // whose captured generation no longer matches exits quietly.
  @Volatile
  private var generation = 0

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_CANCEL -> handleCancel()
      ACTION_START -> handleStart(intent, resume = false)
      ACTION_RESUME -> handleStart(intent, resume = true)
      else -> stopSelf()
    }
    return START_NOT_STICKY
  }

  private fun handleCancel() {
    cancelRequested = true
    activeCall?.cancel()
    val task = DownloadStore.current
    if (task != null) {
      val updated = task.copy(state = ModelDownloadState.CANCELLED, updatedAt = nowIso())
      DownloadStore.update(applicationContext, updated)
      File(task.partialPath).delete()
      DownloadStore.clear(applicationContext)
    }
    stopForegroundCompat()
    stopSelf()
  }

  private fun handleStart(intent: Intent, resume: Boolean) {
    val task = resolveTask(intent, resume) ?: run { stopSelf(); return }

    // A transfer for this task is already running — never start a second worker
    // against the same partial file (that is what makes progress jump around).
    val live = worker?.isAlive == true
    val current = DownloadStore.current
    if (live && current?.taskId == task.taskId &&
      current.state == ModelDownloadState.DOWNLOADING
    ) {
      return
    }

    cancelRequested = false
    // Supersede any previous worker: bump the generation and cancel its in-flight
    // request (OkHttp's blocking read ignores Thread.interrupt()).
    val myGeneration = ++generation
    activeCall?.cancel()

    createChannel()
    startForegroundCompat(buildNotification(task, 0))
    DownloadStore.update(
      applicationContext,
      task.copy(state = ModelDownloadState.STARTING, updatedAt = nowIso())
    )

    worker = Thread { runDownload(task, myGeneration) }.also { it.start() }
  }

  private fun resolveTask(intent: Intent, resume: Boolean): ModelTask? {
    if (resume) {
      val taskId = intent.getStringExtra(EXTRA_TASK_ID)
      return DownloadStore.current?.takeIf { it.taskId == taskId }
        ?: DownloadStore.load(applicationContext)?.takeIf { it.taskId == taskId }
    }
    val taskId = intent.getStringExtra(EXTRA_TASK_ID) ?: return null
    val url = intent.getStringExtra(EXTRA_URL) ?: return null
    val destination = intent.getStringExtra(EXTRA_DESTINATION) ?: return null
    return ModelTask(
      taskId = taskId,
      modelId = intent.getStringExtra(EXTRA_MODEL_ID) ?: "",
      state = ModelDownloadState.STARTING,
      sourceUrl = url,
      partialPath = destination,
      finalPath = destination.removeSuffix(".partial"),
      downloadedBytes = 0,
      totalBytes = intent.getLongExtra(EXTRA_EXPECTED_BYTES, 0),
      createdAt = nowIso(),
      updatedAt = nowIso(),
    )
  }

  private fun runDownload(task: ModelTask, myGeneration: Int) {
    val file = File(task.partialPath.removePrefix("file://"))
    file.parentFile?.mkdirs()

    if (!hasNetwork()) {
      finishWithState(task, ModelDownloadState.WAITING_FOR_NETWORK, file)
      return
    }

    val existing = if (file.exists()) file.length() else 0
    val request = Request.Builder()
      .url(task.sourceUrl)
      .apply { if (existing > 0) header("Range", "bytes=$existing-") }
      .build()

    try {
      val call = client.newCall(request)
      activeCall = call
      call.execute().use { response ->
        if (!response.isSuccessful) {
          finishWithState(task, ModelDownloadState.WAITING_TO_RESUME, file)
          return
        }

        // If the server ignored our Range request, restart from zero.
        val resumed = existing > 0 && response.code == 206
        if (existing > 0 && !resumed) file.delete()
        var downloaded = if (resumed) existing else 0L

        val body = response.body ?: run {
          finishWithState(task, ModelDownloadState.WAITING_TO_RESUME, file)
          return
        }
        val reportedTotal = body.contentLength().let { len ->
          if (len > 0) downloaded + len else task.totalBytes
        }
        val total = if (reportedTotal > 0) reportedTotal else task.totalBytes

        RandomAccessFile(file, "rw").use { out ->
          out.seek(downloaded)
          val source = body.byteStream()
          val buffer = ByteArray(1 shl 20)
          var lastTick = 0L
          publish(task, ModelDownloadState.DOWNLOADING, downloaded, total)

          while (true) {
            // Stop if cancelled, or if a newer worker has superseded this one.
            if (cancelRequested || myGeneration != generation) return
            val read = source.read(buffer)
            if (read < 0) break
            out.write(buffer, 0, read)
            downloaded += read

            val now = System.currentTimeMillis()
            if (now - lastTick >= PROGRESS_INTERVAL_MS) {
              lastTick = now
              publish(task, ModelDownloadState.DOWNLOADING, downloaded, total)
              updateNotification(task, percentOf(downloaded, total))
            }
          }
        }

        // A newer worker took over while we were finishing — let it own the task.
        if (myGeneration != generation) return
        // Bytes are on disk; hand verification back to JS.
        publish(task, ModelDownloadState.VERIFYING, downloaded, total)
        stopForegroundCompat()
        stopSelf()
      }
    } catch (_: Exception) {
      if (cancelRequested || myGeneration != generation) return
      val state =
        if (hasNetwork()) ModelDownloadState.WAITING_TO_RESUME
        else ModelDownloadState.WAITING_FOR_NETWORK
      finishWithState(task, state, file)
    } finally {
      activeCall = null
    }
  }

  private fun finishWithState(task: ModelTask, state: String, file: File) {
    val downloaded = if (file.exists()) file.length() else task.downloadedBytes
    publish(task, state, downloaded, task.totalBytes)
    stopForegroundCompat()
    stopSelf()
  }

  private fun publish(task: ModelTask, state: String, downloaded: Long, total: Long) {
    DownloadStore.update(
      applicationContext,
      task.copy(
        state = state,
        downloadedBytes = downloaded,
        totalBytes = total,
        updatedAt = nowIso(),
      )
    )
  }

  private fun percentOf(downloaded: Long, total: Long): Int =
    if (total > 0) ((downloaded * 100) / total).toInt().coerceIn(0, 100) else 0

  private fun hasNetwork(): Boolean {
    val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
      ?: return true
    val network = cm.activeNetwork ?: return false
    return cm.getNetworkCapabilities(network) != null
  }

  private fun createChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(NotificationManager::class.java)
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    val channel = NotificationChannel(
      CHANNEL_ID,
      "Model downloads",
      NotificationManager.IMPORTANCE_LOW,
    ).apply {
      setSound(null, null)
      enableVibration(false)
    }
    manager.createNotificationChannel(channel)
  }

  private fun buildNotification(task: ModelTask, percent: Int): Notification {
    val cancelIntent = PendingIntent.getBroadcast(
      this,
      0,
      Intent(this, CancelReceiver::class.java).apply {
        action = ACTION_CANCEL
        putExtra(EXTRA_TASK_ID, task.taskId)
      },
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.stat_sys_download)
      .setContentTitle("Downloading AI model")
      .setContentText("$percent% · ${task.modelId}")
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setProgress(100, percent, task.totalBytes <= 0)
      .setContentIntent(contentIntent())
      .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Cancel", cancelIntent)
      .build()
  }

  private fun updateNotification(task: ModelTask, percent: Int) {
    val manager = getSystemService(NotificationManager::class.java)
    manager.notify(NOTIFICATION_ID, buildNotification(task, percent))
  }

  private fun contentIntent(): PendingIntent {
    val deepLink = runCatching {
      packageManager
        .getApplicationInfo(packageName, android.content.pm.PackageManager.GET_META_DATA)
        .metaData
        ?.getString(META_DEEP_LINK)
    }.getOrNull()

    val intent = if (deepLink != null) {
      Intent(Intent.ACTION_VIEW, Uri.parse(deepLink)).setPackage(packageName)
    } else {
      packageManager.getLaunchIntentForPackage(packageName) ?: Intent()
    }
    return PendingIntent.getActivity(
      this,
      0,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun startForegroundCompat(notification: Notification) {
    ServiceCompat.startForeground(
      this,
      NOTIFICATION_ID,
      notification,
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
      } else {
        0
      },
    )
  }

  private fun stopForegroundCompat() {
    ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
  }

  private fun nowIso(): String {
    val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    format.timeZone = java.util.TimeZone.getTimeZone("UTC")
    return format.format(Date())
  }

  override fun onDestroy() {
    cancelRequested = true
    activeCall?.cancel()
    worker?.interrupt()
    super.onDestroy()
  }
}
