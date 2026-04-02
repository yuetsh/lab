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
  <div class="list-card">
    <div class="list-header">
      <div class="list-title-group">
        <div class="list-icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
        </div>
        <div>
          <h2 class="list-title">我的项目</h2>
          <p class="list-subtitle">{{ projects.length }} 个项目</p>
        </div>
      </div>

      <div class="search-box">
        <div class="search-input-wrap">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="searchInput"
            type="search"
            placeholder="搜索项目..."
            class="search-input"
            @input="handleSearchInput"
            @keyup.enter="handleSearch"
            aria-label="搜索项目"
          />
        </div>
        <button
          @click="handleSearch"
          class="search-btn"
          :disabled="!searchInput.trim()"
        >
          搜索
        </button>
        <button
          v-if="searchQuery"
          @click="handleClearSearch"
          class="clear-btn"
          aria-label="清除搜索"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          清除
        </button>
      </div>
    </div>

    <div v-if="searchQuery" class="search-results-banner">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      搜索 "<strong>{{ searchQuery }}</strong>" — 找到 {{ projects.length }} 个结果
    </div>

    <div class="list-body">
      <div v-if="projects.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <p class="empty-title">
          {{ searchQuery ? "没有找到匹配的项目" : "还没有项目" }}
        </p>
        <p class="empty-hint">
          {{ searchQuery ? "试试其他关键词" : "上传一个HTML文件开始使用吧" }}
        </p>
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
  </div>
</template>

<style scoped>
.list-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.list-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.list-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--color-gray-100);
  color: var(--color-gray-600);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.list-title {
  margin: 0 0 2px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.list-subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-muted);
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input-wrap {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-400);
  pointer-events: none;
}

.search-input {
  padding: 8px 12px 8px 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--color-text);
  background: var(--color-surface);
  outline: none;
  width: 220px;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.search-input:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.search-input::-webkit-search-cancel-button {
  display: none;
}

.search-btn {
  padding: 8px 14px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
  white-space: nowrap;
}

.search-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.search-btn:disabled {
  background: var(--color-gray-200);
  color: var(--color-gray-400);
  cursor: not-allowed;
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  background: var(--color-gray-100);
  color: var(--color-gray-600);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
  white-space: nowrap;
}

.clear-btn:hover {
  background: var(--color-gray-200);
  color: var(--color-text);
}

.search-results-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  font-size: 13px;
  color: var(--color-primary);
  background: var(--color-primary-light);
  border-bottom: 1px solid var(--color-primary-border);
}

.list-body {
  padding: 24px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-xl);
  background: var(--color-gray-100);
  color: var(--color-gray-400);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.empty-hint {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-muted);
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .list-header {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    flex-wrap: wrap;
  }

  .search-input {
    width: 100%;
  }

  .list-body {
    padding: 16px;
  }
}
</style>
