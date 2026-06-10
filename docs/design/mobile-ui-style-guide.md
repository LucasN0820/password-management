# Mobile App UI Style Guide

> Figma file: https://www.figma.com/design/YDojBHYjlOJroekpgw52Pz
> (Design system + screen mockups to be synced here)

## Design Direction

**Notion-inspired minimalism with hand-drawn warmth** — the same design language as the desktop app, reimagined for touch-first mobile interaction. Clean vertical layouts with generous whitespace, warm off-white surfaces, and the distinctive Caveat handwritten headings that give Vault its personality.

The mobile experience draws interaction patterns from **Twitter, Instagram, and TikTok**: long-press context menus, swipe gestures, bottom sheet forms, and haptic feedback throughout. Every touch target is at least 44pt. No hover states — all feedback is through press states, haptics, and animations.

## Brand

- **Name**: Vault
- **Logo**: `🔐` emoji + "Vault" in Caveat font
- **Language**: English (UI labels)

## Typography

| Role            | Font           | Weight         | Size | Usage                                               |
| --------------- | -------------- | -------------- | ---- | --------------------------------------------------- |
| Page Title      | Caveat         | Bold (700)     | 32px | Top-of-screen page titles ("My Vault", "Generator") |
| Section Header  | Caveat         | Bold (700)     | 22px | Section labels, card group titles                   |
| Card Title      | Caveat         | SemiBold (600) | 20px | Password item titles, modal titles                  |
| Body / UI       | Nunito         | Regular (400)  | 15px | Body text, descriptions, field content              |
| Button / Label  | Nunito         | SemiBold (600) | 15px | Buttons, nav labels, form labels                    |
| Small Label     | Nunito         | SemiBold (600) | 12px | Section labels (uppercase), timestamps              |
| Caption / Hint  | Nunito         | Regular (400)  | 12px | Placeholder text, helper text, metadata             |
| Password / Code | JetBrains Mono | Regular (400)  | 14px | Password display, generated passwords               |

**Loading**: Fonts loaded via `expo-google-fonts` packages (`@expo-google-fonts/caveat`, `@expo-google-fonts/nunito`, `@expo-google-fonts/jetbrains-mono`). App shows splash screen until fonts are ready.

## Color Palette

### Core Colors (Notion-inspired — shared with desktop)

| Token              | Light     | Dark        | Usage                                  |
| ------------------ | --------- | ----------- | -------------------------------------- |
| `background`       | `#FFFFFF` | `#191919`   | Main screen background                 |
| `foreground`       | `#37352F` | `#FFFFFFCF` | Primary text, primary button bg        |
| `surface`          | `#F7F6F3` | `#2F2F2F`   | Cards, input backgrounds, list item bg |
| `border`           | `#E9E9E7` | `#3A3A3A`   | Borders, dividers, separators          |
| `hover`            | `#EFEFEF` | `#363636`   | Pressed/active state backgrounds       |
| `muted-foreground` | `#787774` | `#9B9A97`   | Secondary text                         |
| `text-tertiary`    | `#C0BFB9` | `#5A5A5A`   | Placeholder text, timestamps, hints    |

### Semantic Colors

| Token           | Light     | Dark      | Usage                                    |
| --------------- | --------- | --------- | ---------------------------------------- |
| `accent-blue`   | `#2EAADC` | `#529CCA` | Links, focus rings, active tab indicator |
| `accent-green`  | `#0F7B6C` | `#4DAB9A` | Strong password, success states          |
| `accent-red`    | `#EB5757` | `#FF6B6B` | Destructive actions, weak password       |
| `accent-yellow` | `#F5C542` | `#F5C542` | Favorite star fill, medium strength      |
| `selected-bg`   | `#E8F5FD` | `#1A3A4A` | Selected/active list item background     |

### Tinted Backgrounds

| Context                    | Light     | Dark      |
| -------------------------- | --------- | --------- |
| Favorites stat card        | `#FEF9EF` | `#2A2520` |
| Strong passwords stat card | `#EDF9F0` | `#1A2A20` |
| Default stat card          | `#F7F6F3` | `#2F2F2F` |

## Layout Principles

### Screen Structure

```
┌──────────────────────────┐
│     SafeArea (top)       │
├──────────────────────────┤
│  Page Title (Caveat 32)  │
│  Optional: Search Bar    │
│  Optional: Tab Bar       │
├──────────────────────────┤
│                          │
│     Scrollable Content   │
│     (full-width cards,   │
│      generous spacing)   │
│                          │
│                          │
│                          │
├──────────────────────────┤
│    Bottom Tab Bar (2)    │
│  [Vault]     [Generator] │
└──────────────────────────┘
```

