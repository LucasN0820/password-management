import React from 'react';

/**
 * Vault Card — warm paper surface with a hairline border and soft rest
 * shadow. `hoverable` lifts it on hover (feature-grid behaviour); `tone`
 * 'cream' / 'dark' switch the surface.
 */
export function Card({ hoverable = false, tone = 'card', style = {}, children, ...props }) {
  const [hover, setHover] = React.useState(false);
  const tones = {
    card:  { bg: 'var(--surface-card)', fg: 'var(--text-primary)', border: 'var(--border-color)' },
    cream: { bg: 'var(--paper-3)', fg: 'var(--text-primary)', border: 'var(--border-color)' },
    dark:  { bg: 'var(--surface-dark)', fg: 'var(--text-on-dark)', border: 'transparent' },
  };
  const t = tones[tone] || tones.card;
  const base = {
    background: t.bg,
    color: t.fg,
    border: `1px solid ${hover && hoverable ? 'var(--sand)' : t.border}`,
    borderRadius: 'var(--radius-2xl)',
    padding: 28,
    boxShadow: hover && hoverable ? 'var(--shadow-feature)' : 'var(--shadow-vault)',
    transition: 'box-shadow 200ms ease, border-color 200ms ease, transform 200ms ease',
    transform: hover && hoverable ? 'translateY(-2px)' : 'none',
    ...style,
  };
  return (
    <div
      style={base}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...props}
    >
      {children}
    </div>
  );
}
