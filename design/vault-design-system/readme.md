# Vault Design System

A warm, restrained design system for **Vault (密码管理应用)** — a cross-platform
password manager. The aesthetic is unmistakably *Claude-inspired*: ivory paper,
warm ink text, and a single terracotta "clay" accent. No blues, no purple
gradients — warmth and typographic calm carry the entire brand.

> **Product in one line:** "记住一个密码，掌管所有安全" — *Remember one password,
> command all your security.*

---

## Sources

This system was reverse-engineered from the product's own codebase. Explore
these to build richer, more accurate Vault designs:

- **GitHub — `LucasN0820/password-management`**
  https://github.com/LucasN0820/password-management
  A Turborepo monorepo with three surfaces:
  - `apps/desktop/` — **Electron + React 18 + Vite**, Radix UI / shadcn-ui
    primitives, Framer Motion, Lucide icons. This is the richest UI source;
    its `src/index.css` holds the canonical token set.
  - `apps/landing/` — **Next.js** marketing site. Its `app/globals.css` defines
    the `cream / charcoal / terra / sand` Tailwind theme used here.
  - `apps/mobile/` — **React Native + Expo**, "BNA UI" component library,
    NativeWind. (Not recreated as a web UI kit — see Caveats.)
  - `packages/ui/` — shared shadcn primitives (Button, Card, Input, Switch,
    Slider, Sidebar, Dialog, Tabs…) consumed by desktop.

Nothing from the repo is bundled into consumers except the assets and tokens
captured here. If you have repo access, read `packages/ui/src/primitives/` and
`apps/desktop/src/routes/` for exact component behaviour.

---

## CONTENT FUNDAMENTALS — how Vault writes

Vault's product is **bilingual, Chinese-first**. Marketing and in-app copy lead
in Simplified Chinese; English appears in code, labels, and international
contexts. Match whichever language the surface you're building uses.

