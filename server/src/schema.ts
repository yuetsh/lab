import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  entryPoint: text('entry_point').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  uploadedAt: text('uploaded_at').default('CURRENT_TIMESTAMP')
})

export const files = sqliteTable('files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  content: text('content').notNull(),
  size: integer('size').notNull(),
  projectId: integer('project_id').notNull().references(() => projects.id),
  uploadedAt: text('uploaded_at').default('CURRENT_TIMESTAMP')
})
