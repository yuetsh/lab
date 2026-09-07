// 项目类型定义
export interface Project {
  id: number
  slug: string
  name: string
  entryPoint: string
  size: number
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

// 项目详情类型（额外带上 HTML 内容）
export interface ProjectDetail extends Project {
  content: string
}

// 更新项目响应类型
export interface UpdateProjectResponse {
  message: string
  project: Project
}
