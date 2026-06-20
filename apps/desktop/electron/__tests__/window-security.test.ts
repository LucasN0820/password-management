import type { WebContents } from 'electron';
import { describe, expect, it, vi } from 'vitest';
import {
  addContentSecurityPolicyHeader,
  attachNavigationGuards,
  getContentSecurityPolicy,
  isAllowedNavigation,
  SECURE_WEB_PREFERENCES,
  shouldEnableDevTools,
} from '../window-security';

interface TestNavigationEvent {
  preventDefault: () => void;
  url: string;
}

interface TestNavigationDetails {
  url: string;
}

type TestNavigationListener = (event: TestNavigationEvent) => void;

type TestWindowOpenHandler = (details: TestNavigationDetails) => {
  action: 'deny';
};

describe('window security policy', () => {
  it('uses sandboxed, isolated renderer preferences', () => {
    expect(SECURE_WEB_PREFERENCES).toEqual({
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    });
  });

  it('keeps production CSP strict while relaxing scripts for the dev server', () => {
    const production = getContentSecurityPolicy(false);
    const development = getContentSecurityPolicy(true);

    expect(production).toContain("default-src 'self'");
    expect(production).toContain("script-src 'self'");
    expect(production).toContain("object-src 'none'");
    expect(production).not.toContain('unsafe-eval');
    expect(production).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(production).not.toContain('localhost');

    // The Vite dev server's inline React Refresh preamble and HMR require
    // these in development only.
    expect(development).toContain('ws://localhost:5173');
    expect(development).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
  });

  it('replaces existing CSP headers without changing other response headers', () => {
    const headers = addContentSecurityPolicyHeader(
      {
        'content-security-policy': ["default-src * 'unsafe-eval'"],
        'X-Frame-Options': ['DENY'],
      },
      false
    );

    expect(headers['content-security-policy']).toBeUndefined();
    expect(headers['Content-Security-Policy']?.[0]).not.toContain(
      'unsafe-eval'
    );
    expect(headers['X-Frame-Options']).toEqual(['DENY']);
  });

  it('disables DevTools for packaged builds', () => {
    expect(shouldEnableDevTools(true)).toBe(false);
    expect(shouldEnableDevTools(false)).toBe(true);
  });
});

describe('navigation guards', () => {
  it('allows only the application origin or exact packaged document', () => {
    expect(
      isAllowedNavigation(
        'http://localhost:5173/password',
        'http://localhost:5173/'
      )
    ).toBe(true);
    expect(
      isAllowedNavigation('https://example.com/', 'http://localhost:5173/')
    ).toBe(false);
    expect(
      isAllowedNavigation(
        'file:///C:/app/dist/index.html#/search',
        'file:///C:/app/dist/index.html'
      )
    ).toBe(true);
    expect(
      isAllowedNavigation(
        'file:///C:/Users/person/other.html',
        'file:///C:/app/dist/index.html'
      )
    ).toBe(false);
  });

  it('blocks external navigation and all window-open requests', () => {
    let navigateListener: TestNavigationListener | undefined;
    let openHandler: TestWindowOpenHandler | undefined;
    const webContents = {
      on: vi.fn((_event, listener) => {
        navigateListener = listener;
      }),
      setWindowOpenHandler: vi.fn(handler => {
        openHandler = handler;
      }),
    };
    const preventDefault = vi.fn();

    attachNavigationGuards(
      webContents as unknown as WebContents,
      'http://localhost:5173/'
    );
    navigateListener?.({
      preventDefault,
      url: 'https://phishing.example/',
    });

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(openHandler?.({ url: 'https://phishing.example/' })).toEqual({
      action: 'deny',
    });
  });
});
