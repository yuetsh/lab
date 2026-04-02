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
  }
}

const openEditDialog = async (projectSlug: string) => {
  isEditing.value = true
  editProjectName.value = props.project.name

  try {
    projectDetail.value = await api.getProjectDetail(projectSlug)
  } catch (error) {
    showMessage(
      error instanceof Error ? error.message : "获取项目详情失败",
      "error"
    )
    isEditing.value = false
  }
}

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

const validateFile = (file: File): boolean => {
  if (!file.name.endsWith(".html")) {
    showMessage("请选择HTML文件", "error")
    return false
  }
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

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (validateFile(file)) {
    selectedFile.value = file
  } else {
    if (editFileInput.value) editFileInput.value.value = ""
    selectedFile.value = null
  }
}

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
    if (editFileInput.value) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      editFileInput.value.files = dataTransfer.files
    }
  }
}

const clearSelectedFile = () => {
  selectedFile.value = null
  if (editFileInput.value) editFileInput.value.value = ""
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

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

  if (editProjectName.value === props.project.name && !file) {
    showMessage("请至少修改项目名称或上传新文件", "error")
    return
  }

  isLoading.value = true

  try {
    const formData = new FormData()

    if (editProjectName.value !== props.project.name) {
      formData.append("projectName", editProjectName.value)
    }
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
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="card">
    <!-- Header row -->
    <div class="card-header">
      <div class="card-name-row">
        <div class="file-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          HTML
        </div>
        <h3 class="card-name" :title="props.project.name">{{ props.project.name }}</h3>
      </div>
      <span class="status-badge" :class="props.project.isActive ? 'status-badge--active' : 'status-badge--inactive'">
        <span class="status-dot"></span>
        {{ props.project.isActive ? "激活" : "停用" }}
      </span>
    </div>

    <!-- Meta -->
    <div class="card-meta">
      <div class="meta-item">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
          <polyline points="13 2 13 9 20 9"/>
        </svg>
        <span>{{ props.project.entryPoint }}</span>
      </div>
      <div class="meta-item">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>{{ formatDate(props.project.uploadedAt) }}</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="card-actions">
      <!-- Primary actions -->
      <template v-if="props.project.isActive">
        <a
          :href="getProjectUrl(props.project, props.apiBase)"
          target="_blank"
          class="btn btn--primary"
          title="在新标签页打开项目"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          访问
        </a>
        <button
          @click="copyUrl(getProjectUrl(props.project, props.apiBase))"
          class="btn btn--ghost"
          title="复制访问链接"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          复制链接
        </button>
      </template>

      <div class="actions-spacer"></div>

      <!-- Management actions -->
      <button
        @click="openEditDialog(props.project.slug)"
        class="btn btn--ghost"
        title="编辑项目"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        编辑
      </button>
      <button
        @click="toggleProjectStatus(props.project.slug)"
        class="btn btn--ghost"
        :title="props.project.isActive ? '停用项目' : '激活项目'"
      >
        <svg v-if="props.project.isActive" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="6" y="4" width="4" height="16"/>
          <rect x="14" y="4" width="4" height="16"/>
        </svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        {{ props.project.isActive ? "停用" : "激活" }}
      </button>
      <button
        @click="deleteProject(props.project.slug, props.project.name)"
        class="btn btn--danger"
        title="删除项目"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/>
          <path d="M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
        删除
      </button>
    </div>
  </div>

  <!-- Edit Modal -->
  <Teleport to="body">
    <div v-if="isEditing" class="modal-overlay" @click="closeEditDialog" role="dialog" aria-modal="true" aria-label="编辑项目">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">编辑项目</h3>
          <button @click="closeEditDialog" class="modal-close" aria-label="关闭">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-field">
            <label class="field-label" for="editProjectName">项目名称</label>
            <input
              v-model="editProjectName"
              type="text"
              id="editProjectName"
              placeholder="请输入项目名称"
              class="field-input"
              maxlength="50"
              :disabled="isLoading"
            />
            <span class="field-hint">最多50个字符</span>
          </div>

          <div class="form-field">
            <label class="field-label">更新HTML文件 <span class="field-optional">（可选）</span></label>

            <div
              class="drop-zone"
              :class="{ 'drop-zone--dragging': isDragging, 'drop-zone--has-file': selectedFile, 'drop-zone--disabled': isLoading }"
              @dragover="handleDragOver"
              @dragleave="handleDragLeave"
              @drop="handleDrop"
              @click="!selectedFile && editFileInput?.click()"
            >
              <input
                ref="editFileInput"
                type="file"
                accept=".html"
                @change="handleFileSelect"
                :disabled="isLoading"
                style="display: none"
              />

              <div v-if="!selectedFile" class="drop-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                <span class="drop-text">点击选择或拖拽HTML文件</span>
                <span class="drop-hint">.html · 最大 5MB</span>
              </div>

              <div v-else class="file-preview">
                <div class="file-preview-info">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <div class="file-preview-text">
                    <span class="file-preview-name">{{ selectedFile.name }}</span>
                    <span class="file-preview-size">{{ formatFileSize(selectedFile.size) }}</span>
                  </div>
                </div>
                <button
                  type="button"
                  @click.stop="clearSelectedFile"
                  class="file-remove-btn"
                  :disabled="isLoading"
                  aria-label="移除文件"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
            <span class="field-hint">不选择文件则保持原有文件不变</span>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeEditDialog" class="btn btn--ghost" :disabled="isLoading">
            取消
          </button>
          <button @click="saveEdit" class="btn btn--primary" :disabled="isLoading">
            <svg v-if="isLoading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            {{ isLoading ? "保存中..." : "保存更改" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Card */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.card:hover {
  border-color: var(--color-primary-border);
  box-shadow: var(--shadow-md);
}

/* Header */
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.card-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.file-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  flex-shrink: 0;
}

