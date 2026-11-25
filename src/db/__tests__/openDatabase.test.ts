import type { SQLiteDatabase } from 'expo-sqlite'

import { migrate } from '../openDatabase'

jest.mock('expo-sqlite', () => ({ openDatabaseSync: jest.fn() }))

/** A database at `version` that records the SQL it runs */
function fakeDb(version: number) {
  const executed: string[] = []
  const db = {
    getFirstSync: () => ({ user_version: version }),
    withTransactionSync: (fn: () => void) => fn(),
    execSync: (sql: string) => executed.push(sql),
  }
  return { db: db as unknown as SQLiteDatabase, executed }
}

describe('migrate', () => {
  const migrations = ['CREATE TABLE a (id)', 'CREATE TABLE b (id)', 'ALTER TABLE a ADD COLUMN x']

  it('applies every migration to a new database', () => {
    const { db, executed } = fakeDb(0)
    migrate(db, migrations)
    expect(executed).toEqual([...migrations, 'PRAGMA user_version = 3'])
  })

  it('applies only the pending ones', () => {
    const { db, executed } = fakeDb(2)
    migrate(db, migrations)
    expect(executed).toEqual(['ALTER TABLE a ADD COLUMN x', 'PRAGMA user_version = 3'])
  })

  it('does nothing when up to date', () => {
    const { db, executed } = fakeDb(3)
    migrate(db, migrations)
    expect(executed).toEqual([])
  })
})
