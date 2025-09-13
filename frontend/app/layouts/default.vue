<template>
  <div class="min-h-screen bg-background">
    <!-- Mobile Navigation Overlay -->
    <div
        v-if="isMobileMenuOpen"
        class="fixed inset-0 z-50 lg:hidden"
        @click="closeMobileMenu"
    >
      <div class="absolute inset-0 bg-black/50"/>
      <div class="absolute left-0 top-0 h-full w-64 bg-background">
        <LayoutSidebar is-mobile @close="closeMobileMenu"/>
      </div>
    </div>

    <!-- Desktop Sidebar -->
    <LayoutSidebar
        v-if="!isMobile"
        class="fixed left-0 top-0 z-40 h-screen"
        :collapsed="sidebarCollapsed"
        hover-expand
        @hover-change="handleSidebarHover"
    />

    <!-- Main Content Area -->
    <div
        class="transition-all duration-300 ease-in-out"
        :class="mainContentClasses"
    >
      <!-- Header -->
      <LayoutHeader
          :is-sidebar-collapsed="sidebarCollapsed"
          @toggle-sidebar="toggleSidebar"
          @toggle-mobile-menu="toggleMobileMenu"
      />

      <!-- Page Content -->
      <main class="p-4 lg:p-6">
        <slot/>
      </main>

      <!-- Footer -->
      <LayoutFooter/>
    </div>
  </div>
</template>

<script setup lang="ts">
import {useBreakpoints} from '@vueuse/core'
import LayoutSidebar from "~/layouts/components/sidebar/LayoutSidebar.vue";
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

// Sidebar state - シンプルな状態管理
const sidebarCollapsed = ref(true)  // 常に折りたたみから開始
const isMobileMenuOpen = ref(false)
const isSidebarHovered = ref(false)

// Computed for main content classes
const mainContentClasses = computed(() => {
  if (isMobile.value) return ''
  
  // ホバー中またはサイドバーが展開されている場合
  const isExpanded = !sidebarCollapsed.value || isSidebarHovered.value
  return isExpanded ? 'lg:ml-64' : 'lg:ml-16'
})

// Sidebar controls
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const handleSidebarHover = (isHovered: boolean) => {
  isSidebarHovered.value = isHovered
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

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>