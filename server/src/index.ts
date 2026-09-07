import { Hono } from "hono"
import { cors } from "hono/cors"
import db, { schema, initDatabase } from "./database"
import { eq, desc, sql } from "drizzle-orm"
import { randomBytes } from "crypto"

const app = new Hono()

// 生产环境前端与 API 同源（经 Caddy 代理），只有本地开发的 Vite dev server 需要跨域
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:4173"],
  })
)

// 项目名称长度上限：上传与更新必须一致，否则改名就能绕过上传时的限制
const MAX_PROJECT_NAME_LENGTH = 20

// 校验是否为 HTML 文件（扩展名大小写不敏感）
const isHtmlFile = (name: string): boolean => name.toLowerCase().endsWith(".html")

// 转义 LIKE 通配符，避免用户搜索的 % 和 _ 被当成模式匹配
const escapeLike = (value: string): string =>
  value.replace(/[\\%_]/g, (ch) => "\\" + ch)

// 生成安全的slug
const generateSlug = (): string => {
  return randomBytes(6).toString('hex')
}

// 项目的元信息列。content 可能有 5MB，只在真正需要时单独查
const projectColumns = {
  id: schema.projects.id,
  slug: schema.projects.slug,
  name: schema.projects.name,
  entryPoint: schema.projects.entryPoint,
  size: schema.projects.size,
  isActive: schema.projects.isActive,
  uploadedAt: schema.projects.uploadedAt,
}

// 辅助函数：根据slug查找项目
const findProjectBySlug = async (slug: string) => {
  const project = await db
    .select(projectColumns)
    .from(schema.projects)
    .where(eq(schema.projects.slug, slug))
    .limit(1)
  return project[0] || null
}

// 辅助函数：创建项目（内容直接落在 projects 上）
const createProject = async (name: string, file: globalThis.File) => {
  const projectResult = await db
    .insert(schema.projects)
    .values({
      slug: generateSlug(),
      name,
      entryPoint: file.name,
      content: await file.text(),
      size: file.size,
      uploadedAt: new Date().toISOString(),
    })
    .returning({ id: schema.projects.id, slug: schema.projects.slug })
  return projectResult[0]
}

// 辅助函数：统一错误处理
const handleError = (
  c: any,
  error: any,
  message: string,
  statusCode: number = 500
) => {
  console.error(message, error)
  return c.json({ error: message }, statusCode)
}

// 获取项目列表
app.get("/api/projects", async (c) => {
  try {
    const searchQuery = c.req.query("search")
    
    // 如果有搜索查询，添加搜索条件
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = `%${escapeLike(searchQuery.trim())}%`
      const projectList = await db
        .select(projectColumns)
        .from(schema.projects)
        .where(sql`${schema.projects.name} LIKE ${searchTerm} ESCAPE '\\'`)
        .orderBy(desc(schema.projects.id))
      
      return c.json(projectList)
    } else {
      const projectList = await db
        .select(projectColumns)
        .from(schema.projects)
        .orderBy(desc(schema.projects.id))
      
      return c.json(projectList)
    }
  } catch (error) {
    return handleError(c, error, "获取项目列表失败")
  }
})

// 获取项目详情（包括文件内容）
app.get("/api/projects/:slug", async (c) => {
  try {
    const slug = c.req.param("slug")
    const project = await findProjectBySlug(slug)

    if (!project) {
      return c.json({ error: "项目不存在" }, 404)
    }

    const detail = await db
      .select({ content: schema.projects.content })
      .from(schema.projects)
      .where(eq(schema.projects.slug, slug))
      .limit(1)

    return c.json({
      ...project,
      content: detail[0]?.content ?? "",
    })
  } catch (error) {
    return handleError(c, error, "获取项目详情失败")
  }
})

// 项目访问路由 - 直接处理项目内容
app.get("/projects/:slug", async (c) => {
  try {
    const slug = c.req.param("slug")
    const rows = await db
      .select({
        isActive: schema.projects.isActive,
        content: schema.projects.content,
      })
      .from(schema.projects)
      .where(eq(schema.projects.slug, slug))
      .limit(1)

    const project = rows[0]

    if (!project) {
      return c.json({ error: "项目不存在" }, 404)
    }

    if (!project.isActive) {
      return c.json({ error: "项目已停用" }, 403)
    }

    return new Response(project.content, {
      headers: { 
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache"
      },
    })
  } catch (error) {
    return handleError(c, error, "获取项目内容失败")
  }
})


