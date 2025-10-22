import { ref } from "vue"
import { api } from "../services/api"
import type { Project } from "../types"

export function useProjects() {
  const projects = ref<Project[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref("")

  const fetchProjects = async (search?: string) => {
    loading.value = true
    error.value = null

    try {
      projects.value = await api.getProjects(search)
    } catch (err) {
      error.value = err instanceof Error ? err.message : "获取项目列表失败"
      console.error("获取项目列表失败:", err)
    } finally {
      loading.value = false
    }
  }

  const searchProjects = async (query: string) => {
    searchQuery.value = query
    await fetchProjects(query)
  }

  const clearSearch = async () => {
    searchQuery.value = ""
    await fetchProjects()
  }

  const refreshProjects = () => {
    return fetchProjects(searchQuery.value)
  }

  return {
    projects,
    loading,
    error,
    searchQuery,
    fetchProjects,
    searchProjects,
    clearSearch,
    refreshProjects,
  }
}
