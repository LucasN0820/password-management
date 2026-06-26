const MASKED_VIEW_MANIFEST =
  'node_modules/@react-native-masked-view/masked-view/android/src/main/AndroidManifest.xml';
const MASKED_VIEW_PACKAGE = 'org.reactnative.maskedview';

const bufferedFiles = new Map();

function normalizeMaskedViewManifest(contents) {
  if (/\bpackage=/.test(contents)) return contents;

  return contents.replace(
    /<manifest\s+/,
    `<manifest package="${MASKED_VIEW_PACKAGE}" `
  );
}

module.exports = {
  fileHookTransform(source, chunk, isEndOfFile, encoding) {
    if (
      source.type !== 'file' ||
      !source.filePath.endsWith(MASKED_VIEW_MANIFEST)
    ) {
      return chunk;
    }

    const key = source.filePath;
    if (!isEndOfFile) {
      const current = bufferedFiles.get(key) ?? '';
      bufferedFiles.set(key, current + chunk.toString('utf8'));
      return null;
    }

    const contents = bufferedFiles.get(key) ?? '';
    bufferedFiles.delete(key);
    return normalizeMaskedViewManifest(contents);
  },
};
