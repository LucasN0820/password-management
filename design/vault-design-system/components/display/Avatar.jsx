import React from 'react';

/**
 * Vault Avatar — a square-rounded letter tile (brand "service" cards) or a
 * round initial chip. `tone` sets a soft tint background; pass `shape`
 * 'square' (services) or 'round' (people).
 */
export function Avatar({
  letter = '',
  tone = '#E8F0FE',
  shape = 'square',
  size = 34,
  src,
  style = {},
  ...props
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 'none',
    width: size,
    height: size,
    borderRadius: shape === 'round' ? 'var(--radius-full)' : 'var(--radius-md)',
    background: src ? 'var(--paper-4)' : tone,
    color: 'var(--ink-3)',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: Math.round(size * 0.42),
    overflow: 'hidden',
    border: shape === 'round' ? 'none' : '1px solid color-mix(in srgb, var(--ink-7) 18%, transparent)',
    ...style,
  };
  return (
    <span style={base} {...props}>
      {src
        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : letter}
    </span>
  );
}
