/* @ds-bundle: {"format":3,"namespace":"VaultDesignSystem_ad3078","components":[{"name":"Avatar","sourcePath":"components/display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/display/Badge.jsx"},{"name":"Card","sourcePath":"components/display/Card.jsx"},{"name":"Keycap","sourcePath":"components/display/Keycap.jsx"},{"name":"PasswordRow","sourcePath":"components/display/PasswordRow.jsx"},{"name":"StrengthMeter","sourcePath":"components/display/StrengthMeter.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Slider","sourcePath":"components/forms/Slider.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"}],"sourceHashes":{"components/display/Avatar.jsx":"8038dad659ca","components/display/Badge.jsx":"841abcf0d0ff","components/display/Card.jsx":"025f81965293","components/display/Keycap.jsx":"6ecf193c147f","components/display/PasswordRow.jsx":"83be7edba2a3","components/display/StrengthMeter.jsx":"7fb2d7a80462","components/forms/Button.jsx":"cbd766334624","components/forms/Input.jsx":"aa425a22388d","components/forms/Slider.jsx":"ca571e9891ad","components/forms/Switch.jsx":"23817f75e3ea"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.VaultDesignSystem_ad3078 = window.VaultDesignSystem_ad3078 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/display/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Vault Avatar — a square-rounded letter tile (brand "service" cards) or a
 * round initial chip. `tone` sets a soft tint background; pass `shape`
 * 'square' (services) or 'round' (people).
 */
function Avatar({
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
    ...style
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: base
  }, props), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : letter);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Vault Badge — small status/label pill. `tone` picks the palette:
 * 'clay' tint (default), 'neutral', 'success', 'warning', 'danger', or
 * 'mono' for a monospace tag (AES-256, PBKDF2…).
 */
function Badge({
  tone = 'clay',
  style = {},
  children,
  ...props
}) {
  const tones = {
    clay: {
      bg: 'var(--clay-tint)',
      fg: 'var(--clay-mid)',
      border: 'transparent'
    },
    neutral: {
      bg: 'var(--paper-4)',
      fg: 'var(--text-secondary)',
      border: 'transparent'
    },
    success: {
      bg: 'color-mix(in srgb, var(--green) 14%, white)',
      fg: 'var(--green)',
      border: 'transparent'
    },
    warning: {
      bg: 'color-mix(in srgb, var(--yellow) 16%, white)',
      fg: 'var(--yellow)',
      border: 'transparent'
    },
    danger: {
      bg: 'color-mix(in srgb, var(--red) 12%, white)',
      fg: 'var(--red)',
      border: 'transparent'
    },
    mono: {
      bg: 'var(--surface-card)',
      fg: 'var(--text-secondary)',
      border: 'var(--border-color)'
    },
    outline: {
      bg: 'transparent',
      fg: 'var(--text-secondary)',
      border: 'var(--border-color)'
    }
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
    ...style
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: base
  }, props), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Vault Card — warm paper surface with a hairline border and soft rest
 * shadow. `hoverable` lifts it on hover (feature-grid behaviour); `tone`
 * 'cream' / 'dark' switch the surface.
 */
function Card({
  hoverable = false,
  tone = 'card',
  style = {},
  children,
  ...props
}) {
  const [hover, setHover] = React.useState(false);
  const tones = {
    card: {
      bg: 'var(--surface-card)',
      fg: 'var(--text-primary)',
      border: 'var(--border-color)'
    },
    cream: {
      bg: 'var(--paper-3)',
      fg: 'var(--text-primary)',
      border: 'var(--border-color)'
    },
    dark: {
      bg: 'var(--surface-dark)',
      fg: 'var(--text-on-dark)',
      border: 'transparent'
    }
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
    ...style
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: base,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  }, props), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Card.jsx", error: String((e && e.message) || e) }); }

