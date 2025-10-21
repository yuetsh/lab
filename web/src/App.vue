<script setup lang="ts">
import { onMounted } from "vue"
import ProjectManager from "./components/ProjectManager.vue"
import { useProjects } from "./composables/useProjects"

const { projects, fetchProjects } = useProjects()

function getApiBase() {
  if (window.location.hostname !== "localhost") {
    return `${window.location.protocol}//${window.location.host}/api`
  }
  return "http://localhost:3000/api"
}

onMounted(() => {
  fetchProjects()
})
</script>

<template>
  <div class="app">
    <ProjectManager
      :projects="projects"
      :api-base="getApiBase()"
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
