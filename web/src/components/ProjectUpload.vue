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
const fileInput = ref<HTMLInputElement>()

const handleFileSelect = () => {
  const file = fileInput.value?.files?.[0]
  if (!file) return
  
  // 文件类型验证
  if (!file.name.endsWith(".html")) {
    showMessage("请选择HTML文件", "error")
    return
  }
  
  // 文件大小验证 (5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    showMessage("文件大小不能超过5MB", "error")
    return
  }
  
  if (file.size === 0) {
    showMessage("文件不能为空", "error")
    return
  }
  
  uploadProject(file)
}

const uploadProject = async (file: File) => {
  if (!projectName.value.trim()) {
    showMessage("请输入项目名称", "error")
    return
  }
  
  if (projectName.value.length > 50) {
    showMessage("项目名称不能超过50个字符", "error")
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
</script>

<template>
  <div class="upload-section">
    <h2>🚀 在港口即将出发</h2>
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
          maxlength="50"
          :disabled="isUploading"
        />
        <small class="input-hint">最多50个字符</small>
      </div>

      <div class="file-upload">
        <input
          ref="fileInput"
          type="file"
          accept=".html"
          @change="handleFileSelect"
          style="display: none"
          :disabled="isUploading"
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
</template>

<style scoped>
.upload-section {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
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

.form-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.input-hint {
  color: #666;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.upload-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 14px;
  border-radius: 20px;
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
</style>
