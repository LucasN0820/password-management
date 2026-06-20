const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

export function formatBytes(bytes?: number) {
  if (bytes === undefined || !Number.isFinite(bytes)) {
    return 'Unknown size';
  }

  const normalizedBytes = Math.max(0, bytes);
  if (normalizedBytes < 1024) {
    return `${Math.round(normalizedBytes)} B`;
  }

  const unitIndex = Math.min(
    Math.floor(Math.log(normalizedBytes) / Math.log(1024)),
    BYTE_UNITS.length - 1
  );
  const value = normalizedBytes / 1024 ** unitIndex;

  return `${value.toFixed(1)} ${BYTE_UNITS[unitIndex]}`;
}
