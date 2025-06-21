<template>
  <div>
    <!-- Main app layout -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    
    <!-- Global components -->
    <ToastContainer />
    <OfflineDetector />
  </div>
</template>

<script setup lang="ts">
/**
 * Root App Component
 * 
 * @description The main application component that sets up global providers,
 * fonts, and layout structure. This is the Vue/Nuxt equivalent of the
 * React _app.tsx with provider setup.
 */

// Import global styles
import '~/assets/css/main.css'

// Set up fonts (Nuxt handles this via @nuxtjs/google-fonts module)
// Configure in nuxt.config.ts

// SEO and meta tags
useHead({
  title: 'Aster Management - Legal Matter Management System',
  meta: [
    { 
      name: 'description', 
      content: 'Legal matter management system with mobile-optimized Kanban board' 
    },
    { 
      name: 'viewport', 
      content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' 
    },
    {
      name: 'theme-color',
      content: '#ffffff'
    }
  ],
  link: [
    { 
      rel: 'manifest', 
      href: '/manifest.json' 
    }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

// Handle app mounting
onMounted(() => {
  // Remove any loading indicators
  const loader = document.getElementById('app-loader')
  if (loader) {
    loader.style.opacity = '0'
    setTimeout(() => loader.remove(), 300)
  }
})
</script>

<style>
/* Import Tailwind CSS */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

/* Custom font variables */
:root {
  --font-geist-sans: 'Geist', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-geist-mono: 'Geist Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
}

/* Global styles */
body {
  font-family: var(--font-geist-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code, pre {
  font-family: var(--font-geist-mono);
}

/* Prevent text selection on interactive elements */
button, a {
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
}

/* Ensure full height layouts */
html, body, #__nuxt {
  height: 100%;
}

/* Custom scrollbar styles */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-400 dark:bg-gray-600 rounded;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-500 dark:bg-gray-500;
}

/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.2s;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Layout transitions */
.layout-enter-active,
.layout-leave-active {
  transition: all 0.3s;
}

.layout-enter-from,
.layout-leave-to {
  opacity: 0;
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active,
  .layout-enter-active,
  .layout-leave-active {
    transition: none;
  }
}
</style>