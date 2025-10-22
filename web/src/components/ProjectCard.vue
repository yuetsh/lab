<script setup lang="ts">
import { api } from "../services/api"
import { formatDate, getProjectUrl, copyToClipboard } from "../utils"
import { useMessage } from "../composables/useMessage"
import type { Project } from "../types"

interface Props {
  project: Project
  apiBase: string
}

interface Emits {
  (e: "project-updated"): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const { showMessage } = useMessage()

const copyUrl = async (url: string) => {
  try {
    await copyToClipboard(url)
    showMessage("链接已复制到剪贴板！", "success")
  } catch (error) {
    showMessage(
      error instanceof Error ? error.message : "复制失败，请手动复制链接",
      "error"
    )
  }
}

const toggleProjectStatus = async (projectSlug: string) => {
  try {
    const result = await api.toggleProject(projectSlug)
    showMessage(result.message, "success")
    emit("project-updated")
  } catch (error) {
    showMessage(
      error instanceof Error ? error.message : "状态切换失败，请检查网络连接",
      "error"
    )
    console.error("状态切换失败:", error)
  }
}

const deleteProject = async (projectSlug: string, projectName: string) => {
  if (!confirm(`确定要删除项目 "${projectName}" 吗？此操作不可撤销。`)) {
    return
  }

  try {
    const result = await api.deleteProject(projectSlug)
    showMessage(result.message, "success")
    emit("project-updated")
  } catch (error) {
    showMessage(
      error instanceof Error ? error.message : "删除失败，请检查网络连接",
      "error"
    )
    console.error("删除失败:", error)
  }
}
</script>

<template>
  <div class="project-card">
    <div class="project-info">
      <div class="project-header">
        <h3 class="project-name">{{ project.name }}</h3>
        <div class="project-badges">
          <span class="project-type-badge"> 📄 HTML文件 </span>
          <span
            class="status-badge"
            :class="{
              active: project.isActive,
              inactive: !project.isActive,
            }"
          >
            {{ project.isActive ? "🟢 激活" : "🔴 停用" }}
          </span>
        </div>
      </div>
      <div class="project-details">
        <div class="detail-item">
          <span class="label">入口文件:</span>
          <span class="value">{{ project.entryPoint }}</span>
        </div>
        <div class="detail-item">
          <span class="label">创建时间:</span>
          <span class="value">{{ formatDate(project.uploadedAt) }}</span>
        </div>
      </div>
      <div class="project-actions">
        <a
          v-if="project.isActive"
          :href="getProjectUrl(project, apiBase)"
          target="_blank"
          class="visit-button"
        >
          🌐 访问项目
        </a>
        <button
          v-if="project.isActive"
          @click="copyUrl(getProjectUrl(project, apiBase))"
          class="copy-button"
        >
          📋 复制链接
        </button>
        <button
          @click="toggleProjectStatus(project.slug)"
          :class="
            project.isActive ? 'deactivate-button' : 'activate-button'
          "
        >
          {{ project.isActive ? "⏸️ 停用项目" : "▶️ 激活项目" }}
        </button>
        <button
          @click="deleteProject(project.slug, project.name)"
          class="delete-button"
        >
          🗑️ 删除项目
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.project-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.project-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.project-badges {
  display: flex;
  gap: 8px;
  align-items: center;
}

.project-name {
  margin: 0;
  color: #333;
  font-size: 1.2em;
}

.project-type-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 500;
  background: #e3f2fd;
  color: #1976d2;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 500;
  transition: all 0.3s ease;
}

.status-badge.active {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-badge.inactive {
  background: #ffebee;
  color: #c62828;
}

.project-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.9em;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
  font-weight: 400;
}

.project-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.visit-button {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
  transition: all 0.3s ease;
  font-size: 13px;
}

.visit-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.copy-button,
.delete-button {
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  font-size: 13px;
}

.copy-button {
  background: #6c757d;
}

.copy-button:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.delete-button {
  background: #dc3545;
}

.delete-button:hover {
  background: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.activate-button,
.deactivate-button {
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  font-size: 13px;
}

.activate-button {
  background: #28a745;
}

.activate-button:hover {
  background: #218838;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.deactivate-button {
  background: #ffc107;
  color: #212529;
}

.deactivate-button:hover {
  background: #e0a800;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

/* 手机端响应式设计 */
@media (max-width: 768px) {
  .project-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  
  .visit-button,
  .copy-button,
  .delete-button,
  .activate-button,
  .deactivate-button {
    font-size: 12px;
    padding: 6px 8px;
  }
}
</style>
