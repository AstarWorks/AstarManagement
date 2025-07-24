<!--
  Stale Data Indicator Component
  
  @description Visual indicator for data freshness in the Kanban board.
  Shows when data is stale based on sync configuration and allows manual refresh.
  
  @author Claude
  @created 2025-06-26
-->

<template>
  <div 
    class="stale-data-indicator"
    :class="containerClass"
  >
    <!-- Visual indicator -->
    <div 
      class="indicator-wrapper"
      :title="tooltipText"
    >
      <div
        class="indicator-dot"
        :class="indicatorClass"
      >
        <!-- Pulse animation for stale/error states -->
        <div
          v-if="isStale || hasError"
          class="absolute inset-0 rounded-full animate-ping"
          :class="pulseClass"
        />
      </div>
    </div>

    <!-- Status text -->
    <Transition
      name="fade"
      mode="out-in"
    >
      <span
        v-if="showText"
        :key="status"
        class="status-text"
        :class="textClass"
      >
        {{ statusText }}
      </span>
    </Transition>

    <!-- Refresh button -->
    <Transition name="scale">
      <Button
        v-if="canRefresh && !isSyncing"
        variant="ghost"
        size="icon"
        class="refresh-button"
        :disabled="isRefreshing"
        @click="handleRefresh"
        :aria-label="refreshAriaLabel"
      >
        <component
          :is="refreshIcon"
          class="h-3.5 w-3.5 transition-transform"
          :class="{ 'animate-spin': isRefreshing }"
        />
      </Button>
    </Transition>

    <!-- Syncing indicator -->
    <Transition name="scale">
      <div
        v-if="isSyncing"
        class="syncing-indicator"
        aria-label="Data is syncing"
      >
        <Loader2 class="h-3.5 w-3.5 animate-spin text-blue-500" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * Stale Data Indicator Component
 * 
 * @description Displays data freshness status and provides manual refresh capability.
 * Integrates with useBackgroundSync composable for sync configuration.
 */

import { computed, ref, watch } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { RefreshCw, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { useBackgroundSync } from '~/composables/useBackgroundSync'
import { getSyncConfig, type SyncMode } from '~/config/background-sync'
import { cn } from '~/lib/utils'

// Props
interface Props {
  /** Type of data being displayed (e.g., 'matters', 'kanban') */
  dataType: 'matters' | 'kanban' | 'activity' | 'static'
  /** Last updated timestamp */
  lastUpdated?: number | Date | null
  /** Override sync mode */
  syncMode?: SyncMode
  /** Show text status */
  showText?: boolean
  /** Compact mode */
  compact?: boolean
  /** Custom refresh handler */
  onRefresh?: () => void | Promise<void>
  /** Additional CSS classes */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  showText: true,
  compact: false
})

const emit = defineEmits<{
  refresh: []
  staleDetected: []
}>()

// State
const isRefreshing = ref(false)

// Composables
const { 
  syncMode: currentSyncMode, 
  syncStatus,
  syncDataType 
} = useBackgroundSync()

// Computed properties
const effectiveSyncMode = computed(() => 
  props.syncMode || currentSyncMode.value
)

const syncConfig = computed(() => {
  const mode = effectiveSyncMode.value
  // Type guard to ensure we have a valid SyncMode
  const validModes: SyncMode[] = ['aggressive', 'balanced', 'conservative', 'offline', 'manual']
  const typedMode = validModes.includes(mode as SyncMode) ? mode as SyncMode : 'balanced'
  return getSyncConfig(props.dataType, typedMode)
})

const lastUpdatedTime = computed(() => {
  if (!props.lastUpdated) return null
  return props.lastUpdated instanceof Date 
    ? props.lastUpdated.getTime() 
    : props.lastUpdated
})

const timeSinceUpdate = computed(() => {
  if (!lastUpdatedTime.value) return Infinity
  return Date.now() - lastUpdatedTime.value
})

const isFresh = computed(() => 
  timeSinceUpdate.value < syncConfig.value.staleTime
)

const isStale = computed(() => 
  !isFresh.value && timeSinceUpdate.value < syncConfig.value.staleTime * 3
)

const isVeryStale = computed(() => 
  timeSinceUpdate.value >= syncConfig.value.staleTime * 3
)

const hasError = computed(() => 
  syncStatus.value === 'error'
)

const isSyncing = computed(() => 
  syncStatus.value === 'syncing'
)

const status = computed(() => {
  if (hasError.value) return 'error'
  if (isSyncing.value) return 'syncing'
  if (!lastUpdatedTime.value) return 'unknown'
  if (isFresh.value) return 'fresh'
  if (isVeryStale.value) return 'very-stale'
  if (isStale.value) return 'stale'
  return 'fresh'
})

