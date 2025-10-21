<script setup lang="ts">
import { onMounted } from "vue"
import ProjectManager from "./components/ProjectManager.vue"
import { useProjects } from "./composables/useProjects"

const { projects, fetchProjects } = useProjects()

const getApiBase = () => {
  if (window.location.hostname !== "localhost") {
    return "/api"
  }
  return "http://localhost:3000/api"
}

const API_BASE = getApiBase()

onMounted(() => {
  fetchProjects()
})
</script>

<template>
  <div class="app">
    <ProjectManager
      :projects="projects"
      :api-base="API_BASE"
      @project-uploaded="fetchProjects"
    />
  </div>
</template>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}
</style>
