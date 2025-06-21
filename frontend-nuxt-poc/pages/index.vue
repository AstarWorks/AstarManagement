<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="border-b">
      <div class="container mx-auto px-4 py-4">
        <h1 class="text-2xl font-bold">Aster Management - Nuxt PoC</h1>
        <p class="text-gray-600">Next.js to Nuxt.js Migration Proof of Concept</p>
      </div>
    </header>

    <!-- Filter Bar -->
    <FilterBar v-model="filters" />

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading matters...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center text-red-600">
        <p class="mb-4">{{ error }}</p>
        <Button @click="loadMatters">Retry</Button>
      </div>
    </div>

    <!-- Kanban Board -->
    <KanbanBoard v-else />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useKanbanStore } from '~/stores/kanban'

// Store
const kanbanStore = useKanbanStore()
const { filters, isLoading, error } = storeToRefs(kanbanStore)
const { loadMatters, setFilters } = kanbanStore

// Load matters on mount
onMounted(() => {
  loadMatters()
})
</script>