# Drizzle DB Migration

## Summary

This project now uses Drizzle ORM as the shared database abstraction and migration system for both desktop and mobile.

- `packages/db/src/schema.ts` defines the SQLite schema with Drizzle
- `packages/db/src/database.ts` owns Drizzle migration execution, typed queries, and the shared adapter
- `apps/desktop/electron/db.ts` initializes `better-sqlite3` + Drizzle for Electron
- `apps/mobile/src/db/client.ts` initializes `expo-sqlite` + Drizzle for Expo

The old raw SQL query implementations and direct schema initialization code have been removed from app runtime code.

## Shared Package Structure

`@repo/db` now contains four layers:

1. `schema.ts`
   Defines the `passwords` table with Drizzle's SQLite schema APIs.
2. `types.ts`
   Exposes Drizzle-derived row types plus the app-facing `Password` and `PasswordInput` types.
3. `database.ts`
   Exposes:
   - `migratePasswordDatabase()`
   - typed repository functions such as `getPasswords()` and `searchPasswords()`
   - `createDrizzleAdapter()` for the Zustand store layer
4. `drizzle.config.ts`
   Adds a standard Drizzle config for future migration generation.
5. `src/migrations.generated.ts`
   Contains the runtime migration bundle consumed by both desktop and mobile.

## Initialization Flow

### Desktop

- Electron opens the SQLite file with `better-sqlite3`
- `drizzle(..., { schema })` creates the Drizzle database client
- `migratePasswordDatabase()` applies the generated Drizzle migrations at startup
- IPC handlers call the shared repository functions from `@repo/db`

### Mobile

- Expo gets the `SQLiteDatabase` from `SQLiteProvider`
- `drizzle(..., { schema })` wraps that SQLite client
- `migratePasswordDatabase()` runs during `SQLiteProvider.onInit`
- The password store now consumes `createDrizzleAdapter()` instead of hand-written SQL

## Type Safety Changes

Before this migration:

- table definition was a SQL string
- desktop and mobile each maintained their own query strings
- `favorite` and `isFavorite` needed per-app manual conversion logic

After this migration:

- the schema is defined once in Drizzle
- typed query builders are shared across desktop and mobile
- the application-facing `Password` type is normalized in one place inside `@repo/db`

## Validation

The following checks were run after the migration:

- `yarn exec tsc -p packages/db/tsconfig.json --noEmit`
- `yarn exec tsc -p apps/desktop/tsconfig.json --noEmit`
- `yarn exec tsc -p apps/mobile/tsconfig.json --noEmit`
- `yarn workspace password-desktop build`

## Migration Workflow

- Edit schema in `packages/db/src/schema.ts`
- Run `yarn workspace @repo/db drizzle:generate`
- This updates:
  - SQL files in `packages/db/drizzle/`
  - the runtime migration bundle in `packages/db/src/migrations.generated.ts`

Desktop and mobile both consume the same generated migration bundle at runtime, so schema evolution is now centralized in `@repo/db`.

## Legacy Database Compatibility

Older installs may already have a `passwords` table but no Drizzle migration history table.

To support that upgrade path safely:

- runtime migration first checks whether `passwords` already exists
- if the table exists but `__drizzle_migrations` is empty, the app treats that database as a legacy pre-Drizzle install
- it repairs the legacy table shape when needed (currently the `icon` column)
- it then marks the baseline migration as already applied before running later Drizzle migrations

This prevents the old upgrade path from failing with `table passwords already exists` on first launch after the migration.
