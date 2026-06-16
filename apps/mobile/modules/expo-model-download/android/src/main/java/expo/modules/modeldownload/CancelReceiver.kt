package expo.modules.modeldownload

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

/**
 * Handles the notification Cancel action. Runs without the React Native runtime,
 * forwarding an explicit cancel to the service so it cleans up the partial and
 * tears down the notification.
 */
class CancelReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val serviceIntent = Intent(context, ModelDownloadService::class.java).apply {
      action = ModelDownloadService.ACTION_CANCEL
      putExtra(
        ModelDownloadService.EXTRA_TASK_ID,
        intent.getStringExtra(ModelDownloadService.EXTRA_TASK_ID)
      )
    }
    ContextCompat.startForegroundService(context, serviceIntent)
  }
}
