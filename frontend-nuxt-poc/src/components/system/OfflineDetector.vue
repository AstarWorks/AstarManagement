<template>
  <div v-if="isOffline" class="offline-banner">
    <div class="offline-content">
      <WifiOff class="size-4 mr-2" />
      <span>You are currently offline. Some features may be limited.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Offline Detector Component
 * 
 * @description Displays a banner when the application is offline.
 * This is the Vue equivalent of the React OfflineDetector component.
 */

import { WifiOff } from 'lucide-vue-next'

const { $serviceWorker } = useNuxtApp()
const isOffline = computed(() => $serviceWorker?.isOffline?.value ?? false)
</script>

<style scoped>
.offline-banner {
  @apply fixed bottom-0 left-0 right-0 z-50 bg-yellow-100 dark:bg-yellow-900 border-t border-yellow-200 dark:border-yellow-800 p-2;
}

.offline-content {
  @apply flex items-center justify-center text-yellow-800 dark:text-yellow-200 text-sm;
}
</style>