- **Vertical-first**: All layouts stack vertically. No side-by-side panels.
- **Full-width cards**: Cards stretch edge-to-edge with `mx-4` (16px) horizontal margin.
- **Padding**: Screen content uses `px-5 pt-4` (20px horizontal, 16px top).
- **Spacing**: Between cards/sections: 12px. Between card groups: 24px.
- **Safe areas**: Respect top/bottom safe area insets (notch, home indicator).

### Bottom Tab Bar

Custom tab bar matching the Notion aesthetic:

```
┌─────────────────────────────┐
│   🔐 My Vault    ⚡ Generate │
│   (active: foreground text   │
│    + blue dot indicator)     │
└─────────────────────────────┘
```

- Background: `background` with top border `border`
- Active tab: `foreground` text + small dot below icon (`accent-blue`)
- Inactive tab: `muted-foreground` text
- Icons: Lucide icons, 22px (`KeyRound` for vault, `Wand2` for generator)
- Tab labels: Nunito SemiBold 11px
- Height: 56px + bottom safe area
- Haptic feedback on tab press (`impactLight`)

## Screen Designs

### 1. Password List (Home / "My Vault")

The main screen — a clean, scrollable list of all saved passwords.

```
┌──────────────────────────────┐
│ SafeArea                     │
│                              │
│  My Vault          🔍  ＋    │  ← Caveat 32px title + icon buttons
│                              │
│  ┌────────────────────────┐  │
│  │ 🔍 Search passwords... │  │  ← Expandable search (shown on 🔍 tap)
│  └────────────────────────┘  │
│                              │
│  [ All ]  [ ★ Favorites ]    │  ← Segmented tabs, pill-shaped
│                              │
│  ┌────────────────────────┐  │
│  │ 🌐 G  GitHub           │  │  ← Password item card
│  │       johndoe          │  │     Icon circle + title + username
│  │       github.com    ★  │  │     URL + favorite star
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🌐 T  Twitter          │  │
│  │       @johndoe         │  │
│  │       twitter.com   ★  │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🌐 N  Netflix          │  │
│  │       john@email.com   │  │
│  │       netflix.com      │  │
│  └────────────────────────┘  │
│                              │
│  ─────────────────────────── │
│  [🔐 My Vault]  [⚡ Generate]│
└──────────────────────────────┘
```

**Header area:**

- Title: "My Vault" in Caveat Bold 32px, color `foreground`
- Right icons: Search (magnifying glass) + Add (plus circle), 24px, color `muted-foreground`
- Search bar: Appears below title with slide-down animation when search icon tapped
- Search input: `surface` bg, `border` border, rounded-xl (16px), Nunito 15px

**Segmented tabs:**

- Container: `surface` bg, rounded-full, p-1
- Active tab: `background` bg, rounded-full, `foreground` text, subtle shadow
- Inactive tab: transparent, `muted-foreground` text
- Font: Nunito SemiBold 14px
- Haptic on switch (`impactLight`)

**Password list items:**

- Background: `surface` (the warm off-white `#F7F6F3`)
- Border radius: 16px
- Padding: 16px
- Margin between items: 8px
- Left: Icon circle (40px, rounded-lg)
  - If has icon (base64): Show image
  - Else: First letter of domain/title, Nunito SemiBold 18px, `surface` bg + `border` border
- Center: Title (Nunito SemiBold 16px, `foreground`) + Username (Nunito Regular 14px, `muted-foreground`) + URL row (Globe icon 12px + url text 12px, `text-tertiary`)
- Right: Favorite star (18px), yellow fill if favorite, `text-tertiary` if not
- Press state: bg changes to `hover` (`#EFEFEF`), 150ms transition
- **No shadows** — flat Notion-style cards with borders

**Empty state:**

- Centered illustration area
- "No passwords yet" in Caveat 22px
- "Tap + to add your first password" in Nunito 14px, `muted-foreground`
- Large + button (56px circle, `foreground` bg, white icon)

### 2. Password Detail

Full-screen detail view, pushed from list. Scrollable with card sections.

