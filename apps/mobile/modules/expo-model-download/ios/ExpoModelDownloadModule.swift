import ExpoModulesCore
import UserNotifications

struct StartRecord: Record {
  @Field var taskId: String = ""
  @Field var modelId: String = ""
  @Field var url: String = ""
  @Field var destination: String = ""
  @Field var expectedBytes: Double = 0
}

public class ExpoModelDownloadModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoModelDownload")

    Events("onModelDownloadUpdate")

    OnCreate {
      ModelDownloadManager.shared.onUpdate = { [weak self] payload in
        self?.sendEvent("onModelDownloadUpdate", payload)
      }
      UNUserNotificationCenter.current().delegate = ModelDownloadManager.shared
      ModelDownloadManager.shared.bootstrap()
    }

    AsyncFunction("startModelDownload") { (input: StartRecord) in
      let now = Self.nowIso()
      let task = ModelTask(
        taskId: input.taskId,
        modelId: input.modelId,
        state: ModelDownloadState.starting,
        sourceUrl: input.url,
        partialPath: input.destination,
        finalPath: input.destination.replacingOccurrences(
          of: ".partial", with: "", options: [.anchored, .backwards]
        ),
        downloadedBytes: 0,
        totalBytes: Int64(input.expectedBytes),
        createdAt: now,
        updatedAt: now,
        errorCode: nil
      )
      ModelDownloadManager.shared.start(task: task)
    }

    AsyncFunction("getActiveModelDownload") { () -> [String: Any]? in
      ModelDownloadManager.shared.activeTask()
    }

    AsyncFunction("cancelModelDownload") { (taskId: String) in
      ModelDownloadManager.shared.cancel(taskId: taskId)
    }

    AsyncFunction("resumeModelDownload") { (taskId: String) in
      ModelDownloadManager.shared.resume(taskId: taskId)
    }
  }

  private static func nowIso() -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter.string(from: Date())
  }
}
