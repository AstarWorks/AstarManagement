<template>
  <header class="bg-background border-b border-border px-4 lg:px-6 h-16 flex items-center header-container">
    <HeaderToggleButtons :is-sidebar-collapsed="uiStore.isSidebarCollapsed" @toggle-sidebar='uiStore.toggleSidebar'
      @toggle-mobile-menu='uiStore.toggleMobileMenu' />

    <HeaderBreadcrumb class="mr-auto" />

    <HeaderSearch />

    <HeaderToggleAgentButton @toggle-agent='uiStore.toggleAgent' />

    <HeaderActions :notification-count="notificationCount" />
  </header>
</template>

<script setup lang="ts">
import HeaderToggleButtons from './HeaderToggleButtons.vue'
import HeaderBreadcrumb from './HeaderBreadcrumb.vue'
import HeaderSearch from './HeaderSearch.vue'
import HeaderActions from './HeaderActions.vue'
import HeaderToggleAgentButton from './HeaderAgentToggleButton.vue'
import { useUIStore } from '~/foundation/stores/ui';
const uiStore = useUIStore()

// Mock notification count (将来的にはstore/APIから取得)
const notificationCount = ref(3)
</script>

<style scoped>
.header-container {
  gap: 1rem;
}
</style>