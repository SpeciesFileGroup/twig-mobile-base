import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite'

/**
 * Opens a SQLite database and brings its schema up to date: `migrations` are applied in order, once
 * each, tracked with `PRAGMA user_version`. A failed migration rolls back all the pending ones.
 */
export function openDatabase(name: string, migrations: readonly string[]): SQLiteDatabase {
  const db = openDatabaseSync(name)

  db.execSync('PRAGMA journal_mode = WAL;')
  migrate(db, migrations)

  return db
}

export function migrate(db: SQLiteDatabase, migrations: readonly string[]) {
  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version')
  const current = row?.user_version ?? 0

  if (current >= migrations.length) return

  db.withTransactionSync(() => {
    migrations.slice(current).forEach((sql) => db.execSync(sql))
    db.execSync(`PRAGMA user_version = ${migrations.length}`)
  })
}
