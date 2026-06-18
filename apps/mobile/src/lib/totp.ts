/**
 * Pure RFC 6238 TOTP implementation.
 *
 * No native imports: everything runs on `Uint8Array`/`DataView` math so it is
 * safe on Hermes (no `BigInt`, no `Array#toSorted`/`findLast`, etc.) and can be
 * unit-tested under Node/Vitest by injecting the current time as a number.
 *
 * Pipeline: Base32-decode the shared secret → HMAC-SHA1 over the 8-byte time
 * counter → dynamic truncation → zero-padded N-digit code (RFC 4226 §5.3).
 */

const DEFAULT_PERIOD_SECONDS = 30;
const DEFAULT_DIGITS = 6;

export interface TotpOptions {
  /** Number of digits in the generated code. Defaults to 6. */
  digits?: number;
  /** Time step in seconds. Defaults to 30. */
  period?: number;
}

export interface TotpResult {
  /** The zero-padded N-digit code. */
  code: string;
  /** Seconds remaining until the current code expires (1..period). */
  secondsRemaining: number;
  /** Time step length in seconds. */
  period: number;
}

// ---------------------------------------------------------------------------
// Base32 (RFC 4648, no padding required)
// ---------------------------------------------------------------------------

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decode an RFC 4648 Base32 string into bytes. Whitespace and `=` padding are
 * ignored and the input is treated case-insensitively, matching how authenticator
 * secrets are commonly shared (grouped, lower- or upper-case).
 */
export function base32Decode(input: string): Uint8Array {
  const cleaned = input.replaceAll(/[\s=]/g, '').toUpperCase();
  if (cleaned.length === 0) {
    return new Uint8Array(0);
  }

  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleaned.length; i = i + 1) {
    const char = cleaned.charAt(i);
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base32 character: "${char}"`);
    }
    value = (value << 5) | index;
    bits = bits + 5;
    if (bits >= 8) {
      bits = bits - 8;
      bytes.push((value >>> bits) & 0xff);
    }
  }

  return Uint8Array.from(bytes);
}

/** Returns true when `secret` is a non-empty, valid Base32 string. */
export function isValidBase32Secret(secret: string): boolean {
  const cleaned = secret.replaceAll(/[\s=]/g, '');
  if (cleaned.length === 0) {
    return false;
  }
  return /^[A-Z2-7]+$/i.test(cleaned);
}

// ---------------------------------------------------------------------------
// SHA-1 (FIPS 180-4) over Uint8Array — no BigInt
// ---------------------------------------------------------------------------

const SHA1_BLOCK_BYTES = 64;

function rotl(value: number, shift: number): number {
  return (value << shift) | (value >>> (32 - shift));
}

function sha1(message: Uint8Array): Uint8Array {
  const messageLengthBits = message.length * 8;

  // Pad: 0x80, zeros, then 64-bit big-endian length.
  const withOne = message.length + 1;
  const totalLength = withOne + ((56 - (withOne % 64) + 64) % 64) + 8;
  const padded = new Uint8Array(totalLength);
  padded.set(message);
  padded[message.length] = 0x80;

  // 64-bit length: high 32 bits are always 0 for our inputs (well under 2^32 bits).
  const view = new DataView(padded.buffer);
  view.setUint32(totalLength - 8, Math.floor(messageLengthBits / 0x100000000));
  view.setUint32(totalLength - 4, messageLengthBits >>> 0);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const w = new Int32Array(80);

  for (
    let offset = 0;
    offset < totalLength;
    offset = offset + SHA1_BLOCK_BYTES
  ) {
    for (let i = 0; i < 16; i = i + 1) {
      w[i] = view.getInt32(offset + i * 4);
    }
    for (let i = 16; i < 80; i = i + 1) {
      w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let i = 0; i < 80; i = i + 1) {
      let f: number;
      let k: number;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (rotl(a, 5) + f + e + k + w[i]) | 0;
      e = d;
      d = c;
      c = rotl(b, 30);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
  }

  const out = new Uint8Array(20);
  const outView = new DataView(out.buffer);
  outView.setInt32(0, h0);
  outView.setInt32(4, h1);
  outView.setInt32(8, h2);
  outView.setInt32(12, h3);
  outView.setInt32(16, h4);
  return out;
}

// ---------------------------------------------------------------------------
// HMAC-SHA1 (RFC 2104)
// ---------------------------------------------------------------------------

function hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
  let blockKey = key;
  if (blockKey.length > SHA1_BLOCK_BYTES) {
    blockKey = sha1(blockKey);
  }

  const paddedKey = new Uint8Array(SHA1_BLOCK_BYTES);
  paddedKey.set(blockKey);

  const inner = new Uint8Array(SHA1_BLOCK_BYTES + message.length);
  const outerPrefix = new Uint8Array(SHA1_BLOCK_BYTES);
  for (let i = 0; i < SHA1_BLOCK_BYTES; i = i + 1) {
    const byte = paddedKey[i];
    inner[i] = byte ^ 0x36;
    outerPrefix[i] = byte ^ 0x5c;
  }
  inner.set(message, SHA1_BLOCK_BYTES);

  const innerHash = sha1(inner);
  const outer = new Uint8Array(SHA1_BLOCK_BYTES + innerHash.length);
  outer.set(outerPrefix);
  outer.set(innerHash, SHA1_BLOCK_BYTES);

  return sha1(outer);
}

// ---------------------------------------------------------------------------
// RFC 4226 / 6238
// ---------------------------------------------------------------------------

/** Encode a counter as an 8-byte big-endian buffer (no BigInt). */
function counterToBytes(counter: number): Uint8Array {
  const buffer = new Uint8Array(8);
  const view = new DataView(buffer.buffer);
  // Split into high/low 32-bit halves to stay within safe integer math.
  view.setUint32(0, Math.floor(counter / 0x100000000));
  view.setUint32(4, counter >>> 0);
  return buffer;
}

/** RFC 4226 HOTP: derive the N-digit code for a specific counter value. */
export function hotp(
  secret: Uint8Array,
  counter: number,
  digits: number = DEFAULT_DIGITS
): string {
  const hmac = hmacSha1(secret, counterToBytes(counter));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const modulo = 10 ** digits;
  return (binary % modulo).toString().padStart(digits, '0');
}

/**
 * Generate the current TOTP code for a Base32 secret.
 *
 * @param secret - Base32-encoded shared secret.
 * @param nowMs  - Current time in milliseconds (inject for testability).
 */
export function generateTotp(
  secret: string,
  nowMs: number = Date.now(),
  options: TotpOptions = {}
): TotpResult {
  const digits = options.digits ?? DEFAULT_DIGITS;
  const period = options.period ?? DEFAULT_PERIOD_SECONDS;
  const key = base32Decode(secret);
  const seconds = Math.floor(nowMs / 1000);
  const counter = Math.floor(seconds / period);
  const code = hotp(key, counter, digits);
  const secondsRemaining = period - (seconds % period);

  return { code, secondsRemaining, period };
}
