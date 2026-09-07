import type { Project } from "../types"

// 格式化日期
export const formatDate = (dateString: string): string => {
  if (dateString === "CURRENT_TIMESTAMP") {
    return "刚刚"
  }

  const date = new Date(dateString)

  if (isNaN(date.getTime())) {
    return "未知时间"
  }

  return date.toLocaleString("zh-CN")
}

// 生成项目URL
export const getProjectUrl = (project: Project, apiBase: string): string => {
  const baseUrl = apiBase.replace("/api", "")
  return `${baseUrl}/projects/${project.slug}`
}

// 复制到剪贴板
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    console.error("复制失败:", error)
    throw new Error("复制失败，请手动复制链接")
  }
}