// components/display/Keycap.jsx
try { (() => {
/**
 * Vault Keycap — a monospace <kbd> chip for keyboard shortcuts. Matches the
 * home-screen shortcut list and sidebar hints.
 */
function Keycap({
  children,
  style = {}
}) {
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
    ...style
  };
  return /*#__PURE__*/React.createElement("kbd", {
    style: base
  }, children);
}
Object.assign(__ds_scope, { Keycap });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Keycap.jsx", error: String((e && e.message) || e) }); }

// components/display/PasswordRow.jsx
try { (() => {
/**
 * Vault PasswordRow — a single entry in the password list. Icon tile, title +
 * username, an optional favorite star, and a trailing timestamp. `selected`
 * paints the warm active fill; otherwise hover tints.
 */
function PasswordRow({
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
  style = {}
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
    background: selected ? 'var(--surface-selected)' : hover ? 'var(--paper-3)' : 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 150ms ease',
    ...style
  };
  return /*#__PURE__*/React.createElement("div", {
    role: "option",
    "aria-selected": selected,
    style: row,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    letter: initial,
    tone: tone,
    src: iconSrc,
    size: 36
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-primary)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-secondary)',
      marginTop: 1,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, username || 'No username')), (favorite || hover) && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": favorite ? 'Remove from favorites' : 'Add to favorites',
    onClick: e => {
      e.stopPropagation();
      onToggleFavorite?.();
    },
    style: {
      flex: 'none',
      display: 'inline-flex',
      padding: 4,
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      borderRadius: 'var(--radius-sm)',
      color: favorite ? 'var(--clay)' : 'var(--text-tertiary)',
      lineHeight: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: favorite ? 'currentColor' : 'none',
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m12 2 2.9 6.4 7 .8-5.2 4.7 1.4 6.9L12 17.3l-6.1 3.5 1.4-6.9L2.1 9.2l7-.8L12 2Z"
  }))), timeAgo && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      fontSize: 12,
      color: 'var(--text-tertiary)'
    }
  }, timeAgo));
}
Object.assign(__ds_scope, { PasswordRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/PasswordRow.jsx", error: String((e && e.message) || e) }); }

// components/display/StrengthMeter.jsx
try { (() => {
/**
 * Vault StrengthMeter — the generator's password-strength bar. A thin track
 * fills proportionally and shifts hue by score: weak (red) → medium (yellow)
 * → strong (clay). Shows a label unless `compact`.
 */
function StrengthMeter({
  value = 0,
  compact = false,
  style = {}
}) {
  const v = Math.min(100, Math.max(0, value));
  const color = v >= 80 ? 'var(--clay)' : v >= 50 ? 'var(--yellow)' : 'var(--red)';
  const label = v >= 80 ? 'Very strong' : v >= 60 ? 'Strong' : v >= 40 ? 'Medium' : 'Weak';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      borderRadius: 'var(--radius-full)',
      background: 'var(--paper-5)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: `${v}%`,
      borderRadius: 'var(--radius-full)',
      background: color,
      transition: 'width 300ms ease, background 300ms ease'
    }
  })), !compact && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: 12,
      fontWeight: 600,
      color,
      fontFamily: 'var(--font-body)'
    }
  }, label));
}
Object.assign(__ds_scope, { StrengthMeter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/StrengthMeter.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Vault Button — ink-filled primary by default, with the shadcn-derived
 * variant set the product uses (default / secondary / outline / ghost /
 * destructive / link). Hover darkens; press is a 1px settle. All colors
 * come from Vault CSS custom properties.
 */
function Button({
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
    sm: {
      height: 32,
      padding: '0 12px',
      fontSize: 13,
      gap: 6,
      radius: 'var(--radius-md)'
    },
    default: {
      height: 36,
      padding: '0 16px',
      fontSize: 14,
      gap: 8,
      radius: 'var(--radius-md)'
    },
    lg: {
      height: 40,
      padding: '0 24px',
      fontSize: 15,
      gap: 8,
      radius: 'var(--radius-md)'
    },
    icon: {
      height: 36,
      width: 36,
      padding: 0,
      fontSize: 14,
      gap: 0,
      radius: 'var(--radius-md)'
    },
    'icon-sm': {
      height: 32,
      width: 32,
      padding: 0,
      fontSize: 13,
      gap: 0,
      radius: 'var(--radius-md)'
    }
  };
  const palette = {
    default: {
      bg: 'var(--ink-1)',
      fg: 'var(--text-on-dark)',
      border: 'transparent',
      bgHover: 'var(--ink-3)',
      shadow: 'var(--shadow-xs)'
    },
    secondary: {
      bg: 'var(--paper-4)',
      fg: 'var(--text-primary)',
      border: 'transparent',
      bgHover: 'var(--paper-5)',
      shadow: 'none'
    },
    outline: {
      bg: 'var(--surface-card)',
      fg: 'var(--text-primary)',
      border: 'var(--border-color)',
      bgHover: 'var(--paper-4)',
      shadow: 'var(--shadow-xs)'
    },
    ghost: {
      bg: 'transparent',
      fg: 'var(--text-primary)',
      border: 'transparent',
      bgHover: 'var(--paper-4)',
      shadow: 'none'
    },
    destructive: {
      bg: 'var(--red)',
      fg: '#ffffff',
      border: 'transparent',
      bgHover: 'var(--clay-dark)',
      shadow: 'var(--shadow-xs)'
    },
    link: {
      bg: 'transparent',
      fg: 'var(--text-accent)',
      border: 'transparent',
      bgHover: 'transparent',
      shadow: 'none'
    }
  };
  const s = sizes[size] || sizes.default;
  const p = palette[variant] || palette.default;
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.gap,
    whiteSpace: 'nowrap',
    height: s.height,
    width: s.width,
    padding: s.padding,
    fontFamily: 'var(--font-body)',
    fontSize: s.fontSize,
    fontWeight: 500,
    lineHeight: 1,
    borderRadius: s.radius,
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
    ...style
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    style: base,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false)
  }, props), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Vault Input — single-line field on a warm surface. Focus brings up a clay
 * ring + border, matching the app's search and form fields. Optional
 * `mono` for password/secret fields.
 */
