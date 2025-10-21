<script setup lang="ts">
import { ref } from "vue"
import { api } from "../services/api"
import { formatDate, getProjectUrl, copyToClipboard } from "../utils"
import { useMessage } from "../composables/useMessage"
import type { Project } from "../types"

interface Props {
  projects: Project[]
  apiBase: string
}

interface Emits {
  (e: "project-uploaded"): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const { message: uploadMessage, messageType, showMessage } = useMessage()
const projectName = ref("")
const isUploading = ref(false)
const fileInput = ref<HTMLInputElement>()

const handleFileSelect = () => {
  const file = fileInput.value?.files?.[0]
  if (file && file.name.endsWith(".html")) {
    uploadProject(file)
  } else {
    showMessage("请选择HTML文件", "error")
  }
}

const uploadProject = async (file: File) => {
  if (!projectName.value.trim()) {
    showMessage("请输入项目名称", "error")
    return
  }

  isUploading.value = true

  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("projectName", projectName.value)

    const result = await api.uploadProject(formData)
    showMessage(
      `项目 "${result.name}" 上传成功！访问地址: ${result.url}`,
      "success"
    )
    emit("project-uploaded")
    resetForm()
  } catch (error) {
    showMessage(
      error instanceof Error ? error.message : "上传失败，请检查网络连接",
      "error"
    )
    console.error("上传错误:", error)
  } finally {
    isUploading.value = false
  }
}

const resetForm = () => {
  projectName.value = ""
  if (fileInput.value) {
    fileInput.value.value = ""
  }
}

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
    emit("project-uploaded")
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
    emit("project-uploaded")
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
  <div class="project-manager">
    <div class="upload-section">
      <h2>🚀 HTML文件托管</h2>
      <p class="description">上传HTML文件，立即获得在线访问链接。</p>

      <div class="project-form">
        <div class="form-group">
          <label for="projectName">项目名称:</label>
          <input
            v-model="projectName"
            type="text"
            id="projectName"
            placeholder="请输入项目名称"
            class="form-input"
          />
        </div>

        <div class="file-upload">
          <input
            ref="fileInput"
            type="file"
            accept=".html"
            @change="handleFileSelect"
            style="display: none"
          />
          <button
            @click="fileInput?.click()"
            :disabled="isUploading"
            class="upload-button"
          >
            {{ isUploading ? "上传中..." : "选择HTML文件" }}
          </button>
        </div>
      </div>

      <div
        v-if="uploadMessage"
        class="upload-message"
        :class="{
          success: messageType === 'success',
          error: messageType === 'error',
        }"
      >
        {{ uploadMessage }}
      </div>
    </div>

    <div class="projects-section">
      <h2>📋 我的托管项目</h2>
      <div v-if="projects.length === 0" class="empty-state">
        <p>还没有托管任何项目，上传一个HTML文件开始吧！</p>
      </div>
      <div v-else class="projects-grid">
        <div v-for="project in projects" :key="project.id" class="project-card">
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
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-manager {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.upload-section {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.upload-section h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.5em;
}

.description {
  margin: 0 0 20px 0;
  color: #666;
  line-height: 1.5;
}

.project-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #555;
}

.form-input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  max-width: 300px;
  width: 100%;
  text-align: center;
  margin: 0 auto;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.upload-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 16px;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.upload-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.upload-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-message {
  margin-top: 15px;
  padding: 10px;
  border-radius: 5px;
  text-align: center;
  font-weight: 500;
}

.upload-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.upload-message:not(.success) {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.projects-section {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.projects-section h2 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.5em;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 1.1em;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

/* 响应式设计：小屏幕时切换为单列 */
@media (max-width: 768px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }
}

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
  padding: 10px 15px;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
  transition: all 0.3s ease;
}

.visit-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.copy-button,
.delete-button {
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
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
  padding: 10px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
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
</style>
