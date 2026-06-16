import ExpoModulesCore
import UIKit

/// Captures the background-session completion handler iOS hands to the app when
/// it relaunches to deliver finished transfer events, so the system knows when
/// the app has finished processing them.
public class ModelDownloadAppDelegate: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    handleEventsForBackgroundURLSession identifier: String,
    completionHandler: @escaping () -> Void
  ) {
    ModelDownloadManager.shared.backgroundCompletionHandler = completionHandler
    // Touch the manager so its background session is recreated and re-attaches.
    ModelDownloadManager.shared.bootstrap()
  }
}
