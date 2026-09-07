<script setup lang="ts">
import { onMounted } from "vue"
import ProjectUpload from "./components/ProjectUpload.vue"
import ProjectList from "./components/ProjectList.vue"
import { useProjects } from "./composables/useProjects"
import { getApiBase } from "./services/api"
import { useGlobalMessage } from "./composables/useGlobalMessage"

const { projects, fetchProjects, searchProjects, clearSearch, searchQuery } = useProjects()
const { message, messageType } = useGlobalMessage()

const handleProjectUpdated = () => {
  fetchProjects()
}

onMounted(() => {
  fetchProjects()
})
</script>

<template>
  <div class="page">
    <header class="header">
      <div class="header-inner">
        <div class="brand">
          <svg class="brand-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <span class="brand-name">Lab</span>
        </div>
        <p class="brand-tagline">自托管 HTML 项目发布平台</p>
      </div>
    </header>

    <main class="main">
      <ProjectUpload @project-uploaded="handleProjectUpdated" />

      <ProjectList
        :projects="projects"
        :api-base="getApiBase()"
        :search-query="searchQuery"
        @search="searchProjects"
        @clear-search="clearSearch"
        @project-updated="handleProjectUpdated"
      />
    </main>

    <!-- 全局操作反馈：来自 ProjectCard 等会在操作后卸载的组件 -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="message"
          class="toast"
          :class="messageType === 'success' ? 'toast--success' : 'toast--error'"
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
          {{ message }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  max-width: min(360px, calc(100vw - 32px));
  padding: 12px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.toast svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.toast--success {
  background: var(--color-success-light);
  color: var(--color-success);
  border: 1px solid var(--color-success-border);
}

.toast--error {
  background: var(--color-danger-light);
  color: var(--color-danger);
  border: 1px solid var(--color-danger-border);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-primary);
}

.brand-icon {
  flex-shrink: 0;
}

.brand-name {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.brand-tagline {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-muted);
  border-left: 1px solid var(--color-border);
  padding-left: 16px;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (max-width: 640px) {
  .header-inner {
    padding: 12px 16px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .brand-tagline {
    border-left: none;
    padding-left: 0;
    width: 100%;
  }

  .main {
    padding: 16px;
    gap: 16px;
  }
}
</style>
