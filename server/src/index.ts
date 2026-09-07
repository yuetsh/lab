import { Hono } from "hono"
import { cors } from "hono/cors"
import db, { schema, initDatabase } from "./database"
import { eq, desc, like } from "drizzle-orm"
import { randomBytes } from "crypto"

const app = new Hono()

// 启用CORS
app.use("*", cors())

// 生成安全的slug
const generateSlug = (): string => {
  return randomBytes(6).toString('hex')
}

// 辅助函数：根据slug查找项目
const findProjectBySlug = async (slug: string) => {
  const project = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.slug, slug))
    .limit(1)
  return project[0] || null
}

// 辅助函数：创建项目
const createProject = async (name: string, entryPoint: string) => {
  const slug = generateSlug()
  const uploadedAt = new Date().toISOString()
  const projectResult = await db
    .insert(schema.projects)
    .values({
      slug,
      name,
      entryPoint,
      uploadedAt,
    })
    .returning({ id: schema.projects.id, slug: schema.projects.slug })
  return projectResult[0]
}

// 辅助函数：存储文件
const storeFile = async (
  file: globalThis.File,
  projectId: number,
  filename: string
) => {
  const content = await file.text()
  const uploadedAt = new Date().toISOString()
  await db.insert(schema.files).values({
    filename,
    originalName: file.name,
    content,
    size: file.size,
    projectId,
    uploadedAt,
  })
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
      const searchTerm = `%${searchQuery.trim()}%`
      const projectList = await db
        .select()
        .from(schema.projects)
        .where(like(schema.projects.name, searchTerm))
        .orderBy(desc(schema.projects.id))
      
      return c.json(projectList)
    } else {
      const projectList = await db
        .select()
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

    // 查找项目中的文件
    const projectFiles = await db
      .select()
      .from(schema.files)
      .where(eq(schema.files.projectId, project.id))

    return c.json({
      ...project,
      files: projectFiles,
    })
  } catch (error) {
    return handleError(c, error, "获取项目详情失败")
  }
})

// 项目访问路由 - 直接处理项目内容
app.get("/projects/:slug", async (c) => {
  try {
    const slug = c.req.param("slug")
    const project = await findProjectBySlug(slug)

    if (!project) {
      return c.json({ error: "项目不存在" }, 404)
    }

    if (!project.isActive) {
      return c.json({ error: "项目已停用" }, 403)
    }

    // 查找项目中的文件
    const targetFile = await db
      .select()
      .from(schema.files)
      .where(eq(schema.files.projectId, project.id))
      .limit(1)

    if (!targetFile.length) {
      return c.json({ error: "项目文件不存在" }, 404)
    }

    return new Response(targetFile[0].content, {
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

    if (!projectName || projectName.trim().length === 0) {
      return c.json({ error: "项目名称不能为空" }, 400)
    }

    if (projectName.length > 20) {
      return c.json({ error: "项目名称不能超过20个字符" }, 400)
    }

    // 文件类型和大小验证
    if (!file.name.endsWith(".html")) {
      return c.json({ error: "只支持HTML文件" }, 400)
    }

    const maxFileSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxFileSize) {
      return c.json({ error: "文件大小不能超过5MB" }, 400)
    }

    if (file.size === 0) {
      return c.json({ error: "文件不能为空" }, 400)
    }

    const project = await createProject(projectName, file.name)
    const filename = `file_${Date.now()}.html`
    await storeFile(file, project.id, filename)

    return c.json({
      id: project.id,
      slug: project.slug,
      name: projectName,
      message: "HTML文件上传成功",
      url: `/projects/${project.slug}/`,
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

    // 更新项目名称
    if (projectName) {
      if (projectName.trim().length === 0) {
        return c.json({ error: "项目名称不能为空" }, 400)
      }

      if (projectName.length > 50) {
        return c.json({ error: "项目名称不能超过50个字符" }, 400)
      }

      await db
        .update(schema.projects)
        .set({ name: projectName.trim() })
        .where(eq(schema.projects.slug, slug))
    }

    // 更新文件
    if (file) {
      // 文件类型和大小验证
      if (!file.name.endsWith(".html")) {
        return c.json({ error: "只支持HTML文件" }, 400)
      }

      const maxFileSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxFileSize) {
        return c.json({ error: "文件大小不能超过5MB" }, 400)
      }

      if (file.size === 0) {
        return c.json({ error: "文件不能为空" }, 400)
      }

      // 更新入口文件名
      await db
        .update(schema.projects)
        .set({ entryPoint: file.name })
        .where(eq(schema.projects.slug, slug))

      // 更新文件内容（更新第一个文件，或创建新文件）
      const existingFiles = await db
        .select()
        .from(schema.files)
        .where(eq(schema.files.projectId, project.id))
        .limit(1)

      const content = await file.text()
      const filename = `file_${Date.now()}.html`

      if (existingFiles.length > 0) {
        // 更新现有文件
        await db
          .update(schema.files)
          .set({
            filename,
            originalName: file.name,
            content,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          })
          .where(eq(schema.files.id, existingFiles[0].id))
      } else {
        // 创建新文件
        await storeFile(file, project.id, filename)
      }
    }

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

    // 删除项目相关的所有文件
    await db.delete(schema.files).where(eq(schema.files.projectId, project.id))

    // 删除项目
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
