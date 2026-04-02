<script setup lang="ts">
import { onMounted } from "vue"
import ProjectUpload from "./components/ProjectUpload.vue"
import ProjectList from "./components/ProjectList.vue"
import { useProjects } from "./composables/useProjects"

const { projects, fetchProjects, searchProjects, clearSearch, searchQuery } = useProjects()

function getApiBase() {
  if (window.location.hostname !== "localhost") {
    return `${window.location.protocol}//${window.location.host}/api`
  }
  return "http://localhost:3000/api"
}

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
          <span class="brand-name">港湾</span>
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
  </div>
</template>

<style scoped>
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
