<script setup lang="ts">
import { ref } from "vue"
import { api } from "../services/api"
import { formatDate, getProjectUrl, copyToClipboard } from "../utils"
import { useMessage } from "../composables/useMessage"
import type { Project, ProjectDetail } from "../types"

interface Props {
  project: Project
  apiBase: string
}

interface Emits {
  (e: "project-updated"): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { showMessage } = useMessage()

// 编辑相关状态
const isEditing = ref(false)
const isLoading = ref(false)
const editProjectName = ref("")
const editFileInput = ref<HTMLInputElement>()
const projectDetail = ref<ProjectDetail | null>(null)
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)

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

// 打开编辑对话框
const openEditDialog = async (projectSlug: string) => {
  isEditing.value = true
  editProjectName.value = props.project.name
  
  try {
    // 获取项目详情（包括文件内容）
    projectDetail.value = await api.getProjectDetail(projectSlug)
    if (projectDetail.value.files.length > 0) {
      // 可以在这里预填充文件内容，如果需要的话
    }
  } catch (error) {
    showMessage(
      error instanceof Error ? error.message : "获取项目详情失败",
      "error"
    )
    console.error("获取项目详情失败:", error)
    isEditing.value = false
  }
}

// 关闭编辑对话框
const closeEditDialog = () => {
  isEditing.value = false
  editProjectName.value = ""
  projectDetail.value = null
  selectedFile.value = null
  isDragging.value = false
  if (editFileInput.value) {
    editFileInput.value.value = ""
  }
}

// 验证文件
const validateFile = (file: File): boolean => {
  // 文件类型验证
  if (!file.name.endsWith(".html")) {
    showMessage("请选择HTML文件", "error")
    return false
  }
  
  // 文件大小验证 (5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    showMessage("文件大小不能超过5MB", "error")
    return false
  }
  
  if (file.size === 0) {
    showMessage("文件不能为空", "error")
    return false
  }
  
  return true
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  if (validateFile(file)) {
    selectedFile.value = file
  } else {
    // 验证失败，清空选择
    if (editFileInput.value) {
      editFileInput.value.value = ""
    }
    selectedFile.value = null
  }
}

// 处理拖拽
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  
  if (validateFile(file)) {
    selectedFile.value = file
    // 同步到input元素
    if (editFileInput.value) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      editFileInput.value.files = dataTransfer.files
    }
  }
}

