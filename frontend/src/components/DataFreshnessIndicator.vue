<template>
  <div
    v-if="showIndicator"
    class="inline-flex items-center gap-1.5"
    :title="tooltipText"
  >
    <div class="relative">
      <div
        class="w-2 h-2 rounded-full"
        :class="indicatorClass"
      />
      <div
        v-if="isStale || isExpired"
        class="absolute inset-0 w-2 h-2 rounded-full animate-ping"
        :class="indicatorClass"
      />
    </div>
    
    <span
      v-if="showLabel"
      class="text-xs"
      :class="labelClass"
    >
      {{ labelText }}
    </span>
  </div>
</template>

<script setup lang="ts">
/**
 * Data Freshness Indicator Component
 * 
 * @description Visual indicator showing the freshness status of cached data.
 * Helps users understand when data was last synced and if it needs updating.
 */

import { computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'

// Props
interface Props {
  /** Data freshness status */
  freshness: 'fresh' | 'stale' | 'expired' | null
  /** Last sync timestamp */
  lastSyncTime?: number | null
  /** Whether data is from cache */
  isFromCache?: boolean
  /** Show text label */
  showLabel?: boolean
  /** Always show indicator, even when fresh */
  alwaysShow?: boolean
  /** Compact mode (smaller size) */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: true,
  alwaysShow: false,
  compact: false,
  isFromCache: false
})

// Computed properties
const isFresh = computed(() => props.freshness === 'fresh')
const isStale = computed(() => props.freshness === 'stale')
const isExpired = computed(() => props.freshness === 'expired')

const showIndicator = computed(() => {
  if (props.alwaysShow) return true
  if (!props.freshness) return false
  return !isFresh.value || props.isFromCache
})

const indicatorClass = computed(() => {
  if (isExpired.value) {
    return 'bg-red-500'
  }
  if (isStale.value) {
    return 'bg-yellow-500'
  }
  if (props.isFromCache) {
    return 'bg-blue-500'
  }
  return 'bg-green-500'
})

const labelClass = computed(() => {
  if (isExpired.value) {
    return 'text-red-600 dark:text-red-400'
  }
  if (isStale.value) {
    return 'text-yellow-600 dark:text-yellow-400'
  }
  if (props.isFromCache) {
    return 'text-blue-600 dark:text-blue-400'
  }
  return 'text-green-600 dark:text-green-400'
})

const labelText = computed(() => {
  if (isExpired.value) {
    return 'Expired'
  }
  if (isStale.value) {
    return 'Stale'
  }
  if (props.isFromCache) {
    return 'Cached'
  }
  return 'Fresh'
})

const tooltipText = computed(() => {
  if (!props.lastSyncTime) {
    return 'Data freshness unknown'
  }
  
  const timeAgo = formatDistanceToNow(props.lastSyncTime, { addSuffix: true })
  
  if (isExpired.value) {
    return `Data expired - last updated ${timeAgo}`
  }
  if (isStale.value) {
    return `Data is stale - last updated ${timeAgo}`
  }
  if (props.isFromCache) {
    return `Showing cached data from ${timeAgo}`
  }
  return `Data is fresh - updated ${timeAgo}`
})
</script>