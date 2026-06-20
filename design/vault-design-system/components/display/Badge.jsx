import React from 'react';

/**
 * Vault Badge — small status/label pill. `tone` picks the palette:
 * 'clay' tint (default), 'neutral', 'success', 'warning', 'danger', or
 * 'mono' for a monospace tag (AES-256, PBKDF2…).
 */
export function Badge({ tone = 'clay', style = {}, children, ...props }) {
  const tones = {
    clay:    { bg: 'var(--clay-tint)', fg: 'var(--clay-mid)', border: 'transparent' },
    neutral: { bg: 'var(--paper-4)', fg: 'var(--text-secondary)', border: 'transparent' },
    success: { bg: 'color-mix(in srgb, var(--green) 14%, white)', fg: 'var(--green)', border: 'transparent' },
    warning: { bg: 'color-mix(in srgb, var(--yellow) 16%, white)', fg: 'var(--yellow)', border: 'transparent' },
    danger:  { bg: 'color-mix(in srgb, var(--red) 12%, white)', fg: 'var(--red)', border: 'transparent' },
    mono:    { bg: 'var(--surface-card)', fg: 'var(--text-secondary)', border: 'var(--border-color)' },
    outline: { bg: 'transparent', fg: 'var(--text-secondary)', border: 'var(--border-color)' },
  };
  const t = tones[tone] || tones.clay;
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: tone === 'mono' ? '4px 10px' : '3px 10px',
    fontFamily: tone === 'mono' ? 'var(--font-mono)' : 'var(--font-body)',
    fontSize: tone === 'mono' ? 11 : 12,
    fontWeight: tone === 'mono' ? 400 : 600,
    lineHeight: 1.3,
    color: t.fg,
    background: t.bg,
    border: `1px solid ${t.border}`,
    borderRadius: tone === 'mono' ? 'var(--radius-sm)' : 'var(--radius-full)',
    whiteSpace: 'nowrap',
    ...style,
  };
  return <span style={base} {...props}>{children}</span>;
}
