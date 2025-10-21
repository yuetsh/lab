// 项目类型定义
export interface Project {
  id: number
  slug: string
  name: string
  entryPoint: string
  isActive: boolean
  uploadedAt: string
}

// API响应类型
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
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
