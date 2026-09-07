import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import * as schema from './schema'

const dbPath = `${process.cwd()}/data/uploads.db`
const sqlite = new Database(dbPath)
const db = drizzle(sqlite, { schema })

// 初始化数据库表
export async function initDatabase() {
  sqlite.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      entry_point TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      size INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  migrateFilesIntoProjects()
}

// 老库迁移：内容原本存在独立的 files 表里，搬到 projects 上后删掉该表。
// 幂等，新库和已迁移过的库都会直接跳过。
function migrateFilesIntoProjects() {
  const columns = sqlite
    .query<{ name: string }, []>(`PRAGMA table_info(projects)`)
    .all()
  const existing = new Set(columns.map((c) => c.name))

  if (!existing.has('content')) {
    sqlite.run(`ALTER TABLE projects ADD COLUMN content TEXT NOT NULL DEFAULT ''`)
  }
  if (!existing.has('size')) {
    sqlite.run(`ALTER TABLE projects ADD COLUMN size INTEGER NOT NULL DEFAULT 0`)
  }

  const filesTable = sqlite
    .query(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'files'`)
    .get()

  if (!filesTable) return

  const moved = sqlite.transaction(() => {
    sqlite.run(`
      UPDATE projects SET
        content = COALESCE(
          (SELECT f.content FROM files f WHERE f.project_id = projects.id ORDER BY f.id LIMIT 1),
          content
        ),
        size = COALESCE(
          (SELECT f.size FROM files f WHERE f.project_id = projects.id ORDER BY f.id LIMIT 1),
          size
        )
      WHERE content = ''
    `)
    const count = sqlite.query<{ c: number }, []>(`SELECT COUNT(*) c FROM files`).get()
    sqlite.run(`DROP TABLE files`)
    return count?.c ?? 0
  })()

  console.log(`已将 files 表的 ${moved} 条记录并入 projects，并删除 files 表`)
}

export default db
export { schema }
