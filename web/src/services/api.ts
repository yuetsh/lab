import type { Project, UploadResponse, ToggleResponse } from "../types"

const getApiBase = () => {
  if (window.location.hostname !== 'localhost') {
    return `${window.location.protocol}//${window.location.host}/api`
  }
  // 开发环境直接访问后端
  return 'http://localhost:3000/api'
}

// 通用请求处理
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const API_BASE = getApiBase()
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || "请求失败")
  }

  return data
}

// API方法
export const api = {
  // 获取项目列表
  getProjects: (): Promise<Project[]> => request<Project[]>("/projects"),

  // 上传项目
  uploadProject: (formData: FormData): Promise<UploadResponse> => {
    const API_BASE = getApiBase()
    return fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData,
    }).then(async (response) => {
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "请求失败")
      }
      return data
    })
  },

  // 切换项目状态
  toggleProject: (slug: string): Promise<ToggleResponse> =>
    request<ToggleResponse>(`/projects/${slug}/toggle`, {
      method: "PATCH",
    }),

  // 删除项目
  deleteProject: (slug: string): Promise<{ message: string }> =>
    request<{ message: string }>(`/projects/${slug}`, {
      method: "DELETE",
    }),
}