const canRefresh = computed(() => 
  isStale.value || isVeryStale.value || hasError.value
)

const statusText = computed(() => {
  if (hasError.value) return 'Error'
  if (isSyncing.value) return 'Syncing'
  if (!lastUpdatedTime.value) return 'Unknown'
  if (isFresh.value) return 'Fresh'
  if (isVeryStale.value) return 'Very stale'
  if (isStale.value) return 'Stale'
  return 'Fresh'
})

const tooltipText = computed(() => {
  if (!lastUpdatedTime.value) {
    return 'Data freshness unknown'
  }
  
  const timeAgo = formatDistanceToNow(lastUpdatedTime.value, { addSuffix: true })
  
  switch (status.value) {
    case 'error':
      return 'Failed to sync data. Click to retry.'
    case 'syncing':
      return 'Syncing data...'
    case 'very-stale':
      return `Data is very stale - last updated ${timeAgo}. Click to refresh.`
    case 'stale':
      return `Data is stale - last updated ${timeAgo}. Click to refresh.`
    case 'fresh':
      return `Data is fresh - updated ${timeAgo}`
    default:
      return `Last updated ${timeAgo}`
  }
})

const refreshAriaLabel = computed(() => 
  `Refresh ${props.dataType} data`
)

const refreshIcon = computed(() => {
  if (hasError.value) return AlertCircle
  if (isVeryStale.value) return AlertCircle
  return RefreshCw
})

// Style classes
const containerClass = computed(() => cn(
  'inline-flex items-center gap-1.5',
  props.compact ? 'gap-1' : 'gap-1.5',
  props.class
))

const indicatorClass = computed(() => cn(
  'relative rounded-full transition-colors',
  props.compact ? 'w-1.5 h-1.5' : 'w-2 h-2',
  {
    'bg-green-500': status.value === 'fresh',
    'bg-yellow-500': status.value === 'stale',
    'bg-orange-500': status.value === 'very-stale',
    'bg-red-500': status.value === 'error',
    'bg-blue-500': status.value === 'syncing',
    'bg-gray-400': status.value === 'unknown'
  }
))

const pulseClass = computed(() => cn(
  'opacity-75',
  {
    'bg-yellow-500': status.value === 'stale',
    'bg-orange-500': status.value === 'very-stale',
    'bg-red-500': status.value === 'error'
  }
))

const textClass = computed(() => cn(
  'text-xs font-medium transition-colors',
  {
    'text-green-600 dark:text-green-400': status.value === 'fresh',
    'text-yellow-600 dark:text-yellow-400': status.value === 'stale',
    'text-orange-600 dark:text-orange-400': status.value === 'very-stale',
    'text-red-600 dark:text-red-400': status.value === 'error',
    'text-blue-600 dark:text-blue-400': status.value === 'syncing',
    'text-gray-500 dark:text-gray-400': status.value === 'unknown'
  }
))

// Methods
const handleRefresh = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  emit('refresh')
  
  try {
    if (props.onRefresh) {
      await props.onRefresh()
    } else {
      await syncDataType(props.dataType)
    }
  } catch (error) {
    console.error(`Failed to refresh ${props.dataType}:`, error)
  } finally {
    isRefreshing.value = false
  }
}

// Watch for stale data
watch(() => isStale.value, (stale) => {
  if (stale) {
    emit('staleDetected')
  }
})
</script>

<style scoped>
.stale-data-indicator {
  @apply relative;
}

.indicator-wrapper {
  @apply relative cursor-help;
}

.indicator-dot {
  @apply relative;
}

.status-text {
  @apply select-none;
}

.refresh-button {
  @apply h-6 w-6 p-0;
}

.refresh-button:hover {
  @apply bg-muted;
}

.syncing-indicator {
  @apply flex items-center justify-center;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity duration-200;
}

.fade-enter-from,
.fade-leave-to {
  @apply opacity-0;
}

.scale-enter-active,
.scale-leave-active {
  @apply transition-all duration-200;
}

.scale-enter-from,
.scale-leave-to {
  @apply opacity-0 scale-75;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .stale-data-indicator:not(.compact) {
    @apply gap-1;
  }
  
  .indicator-dot:not(.compact) {
    @apply w-1.5 h-1.5;
  }
  
  .refresh-button {
    @apply h-5 w-5;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .indicator-dot {
    @apply ring-1 ring-white/10;
  }
}

/* Print styles */
@media print {
  .stale-data-indicator {
    @apply hidden;
  }
}
</style>