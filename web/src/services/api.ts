import type { Project, UploadResponse, ToggleResponse } from '../types'

// 动态获取API基础URL
const getApiBase = () => {
  // 在Docker环境中，前端通过Caddy代理访问后端
  if (window.location.hostname !== 'localhost') {
    return '/api'
  }
  // 开发环境直接访问后端
  return 'http://localhost:3000/api'
}

// 通用请求处理
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const API_BASE = getApiBase()
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || '请求失败')
  }

  return data
}

// API方法
export const api = {
  // 获取项目列表
  getProjects: (): Promise<Project[]> => request<Project[]>('/projects'),

  // 上传项目
  uploadProject: (formData: FormData): Promise<UploadResponse> => 
    request<UploadResponse>('/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // 让浏览器自动设置Content-Type
    }),

  // 切换项目状态
  toggleProject: (slug: string): Promise<ToggleResponse> => 
    request<ToggleResponse>(`/projects/${slug}/toggle`, {
      method: 'PATCH',
    }),

  // 删除项目
  deleteProject: (slug: string): Promise<{ message: string }> => 
    request<{ message: string }>(`/projects/${slug}`, {
      method: 'DELETE',
    }),
}