// 清除选择的文件
const clearSelectedFile = () => {
  selectedFile.value = null
  if (editFileInput.value) {
    editFileInput.value.value = ""
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
}

// 保存编辑
const saveEdit = async () => {
  if (!editProjectName.value.trim()) {
    showMessage("请输入项目名称", "error")
    return
  }
  
  if (editProjectName.value.length > 50) {
    showMessage("项目名称不能超过50个字符", "error")
    return
  }

  const file = selectedFile.value
  
  // 至少需要修改名称或文件
  if (editProjectName.value === props.project.name && !file) {
    showMessage("请至少修改项目名称或上传新文件", "error")
    return
  }

  isLoading.value = true

  try {
    const formData = new FormData()
    
    // 只有当名称改变时才添加
    if (editProjectName.value !== props.project.name) {
      formData.append("projectName", editProjectName.value)
    }
    
    // 如果选择了新文件，添加文件
    if (file) {
      formData.append("file", file)
    }

    const result = await api.updateProject(props.project.slug, formData)
    showMessage(result.message, "success")
    emit("project-updated")
    closeEditDialog()
  } catch (error) {
    showMessage(
      error instanceof Error ? error.message : "更新失败，请检查网络连接",
      "error"
    )
    console.error("更新失败:", error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="project-card">
    <div class="project-info">
      <div class="project-header">
        <h3 class="project-name">{{ props.project.name }}</h3>
        <div class="project-badges">
          <span class="project-type-badge"> 📄 HTML文件 </span>
          <span
            class="status-badge"
            :class="{
              active: props.project.isActive,
              inactive: !props.project.isActive,
            }"
          >
            {{ props.project.isActive ? "🟢 激活" : "🔴 停用" }}
          </span>
        </div>
      </div>
      <div class="project-details">
        <div class="detail-item">
          <span class="label">入口文件:</span>
          <span class="value">{{ props.project.entryPoint }}</span>
        </div>
        <div class="detail-item">
          <span class="label">创建时间:</span>
          <span class="value">{{ formatDate(props.project.uploadedAt) }}</span>
        </div>
      </div>
      <div class="project-actions">
        <div class="actions-container">
          <!-- 主要操作 -->
          <div class="action-section primary-section">
            <a
              v-if="props.project.isActive"
              :href="getProjectUrl(props.project, props.apiBase)"
              target="_blank"
              class="action-btn visit-btn"
              title="访问项目"
            >
              <span class="btn-icon">🌐</span>
              <span class="btn-text">访问</span>
            </a>
            <button
              v-if="props.project.isActive"
              @click="copyUrl(getProjectUrl(props.project, props.apiBase))"
              class="action-btn copy-btn"
              title="复制链接"
            >
              <span class="btn-icon">📋</span>
              <span class="btn-text">复制</span>
            </button>
          </div>

          <!-- 分隔符 -->
          <div v-if="props.project.isActive" class="action-divider"></div>

          <!-- 管理操作 -->
          <div class="action-section management-section">
            <button
              @click="openEditDialog(props.project.slug)"
              class="action-btn edit-btn"
              title="编辑项目"
            >
              <span class="btn-icon">✏️</span>
              <span class="btn-text">编辑</span>
            </button>
            <button
              @click="toggleProjectStatus(props.project.slug)"
              :class="[
                'action-btn',
                props.project.isActive ? 'deactivate-btn' : 'activate-btn'
              ]"
              :title="props.project.isActive ? '停用项目' : '激活项目'"
            >
              <span class="btn-icon">{{ props.project.isActive ? "⏸️" : "▶️" }}</span>
              <span class="btn-text">{{ props.project.isActive ? "停用" : "激活" }}</span>
            </button>
            <button
              @click="deleteProject(props.project.slug, props.project.name)"
              class="action-btn delete-btn"
              title="删除项目"
            >
              <span class="btn-icon">🗑️</span>
              <span class="btn-text">删除</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 编辑对话框 -->
  <div v-if="isEditing" class="edit-modal-overlay" @click="closeEditDialog">
    <div class="edit-modal" @click.stop>
      <div class="edit-modal-header">
        <h3>编辑项目</h3>
        <button @click="closeEditDialog" class="close-button">✕</button>
      </div>
      
      <div class="edit-modal-body">
        <div class="form-group">
          <label for="editProjectName">项目名称:</label>
          <input
            v-model="editProjectName"
            type="text"
            id="editProjectName"
            placeholder="请输入项目名称"
            class="form-input"
            maxlength="50"
            :disabled="isLoading"
          />
          <small class="input-hint">最多50个字符</small>
        </div>

        <div class="form-group">
          <label>更新HTML文件 (可选):</label>
          
          <!-- 文件上传区域 -->
          <div
            class="file-upload-area"
            :class="{ 'dragging': isDragging, 'has-file': selectedFile }"
            @dragover.prevent="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
            @click="editFileInput?.click()"
          >
            <input
              ref="editFileInput"
              type="file"
              accept=".html"
              @change="handleFileSelect"
              :disabled="isLoading"
              class="file-input-hidden"
            />
            
            <div v-if="!selectedFile" class="upload-placeholder">
              <div class="upload-icon">📄</div>
              <div class="upload-text">
                <span class="upload-main-text">点击选择或拖拽HTML文件到此处</span>
                <span class="upload-hint">支持 .html 文件，最大 5MB</span>
              </div>
            </div>
            
            <div v-else class="file-preview">
              <div class="file-info">
                <div class="file-icon">📄</div>
                <div class="file-details">
                  <div class="file-name">{{ selectedFile.name }}</div>
                  <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
                </div>
              </div>
              <button
                type="button"
                @click.stop="clearSelectedFile"
                class="remove-file-btn"
                :disabled="isLoading"
                title="移除文件"
              >
                ✕
              </button>
            </div>
          </div>
          
          <small class="input-hint">如果不选择文件，将保持原有文件不变</small>
        </div>
      </div>

      <div class="edit-modal-footer">
        <button
          @click="closeEditDialog"
          class="cancel-button"
          :disabled="isLoading"
        >
          取消
        </button>
        <button
          @click="saveEdit"
          class="save-button"
          :disabled="isLoading"
        >
          {{ isLoading ? "保存中..." : "保存" }}
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
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e8e8e8;
}

.actions-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.action-section {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-divider {
  width: 1px;
  height: 24px;
  background: #ddd;
  flex-shrink: 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.2s ease;
  text-decoration: none;
  white-space: nowrap;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-icon {
  font-size: 14px;
  line-height: 1;
}

.btn-text {
  font-size: 13px;
}

/* 主要操作按钮 */
.visit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.visit-btn:hover {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.copy-btn {
  background: #6c757d;
  color: white;
}

.copy-btn:hover {
  background: #5a6268;
}

/* 管理操作按钮 */
.edit-btn {
  background: #17a2b8;
  color: white;
}

.edit-btn:hover {
  background: #138496;
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
}

.activate-btn {
  background: #28a745;
  color: white;
}

.activate-btn:hover {
  background: #218838;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.deactivate-btn {
  background: #ffc107;
  color: #212529;
}

.deactivate-btn:hover {
  background: #e0a800;
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.delete-btn:hover {
  background: #c82333;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
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

/* 编辑对话框样式 */
.edit-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.edit-modal {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.edit-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.edit-modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.3em;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: #f0f0f0;
  color: #333;
}

.edit-modal-body {
  padding: 20px;
}

.edit-modal-body .form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.edit-modal-body .form-group label {
  font-weight: 500;
  color: #555;
}

.edit-modal-body .form-input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.edit-modal-body .form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.edit-modal-body .form-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

/* 文件上传区域 */
.file-upload-area {
  position: relative;
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 24px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-upload-area:hover {
  border-color: #667eea;
  background: #f5f7ff;
}

.file-upload-area.dragging {
  border-color: #667eea;
  background: #eef2ff;
  transform: scale(1.02);
}

.file-upload-area.has-file {
  border-color: #28a745;
  background: #f0f9f4;
  cursor: default;
}

.file-input-hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  opacity: 0.6;
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.upload-main-text {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.upload-hint {
  font-size: 12px;
  color: #999;
}

.file-preview {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.file-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.file-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-weight: 500;
  color: #333;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #666;
}

.remove-file-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: none;
  background: #dc3545;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
}

.remove-file-btn:hover:not(:disabled) {
  background: #c82333;
  transform: scale(1.1);
}

.remove-file-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.edit-modal-body .input-hint {
  color: #666;
  font-size: 12px;
}

.edit-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.cancel-button,
.save-button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
}

.cancel-button {
  background: #6c757d;
  color: white;
}

.cancel-button:hover:not(:disabled) {
  background: #5a6268;
  transform: translateY(-1px);
}

.save-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.save-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.cancel-button:disabled,
.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 手机端响应式设计 */
@media (max-width: 768px) {
  .actions-container {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .action-section {
    flex-wrap: wrap;
    gap: 6px;
  }

  .action-divider {
    display: none;
  }

  .action-btn {
    flex: 1;
    min-width: 0;
    justify-content: center;
    padding: 8px 10px;
    font-size: 12px;
  }

  .btn-text {
    font-size: 12px;
  }

  .edit-modal {
    width: 95%;
    margin: 10px;
  }

  .edit-modal-header,
  .edit-modal-body,
  .edit-modal-footer {
    padding: 15px;
  }
}
</style>
