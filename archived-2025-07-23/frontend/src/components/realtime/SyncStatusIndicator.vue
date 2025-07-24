<template>
  <div class="sync-status-indicator">
    <!-- Compact indicator for desktop -->
    <Popover v-if="!isMobile">
      <PopoverTrigger as-child>
        <Button
          variant="ghost"
          size="sm"
          class="sync-trigger"
          :class="`sync-${syncStatus}`"
        >
          <component :is="statusIcon" class="h-4 w-4" />
          <span class="ml-2 hidden lg:inline">{{ statusLabel }}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-80">
        <SyncStatusDetails
          :sync-mode="syncMode"
          :sync-status="syncStatus"
          :network-quality="networkQuality"
          :last-sync-time="lastSyncTime"
          :ws-connected="wsConnected"
          :battery-level="batteryLevel"
          :memory-usage="memoryUsage"
          @mode-change="setSyncMode"
          @sync-now="syncAllData"
        />
      </PopoverContent>
    </Popover>
    
    <!-- Full panel for mobile -->
    <Sheet v-else>
      <SheetTrigger as-child>
        <Button
          variant="ghost"
          size="sm"
          class="sync-trigger"
          :class="`sync-${syncStatus}`"
        >
          <component :is="statusIcon" class="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" class="h-auto">
        <SheetHeader>
          <SheetTitle>Sync Settings</SheetTitle>
        </SheetHeader>
        <SyncStatusDetails
          :sync-mode="syncMode"
          :sync-status="syncStatus"
          :network-quality="networkQuality"
          :last-sync-time="lastSyncTime"
          :ws-connected="wsConnected"
          :battery-level="batteryLevel"
          :memory-usage="memoryUsage"
          class="mt-4"
          @mode-change="setSyncMode"
          @sync-now="syncAllData"
        />
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Zap, 
  AlertCircle,
  RefreshCw
} from 'lucide-vue-next'
import { useBackgroundSync } from '~/composables/useBackgroundSync'
import { useIsMobile } from '~/composables/useIsMobile'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '~/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '~/components/ui/sheet'
import { Button } from '~/components/ui/button'
import SyncStatusDetails from './SyncStatusDetails.vue'

const isMobile = useIsMobile()

// Use background sync composable
const {
  syncMode,
  syncStatus,
  networkQuality,
  lastSyncTime,
  wsConnected,
  batteryLevel,
  memoryUsage,
  setSyncMode,
  syncAllData
} = useBackgroundSync()

// Computed icon based on status
const statusIcon = computed(() => {
  switch (syncStatus.value) {
    case 'offline':
      return WifiOff
    case 'syncing':
      return RefreshCw
    case 'error':
      return AlertCircle
    case 'realtime':
      return Zap
    default:
      return Activity
  }
})

// Computed label based on status
const statusLabel = computed(() => {
  switch (syncStatus.value) {
    case 'offline':
      return 'Offline'
    case 'syncing':
      return 'Syncing...'
    case 'error':
      return 'Sync Error'
    case 'realtime':
      return 'Real-time'
    default:
      return networkQuality.value === 'excellent' ? 'Connected' : 'Online'
  }
})
</script>

<style scoped>
.sync-status-indicator {
  @apply flex items-center;
}

.sync-trigger {
  @apply transition-colors duration-200;
}

/* Status-specific colors */
.sync-offline {
  @apply text-gray-400;
}

.sync-syncing {
  @apply text-blue-500 animate-pulse;
}

.sync-error {
  @apply text-red-500;
}

.sync-realtime {
  @apply text-green-500;
}

.sync-idle {
  @apply text-gray-600 dark:text-gray-400;
}

/* Rotation animation for syncing icon */
.sync-syncing :deep(svg) {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>