import React from 'react';

/**
 * Vault Button — ink-filled primary by default, with the shadcn-derived
 * variant set the product uses (default / secondary / outline / ghost /
 * destructive / link). Hover darkens; press is a 1px settle. All colors
 * come from Vault CSS custom properties.
 */
export function Button({
  variant = 'default',
  size = 'default',
  disabled = false,
  type = 'button',
  style = {},
  children,
  ...props
}) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);

  const sizes = {
    sm:      { height: 32, padding: '0 12px', fontSize: 13, gap: 6, radius: 'var(--radius-md)' },
    default: { height: 36, padding: '0 16px', fontSize: 14, gap: 8, radius: 'var(--radius-md)' },
    lg:      { height: 40, padding: '0 24px', fontSize: 15, gap: 8, radius: 'var(--radius-md)' },
    icon:    { height: 36, width: 36, padding: 0, fontSize: 14, gap: 0, radius: 'var(--radius-md)' },
    'icon-sm': { height: 32, width: 32, padding: 0, fontSize: 13, gap: 0, radius: 'var(--radius-md)' },
  };

  const palette = {
    default: {
      bg: 'var(--ink-1)', fg: 'var(--text-on-dark)', border: 'transparent',
      bgHover: 'var(--ink-3)', shadow: 'var(--shadow-xs)',
    },
    secondary: {
      bg: 'var(--paper-4)', fg: 'var(--text-primary)', border: 'transparent',
      bgHover: 'var(--paper-5)', shadow: 'none',
    },
    outline: {
      bg: 'var(--surface-card)', fg: 'var(--text-primary)', border: 'var(--border-color)',
      bgHover: 'var(--paper-4)', shadow: 'var(--shadow-xs)',
    },
    ghost: {
      bg: 'transparent', fg: 'var(--text-primary)', border: 'transparent',
      bgHover: 'var(--paper-4)', shadow: 'none',
    },
    destructive: {
      bg: 'var(--red)', fg: '#ffffff', border: 'transparent',
      bgHover: 'var(--clay-dark)', shadow: 'var(--shadow-xs)',
    },
    link: {
      bg: 'transparent', fg: 'var(--text-accent)', border: 'transparent',
      bgHover: 'transparent', shadow: 'none',
    },
  };

  const s = sizes[size] || sizes.default;
  const p = palette[variant] || palette.default;

  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: s.gap, whiteSpace: 'nowrap',
    height: s.height, width: s.width, padding: s.padding,
    fontFamily: 'var(--font-body)', fontSize: s.fontSize, fontWeight: 500,
    lineHeight: 1, borderRadius: s.radius,
    border: `1px solid ${p.border}`,
    background: hover && !disabled ? p.bgHover : p.bg,
    color: p.fg,
    boxShadow: p.shadow,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    textDecoration: variant === 'link' && hover ? 'underline' : 'none',
    transform: active && !disabled ? 'translateY(1px)' : 'none',
    transition: 'background 150ms ease, transform 100ms ease, color 150ms ease',
    userSelect: 'none',
    ...style,
  };

  return (
    <button
      type={type}
      disabled={disabled}
      style={base}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      {...props}
    >
      {children}
    </button>
  );
}
