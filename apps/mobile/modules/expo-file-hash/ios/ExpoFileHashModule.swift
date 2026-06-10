import CryptoKit
import ExpoModulesCore

public class ExpoFileHashModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoFileHash")

    AsyncFunction("sha256") { (uri: String) throws -> String in
      let url: URL
      if let parsed = URL(string: uri), parsed.isFileURL {
        url = parsed
      } else {
        url = URL(fileURLWithPath: uri)
      }

      guard let stream = InputStream(url: url) else {
        throw FileHashException(uri)
      }

      stream.open()
      defer { stream.close() }

      var hasher = SHA256()
      let bufferSize = 1024 * 1024
      let buffer = UnsafeMutablePointer<UInt8>.allocate(capacity: bufferSize)
      defer { buffer.deallocate() }

      while stream.hasBytesAvailable {
        let count = stream.read(buffer, maxLength: bufferSize)
        if count < 0 {
          throw FileHashException(uri)
        }
        if count == 0 {
          break
        }
        hasher.update(data: Data(bytes: buffer, count: count))
      }

      return hasher.finalize().map { String(format: "%02x", $0) }.joined()
    }
  }
}

private class FileHashException: GenericException<String> {
  override var reason: String {
    "Unable to calculate SHA-256 for file: \(param)"
  }
}
