<template>
  <div class="min-h-screen bg-background">
    <!-- Mobile Navigation Overlay -->
    <div v-if="uiStore.isMobileMenuOpen" class="fixed inset-0 z-50 lg:hidden" @click="uiStore.closeMobileMenu">
      <div class="absolute inset-0 bg-black/50" />
      <div class="absolute left-0 top-0 h-full w-64 bg-background">
        <LayoutSidebar is-mobile @close="uiStore.closeMobileMenu" />
      </div>
    </div>
    <!-- Desktop Sidebar -->
    <LayoutSidebar v-if="!isMobile" class="fixed left-0 top-0 z-40 h-screen transition-transform duration-300" :class="[
      uiStore.isSidebarCollapsed ? '-translate-x-48' : 'translate-x-0'
    ]" :collapsed="uiStore.isSidebarCollapsed" />

    <LayoutAgent v-if="uiStore.isAgentOpen && !isMobile" @toggle-agent="uiStore.toggleAgent"
      class="fixed right-0 top-0 z-40 h-screen transition-transform duration-300" :class="[
      uiStore.isAgentCollapsed ? 'translate-x-88' : 'translate-x-0'
    ]" :collapsed="uiStore.isAgentCollapsed" />

    <!-- Main Content Area -->
    <div class="transition-all duration-300" :class="[
      !isMobile && !uiStore.isSidebarCollapsed ? 'lg:ml-64' : 'lg:ml-16',
      !isMobile && !uiStore.isAgentCollapsed ? 'lg:mr-88' : 'lg:mr-0',
    ]">
      <!-- Header -->
      <LayoutHeader :is-sidebar-collapsed="uiStore.isSidebarCollapsed" @toggle-sidebar="uiStore.toggleSidebar"
        @toggle-mobile-menu="uiStore.toggleMobileMenu" @toggle-agent="uiStore.toggleAgent" />

      <!-- Page Content -->
      <main class="p-4 lg:p-6">
        <slot />
      </main>

      <!-- Footer -->
      <LayoutFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBreakpoints } from '@vueuse/core'
import LayoutSidebar from "~/layouts/components/sidebar/menubar/LayoutSidebar.vue";
import LayoutAgent from "~/layouts/components/sidebar/agent/components/LayoutAgent.vue";
import LayoutHeader from "~/layouts/components/header/LayoutHeader.vue";
import LayoutFooter from "~/layouts/components/footer/LayoutFooter.vue";

// Responsive breakpoints
const breakpoints = useBreakpoints({
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280
})
const isMobile = breakpoints.smaller('lg')
const uiStore = useUIStore()

// Close mobile menu on route change
const route = useRoute()
watch(() => route.path, () => {
  if (isMobile.value) {
    uiStore.closeMobileMenu()
  }
})

// Keyboard shortcuts
onMounted(() => {
  const handleKeydown = (event: KeyboardEvent) => {
    // ESC to close mobile menu
    if (event.key === 'Escape' && uiStore.isMobileMenuOpen) {
      uiStore.closeMobileMenu()
    }

    // Ctrl/Cmd + B to toggle sidebar
    if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
      event.preventDefault()
      if (!isMobile.value) {
        uiStore.toggleSidebar()
      }
    }
  }

  document.addEventListener('keydown', handleKeydown)

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
})
</script>