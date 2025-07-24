<template>
  <footer class="app-footer">
    <div class="footer-container">
      <!-- Left section -->
      <div class="footer-section">
        <p class="footer-text">
          © {{ currentYear }} Aster Management. All rights reserved.
        </p>
      </div>

      <!-- Center section (mobile hidden) -->
      <div class="footer-section hidden sm:flex">
        <NuxtLink to="/privacy" class="footer-link">Privacy Policy</NuxtLink>
        <span class="footer-separator">·</span>
        <NuxtLink to="/terms" class="footer-link">Terms of Service</NuxtLink>
        <span class="footer-separator">·</span>
        <NuxtLink to="/contact" class="footer-link">Contact</NuxtLink>
      </div>

      <!-- Right section -->
      <div class="footer-section">
        <span class="version-text">
          v{{ appVersion }}
          <span v-if="isDevelopment" class="dev-badge">DEV</span>
        </span>
      </div>
    </div>

    <!-- Mobile links -->
    <div class="mobile-links sm:hidden">
      <NuxtLink to="/privacy" class="footer-link">Privacy</NuxtLink>
      <span class="footer-separator">·</span>
      <NuxtLink to="/terms" class="footer-link">Terms</NuxtLink>
      <span class="footer-separator">·</span>
      <NuxtLink to="/contact" class="footer-link">Contact</NuxtLink>
    </div>
  </footer>
</template>

<script setup lang="ts">
/**
 * App Footer Component
 * 
 * @description Application footer with copyright, links, and version information.
 * Responsive design with mobile-optimized layout.
 */

// Get current year
const currentYear = new Date().getFullYear()

// Get app version from package.json or environment
const appVersion = ref('1.0.0') // TODO: Get from package.json or build process
const isDevelopment = process.env.NODE_ENV === 'development'

// Check for updates in production
onMounted(() => {
  if (!isDevelopment && (window as any).$nuxt?.$serviceWorker?.isUpdateAvailable) {
    // Watch for updates
    watch(
      () => (window as any).$nuxt.$serviceWorker.isUpdateAvailable.value,
      (hasUpdate) => {
        if (hasUpdate) {
          appVersion.value += ' (update available)'
        }
      }
    )
  }
})
</script>

<style scoped>
.app-footer {
  @apply bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800;
  @apply px-4 sm:px-6 lg:px-8 py-4;
}

.footer-container {
  @apply flex flex-col sm:flex-row items-center justify-between gap-2;
}

.footer-section {
  @apply flex items-center gap-3;
}

.footer-text {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.footer-link {
  @apply text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100;
  @apply transition-colors hover:underline;
}

.footer-separator {
  @apply text-gray-400 dark:text-gray-600;
}

.version-text {
  @apply text-xs text-gray-500 dark:text-gray-500 font-mono;
}

.dev-badge {
  @apply ml-1 px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300;
  @apply text-xs font-semibold rounded;
}

.mobile-links {
  @apply flex items-center justify-center gap-3 mt-2;
}

/* Print styles */
@media print {
  .app-footer {
    @apply hidden;
  }
}
</style>