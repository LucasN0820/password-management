package expo.modules.modeldownload

import android.content.Context

/**
 * Single source of truth for the one active download. Persists to
 * SharedPreferences so the task survives JS-runtime recycling and process
 * restarts, and forwards live updates to the module's event emitter when the JS
 * runtime is attached.
 */
object DownloadStore {
  private const val PREFS = "expo_model_download"
  private const val KEY_ACTIVE = "active_task"

  @Volatile
  var current: ModelTask? = null
    private set

  private var listener: ((ModelTask) -> Unit)? = null

  private fun prefs(context: Context) =
    context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun setListener(value: ((ModelTask) -> Unit)?) {
    listener = value
  }

  /** Re-hydrate the active task into memory (called on module create). */
  fun load(context: Context): ModelTask? {
    val raw = prefs(context).getString(KEY_ACTIVE, null) ?: return null
    current = ModelTask.fromJson(raw)
    return current
  }

  @Synchronized
  fun update(context: Context, task: ModelTask) {
    current = task
    prefs(context).edit().putString(KEY_ACTIVE, task.toJson()).apply()
    listener?.invoke(task)
  }

  @Synchronized
  fun clear(context: Context) {
    current = null
    prefs(context).edit().remove(KEY_ACTIVE).apply()
  }
}
