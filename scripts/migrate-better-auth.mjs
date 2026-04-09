import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { neon } from '@neondatabase/serverless'

const workspaceRoot = process.cwd()
const migrationsDir = resolve(workspaceRoot, 'db/migrations')

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

function readDatabaseUrlFromEnvFiles() {
  const envFiles = ['.env.local', '.env']

  for (const envFile of envFiles) {
    const envPath = resolve(workspaceRoot, envFile)
    if (!existsSync(envPath)) continue

    const content = readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      if (!trimmed.startsWith('DATABASE_URL=')) continue

      const rawValue = trimmed.slice('DATABASE_URL='.length).trim()
      return stripWrappingQuotes(rawValue)
    }
  }

  return undefined
}

function getDatabaseUrl() {
  return process.env.DATABASE_URL ?? readDatabaseUrlFromEnvFiles()
}

const databaseUrl = getDatabaseUrl()

if (!databaseUrl) {
  console.error(
    'DATABASE_URL not found. Set it in your environment, .env.local, or .env.',
  )
  process.exit(1)
}

const sql = neon(databaseUrl)
const migrationFiles = readdirSync(migrationsDir)
  .filter((name) => name.endsWith('.sql'))
  .sort((a, b) => a.localeCompare(b))

if (migrationFiles.length === 0) {
  console.log('No SQL migrations found in db/migrations.')
  process.exit(0)
}

await sql`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`

const appliedRows =
  await sql`SELECT filename FROM schema_migrations ORDER BY filename ASC`
const appliedSet = new Set(appliedRows.map((row) => row.filename))

let appliedCount = 0
let skippedCount = 0

for (const filename of migrationFiles) {
  if (appliedSet.has(filename)) {
    skippedCount += 1
    continue
  }

  const migrationPath = join(migrationsDir, filename)
  const migrationSql = readFileSync(migrationPath, 'utf8')
  const statements = migrationSql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)

  for (const statement of statements) {
    // Execute plain SQL statements from each migration file in order.
    await sql.query(statement)
  }

  await sql`INSERT INTO schema_migrations (filename) VALUES (${filename})`
  appliedCount += 1
  console.log(`Applied migration: ${filename} (${statements.length} statements).`)
}

console.log(
  `Migration complete. Applied: ${appliedCount}, skipped: ${skippedCount}, total files: ${migrationFiles.length}.`,
)
