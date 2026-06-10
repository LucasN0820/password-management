package expo.modules.filehash

import android.net.Uri
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.FileInputStream
import java.io.InputStream
import java.security.MessageDigest

class ExpoFileHashModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoFileHash")

    AsyncFunction("sha256") { uri: String ->
      val context = appContext.reactContext ?: throw FileHashException(uri)
      val parsed = Uri.parse(uri)
      val input: InputStream = when (parsed.scheme) {
        "content" -> context.contentResolver.openInputStream(parsed)
          ?: throw FileHashException(uri)
        "file" -> FileInputStream(parsed.path ?: throw FileHashException(uri))
        else -> FileInputStream(uri)
      }

      input.use { stream ->
        val digest = MessageDigest.getInstance("SHA-256")
        val buffer = ByteArray(1024 * 1024)
        while (true) {
          val count = stream.read(buffer)
          if (count <= 0) break
          digest.update(buffer, 0, count)
        }
        digest.digest().joinToString("") { "%02x".format(it) }
      }
    }
  }
}

private class FileHashException(uri: String) :
  CodedException("ERR_FILE_HASH", "Unable to calculate SHA-256 for file: $uri", null)
