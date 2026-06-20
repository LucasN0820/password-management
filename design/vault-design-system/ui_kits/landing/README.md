# Vault Marketing — UI Kit

A high-fidelity recreation of the **Next.js landing page** (`apps/landing` in
`LucasN0820/password-management`).

`index.html` renders the full marketing page top to bottom:
**sticky header → hero (with floating vault preview) → trust bar → feature grid
→ dark security beat → pricing → closing CTA → footer.** Copy is the product's
own Simplified-Chinese marketing text.

## Key patterns shown
- Centered `max-width: 1100px` column, 100px section rhythm.
- Serif headlines with a second emphasised italic line.
- The one **dark charcoal beat** (Security) inside an otherwise ivory page, and
  the dark **featured pricing card**.
- Monospace crypto tags, clay eyebrow labels, hover-lift feature cards.

## Composes
Bundle components: `Button`, `Card` (incl. `tone="cream"`/`"dark"` + `hoverable`),
`Badge` (incl. `tone="mono"`), `Avatar`. Icons are Lucide. Tokens from the root
`styles.css`.

## Not included
The mobile nav drawer and the live desktop-download buttons (which call the
app's API) are omitted — these are static-mock surfaces.
