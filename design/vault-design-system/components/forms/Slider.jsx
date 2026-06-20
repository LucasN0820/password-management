import React from 'react';

/**
 * Vault Slider — single-thumb range used for password length. Filled track
 * is ink; the thumb is paper with a sand ring. Click-drag along the track.
 */
export function Slider({
  value = 16,
  min = 4,
  max = 64,
  step = 1,
  onValueChange,
  style = {},
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const pct = ((value - min) / (max - min)) * 100;

  const setFromClientX = (clientX) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const raw = min + ratio * (max - min);
    const stepped = Math.round(raw / step) * step;
    onValueChange?.(Math.min(max, Math.max(min, stepped)));
  };

  React.useEffect(() => {
    if (!dragging) return;
    const move = (e) => setFromClientX(e.clientX);
    const up = () => setDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [dragging]);

  const wrap = {
    position: 'relative',
    height: 18,
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    ...style,
  };

  return (
    <div
      ref={trackRef}
      style={wrap}
      onMouseDown={(e) => { setDragging(true); setFromClientX(e.clientX); }}
    >
      <div style={{ position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 'var(--radius-full)', background: 'var(--paper-5)' }} />
      <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: 6, borderRadius: 'var(--radius-full)', background: 'var(--ink-1)' }} />
      <div
        style={{
          position: 'absolute',
          left: `calc(${pct}% - 9px)`,
          width: 18,
          height: 18,
          borderRadius: 'var(--radius-full)',
          background: 'var(--paper-0)',
          border: '1px solid var(--sand)',
          boxShadow: dragging ? 'var(--shadow-feature)' : 'var(--shadow-sm)',
          transition: dragging ? 'none' : 'box-shadow 150ms ease',
        }}
      />
    </div>
  );
}
