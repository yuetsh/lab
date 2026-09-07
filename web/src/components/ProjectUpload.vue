<script setup lang="ts">
import { ref } from "vue"
import { api } from "../services/api"
import { useMessage } from "../composables/useMessage"

interface Emits {
  (e: "project-uploaded"): void
}

const emit = defineEmits<Emits>()

const { message: uploadMessage, messageType, showMessage } = useMessage()
const projectName = ref("")
const isUploading = ref(false)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()

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

const handleFileSelect = () => {
  const file = fileInput.value?.files?.[0]
  if (!file) return
  if (validateFile(file)) {
    uploadProject(file)
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
    uploadProject(file)
  }
}

const triggerFileSelect = () => {
  fileInput.value?.click()
}

const uploadProject = async (file: File) => {
  if (!projectName.value.trim()) {
    showMessage("请先输入项目名称", "error")
    return
  }
  if (projectName.value.length > 20) {
    showMessage("项目名称不能超过20个字符", "error")
    return
  }

  isUploading.value = true

  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("projectName", projectName.value)

    const result = await api.uploadProject(formData)
    showMessage(`"${result.name}" 上传成功`, "success")
    emit("project-uploaded")
    resetForm()
  } catch (error) {
    showMessage(
      error instanceof Error ? error.message : "上传失败，请检查网络连接",
      "error"
    )
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
</script>

<template>
  <div class="upload-card">
    <div class="upload-header">
      <div class="upload-icon-wrap">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>
      <div>
        <h2 class="upload-title">上传项目</h2>
        <p class="upload-subtitle">上传HTML文件，立即获得在线访问链接</p>
      </div>
    </div>

    <div class="upload-body">
      <div class="form-field">
        <label class="field-label" for="projectName">项目名称</label>
        <input
          v-model="projectName"
          type="text"
          id="projectName"
          placeholder="为你的项目起个名字"
          class="field-input"
          maxlength="20"
          :disabled="isUploading"
        />
        <span class="field-hint">最多20个字符</span>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept=".html"
        @change="handleFileSelect"
        style="display: none"
        :disabled="isUploading"
      />

      <div
        class="drop-zone"
        :class="{ 'drop-zone--dragging': isDragging, 'drop-zone--disabled': isUploading }"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        @click="triggerFileSelect"
        role="button"
        tabindex="0"
        @keydown.enter="triggerFileSelect"
        @keydown.space.prevent="triggerFileSelect"
        :aria-label="isUploading ? '上传中' : '点击选择或拖拽HTML文件到此处'"
      >
        <div class="drop-zone-content">
          <div class="drop-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <p class="drop-main-text">
            {{ isUploading ? "上传中..." : "点击选择或拖拽HTML文件到此处" }}
          </p>
          <p class="drop-hint">支持 .html 文件，最大 5MB</p>
        </div>
      </div>

      <div
        v-if="uploadMessage"
        class="feedback-message"
        :class="messageType === 'success' ? 'feedback-message--success' : 'feedback-message--error'"
        role="alert"
      >
        <svg v-if="messageType === 'success'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {{ uploadMessage }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.upload-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.upload-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.upload-title {
  margin: 0 0 2px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.upload-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-muted);
}

.upload-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

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

.field-input {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text);
  background: var(--color-surface);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  outline: none;
  width: 100%;
  max-width: 360px;
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

.drop-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: 32px 24px;
  cursor: pointer;
  transition: border-color var(--transition-base), background var(--transition-base);
  text-align: center;
  outline: none;
}

.drop-zone:focus-visible {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.drop-zone:hover:not(.drop-zone--disabled) {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.drop-zone--dragging {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.drop-zone--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.drop-icon {
  color: var(--color-gray-400);
  margin-bottom: 4px;
}

.drop-zone:hover:not(.drop-zone--disabled) .drop-icon,
.drop-zone--dragging .drop-icon {
  color: var(--color-primary);
}

.drop-main-text {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.drop-hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-muted);
}

.feedback-message {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
}

.feedback-message svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.feedback-message--success {
  background: var(--color-success-light);
  color: var(--color-success);
  border: 1px solid var(--color-success-border);
}

.feedback-message--error {
  background: var(--color-danger-light);
  color: var(--color-danger);
  border: 1px solid var(--color-danger-border);
}
</style>