```
┌──────────────────────────────┐
│ ←  Password Detail      •••  │  ← Back arrow + overflow menu (3 dots)
├──────────────────────────────┤
│                              │
│         ┌──────┐             │
│         │  G   │  64px icon  │  ← Centered icon circle
│         └──────┘             │
│        GitHub   ★            │  ← Title (Caveat 24px) + star
│                              │
│  ┌────────────────────────┐  │
│  │ 👤 USERNAME             │  │  ← Section label (uppercase, 12px)
│  │ johndoe           [📋] │  │  ← Content + copy button
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ 🔑 PASSWORD             │  │
│  │ •••••••••    [👁] [📋] │  │  ← Toggle + copy
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ 🌐 URL                  │  │
│  │ github.com       [🔗]  │  │  ← Tap to open
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ 📝 NOTES                │  │
│  │ Personal account for... │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

**Navigation bar:**

- Back arrow (ChevronLeft, 24px) — navigates back
- Title: "Password Detail" in Nunito SemiBold 17px (or just the password title)
- Right: Overflow menu icon (MoreHorizontal/Ellipsis, 24px)
  - Tapping overflow opens bottom action sheet (see Interaction Patterns)

**Hero section:**

- Icon: 64px circle, centered, `foreground` bg if no image
- Title: Caveat Bold 24px, centered
- Favorite star inline after title
- Spacing: 24px below hero before detail cards

**Detail cards:**

- Background: `surface`
- Border: 1px `border`
- Border radius: 12px
- Padding: 16px
- Section label: Uppercase, Nunito SemiBold 12px, `text-tertiary`, with icon (16px)
- Content: Nunito Regular 16px, `foreground`
- Action icons: 32px touch target, `accent-blue` tint, `hover` bg on press
- Copy feedback: Brief checkmark animation + haptic (`notificationSuccess`)
- Password field: JetBrains Mono 14px, masked by default (dots)

**Overflow action sheet** (triggered by ••• button):

- Bottom sheet with options: Edit, Share, Delete
- Delete option in `accent-red`
- See "Bottom Action Sheet" in Interaction Patterns

### 3. Add / Edit Password (Bottom Sheet)

A bottom sheet that slides up from the bottom, covering ~90% of the screen. Follows Instagram "create post" and Twitter "compose" patterns.

```
┌──────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← Dimmed overlay (foreground/20)
├──────────────────────────────┤
│          ── handle ──        │  ← Drag handle (40px × 4px, rounded)
│                              │
│  Cancel   Add Password  Save │  ← Caveat 20px title, action buttons
│                              │
│  ┌────────────────────────┐  │
│  │  [tap to pick icon]    │  │  ← Icon picker (centered, 64px)
│  └────────────────────────┘  │
│                              │
│  TITLE                       │  ← Label: Nunito SemiBold 12px uppercase
│  ┌────────────────────────┐  │
│  │ e.g. GitHub             │  │  ← Input: surface bg, rounded-xl
│  └────────────────────────┘  │
│                              │
│  USERNAME                    │
│  ┌────────────────────────┐  │
│  │ e.g. johndoe           │  │
│  └────────────────────────┘  │
│                              │
│  PASSWORD                    │
│  ┌────────────────────────┐  │
│  │ ••••••••         [👁]  │  │  ← Password input with toggle
│  └────────────────────────┘  │
│                              │
│  URL (optional)              │
│  ┌────────────────────────┐  │
│  │ e.g. github.com        │  │
│  └────────────────────────┘  │
│                              │
│  NOTES (optional)            │
│  ┌────────────────────────┐  │
│  │ Add any notes...       │  │  ← Multiline, 80px min height
│  │                        │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

**Bottom sheet behavior:**

- Slides up with spring animation (damping: 20, stiffness: 300)
- Drag handle at top (can drag down to dismiss)
- Swipe down to dismiss (velocity threshold: 500)
- Background: `background` with rounded top corners (24px)
- Overlay: `foreground` at 20% opacity
- KeyboardAvoidingView wraps the sheet content

**Header row:**

- Cancel: Nunito Regular 15px, `accent-blue`, left-aligned
- Title: Caveat Bold 20px, centered — "Add Password" or "Edit Password"
- Save: Nunito SemiBold 15px, `accent-blue` (disabled state: `text-tertiary`)
- Save activates haptic on success (`notificationSuccess`)

**Form inputs:**

- Labels: Nunito SemiBold 12px, uppercase, `muted-foreground`, tracking-wider
- Input fields:
  - Background: `surface`
  - Border: 1px `border`
  - Border radius: 12px
  - Padding: 14px 16px
  - Font: Nunito Regular 15px
  - Placeholder: `text-tertiary`
  - Focus state: border changes to `accent-blue`, bg becomes `background` (white)
- Password input: JetBrains Mono font, with eye toggle icon
- Notes: Multiline TextInput, min height 80px

**Keyboard handling:**

- Bottom sheet content scrolls as keyboard appears
- Active input stays visible above keyboard
- Platform-specific behavior (iOS: padding, Android: height)

### 4. Generator Screen

Clean, focused generator with large password display and tactile controls.

