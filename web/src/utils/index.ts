import type { Project } from "../types"

// 格式化日期
export const formatDate = (dateString: string): string => {
  // 老库里有 uploaded_at 存成字面量 "CURRENT_TIMESTAMP" 的坏数据（schema 默认值
  // 写错导致）。真实上传时间已经无从恢复，交给下面的无效日期分支显示"未知时间"，
  // 而不是谎称"刚刚"。
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

// 复制到剪贴板。
// navigator.clipboard 只在安全上下文（HTTPS 或 localhost）下存在，通过
// http://内网IP 访问时必定是 undefined，所以必须保留 execCommand 回退。
export const copyToClipboard = async (text: string): Promise<void> => {
  if (window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch (error) {
      console.error("clipboard API 复制失败，回退到 execCommand:", error)
    }
  }

  if (!copyByExecCommand(text)) {
    throw new Error("复制失败，请手动复制链接")
  }
}

// 已废弃但在非安全上下文里仍是唯一可用的方案
const copyByExecCommand = (text: string): boolean => {
  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  // 移出视口，避免页面跳动和移动端弹出键盘
  textarea.style.position = "fixed"
  textarea.style.top = "-9999px"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)

  // 记住用户原本的选区，复制完还回去
  const selection = document.getSelection()
  const previousRange =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

  textarea.select()
  textarea.setSelectionRange(0, text.length)

  let succeeded = false
  try {
    succeeded = document.execCommand("copy")
  } catch (error) {
    console.error("execCommand 复制失败:", error)
  }

  document.body.removeChild(textarea)

  if (selection && previousRange) {
    selection.removeAllRanges()
    selection.addRange(previousRange)
  }

  return succeeded
}
