import Foundation
import UIKit
import UserNotifications

/// Mirrors the JS `NativeModelDownloadTask` shape.
struct ModelTask: Codable {
  let taskId: String
  let modelId: String
  var state: String
  let sourceUrl: String
  let partialPath: String
  let finalPath: String
  var downloadedBytes: Int64
  var totalBytes: Int64
  let createdAt: String
  var updatedAt: String
  var errorCode: String?

  func toDictionary() -> [String: Any] {
    var dict: [String: Any] = [
      "taskId": taskId,
      "modelId": modelId,
      "state": state,
      "sourceUrl": sourceUrl,
      "partialPath": partialPath,
      "finalPath": finalPath,
      "downloadedBytes": Double(downloadedBytes),
      "totalBytes": Double(totalBytes),
      "createdAt": createdAt,
      "updatedAt": updatedAt,
    ]
    if let errorCode { dict["errorCode"] = errorCode }
    return dict
  }
}

enum ModelDownloadState {
  static let starting = "starting"
  static let downloading = "downloading"
  static let waitingForNetwork = "waiting-for-network"
  static let waitingToResume = "waiting-to-resume"
  static let verifying = "verifying"
  static let cancelled = "cancelled-by-user"
  static let failed = "failed"
}

/// Owns the background `URLSession` transfer. The system transfer daemon keeps
/// the download running while the app is backgrounded or recycled; on relaunch
/// the same-identifier session is rebuilt and its task re-attached.
final class ModelDownloadManager: NSObject {
  static let shared = ModelDownloadManager()

  private let sessionIdentifier = (Bundle.main.bundleIdentifier ?? "app") + ".modeldownload"
  private let activeKey = "expo_model_download_active"
  private let notificationId = "expo_model_download"
  static let cancelActionId = "CANCEL_MODEL_DOWNLOAD"
  static let categoryId = "MODEL_DOWNLOAD"

  private let progressIntervalMs: Double = 500
  private var lastEmit: TimeInterval = 0

  /// Set by the module while the JS runtime is attached.
  var onUpdate: (([String: Any]) -> Void)?
  /// Stored by the AppDelegate subscriber for background URLSession events.
  var backgroundCompletionHandler: (() -> Void)?

  private lazy var session: URLSession = {
    let config = URLSessionConfiguration.background(withIdentifier: sessionIdentifier)
    config.sessionSendsLaunchEvents = true
    config.isDiscretionary = false
    config.allowsCellularAccess = true
    return URLSession(configuration: config, delegate: self, delegateQueue: nil)
  }()

  private var current: ModelTask? {
    didSet { persist() }
  }

  // MARK: - Public API

  func bootstrap() {
    current = loadPersisted()
    // Re-attach to any task the background session is still running.
    session.getAllTasks { tasks in
      // Touching the lazy session is enough to resume delegate callbacks.
      _ = tasks
    }
  }

  func start(task input: ModelTask) {
    var task = input
    task.state = ModelDownloadState.starting
    task.updatedAt = Self.nowIso()
    current = task
    registerCategory()
    emit(task)

    let partial = fileURL(task.partialPath)
    let existing = byteCount(of: partial)
    var request = URLRequest(url: URL(string: task.sourceUrl)!)
    if existing > 0 {
      request.setValue("bytes=\(existing)-", forHTTPHeaderField: "Range")
    }
    let downloadTask = session.downloadTask(with: request)
    downloadTask.taskDescription = task.taskId
    downloadTask.resume()
  }

  func resume(taskId: String) {
    guard let task = current, task.taskId == taskId else { return }
    if let data = loadResumeData() {
      let downloadTask = session.downloadTask(withResumeData: data)
      downloadTask.taskDescription = taskId
      downloadTask.resume()
      clearResumeData()
    } else {
      start(task: task)
    }
  }

  func cancel(taskId: String) {
    guard let task = current, task.taskId == taskId else {
      clearAll()
      return
    }
    session.getAllTasks { tasks in
      for t in tasks where t.taskDescription == taskId {
        t.cancel()
      }
      var cancelled = task
      cancelled.state = ModelDownloadState.cancelled
      cancelled.updatedAt = Self.nowIso()
      self.emit(cancelled)
      try? FileManager.default.removeItem(at: self.fileURL(task.partialPath))
      self.clearAll()
    }
  }

  func activeTask() -> [String: Any]? {
    current?.toDictionary()
  }

  // MARK: - Helpers

  private func emit(_ task: ModelTask, force: Bool = true) {
    let now = Date().timeIntervalSince1970 * 1000
    let isProgress = task.state == ModelDownloadState.downloading
    if isProgress && !force && now - lastEmit < progressIntervalMs { return }
    lastEmit = now
    current = task
    DispatchQueue.main.async { self.onUpdate?(task.toDictionary()) }
    updateNotification(task)
  }

  private func fileURL(_ path: String) -> URL {
    if let url = URL(string: path), url.isFileURL { return url }
    return URL(fileURLWithPath: path)
  }

  private func byteCount(of url: URL) -> Int64 {
    let attrs = try? FileManager.default.attributesOfItem(atPath: url.path)
    return (attrs?[.size] as? Int64) ?? 0
  }

