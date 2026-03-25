# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

| Command | Purpose |
|---------|---------|
| `yarn dev` | Start all apps in dev mode (Turbo) |
| `yarn build` | Build all packages |
| `yarn lint` | ESLint across all packages |
| `yarn tsc` | TypeScript type-check all packages |
| `yarn format` | Prettier format all files |

**Desktop only:** `cd apps/desktop && yarn dev` (Vite + Electron on port 5173)
**Mobile only:** `cd apps/mobile && yarn dev` (Expo on port 8081)

Package manager is **Yarn 4.13.0** (via Corepack). Use `yarn install --immutable` in CI.

## Architecture

**Monorepo** managed by Turborepo with two apps and shared config packages:

- `apps/desktop` — Electron 29 + React 18 + Vite + React Router v7
- `apps/mobile` — Expo 54 + React Native 0.81 + Expo Router (file-based)
- `config/eslint` — Shared ESLint config (eslint-config-sheriff)
- `config/ts` — Shared TypeScript base config (strict mode, bundler resolution)
- `config/metadata` — Shared metadata

### Data Layer

Both apps use **SQLite** with an identical `passwords` table schema:
- Desktop: `better-sqlite3` accessed via Electron IPC (`electron/main.ts` handlers → `window.electronAPI`)
- Mobile: `expo-sqlite` initialized in `src/providers/db.tsx`

### State Management

Both apps use **Zustand** stores (`src/store/passwordStore.ts`) with the same interface (`PasswordState`). Desktop store calls `window.electronAPI.*`; mobile store receives an `SQLiteDatabase` instance.

### Routing

- **Desktop:** React Router v7 configured in `src/routes.ts`. Layout in `App.tsx`, pages in `src/routes/`.
- **Mobile:** Expo Router file-based routing in `src/app/`. Tab layout in `(tabs)/_layout.tsx`, screens in `src/screens/`.

### Electron Architecture

- `electron/main.ts` — Main process: SQLite DB, IPC handlers, global shortcuts (`Ctrl+Shift+P` for spotlight)
- `electron/preload.ts` — Preload bridge exposing `electronAPI` with context isolation
- `src/` — Renderer process (React app)

### UI/Styling

- **Desktop:** TailwindCSS 4 + shadcn/ui (new-york style) + Framer Motion + Radix UI
- **Mobile:** NativeWind (TailwindCSS for RN) + custom color theme system with light/dark mode

Path alias: `@/*` maps to `src/*` in both apps.

## Code Style

- Prettier: 80-char lines, single quotes, 2-space indent, trailing commas (es5), no parens on single arrow params
- TypeScript strict mode with `noUncheckedIndexedAccess`
- shadcn/ui components live in `apps/desktop/src/components/ui/` and are excluded from type-checking
- Desktop ESLint disables `explicit-module-boundary-types` and `no-floating-promises`

## CI

GitHub Actions (`.github/workflows/ci.yml`): runs on push to `main`, Node 22, `yarn install --immutable`, then `yarn tsc`.
