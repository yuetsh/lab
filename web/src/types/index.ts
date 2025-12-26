// 项目类型定义
export interface Project {
  id: number
  slug: string
  name: string
  entryPoint: string
  isActive: boolean
  uploadedAt: string
}

// 上传响应类型
export interface UploadResponse {
  id: number
  slug: string
  name: string
  message: string
  url: string
}

// 状态切换响应类型
export interface ToggleResponse {
  message: string
  isActive: boolean
}

// 项目文件类型
export interface ProjectFile {
  id: number
  filename: string
  originalName: string
  content: string
  size: number
  projectId: number
  uploadedAt: string
}

// 项目详情类型（包含文件）
export interface ProjectDetail extends Project {
  files: ProjectFile[]
}

// 更新项目响应类型
export interface UpdateProjectResponse {
  message: string
  project: Project
}
