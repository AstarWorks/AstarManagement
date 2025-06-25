<template>
  <div class="app-layout min-h-screen">
    <!-- Main content slot -->
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * Default Layout Component
 * 
 * @description Provides the base layout structure for the application,
 * including provider setup and global layout elements.
 * Based on the React layout.tsx structure with Vue/Nuxt adaptations.
 */

// Layout will be enhanced with providers through plugins
// Dark mode support will be added via composables
</script>

<style scoped>
.app-layout {
  /* Font variables will be applied globally via app.vue */
  font-family: var(--font-geist-sans), system-ui, -apple-system, sans-serif;
}

/* Antialiasing for better text rendering */
.app-layout {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>