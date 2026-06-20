import { createHash, timingSafeEqual } from 'node:crypto';
import { createReadStream } from 'node:fs';

export async function sha256File(path: string) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) {
    hash.update(chunk as Buffer);
  }
  return hash.digest('hex');
}

export async function assertFileSha256(
  path: string,
  expectedSha256: string,
  label: string
) {
  if (!/^[a-f0-9]{64}$/i.test(expectedSha256)) {
    throw new Error(`${label} has no valid trusted SHA256 configured.`);
  }
  const actual = await sha256File(path);
  const matches = timingSafeEqual(
    Buffer.from(actual, 'hex'),
    Buffer.from(expectedSha256, 'hex')
  );
  if (!matches) {
    throw new Error(
      `${label} failed integrity verification. Remove it and download a trusted copy.`
    );
  }
  return actual;
}