```
┌──────────────────────────────┐
│ SafeArea                     │
│                              │
│  Generator                   │  ← Caveat 32px title
│                              │
│  ┌────────────────────────┐  │
│  │                        │  │
│  │   aB3$kM9!xQ2&nF7     │  │  ← Generated password (JetBrains Mono)
│  │                        │  │     Large, centered
│  │   ▓▓▓▓▓▓▓▓▓▓▓▓░░░░    │  │  ← Strength bar (colored)
│  │   Strong               │  │  ← Strength label
│  │                        │  │
│  │   [🔄 Regenerate] [📋] │  │  ← Action buttons
│  └────────────────────────┘  │
│                              │
│  Length                      │  ← Caveat 20px section header
│  ┌────────────────────────┐  │
│  │  ◀──────●────────▶ 16  │  │  ← Custom slider with value
│  │  4                  64 │  │  ← Min/max labels
│  └────────────────────────┘  │
│                              │
│  Characters                  │
│  ┌────────────────────────┐  │
│  │ Uppercase (A-Z)    [✓] │  │  ← Toggle rows
│  │─────────────────────── │  │
│  │ Lowercase (a-z)    [✓] │  │
│  │─────────────────────── │  │
│  │ Numbers (0-9)      [✓] │  │
│  │─────────────────────── │  │
│  │ Symbols (!@#$)     [✓] │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │    Save to Vault       │  │  ← Optional: save generated password
│  └────────────────────────┘  │
│                              │
│  ─────────────────────────── │
│  [🔐 My Vault]  [⚡ Generate]│
└──────────────────────────────┘
```

**Password display card:**

- Background: `surface`
- Border: 1px `border`
- Border radius: 20px
- Padding: 24px
- Password text: JetBrains Mono Medium 18px, centered, `foreground`
- Tap on password text to copy (with haptic)
- Strength bar: Full width, 4px height, rounded-full
  - Weak: `accent-red`
  - Medium: `accent-yellow`
  - Strong: `accent-green`
  - Animated width transition (300ms)
- Strength label: Nunito SemiBold 13px, color matches bar
- Regenerate button: Outline style, rounded-full, `foreground` border
- Copy button: Filled, rounded-full, `foreground` bg, white icon

**Length slider:**

- Custom slider track: `border` bg, `foreground` fill, 4px height
- Thumb: 24px circle, `foreground` bg, white ring
- Value display: Nunito SemiBold 16px, right of slider
- Range labels: Nunito Regular 12px, `text-tertiary`
- Haptic on value change (`impactLight`)

**Character toggles:**

- Card background: `surface`, border: `border`, rounded-xl
- Each row: Label (Nunito Regular 15px) + custom toggle switch
- Toggle: Track 48×28px, thumb 24px
  - On: `foreground` track, white thumb
  - Off: `border` track, white thumb
- Dividers between rows: 1px `border`
- Haptic on toggle (`impactLight`)

**Save to Vault button:**

- Full-width, `foreground` bg, white text
- Nunito SemiBold 15px
- Rounded-xl (16px)
- Height: 52px
- Opens the Add Password bottom sheet with the generated password pre-filled

## Interaction Patterns

### Long Press → Context Menu

When a user long-presses a password list item, a context menu appears. This follows the **Twitter/Instagram** pattern of a centered bottom action sheet.

**Trigger:**

- Long press duration: 500ms
- Haptic feedback on activation: `impactMedium`
- Item slightly scales down (0.97) during press, returns to 1.0 on release

**Context menu (bottom action sheet):**

```
┌──────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← Overlay: foreground at 40% opacity
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
├──────────────────────────────┤
│          ── handle ──        │
│                              │
│  📋  Copy Password           │  ← Haptic + dismiss on tap
│  ──────────────────────────  │
│  📋  Copy Username           │
│  ──────────────────────────  │
│  ✏️  Edit                    │  ← Opens edit bottom sheet
│  ──────────────────────────  │
│  ★   Toggle Favorite         │
│  ──────────────────────────  │
│  🗑  Delete              red │  ← accent-red text
│                              │
│  ┌────────────────────────┐  │
│  │       Cancel           │  │  ← Separate cancel button
│  └────────────────────────┘  │
└──────────────────────────────┘
```

- Each option row: 52px height, Nunito Regular 16px
- Icon: 20px, left of text, `muted-foreground` (red for delete)
- Dividers: 1px `border`
- Cancel button: Separate group, `surface` bg, Nunito SemiBold 16px, `accent-blue`
- Slide-up animation with spring physics
- Tap outside (overlay) to dismiss
- Haptic on selection: `impactLight`

### Swipe Actions

