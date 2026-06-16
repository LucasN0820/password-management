package expo.modules.modeldownload

import android.os.Bundle
import org.json.JSONObject

/**
 * Flat, serialisable download task. Mirrors the JS `NativeModelDownloadTask`
 * shape so it crosses the bridge and the persisted manifest unchanged.
 */
data class ModelTask(
  val taskId: String,
  val modelId: String,
  var state: String,
  val sourceUrl: String,
  val partialPath: String,
  val finalPath: String,
  var downloadedBytes: Long,
  var totalBytes: Long,
  val createdAt: String,
  var updatedAt: String,
  var errorCode: String? = null,
) {
  fun toBundle(): Bundle = Bundle().apply {
    putString("taskId", taskId)
    putString("modelId", modelId)
    putString("state", state)
    putString("sourceUrl", sourceUrl)
    putString("partialPath", partialPath)
    putString("finalPath", finalPath)
    // JS numbers are doubles; byte counts fit exactly within 2^53.
    putDouble("downloadedBytes", downloadedBytes.toDouble())
    putDouble("totalBytes", totalBytes.toDouble())
    putString("createdAt", createdAt)
    putString("updatedAt", updatedAt)
    errorCode?.let { putString("errorCode", it) }
  }

  fun toJson(): String = JSONObject().apply {
    put("taskId", taskId)
    put("modelId", modelId)
    put("state", state)
    put("sourceUrl", sourceUrl)
    put("partialPath", partialPath)
    put("finalPath", finalPath)
    put("downloadedBytes", downloadedBytes)
    put("totalBytes", totalBytes)
    put("createdAt", createdAt)
    put("updatedAt", updatedAt)
    errorCode?.let { put("errorCode", it) }
  }.toString()

  companion object {
    fun fromJson(raw: String): ModelTask? = try {
      val json = JSONObject(raw)
      ModelTask(
        taskId = json.getString("taskId"),
        modelId = json.getString("modelId"),
        state = json.getString("state"),
        sourceUrl = json.getString("sourceUrl"),
        partialPath = json.getString("partialPath"),
        finalPath = json.getString("finalPath"),
        downloadedBytes = json.getLong("downloadedBytes"),
        totalBytes = json.getLong("totalBytes"),
        createdAt = json.getString("createdAt"),
        updatedAt = json.getString("updatedAt"),
        errorCode = if (json.has("errorCode")) json.getString("errorCode") else null,
      )
    } catch (_: Exception) {
      null
    }
  }
}

object ModelDownloadState {
  const val STARTING = "starting"
  const val DOWNLOADING = "downloading"
  const val WAITING_FOR_NETWORK = "waiting-for-network"
  const val WAITING_TO_RESUME = "waiting-to-resume"
  const val VERIFYING = "verifying"
  const val CANCELLED = "cancelled-by-user"
  const val FAILED = "failed"
}