function Input({
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
    ...style
  };
  return /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    disabled: disabled,
    style: base,
    onFocus: e => {
      setFocus(true);
      props.onFocus?.(e);
    },
    onBlur: e => {
      setFocus(false);
      props.onBlur?.(e);
    }
  }, props));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Slider.jsx
try { (() => {
/**
 * Vault Slider — single-thumb range used for password length. Filled track
 * is ink; the thumb is paper with a sand ring. Click-drag along the track.
 */
function Slider({
  value = 16,
  min = 4,
  max = 64,
  step = 1,
  onValueChange,
  style = {}
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const pct = (value - min) / (max - min) * 100;
  const setFromClientX = clientX => {
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
    const move = e => setFromClientX(e.clientX);
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
    ...style
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    style: wrap,
    onMouseDown: e => {
      setDragging(true);
      setFromClientX(e.clientX);
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 6,
      borderRadius: 'var(--radius-full)',
      background: 'var(--paper-5)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      width: `${pct}%`,
      height: 6,
      borderRadius: 'var(--radius-full)',
      background: 'var(--ink-1)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: `calc(${pct}% - 9px)`,
      width: 18,
      height: 18,
      borderRadius: 'var(--radius-full)',
      background: 'var(--paper-0)',
      border: '1px solid var(--sand)',
      boxShadow: dragging ? 'var(--shadow-feature)' : 'var(--shadow-sm)',
      transition: dragging ? 'none' : 'box-shadow 150ms ease'
    }
  }));
}
Object.assign(__ds_scope, { Slider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Slider.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Vault Switch — pill toggle. Checked fills with ink (primary); the thumb is
 * paper-white and slides. Used throughout the generator's option list.
 */
function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
  size = 'default',
  style = {},
  ...props
}) {
  const dims = size === 'sm' ? {
    w: 24,
    h: 14,
    thumb: 12
  } : {
    w: 32,
    h: 18,
    thumb: 16
  };
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
    ...style
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
    boxShadow: '0 1px 2px rgb(0 0 0 / 0.2)'
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    role: "switch",
    "aria-checked": checked,
    disabled: disabled,
    style: track,
    onClick: () => !disabled && onCheckedChange?.(!checked)
  }, props), /*#__PURE__*/React.createElement("span", {
    style: thumb
  }));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Keycap = __ds_scope.Keycap;

__ds_ns.PasswordRow = __ds_scope.PasswordRow;

__ds_ns.StrengthMeter = __ds_scope.StrengthMeter;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Slider = __ds_scope.Slider;

__ds_ns.Switch = __ds_scope.Switch;

})();