Left-swipe on password list items reveals action buttons — same concept as the current implementation, refined to match the Notion style.

**Behavior:**

- Swipe left to reveal: Edit (60px, `foreground` bg) + Delete (60px, `accent-red` bg)
- Snap threshold: 80px or velocity > 500
- Spring animation: damping 20, stiffness 100
- Icons: Edit and Trash2, 20px, white
- **No right-swipe actions** (prevent accidental actions)

### Tap Actions on List Items

- **Single tap**: Navigate to Password Detail screen (push transition)
- **Single tap on star**: Toggle favorite (haptic `impactLight`)

### Bottom Action Sheet (from Detail overflow menu)

Same style as the long-press context menu:

- Options: Edit, Share, Delete
- Slide-up with spring animation
- Overlay dismissal

### Delete Confirmation

A centered alert dialog, not a bottom sheet — to clearly differentiate destructive confirmation from action menus.

```
┌──────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░┌──────────────────────┐░░ │
│ ░░│                      │░░ │
│ ░░│   Delete "GitHub"?   │░░ │  ← Caveat 20px
│ ░░│                      │░░ │
│ ░░│   This action cannot │░░ │  ← Nunito 14px, muted-foreground
│ ░░│   be undone.         │░░ │
│ ░░│                      │░░ │
│ ░░│  [Cancel]  [Delete]  │░░ │  ← Cancel: outline, Delete: accent-red
│ ░░│                      │░░ │
│ ░░└──────────────────────┘░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└──────────────────────────────┘
```

- Card: `background` bg, rounded-2xl, `border` border, shadow-lg
- Overlay: `foreground` at 20% opacity
- Title: Caveat Bold 20px, centered
- Description: Nunito Regular 14px, `muted-foreground`, centered
- Cancel button: Outline, rounded-lg, `foreground` text
- Delete button: `accent-red` bg, white text, rounded-lg
- Both buttons: Height 44px, Nunito SemiBold 15px
- Haptic on delete: `notificationWarning`

### Copy Feedback

When a user copies a password or username:

1. Brief toast notification slides down from top (200ms in, hold 1.5s, 200ms out)
2. Toast: `accent-green` bg, white text, rounded-lg, "Copied to clipboard ✓"
3. Haptic: `notificationSuccess`

### Pull to Refresh

On the password list:

- Pull down to trigger refresh (reload from database)
- Standard RefreshControl with `foreground` tint color

## Animation Philosophy

Same as desktop — **minimal and functional**, no decorative animations.

| Animation                | Duration | Easing                               |
| ------------------------ | -------- | ------------------------------------ |
| Screen push/pop          | 350ms    | iOS default (spring)                 |
| Bottom sheet open        | 300ms    | Spring (damping: 20, stiffness: 300) |
| Bottom sheet close       | 200ms    | Spring (damping: 25, stiffness: 400) |
| Tab switch               | 200ms    | Ease-out                             |
| Press state              | 150ms    | Linear                               |
| Strength bar             | 300ms    | Ease-in-out                          |
| Toast in/out             | 200ms    | Ease-out / Ease-in                   |
| Item scale on long press | 200ms    | Spring                               |

## Haptic Feedback

| Action                 | Haptic Type               |
| ---------------------- | ------------------------- |
| Tab bar press          | `impactLight`             |
| Toggle switch          | `impactLight`             |
| Slider value change    | `impactLight` (selection) |
| Long press trigger     | `impactMedium`            |
| Context menu selection | `impactLight`             |
| Copy success           | `notificationSuccess`     |
| Delete confirm         | `notificationWarning`     |
| Save success           | `notificationSuccess`     |
| Swipe snap             | `impactLight`             |

## Dark Mode

The color system includes dark mode tokens (see Color Palette table). Implementation uses `useColorScheme()` from React Native to detect system preference. All colors should be referenced through the theme system, never hardcoded.

## Differences from Desktop

| Aspect            | Desktop                       | Mobile                                |
| ----------------- | ----------------------------- | ------------------------------------- |
| Navigation        | Sidebar + keyboard            | Bottom tab bar + gestures             |
| CRUD interaction  | Click buttons, modals         | Long press menu, bottom sheets, swipe |
| Search            | Spotlight overlay (⌘⇧P)       | Expandable search bar in header       |
| Layout            | Two-panel (list + detail)     | Single column, screen push            |
| Feedback          | Cursor hover, tooltips        | Haptics, press states, toasts         |
| Password gen save | Side panel form               | Bottom sheet                          |
| Primary input     | Keyboard-first                | Touch-first                           |
| Shortcuts         | Keyboard shortcuts throughout | None — all gesture/tap based          |
