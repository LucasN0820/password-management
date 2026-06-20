import React from 'react';

/**
 * Vault Input — single-line field on a warm surface. Focus brings up a clay
 * ring + border, matching the app's search and form fields. Optional
 * `mono` for password/secret fields.
 */
export function Input({
  type = 'text',
  mono = false,
  disabled = false,
  style = {},
  ...props
}) {
  const [focus, setFocus] = React.useState(false);

  const base = {
    height: 36,
    width: '100%',
    boxSizing: 'border-box',
    padding: '0 12px',
    fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
    fontSize: 14,
    color: 'var(--text-primary)',
    background: 'var(--surface-card)',
    border: `1px solid ${focus ? 'var(--clay)' : 'var(--border-color)'}`,
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    boxShadow: focus ? '0 0 0 3px color-mix(in srgb, var(--clay) 22%, transparent)' : 'var(--shadow-xs)',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    opacity: disabled ? 0.5 : 1,
    ...style,
  };

  return (
    <input
      type={type}
      disabled={disabled}
      style={base}
      onFocus={(e) => { setFocus(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocus(false); props.onBlur?.(e); }}
      {...props}
    />
  );
}
