import { ref } from 'vue'
import { api } from '../services/api'
import type { Project } from '../types'

export function useProjects() {
  const projects = ref<Project[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchProjects = async () => {
    loading.value = true
    error.value = null
    
    try {
      projects.value = await api.getProjects()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取项目列表失败'
      console.error('获取项目列表失败:', err)
    } finally {
      loading.value = false
    }
  }

  const refreshProjects = () => {
    return fetchProjects()
  }

  return {
    projects,
    loading,
    error,
    fetchProjects,
    refreshProjects
  }
}