// 项目上传API
app.post("/api/upload", async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get("file") as globalThis.File
    const projectName = formData.get("projectName") as string

    // 输入验证
    if (!file) {
      return c.json({ error: "没有选择文件" }, 400)
    }

    const name = projectName?.trim() ?? ""

    if (!name) {
      return c.json({ error: "项目名称不能为空" }, 400)
    }

    if (name.length > MAX_PROJECT_NAME_LENGTH) {
      return c.json(
        { error: `项目名称不能超过${MAX_PROJECT_NAME_LENGTH}个字符` },
        400
      )
    }

    // 文件类型和大小验证
    if (!isHtmlFile(file.name)) {
      return c.json({ error: "只支持HTML文件" }, 400)
    }

    const maxFileSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxFileSize) {
      return c.json({ error: "文件大小不能超过5MB" }, 400)
    }

    if (file.size === 0) {
      return c.json({ error: "文件不能为空" }, 400)
    }

    const project = await createProject(name, file)

    return c.json({
      id: project.id,
      slug: project.slug,
      name,
      message: "HTML文件上传成功",
      url: `/projects/${project.slug}`,
    })
  } catch (error) {
    return handleError(c, error, "上传失败")
  }
})

// 切换项目激活状态
app.patch("/api/projects/:slug/toggle", async (c) => {
  try {
    const slug = c.req.param("slug")
    const project = await findProjectBySlug(slug)

    if (!project) {
      return c.json({ error: "项目不存在" }, 404)
    }

    // 切换激活状态
    const newStatus = !project.isActive
    await db
      .update(schema.projects)
      .set({ isActive: newStatus })
      .where(eq(schema.projects.slug, slug))

    return c.json({ 
      message: `项目已${newStatus ? '激活' : '停用'}`,
      isActive: newStatus 
    })
  } catch (error) {
    return handleError(c, error, "切换项目状态失败")
  }
})

// 更新项目
app.put("/api/projects/:slug", async (c) => {
  try {
    const slug = c.req.param("slug")
    const project = await findProjectBySlug(slug)

    if (!project) {
      return c.json({ error: "项目不存在" }, 404)
    }

    const formData = await c.req.formData()
    const projectName = formData.get("projectName") as string | null
    const file = formData.get("file") as globalThis.File | null

    // 至少需要提供一个更新字段
    if (!projectName && !file) {
      return c.json({ error: "至少需要提供项目名称或文件" }, 400)
    }

    // 先把改动收集齐、校验完，最后一条 UPDATE 落库。
    // 分成多条会出现"名字改了但文件没换成"这种半更新状态。
    const updates: {
      name?: string
      entryPoint?: string
      content?: string
      size?: number
    } = {}

    if (projectName) {
      const name = projectName.trim()

      if (!name) {
        return c.json({ error: "项目名称不能为空" }, 400)
      }

      if (name.length > MAX_PROJECT_NAME_LENGTH) {
        return c.json(
          { error: `项目名称不能超过${MAX_PROJECT_NAME_LENGTH}个字符` },
          400
        )
      }

      updates.name = name
    }

    if (file) {
      if (!isHtmlFile(file.name)) {
        return c.json({ error: "只支持HTML文件" }, 400)
      }

      const maxFileSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxFileSize) {
        return c.json({ error: "文件大小不能超过5MB" }, 400)
      }

      if (file.size === 0) {
        return c.json({ error: "文件不能为空" }, 400)
      }

      updates.entryPoint = file.name
      updates.content = await file.text()
      updates.size = file.size
    }

    await db
      .update(schema.projects)
      .set(updates)
      .where(eq(schema.projects.slug, slug))

    // 返回更新后的项目信息
    const updatedProject = await findProjectBySlug(slug)
    return c.json({
      message: "项目更新成功",
      project: updatedProject,
    })
  } catch (error) {
    return handleError(c, error, "更新项目失败")
  }
})

// 删除项目
app.delete("/api/projects/:slug", async (c) => {
  try {
    const slug = c.req.param("slug")
    const project = await findProjectBySlug(slug)

    if (!project) {
      return c.json({ error: "项目不存在" }, 404)
    }

    await db.delete(schema.projects).where(eq(schema.projects.slug, slug))

    return c.json({ message: "项目删除成功" })
  } catch (error) {
    return handleError(c, error, "删除项目失败")
  }
})

// 启动服务器
const port = 3000

// 初始化数据库
initDatabase()
  .then(() => {
    console.log("数据库初始化完成")
    console.log(`服务器运行在 http://localhost:${port}`)

    Bun.serve({
      fetch: app.fetch,
      port,
    })
  })
  .catch((error) => {
    console.error("数据库初始化失败:", error)
    process.exit(1)
  })
