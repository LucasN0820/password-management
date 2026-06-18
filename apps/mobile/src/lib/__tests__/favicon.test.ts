import { describe, expect, it } from 'vitest';
import { faviconUrl, hostnameFromUrl } from '../favicon';

describe('hostnameFromUrl', () => {
  it('extracts host from full and scheme-less URLs', () => {
    expect(hostnameFromUrl('https://www.expo.dev/foo')).toBe('www.expo.dev');
    expect(hostnameFromUrl('expo.dev')).toBe('expo.dev');
    expect(hostnameFromUrl('http://sub.example.com:8080')).toBe(
      'sub.example.com'
    );
  });

  it('returns null for empty / unusable input', () => {
    expect(hostnameFromUrl('')).toBeNull();
    expect(hostnameFromUrl('   ')).toBeNull();
    expect(hostnameFromUrl(null)).toBeNull();
    expect(hostnameFromUrl(undefined)).toBeNull();
  });
});

describe('faviconUrl', () => {
  it('builds a favicon service URL for a valid host', () => {
    expect(faviconUrl('github.com')).toBe(
      'https://www.google.com/s2/favicons?domain=github.com&sz=64'
    );
  });

  it('honors a custom size', () => {
    expect(faviconUrl('https://x.com', 32)).toContain('sz=32');
  });

  it('returns null when no host can be resolved', () => {
    expect(faviconUrl('')).toBeNull();
    expect(faviconUrl(null)).toBeNull();
  });
});
