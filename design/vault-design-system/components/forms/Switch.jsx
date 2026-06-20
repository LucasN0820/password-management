import React from 'react';

/**
 * Vault Switch — pill toggle. Checked fills with ink (primary); the thumb is
 * paper-white and slides. Used throughout the generator's option list.
 */
export function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
  size = 'default',
  style = {},
  ...props
}) {
  const dims = size === 'sm'
    ? { w: 24, h: 14, thumb: 12 }
    : { w: 32, h: 18, thumb: 16 };

  const track = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    width: dims.w,
    height: dims.h,
    flex: 'none',
    borderRadius: 'var(--radius-full)',
    background: checked ? 'var(--ink-1)' : 'var(--sand)',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'background 160ms ease',
    boxShadow: 'var(--shadow-xs)',
    padding: 0,
    ...style,
  };

  const thumb = {
    position: 'absolute',
    top: '50%',
    left: 1,
    width: dims.thumb,
    height: dims.thumb,
    borderRadius: 'var(--radius-full)',
    background: 'var(--paper-0)',
    transform: `translateY(-50%) translateX(${checked ? dims.w - dims.thumb - 3 : 0}px)`,
    transition: 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1)',
    boxShadow: '0 1px 2px rgb(0 0 0 / 0.2)',
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      style={track}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      {...props}
    >
      <span style={thumb} />
    </button>
  );
}
