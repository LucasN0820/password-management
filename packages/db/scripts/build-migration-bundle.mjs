import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url)
const drizzleDir = join(root.pathname, 'drizzle')
const journalPath = join(drizzleDir, 'meta', '_journal.json')
const outputPath = join(root.pathname, 'src', 'migrations.generated.ts')

const journal = JSON.parse(readFileSync(journalPath, 'utf8'))
const sqlFiles = readdirSync(drizzleDir).filter(file => file.endsWith('.sql')).sort()

const migrations = Object.fromEntries(
  sqlFiles.map((file, idx) => [
    `m${idx.toString().padStart(4, '0')}`,
    readFileSync(join(drizzleDir, file), 'utf8'),
  ])
)

const contents = `export const passwordMigrations = ${JSON.stringify(
  {
    journal,
    migrations,
  },
  null,
  2
)} as const\n`

writeFileSync(outputPath, contents)
