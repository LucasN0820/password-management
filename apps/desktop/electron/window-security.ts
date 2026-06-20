import type { WebContents } from 'electron';

export const SECURE_WEB_PREFERENCES = {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  webSecurity: true,
  allowRunningInsecureContent: false,
} as const;

const BASE_CSP_DIRECTIVES = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
];

export function getContentSecurityPolicy(isDevelopment: boolean) {
  // In development the Vite dev server injects an inline React Refresh
  // preamble (<script type="module">) and relies on eval for HMR, so the
  // renderer needs 'unsafe-inline'/'unsafe-eval'. Without them the preamble
  // never installs and React throws "can't detect preamble", leaving the
  // window blank. Packaged builds load static assets and stay strict.
  const scriptSrc = isDevelopment
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self'";

  const connectSources = isDevelopment
    ? "connect-src 'self' ws://localhost:5173 ws://127.0.0.1:5173"
    : "connect-src 'self'";

  return [...BASE_CSP_DIRECTIVES, scriptSrc, connectSources].join('; ');
}

export function addContentSecurityPolicyHeader(
  responseHeaders: Record<string, string[]> | undefined,
  isDevelopment: boolean
): Record<string, string[]> {
  const headers = Object.fromEntries(
    Object.entries(responseHeaders ?? {}).filter(
      ([name]) => name.toLowerCase() !== 'content-security-policy'
    )
  );

  return {
    ...headers,
    'Content-Security-Policy': [getContentSecurityPolicy(isDevelopment)],
  };
}

export function shouldEnableDevTools(isPackaged: boolean) {
  return !isPackaged;
}

export function isAllowedNavigation(targetUrl: string, appUrl: string) {
  try {
    const target = new URL(targetUrl);
    const expected = new URL(appUrl);

    if (expected.protocol === 'file:') {
      return (
        target.protocol === 'file:' &&
        decodeURIComponent(target.pathname) ===
          decodeURIComponent(expected.pathname)
      );
    }

    return target.origin === expected.origin;
  } catch {
    return false;
  }
}

export function attachNavigationGuards(
  webContents: WebContents,
  appUrl: string
) {
  webContents.on('will-navigate', event => {
    if (!isAllowedNavigation(event.url, appUrl)) {
      event.preventDefault();
    }
  });

  webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}
