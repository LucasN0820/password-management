package expo.modules.modeldownload

import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class StartInput : Record {
  @Field val taskId: String = ""
  @Field val modelId: String = ""
  @Field val url: String = ""
  @Field val destination: String = ""
  @Field val expectedBytes: Double = 0.0
}

class ExpoModelDownloadModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw MissingContextException()

  override fun definition() = ModuleDefinition {
    Name("ExpoModelDownload")

    Events("onModelDownloadUpdate")

    OnCreate {
      DownloadStore.setListener { task ->
        sendEvent("onModelDownloadUpdate", task.toBundle())
      }
      appContext.reactContext?.let { DownloadStore.load(it) }
    }

    OnDestroy {
      DownloadStore.setListener(null)
    }

    AsyncFunction("startModelDownload") { input: StartInput ->
      val intent = Intent(context, ModelDownloadService::class.java).apply {
        action = ModelDownloadService.ACTION_START
        putExtra(ModelDownloadService.EXTRA_TASK_ID, input.taskId)
        putExtra(ModelDownloadService.EXTRA_MODEL_ID, input.modelId)
        putExtra(ModelDownloadService.EXTRA_URL, input.url)
        putExtra(ModelDownloadService.EXTRA_DESTINATION, input.destination)
        putExtra(ModelDownloadService.EXTRA_EXPECTED_BYTES, input.expectedBytes.toLong())
      }
      ContextCompat.startForegroundService(context, intent)
    }

    AsyncFunction("getActiveModelDownload") {
      DownloadStore.current?.toBundle()
    }

    AsyncFunction("cancelModelDownload") { taskId: String ->
      val intent = Intent(context, ModelDownloadService::class.java).apply {
        action = ModelDownloadService.ACTION_CANCEL
        putExtra(ModelDownloadService.EXTRA_TASK_ID, taskId)
      }
      // The service may have already stopped; cancelling still needs to clean up.
      ContextCompat.startForegroundService(context, intent)
    }

    AsyncFunction("resumeModelDownload") { taskId: String ->
      val intent = Intent(context, ModelDownloadService::class.java).apply {
        action = ModelDownloadService.ACTION_RESUME
        putExtra(ModelDownloadService.EXTRA_TASK_ID, taskId)
      }
      ContextCompat.startForegroundService(context, intent)
    }
  }
}

private class MissingContextException :
  CodedException("ERR_MODEL_DOWNLOAD", "React context is unavailable.", null)
