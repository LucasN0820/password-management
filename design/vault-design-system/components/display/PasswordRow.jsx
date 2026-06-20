import React from 'react';
import { Avatar } from './Avatar.jsx';

/**
 * Vault PasswordRow — a single entry in the password list. Icon tile, title +
 * username, an optional favorite star, and a trailing timestamp. `selected`
 * paints the warm active fill; otherwise hover tints.
 */
export function PasswordRow({
  title = '',
  username = '',
  letter,
  tone = 'var(--paper-5)',
  iconSrc,
  favorite = false,
  timeAgo,
  selected = false,
  onClick,
  onToggleFavorite,
  style = {},
}) {
  const [hover, setHover] = React.useState(false);
  const initial = letter ?? (title ? title[0].toUpperCase() : '•');

  const row = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    background: selected ? 'var(--surface-selected)' : (hover ? 'var(--paper-3)' : 'transparent'),
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 150ms ease',
    ...style,
  };

  return (
    <div
      role="option"
      aria-selected={selected}
      style={row}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Avatar letter={initial} tone={tone} src={iconSrc} size={36} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{title}</div>
        <div style={{
          fontSize: 12, color: 'var(--text-secondary)', marginTop: 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{username || 'No username'}</div>
      </div>
      {(favorite || hover) && (
        <button
          type="button"
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
          style={{
            flex: 'none', display: 'inline-flex', padding: 4, border: 'none',
            background: 'transparent', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
            color: favorite ? 'var(--clay)' : 'var(--text-tertiary)', lineHeight: 0,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24"
            fill={favorite ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 2 2.9 6.4 7 .8-5.2 4.7 1.4 6.9L12 17.3l-6.1 3.5 1.4-6.9L2.1 9.2l7-.8L12 2Z" />
          </svg>
        </button>
      )}
      {timeAgo && (
        <span style={{ flex: 'none', fontSize: 12, color: 'var(--text-tertiary)' }}>{timeAgo}</span>
      )}
    </div>
  );
}
