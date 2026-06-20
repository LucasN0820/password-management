import React from 'react';

/**
 * Vault StrengthMeter — the generator's password-strength bar. A thin track
 * fills proportionally and shifts hue by score: weak (red) → medium (yellow)
 * → strong (clay). Shows a label unless `compact`.
 */
export function StrengthMeter({ value = 0, compact = false, style = {} }) {
  const v = Math.min(100, Math.max(0, value));
  const color =
    v >= 80 ? 'var(--clay)' :
    v >= 50 ? 'var(--yellow)' :
    'var(--red)';
  const label =
    v >= 80 ? 'Very strong' :
    v >= 60 ? 'Strong' :
    v >= 40 ? 'Medium' :
    'Weak';

  return (
    <div style={{ ...style }}>
      <div style={{ height: 6, borderRadius: 'var(--radius-full)', background: 'var(--paper-5)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${v}%`,
          borderRadius: 'var(--radius-full)',
          background: color,
          transition: 'width 300ms ease, background 300ms ease',
        }} />
      </div>
      {!compact && (
        <div style={{
          marginTop: 6,
          fontSize: 12,
          fontWeight: 600,
          color,
          fontFamily: 'var(--font-body)',
        }}>{label}</div>
      )}
    </div>
  );
}
