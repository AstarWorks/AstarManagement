<template>
  <header class="bg-background border-b border-border px-4 lg:px-6 h-16 flex items-center header-container">
    <HeaderToggleButtons
      :is-sidebar-collapsed="isSidebarCollapsed"
      @toggle-sidebar="$emit('toggleSidebar')"
      @toggle-mobile-menu="$emit('toggleMobileMenu')"
    />
    
    <HeaderBreadcrumb />
    
    <HeaderSearch />
    
    <HeaderActions :notification-count="notificationCount" />
  </header>
</template>

<script setup lang="ts">
import HeaderToggleButtons from './HeaderToggleButtons.vue'
import HeaderBreadcrumb from './HeaderBreadcrumb.vue'
import HeaderSearch from './HeaderSearch.vue'
import HeaderActions from './HeaderActions.vue'

interface Props {
  isSidebarCollapsed?: boolean
}

defineProps<Props>()
defineEmits<{
  toggleSidebar: []
  toggleMobileMenu: []
}>()

// Mock notification count (将来的にはstore/APIから取得)
const notificationCount = ref(3)
</script>

<style scoped>
.header-container {
  gap: 1rem;
}
</style>