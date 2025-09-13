<template>
  <header class="bg-white text-foreground border-b border-border px-4 lg:px-6 h-14 shadow-sm">
    <div class="h-full grid grid-cols-3 items-center gap-4">
      <!-- Left Section: Toggle & Breadcrumb -->
      <div class="flex items-center gap-3">
        <HeaderToggleButtons
          :is-sidebar-collapsed="isSidebarCollapsed"
          @toggle-sidebar="$emit('toggle-sidebar')"
          @toggle-mobile-menu="$emit('toggle-mobile-menu')"
        />
        <HeaderBreadcrumb />
      </div>
      
      <!-- Center Section: Search -->
      <div class="flex justify-center">
        <HeaderSearch class="w-full max-w-xl" />
      </div>
      
      <!-- Right Section: Actions -->
      <div class="flex justify-end">
        <HeaderActions :notification-count="notificationCount" />
      </div>
    </div>
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
  'toggle-sidebar': []
  'toggle-mobile-menu': []
}>()

// Mock notification count (将来的にはstore/APIから取得)
const notificationCount = ref(3)
</script>