  private static func nowIso() -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter.string(from: Date())
  }

  // MARK: - Persistence

  private func persist() {
    let defaults = UserDefaults.standard
    if let current, let data = try? JSONEncoder().encode(current) {
      defaults.set(data, forKey: activeKey)
    } else {
      defaults.removeObject(forKey: activeKey)
    }
  }

  private func loadPersisted() -> ModelTask? {
    guard let data = UserDefaults.standard.data(forKey: activeKey) else { return nil }
    return try? JSONDecoder().decode(ModelTask.self, from: data)
  }

  private func resumeDataURL() -> URL {
    let caches = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
    return caches.appendingPathComponent("model-download-resume.dat")
  }

  private func saveResumeData(_ data: Data) { try? data.write(to: resumeDataURL()) }
  private func loadResumeData() -> Data? { try? Data(contentsOf: resumeDataURL()) }
  private func clearResumeData() { try? FileManager.default.removeItem(at: resumeDataURL()) }

  private func clearAll() {
    current = nil
    clearResumeData()
    removeNotification()
  }

  // MARK: - Notifications

  private func registerCategory() {
    UNUserNotificationCenter.current()
      .requestAuthorization(options: [.alert]) { _, _ in }
    let cancel = UNNotificationAction(
      identifier: Self.cancelActionId,
      title: "Cancel",
      options: [.destructive]
    )
    let category = UNNotificationCategory(
      identifier: Self.categoryId,
      actions: [cancel],
      intentIdentifiers: [],
      options: []
    )
    UNUserNotificationCenter.current().setNotificationCategories([category])
  }

  private func updateNotification(_ task: ModelTask) {
    guard task.state == ModelDownloadState.downloading
      || task.state == ModelDownloadState.starting else {
      if task.state == ModelDownloadState.verifying { removeNotification() }
      return
    }
    let percent = task.totalBytes > 0
      ? Int(task.downloadedBytes * 100 / task.totalBytes) : 0
    let content = UNMutableNotificationContent()
    content.title = "Downloading AI model"
    content.body = "\(percent)% · \(task.modelId)"
    content.categoryIdentifier = Self.categoryId
    content.userInfo = ["url": deepLink()]
    content.sound = nil
    let request = UNNotificationRequest(
      identifier: notificationId,
      content: content,
      trigger: nil
    )
    UNUserNotificationCenter.current().add(request)
  }

  private func removeNotification() {
    UNUserNotificationCenter.current()
      .removePendingNotificationRequests(withIdentifiers: [notificationId])
    UNUserNotificationCenter.current()
      .removeDeliveredNotifications(withIdentifiers: [notificationId])
  }

  func deepLink() -> String {
    let scheme = (Bundle.main.object(forInfoDictionaryKey: "CFBundleURLTypes")
      as? [[String: Any]])?
      .compactMap { ($0["CFBundleURLSchemes"] as? [String])?.first }
      .first ?? "app"
    return "\(scheme)://ai-import"
  }
}

// MARK: - URLSession background delegate

extension ModelDownloadManager: URLSessionDownloadDelegate {
  func urlSession(
    _ session: URLSession,
    downloadTask: URLSessionDownloadTask,
    didWriteData bytesWritten: Int64,
    totalBytesWritten: Int64,
    totalBytesExpectedToWrite: Int64
  ) {
    guard var task = current,
      downloadTask.taskDescription == task.taskId else { return }
    task.state = ModelDownloadState.downloading
    task.downloadedBytes = totalBytesWritten
    if totalBytesExpectedToWrite > 0 { task.totalBytes = totalBytesExpectedToWrite }
    task.updatedAt = Self.nowIso()
    emit(task, force: false)
  }

  func urlSession(
    _ session: URLSession,
    downloadTask: URLSessionDownloadTask,
    didFinishDownloadingTo location: URL
  ) {
    guard var task = current,
      downloadTask.taskDescription == task.taskId else { return }
    let destination = fileURL(task.partialPath)
    try? FileManager.default.removeItem(at: destination)
    do {
      try FileManager.default.createDirectory(
        at: destination.deletingLastPathComponent(),
        withIntermediateDirectories: true
      )
      try FileManager.default.moveItem(at: location, to: destination)
      task.state = ModelDownloadState.verifying
      task.downloadedBytes = byteCount(of: destination)
      task.updatedAt = Self.nowIso()
      emit(task)
    } catch {
      task.state = ModelDownloadState.failed
      task.errorCode = "move-failed"
      task.updatedAt = Self.nowIso()
      emit(task)
    }
  }

  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    didCompleteWithError error: Error?
  ) {
    guard let error, var model = current,
      task.taskDescription == model.taskId else { return }
    // A user cancel already moved the task to its terminal state.
    if model.state == ModelDownloadState.cancelled { return }

    let nsError = error as NSError
    if let resumeData =
      nsError.userInfo[NSURLSessionDownloadTaskResumeData] as? Data {
      saveResumeData(resumeData)
    }
    model.state = nsError.code == NSURLErrorNotConnectedToInternet
      ? ModelDownloadState.waitingForNetwork
      : ModelDownloadState.waitingToResume
    model.updatedAt = Self.nowIso()
    emit(model)
  }

  func urlSessionDidFinishEvents(forBackgroundURLSession session: URLSession) {
    DispatchQueue.main.async {
      self.backgroundCompletionHandler?()
      self.backgroundCompletionHandler = nil
    }
  }
}

// MARK: - Notification responses

extension ModelDownloadManager: UNUserNotificationCenterDelegate {
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    if response.actionIdentifier == Self.cancelActionId {
      if let taskId = current?.taskId { cancel(taskId: taskId) }
    } else if response.actionIdentifier == UNNotificationDefaultActionIdentifier {
      // Tapping the body routes into the app via its own URL scheme; Expo Router
      // handles the deep link exactly like the Android ACTION_VIEW intent.
      if let url = URL(string: deepLink()) {
        DispatchQueue.main.async { UIApplication.shared.open(url) }
      }
    }
    completionHandler()
  }
}
