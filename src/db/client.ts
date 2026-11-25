import type { SQLiteDatabase } from 'expo-sqlite'

import { APP_CONFIG } from '@/config'

import { MIGRATIONS } from './migrations'
import { openDatabase } from './openDatabase'

let db: SQLiteDatabase | null = null

export function getDatabase(): SQLiteDatabase {
  db ??= openDatabase(APP_CONFIG.databaseName, MIGRATIONS)
  return db
}
