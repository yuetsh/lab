import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// 一个项目对应一个 HTML 文件，内容直接存在这张表上。
// 早先内容放在独立的 files 表里，但两者始终是 1:1，那层间接只带来了
// 额外的 join、无人读取的 filename 字段和没有 orderBy 的 limit(1) 取数。
export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  // 上传时的原始文件名，仅用于展示
  entryPoint: text('entry_point').notNull(),
  content: text('content').notNull(),
  size: integer('size').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  // 必须是 sql`CURRENT_TIMESTAMP`：写成字符串会把 'CURRENT_TIMESTAMP' 这七个字
  // 当默认值存进去，老库里就有这样的坏数据
  uploadedAt: text('uploaded_at').default(sql`CURRENT_TIMESTAMP`)
})
