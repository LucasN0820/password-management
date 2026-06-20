---
name: vault-design
description: Use this skill to generate well-branded interfaces and assets for Vault (密码管理应用), a warm, Claude-inspired password manager — either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

This is the **Vault Design System** — a cross-platform password manager with an
unmistakably Claude-inspired aesthetic: warm ivory paper, warm-ink text, and a
single terracotta "clay" accent. No blues, no purple gradients.

Key files:
- `readme.md` — the full design guide: sources, content/voice fundamentals,
  visual foundations, and iconography. **Start here.**
- `styles.css` — the single CSS entry point; `@import`s all tokens + fonts.
  Link this one file and everything (paper/ink/clay ramps, type scale, radii,
  shadows, Noto Serif SC / Noto Sans SC / JetBrains Mono) is available as CSS
  custom properties.
- `tokens/` — colors, typography, spacing, shadows, fonts.
- `components/` — reusable React primitives (forms: Button, Input, Switch,
  Slider; display: Card, Badge, Avatar, Keycap, StrengthMeter, PasswordRow).
  Each has a `.jsx`, a `.d.ts` props contract, and a `.prompt.md` usage note.
- `ui_kits/desktop/` and `ui_kits/landing/` — full interactive screen
  recreations of the two web surfaces. Great references for composition.
- `guidelines/cards/` — small specimen cards for colors, type, spacing, brand.
- `assets/logo/` — the Vault mark (SVG + PNG).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy
assets out and create static HTML files for the user to view. Link `styles.css`
for tokens; load Lucide from CDN for icons (1.8 stroke). If working on
production code, copy assets and read the rules here to design as an expert in
this brand.

If the user invokes this skill without other guidance, ask them what they want
to build or design, ask a few questions, and act as an expert designer who
outputs HTML artifacts *or* production code, depending on the need.
