<script setup lang="ts">
import { ref } from "vue"
import ProjectCard from "./ProjectCard.vue"
import type { Project } from "../types"

interface Props {
  projects: Project[]
  apiBase: string
  searchQuery: string
}

interface Emits {
  (e: "search", query: string): void
  (e: "clear-search"): void
  (e: "project-updated"): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const searchInput = ref("")

const handleSearch = () => {
  emit("search", searchInput.value.trim())
}

const handleClearSearch = () => {
  searchInput.value = ""
  emit("clear-search")
}

const handleSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.value.trim() === "") {
    emit("clear-search")
  }
}

const handleProjectUpdated = () => {
  emit("project-updated")
}
</script>

<template>
  <div class="projects-section">
    <div class="projects-header">
      <h2>📋 我的托管项目</h2>
      <div class="search-container">
        <div class="search-box">
          <input
            v-model="searchInput"
            type="text"
            placeholder="搜索项目名称..."
            class="search-input"
            @input="handleSearchInput"
            @keyup.enter="handleSearch"
          />
          <button
            @click="handleSearch"
            class="search-button"
            :disabled="!searchInput.trim()"
          >
            🔍 搜索
          </button>
          <button
            v-if="searchQuery"
            @click="handleClearSearch"
            class="clear-search-button"
          >
            ✕ 清除
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="searchQuery" class="search-results-info">
      <p>搜索 "{{ searchQuery }}" 的结果 ({{ projects.length }} 个项目)</p>
    </div>
    
    <div v-if="projects.length === 0" class="empty-state">
      <p v-if="searchQuery">没有找到匹配的项目，请尝试其他搜索词。</p>
      <p v-else>还没有托管任何项目，上传一个HTML文件开始吧！</p>
    </div>
    
    <div v-else class="projects-grid">
      <ProjectCard
        v-for="project in projects"
        :key="project.id"
        :project="project"
        :api-base="apiBase"
        @project-updated="handleProjectUpdated"
      />
    </div>
  </div>
</template>

<style scoped>
.projects-section {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.projects-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
}

.projects-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5em;
}

.search-container {
  flex: 1;
  max-width: 400px;
}

.search-box {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.search-button,
.clear-search-button {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.search-button {
  background: #667eea;
  color: white;
}

.search-button:hover:not(:disabled) {
  background: #5a6fd8;
  transform: translateY(-1px);
}

.search-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.clear-search-button {
  background: #dc3545;
  color: white;
}

.clear-search-button:hover {
  background: #c82333;
  transform: translateY(-1px);
}

.search-results-info {
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #667eea;
}

.search-results-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
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
  
  .projects-header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .search-container {
    max-width: none;
  }
  
  .search-box {
    flex-wrap: wrap;
  }
  
  .search-input {
    min-width: 200px;
  }
}
</style>
