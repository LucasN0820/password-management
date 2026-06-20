import React from 'react';

/**
 * Vault Keycap — a monospace <kbd> chip for keyboard shortcuts. Matches the
 * home-screen shortcut list and sidebar hints.
 */
export function Keycap({ children, style = {} }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 22,
    padding: '3px 8px',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--text-primary)',
    background: 'var(--paper-4)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
    ...style,
  };
  return <kbd style={base}>{children}</kbd>;
}
