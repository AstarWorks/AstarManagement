<template>
  <div class="min-h-screen bg-background">
    <!-- Mobile Navigation Overlay -->
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 z-50 lg:hidden"
      @click="closeMobileMenu"
    >
      <div class="absolute inset-0 bg-black/50" />
      <div class="absolute left-0 top-0 h-full w-64 bg-background">
        <AppSidebar is-mobile @close="closeMobileMenu" />
      </div>
    </div>
    
    <!-- Desktop Sidebar -->
    <AppSidebar
      v-if="!isMobile"
      class="fixed left-0 top-0 z-40 h-screen transition-transform duration-300"
:class="[
        sidebarCollapsed ? '-translate-x-48' : 'translate-x-0'
      ]"
      :collapsed="sidebarCollapsed"
    />
    
    <!-- Main Content Area -->
    <div
      class="transition-all duration-300"
:class="[
        !isMobile && !sidebarCollapsed ? 'lg:ml-64' : 'lg:ml-16'
      ]"
    >
      <!-- Header -->
      <AppHeader
        :is-sidebar-collapsed="sidebarCollapsed"
        @toggle-sidebar="toggleSidebar"
        @toggle-mobile-menu="toggleMobileMenu"
      />
      
      <!-- Page Content -->
      <main class="p-4 lg:p-6">
        <slot />
      </main>
      
      <!-- Footer -->
      <AppFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBreakpoints } from '@vueuse/core'
import AppSidebar from './components/AppSidebar.vue'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'

// Responsive breakpoints
const breakpoints = useBreakpoints({
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280
})

const isMobile = breakpoints.smaller('lg')

// Sidebar state with persistence
const sidebarCollapsed = useLocalStorage('sidebar-collapsed', false)
const isMobileMenuOpen = ref(false)

// Sidebar controls
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

// Close mobile menu on route change
const route = useRoute()
watch(() => route.path, () => {
  if (isMobile.value) {
    isMobileMenuOpen.value = false
  }
})

// Keyboard shortcuts
onMounted(() => {
  const handleKeydown = (event: KeyboardEvent) => {
    // ESC to close mobile menu
    if (event.key === 'Escape' && isMobileMenuOpen.value) {
      closeMobileMenu()
    }
    
    // Ctrl/Cmd + B to toggle sidebar
    if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
      event.preventDefault()
      if (!isMobile.value) {
        toggleSidebar()
      }
    }
  }
  
  document.addEventListener('keydown', handleKeydown)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
})
</script>