.card-name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Status badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}

.status-badge--active {
  background: var(--color-success-light);
  color: var(--color-success);
}

.status-badge--inactive {
  background: var(--color-gray-100);
  color: var(--color-gray-500);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* Meta */
.card-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.meta-item svg {
  flex-shrink: 0;
  color: var(--color-gray-400);
}

/* Action buttons */
.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding-top: 4px;
  border-top: 1px solid var(--color-border);
}

.actions-spacer {
  flex: 1;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: background var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
  min-height: 32px;
}

.btn--primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.btn--primary:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.btn--ghost {
  background: transparent;
  color: var(--color-gray-600);
  border-color: var(--color-border);
}

.btn--ghost:hover {
  background: var(--color-gray-50);
  border-color: var(--color-gray-300);
  color: var(--color-text);
}

.btn--danger {
  background: transparent;
  color: var(--color-danger);
  border-color: var(--color-danger-border);
}

.btn--danger:hover {
  background: var(--color-danger-light);
  border-color: var(--color-danger);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 16px;
  backdrop-filter: blur(2px);
}

.modal {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  color: var(--color-gray-400);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.modal-close:hover {
  background: var(--color-gray-100);
  color: var(--color-text);
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border);
}

/* Form */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-gray-700);
}

.field-optional {
  font-weight: 400;
  color: var(--color-text-muted);
}

.field-input {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text);
  background: var(--color-surface);
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.field-input:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.field-input:disabled {
  background: var(--color-gray-50);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.field-hint {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* Drop zone */
.drop-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  cursor: pointer;
  transition: border-color var(--transition-base), background var(--transition-base);
  text-align: center;
}

.drop-zone:hover:not(.drop-zone--disabled):not(.drop-zone--has-file) {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.drop-zone--dragging {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.drop-zone--has-file {
  border-color: var(--color-success-border);
  background: var(--color-success-light);
  cursor: default;
  text-align: left;
}

.drop-zone--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.drop-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--color-gray-400);
}

.drop-zone:hover:not(.drop-zone--disabled) .drop-placeholder,
.drop-zone--dragging .drop-placeholder {
  color: var(--color-primary);
}

.drop-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.drop-hint {
  font-size: 12px;
  color: var(--color-text-muted);
}

.file-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.file-preview-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
  color: var(--color-success);
}

.file-preview-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.file-preview-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-preview-size {
  font-size: 11px;
  color: var(--color-text-muted);
}

.file-remove-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-danger-border);
  background: var(--color-danger-light);
  color: var(--color-danger);
  border-radius: var(--radius-full);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--transition-fast);
}

.file-remove-btn:hover:not(:disabled) {
  background: var(--color-danger);
  color: white;
}

.file-remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 0.8s linear infinite;
}

/* Responsive */
@media (max-width: 480px) {
  .card-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .actions-spacer {
    display: none;
  }

  .btn {
    justify-content: center;
    min-height: 40px;
  }
}
</style>
