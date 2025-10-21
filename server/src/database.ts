import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { join } from 'path'
import * as schema from './schema'

const dbPath = join(process.cwd(), 'uploads.db')
const sqlite = new Database(dbPath)
const db = drizzle(sqlite, { schema })

// 初始化数据库表
export async function initDatabase() {
  // 创建projects表
  await db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      entry_point TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // 创建files表
  await db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      content TEXT NOT NULL,
      size INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )
  `)
}

export default db
export { schema }
