import type { Project, UploadResponse, ToggleResponse, ProjectDetail, UpdateProjectResponse } from "../types"

// 同时被 App.vue 复用，避免两份相同实现
export const getApiBase = () => {
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
    // options 必须先展开：放在后面会把整个 headers 键覆盖掉，
    // 上面的合并就成了摆设
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
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
  getProjects: (searchQuery?: string): Promise<Project[]> => {
    const url = searchQuery ? `/projects?search=${encodeURIComponent(searchQuery)}` : "/projects"
    return request<Project[]>(url)
  },

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

  // 获取项目详情
  getProjectDetail: (slug: string): Promise<ProjectDetail> =>
    request<ProjectDetail>(`/projects/${slug}`),

  // 更新项目
  updateProject: (slug: string, formData: FormData): Promise<UpdateProjectResponse> => {
    const API_BASE = getApiBase()
    return fetch(`${API_BASE}/projects/${slug}`, {
      method: "PUT",
      body: formData,
    }).then(async (response) => {
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "请求失败")
      }
      return data
    })
  },

  // 删除项目
  deleteProject: (slug: string): Promise<{ message: string }> =>
    request<{ message: string }>(`/projects/${slug}`, {
      method: "DELETE",
    }),
}
