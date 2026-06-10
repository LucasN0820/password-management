# Desktop App UI Style Guide

## Design Direction

Notion-inspired minimalism with hand-drawn warmth. Clean, spacious layouts with generous whitespace. The overall tone is **refined yet approachable** — professional enough for a security tool, warm enough to feel personal.

## Brand

- **Name**: Vault
- **Logo**: `🔐` emoji + "Vault" in Caveat font
- **Language**: English (UI labels), with support for localized content

## Typography

| Role               | Font           | Weight                        | Usage                                                   |
| ------------------ | -------------- | ----------------------------- | ------------------------------------------------------- |
| Headings / Display | Caveat         | Bold (700)                    | Page titles, section headers, card titles, modal titles |
| Body / UI          | Nunito         | Regular (400), SemiBold (600) | Body text, labels, buttons, navigation                  |
| Passwords / Code   | JetBrains Mono | Regular (400), Medium (500)   | Password display, keyboard shortcuts, monospace data    |

**Scale**: Headings use large sizes (42px hero, 24px section, 20-22px card). Body stays at 13-15px. Captions and hints at 10-12px.

Fonts are loaded via Google Fonts `@import`. For offline resilience, bundle `.woff2` files locally in a future iteration.

## Color Palette

### Core Colors (Notion-inspired)

| Token                | Hex       | Usage                                  |
| -------------------- | --------- | -------------------------------------- |
| `--background`       | `#FFFFFF` | Main background                        |
| `--foreground`       | `#37352F` | Primary text, primary buttons          |
| `--surface`          | `#F7F6F3` | Cards, input backgrounds, stat card bg |
| `--sidebar`          | `#FBFBFA` | Sidebar background                     |
| `--border`           | `#E9E9E7` | Borders, dividers                      |
| `--accent`           | `#EFEFEF` | Hover states                           |
| `--muted-foreground` | `#787774` | Secondary text                         |
| `--text-tertiary`    | `#C0BFB9` | Placeholder text, timestamps, hints    |

### Semantic Colors

| Token             | Hex       | Usage                                       |
| ----------------- | --------- | ------------------------------------------- |
| `--accent-blue`   | `#2EAADC` | Links, focus rings, active indicators       |
| `--accent-green`  | `#0F7B6C` | Strong password indicator, success          |
| `--accent-red`    | `#EB5757` | Destructive actions, weak password          |
| `--accent-yellow` | `#F5C542` | Favorites (star icon fill), medium strength |
| `--selected-bg`   | `#E8F5FD` | Selected list item background               |

### Tinted Card Backgrounds (Stats)

- Favorites card: `#FEF9EF` (warm yellow tint)
- Strong passwords card: `#EDF9F0` (cool green tint)
- Default stat card: `#F7F6F3` (surface)

## Layout Principles

- **Sidebar**: Fixed 240px width, light background (`#FBFBFA`), right border. Contains logo, 3 nav items, search shortcut hint, user avatar.
- **Content area**: Fills remaining space. Each page manages its own padding (typically `px-10 py-10` with `max-w-4xl` or `max-w-5xl`).
- **Title bar**: 25px macOS-style drag region at top.
- **Two-panel pages** (Passwords): 320px list panel + flexible detail panel, separated by border.
- **Two-column pages** (Generator): Main content left + save form right (`grid-cols-[1fr_380px]`).

## Component Styling

### Buttons

- **Primary**: `bg-foreground text-white` (dark button), `rounded-lg`, no scale transforms.
- **Secondary/Outline**: `border-border bg-background`, subtle hover to `bg-accent`.
- **Destructive**: `text-destructive hover:bg-destructive/10`.
- **Transitions**: `transition-colors duration-150` only. No `hover:scale-*` or `active:scale-*`.

### Inputs

- Background: `bg-surface` (the warm off-white)
- Border: `border-border`
- Focus: `focus:bg-background` (turns white), focus ring uses `--accent-blue`
- Placeholder: `text-text-tertiary`
- Password fields: `font-mono`

### Cards

- `rounded-2xl border border-border`, flat (no shadow or backdrop-blur)
- Section cards use `bg-surface` or `bg-background`
- Stat cards may have tinted backgrounds

### List Items

- No border between items; use spacing (`space-y-0.5`)
- Selected: `bg-selected-bg` (`#E8F5FD`)
- Hover: `bg-accent` (`#EFEFEF`)
- Icon circles: `rounded-lg bg-surface border-border`, 36px
- Selected icon circles: `bg-[#D4EDFA]`

### Modals

- Overlay: `bg-foreground/20` (light dim, not dark)
- Card: `rounded-xl border border-border shadow-lg bg-background`
- Title: Caveat font heading
- Labels: `text-xs font-semibold text-muted-foreground uppercase tracking-wider`
- Animation: `fade-in` + `slide-in-from-bottom` (200ms)

### Spotlight Search

- Overlay: `bg-black/40` (darker than modals for focus)
- Card: `rounded-2xl shadow-2xl`, centered at ~160px from top
- Search input: Large (text-lg), no border, transparent background
- Results: `rounded-xl` items with icon circles, selected shows `↵ Copy` badge
- Bottom bar: `bg-surface` with keyboard hint badges

## Interaction Patterns

### Keyboard-First Design

Keyboard shortcut hints appear throughout the UI:

- Sidebar: `⌘⇧P Quick Search` badge
- Home page: Quick actions show shortcut badges
- Home page: Dedicated "Keyboard Shortcuts" section
- Detail view: Bottom hint bar with `↑↓ Navigate • ↵ Copy • Esc Close`
- Spotlight: Bottom bar with key badges for all actions

### Animation Philosophy

- **Minimal and functional**: No decorative animations (no floating blobs, spinning icons, parallax).
- **Page transitions**: Simple `opacity` fade-in on mount via framer-motion.
- **Interactions**: `transition-colors duration-150` for hover/focus states.
- **Modals**: Slide-up + fade-in on open, reverse on close (200ms).
- **Strength bar**: `transition-all duration-300` for smooth width changes.

### Mouse Interactions

- Hover reveals: Favorite toggle button appears on password list item hover.
- Copy feedback: Button text changes to "Copied!" for 1.5s.
- No tooltip delays — immediate feedback.

## Dark Mode

Not currently implemented. The design system uses CSS custom properties, making dark mode straightforward to add later by defining a `.dark` variant of all color tokens.
