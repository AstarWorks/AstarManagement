<template>
  <div class="app-layout-container">
    <!-- Mobile layout for small screens -->
    <div class="mobile-layout md:hidden">
      <AppHeader :show-menu-toggle="false" />
      <main class="mobile-content">
        <slot />
      </main>
      <BottomNav />
    </div>

    <!-- Desktop layout for larger screens -->
    <div class="desktop-layout hidden md:flex">
      <AppSidebar />
      <div class="desktop-content">
        <AppHeader @toggle-sidebar="handleSidebarToggle" />
        <main class="main-content">
          <slot />
        </main>
        <AppFooter />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * App Layout
 * 
 * @description Main application layout that provides responsive structure
 * with sidebar navigation for desktop and bottom navigation for mobile.
 */

// Handle sidebar toggle (desktop)
const handleSidebarToggle = () => {
  // The sidebar component manages its own state
  // This could be enhanced to use a Pinia store for more complex scenarios
}

// Set up layout-specific styles
onMounted(() => {
  // Ensure full height on mobile browsers
  const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }
  
  setViewportHeight()
  window.addEventListener('resize', setViewportHeight)
  
  onUnmounted(() => {
    window.removeEventListener('resize', setViewportHeight)
  })
})
</script>

<style scoped>
.app-layout-container {
  @apply h-screen w-full overflow-hidden;
}

/* Mobile Layout */
.mobile-layout {
  @apply flex flex-col h-full;
  height: calc(var(--vh, 1vh) * 100);
}

.mobile-content {
  @apply flex-1 overflow-auto;
  @apply bg-gray-50 dark:bg-gray-950;
  /* Account for header and bottom navigation */
  padding-bottom: calc(56px + env(safe-area-inset-bottom));
}

/* Desktop Layout */
.desktop-layout {
  @apply h-full w-full;
}

.desktop-content {
  @apply flex-1 flex flex-col h-full overflow-hidden;
}

.main-content {
  @apply flex-1 overflow-auto;
  @apply bg-gray-50 dark:bg-gray-950;
  @apply p-4 sm:p-6 lg:p-8;
}

/* Smooth transitions */
.mobile-content,
.main-content {
  @apply transition-colors duration-200;
}

/* Print styles */
@media print {
  .app-layout-container {
    @apply h-auto overflow-visible;
  }
  
  .mobile-layout,
  .desktop-layout {
    @apply block h-auto;
  }
  
  .mobile-content,
  .main-content {
    @apply overflow-visible p-0;
  }
}
</style>