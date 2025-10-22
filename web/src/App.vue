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
  <div class="app">
    <div class="project-manager">
      <ProjectUpload @project-uploaded="handleProjectUpdated" />
      
      <ProjectList
        :projects="projects"
        :api-base="getApiBase()"
        :search-query="searchQuery"
        @search="searchProjects"
        @clear-search="clearSearch"
        @project-updated="handleProjectUpdated"
      />
    </div>
  </div>
</template>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.project-manager {
  display: flex;
  flex-direction: column;
  gap: 30px;
}
</style>