**Voice & tone**
- **Calm, confident, quietly premium.** Security is stated as *architecture, not
  a promise*: 「我们看不到你的密码，这是设计，不是承诺」 (*We can't see your
  passwords — that's by design, not a pledge*).
- **Restraint as a value.** The product literally markets less: 「少，但更好」
  (*Less, but better*) and 「我们只做密码管理该做的事，不多也不少」.
- **Reassuring, never fearful.** It sells calm ("让我忘掉密码这件事" — *let me
  forget about passwords*), not anxiety. Threats are mentioned matter-of-factly.
- **Trust through specificity.** Real crypto terms appear as proof:
  `AES-256-GCM`, `PBKDF2`, `SOC 2 Type II`, `本地加密`.

**Person & address**
- Speaks to the user as **你 / "you"**: 「你的数据」「你的设备」「数据始终属于你」.
- The brand refers to itself as **Vault** or **我们/"we"** sparingly.

**Casing & mechanics**
- Eyebrow labels are **UPPERCASE, letter-spaced** in English (`SECURITY`,
  `FEATURES`); Chinese eyebrows stay short (「安全架构」「功能」「定价」).
- Headlines use **serif, sentence-case** (or natural Chinese), often with a
  second emphasised line in italic/lighter ink.
- Numbers and shortcuts are **monospace** (`¥18 / 月`, `Ctrl+Shift+P`).
- **No emoji** in product UI or marketing surfaces. (The repo README uses them
  decoratively, but the product itself does not.) Icons do that job instead.
- Punctuation: full-width Chinese punctuation in zh copy; em-dashes and ·
  middots for rhythm in both languages.

**Microcopy examples**
- Empty state: 「还没有密码」 + 「添加第一个密码」
- Reassurance under CTAs: 「免费版永久可用 · 无需信用卡」, 「无需信用卡 · 随时取消 · 数据始终属于你」
- Strength labels: Weak / Medium / Strong / Very strong (弱 / 中 / 强 / 很强)
- Footer slogan: 「让每一个密码都有归处」 (*Let every password have a home*)

---

## VISUAL FOUNDATIONS

**Overall vibe** — Warm editorial minimalism. Think a well-set paper document,
not a neon SaaS dashboard. Generous whitespace, hairline borders, serif
headlines, and exactly one accent colour.

**Color**
- **Backgrounds are warm ivory**, never pure white at the page level:
  `#faf9f7` (marketing) / `#f8f7f2` (app). Cards sit on top in **white**.
  A short ivory ramp (`paper-0…7`) handles surfaces, hovers and selected rows.
- **Text is warm near-black** (`#1f1e1b`, `#1a1916`) down through a warm-grey
  ramp to `#b6b0a5` for timestamps/hints. There is no cool grey anywhere.
- **One accent: clay / terracotta.** `#d97757` in-app, `#c26b4a` for marketing
  text accents, `#c96442` in the logo. Used for the active state, links, the
  strength bar's strong end, eyebrow labels, and focus rings — and nothing else.
- **Functional accents are earthy and muted**: olive-green success `#6e7d5a`,
  ochre warning `#c5894b`, brick-red danger `#b84d3d`. Never saturated/neon.
- **Avoid entirely:** blue/indigo, purple gradients, rainbow fills, glassmorphism.

**Type**
- **Noto Serif SC** — display & headings (`font-heading`), weight **500**, tight
  tracking (`-0.02em`). Page titles run 40–72px.
- **Noto Sans SC** — body & UI, 13–17px, line-height 1.6–1.7.
- **JetBrains Mono** — *always* for passwords, plus keycaps, crypto tags,
  prices and metadata.
- Eyebrow labels: 12px / 600 / uppercase / letter-spaced / clay.

**Backgrounds & texture** — Flat warm fills only. No photography, no
illustration, no repeating patterns, no noise/grain. Depth comes from the ivory
ramp and hairline borders. Dark sections (security, download, featured pricing)
invert to **charcoal `#1a1916`** with clay-haze accents — a deliberate, sparse
contrast beat.

**Borders & cards** — Borders do the structural work: `1px solid #dfddd5`
warm hairlines everywhere. Cards are **white, 12–16px radius**, hairline border,
and a very soft shadow (`--shadow-vault`, ~5% black). They are *not* heavily
rounded and *never* use a coloured left-border accent stripe.

**Elevation** — Shadows are soft, warm and low-contrast (max ~18% black on
floating toasts/overlays). Most surfaces rest on border + ~5% shadow. The
spotlight/command palette is the one big-elevation moment.

**Radii** — System derives from `--radius: 8px`: sm 4 / md 6 / lg 8 / xl 12 /
2xl 16, plus full pills for badges, avatars and toggles. Inputs and buttons use
md (6px); cards use xl–2xl.

**Animation** — Understated. Framer Motion stagger on page mount
(`opacity 0→1`, `y: 12→0`, ~0.3s, 0.06s stagger). Modals use a 0.2s
`fade + slide-up-1rem` with `cubic-bezier(0.16, 1, 0.3, 1)`. Hover/colour
transitions are 150ms ease. No bounces, no infinite loops, no parallax.

**Hover states** — Buttons darken their fill (ink → `#3a3834`); outline/ghost
fill with warm `paper-4`. Rows tint to `paper-3`. Marketing cards lift 2px and
swap to the feature shadow. Links underline.

**Press states** — A subtle 1px downward settle (`translateY(1px)`); fills go to
`clay-dark`. No aggressive scale-down.

**Focus** — A 3px clay ring at ~22% opacity plus a clay border. Always visible,
never removed.

**Transparency & blur** — Used sparingly: the sticky marketing header is
`cream/88%` + `backdrop-blur`. On dark sections, white is layered at low alpha
(`white/6–12%`) for hairlines and chips. No frosted-glass card surfaces.

**Layout** — Marketing: centered `max-width: 1100px`, 72–100px section rhythm.
App: fixed **left sidebar (256px) → password list (320px) → detail pane**, with
a draggable 25px title bar on top (Electron). Content panes scroll
independently; the sidebar and list are fixed.

**Imagery** — There is essentially none. Brand "imagery" is the logo mark and
brand-tinted letter tiles for services (pastel `#E8F0FE`, `#FDE8E7`, etc.).
Keep it that way.

---

## ICONOGRAPHY

- **Library: [Lucide](https://lucide.dev)** — used across both desktop
  (`lucide-react`) and mobile (`lucide-react-native`). Stroke icons,
  **1.8 stroke width**, rounded line-caps/joins, drawn on a 24px grid.
  Consumers should load Lucide from CDN and colour icons with `currentColor`
  (typically `--text-secondary`, or `--clay` for accent/active).
- **Sizing:** 14–18px inline in lists and buttons; 20–22px for feature/section
  icons; 34px+ for hero lockups. Feature icons sit in a 40px rounded-square tile
  (`border + paper` fill).
- **Common glyphs:** `Lock`, `Key`, `Shield`, `Eye`/`EyeOff`, `Globe`, `Search`,
  `Star` (favorite — filled clay), `Plus`, `Settings`, `RefreshCw`, `Copy`/`Check`,
  `Bot` (AI import), `Zap` (generator).
- **No emoji** as UI icons. No PNG/sprite icon set — everything is inline SVG via
  Lucide. The marketing site hand-rolls a few one-off 24px stroke SVGs in the
  same Lucide style (lock, arrow, eye, spark, monitor, phone, star) when it needs
  a self-contained icon.
- **The Vault logo** (`assets/logo/vault-mark.svg`) is the one bespoke mark: a
  terracotta folded **V** cradling a keyhole on warm ivory, with two faint
  ivory crease lines. Provided as SVG + 512/192 PNG. Pair with the serif
  wordmark "Vault".

See `guidelines/cards/brand-iconography.html` for a live specimen.

---

## What's in here (index)

**Foundations**
- `styles.css` — the single entry point consumers link. `@import`s everything below.
- `tokens/fonts.css` — Noto Serif SC · Noto Sans SC · JetBrains Mono (Google Fonts).
- `tokens/colors.css` — ivory paper ramp, ink ramp, clay accent, functional hues + semantic aliases.
- `tokens/typography.css` — families, px scale, weights, leading, tracking.
- `tokens/spacing.css` — 4px spacing scale, radii, layout sizes.
- `tokens/shadows.css` — warm low-contrast elevation set.
- `guidelines/cards/*.html` — foundation specimen cards (Colors, Type, Spacing, Brand).

**Components** (`window.VaultDesignSystem_ad3078.*`)
- `components/forms/` — **Button, Input, Switch, Slider**
- `components/display/` — **Card, Badge, Avatar, Keycap, StrengthMeter, PasswordRow**

**UI kits** (full-screen recreations)
- `ui_kits/desktop/` — the Electron vault app: home, password list+detail, generator.
- `ui_kits/landing/` — the marketing site: hero, features, security, pricing.

**Assets**
- `assets/logo/` — `vault-mark.svg`, `vault-mark-512.png`, `vault-mark-192.png`.

**Skill**
- `SKILL.md` — makes this folder usable as a downloadable Agent Skill.

---

## Caveats

- **Mobile (React Native / BNA UI) is not recreated as a web UI kit.** Its visual
  language matches this system (same colors, type, clay accent), but its
  component code is RN-specific. Ask if you want a mobile-screen kit built from
  the RN source.
- **Fonts load from Google Fonts** (Noto Serif SC, Noto Sans SC, JetBrains Mono) —
  all exact matches to the product, so no substitution was needed. They require
  network access at render time; say the word if you'd like them self-hosted.
- The product UI is largely **Simplified Chinese**; recreations keep representative
  zh copy. Tell me if you need an English-only variant.
