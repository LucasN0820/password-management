import { requireNativeModule } from 'expo';

interface ExpoFileHashModule {
  sha256(uri: string): Promise<string>;
}

let fileHash: ExpoFileHashModule | null = null;

function getFileHashModule() {
  if (!fileHash) {
    try {
      fileHash = requireNativeModule<ExpoFileHashModule>('ExpoFileHash');
    } catch {
      throw new Error(
        'ExpoFileHash native module is unavailable. Rebuild the app with `yarn ios` or `yarn android`.'
      );
    }
  }
  return fileHash;
}

export function sha256File(uri: string) {
  return getFileHashModule().sha256(uri);
}
