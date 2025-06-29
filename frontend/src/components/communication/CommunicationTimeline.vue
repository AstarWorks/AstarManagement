<template>
  <div class="communication-timeline" :class="{ 'embedded': embedded }">
    <!-- Filters -->
    <TimelineFilters 
      v-if="!embedded"
      :filters="filters"
      :has-active-filters="hasActiveFilters"
      :filter-summary="filterSummary"
      @update-filters="updateFilters"
      @apply-preset="applyPreset"
      @clear-filters="clearFilters"
      class="timeline-filters"
    />
    
    <!-- Connection Status -->
    <div v-if="isRealTimeConnected" class="connection-status">
      <div class="status-dot" />
      <span class="status-text">Real-time updates active</span>
    </div>
    
    <!-- Timeline Container -->
    <div 
      ref="timelineRef"
      class="timeline-container"
      @scroll="handleScroll"
    >
      <!-- Loading State -->
      <TimelineSkeleton v-if="isLoading" />
      
      <!-- Error State -->
      <div v-else-if="isError" class="error-state">
        <AlertCircle class="error-icon" />
        <h3 class="error-title">Failed to load communications</h3>
        <p class="error-description">{{ error?.message || 'An unexpected error occurred' }}</p>
        <Button size="sm" @click="refetch">
          <RefreshCw class="size-4 mr-2" />
          Retry
        </Button>
      </div>
      
      <!-- Empty State -->
      <TimelineEmptyState 
        v-else-if="timelineGroups.length === 0"
        :has-filters="hasActiveFilters"
        @clear-filters="clearFilters"
      />
      
      <!-- Timeline Content -->
      <div v-else class="timeline-content">
        <template v-for="(group, groupIndex) in timelineGroups" :key="group.date">
          <!-- Date Group Header -->
          <TimelineItemGroup 
            :date="group.date"
            :count="group.count"
          />
          
          <!-- Timeline Items -->
          <div class="timeline-items">
            <TimelineItem
              v-for="(item, itemIndex) in group.items"
              :key="item.id"
              :communication="item"
              :is-last="groupIndex === timelineGroups.length - 1 && itemIndex === group.items.length - 1"
              @click="handleItemClick"
              @toggle-read="handleToggleRead"
              @reply="handleReply"
              @add-note="handleAddNote"
            />
          </div>
        </template>
        
        <!-- Load More -->
        <TimelineLoadMore
          v-if="hasNextPage"
          :loading="isFetchingNextPage"
          :has-more="hasNextPage"
          @load-more="fetchNextPage"
        />
      </div>
    </div>
    
    <!-- Mobile pull-to-refresh indicator -->
    <div v-if="isPullRefresh" class="pull-refresh-indicator">
      <div class="refresh-spinner" />
      <span class="refresh-text">Refreshing...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { AlertCircle, RefreshCw } from 'lucide-vue-next'
import type { Communication, CommunicationFilters } from '~/types/communication'
import { Button } from '~/components/ui/button'
import { useCommunicationTimeline } from '~/composables/useCommunicationTimeline'
import { useCommunicationFilters } from '~/composables/useCommunicationFilters'
import {
  TimelineFilters,
  TimelineItem,
  TimelineItemGroup,
  TimelineSkeleton,
  TimelineEmptyState,
  TimelineLoadMore
} from './timeline'

interface Props {
  matterId?: string
  embedded?: boolean
  autoRefresh?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  embedded: false,
  autoRefresh: true
})

const emit = defineEmits<{
  itemClick: [communication: Communication]
  itemReply: [communication: Communication]
  itemAddNote: [communication: Communication]
}>()

// Refs
const timelineRef = ref<HTMLElement>()
const isPullRefresh = ref(false)

// Composables
const { 
  filters, 
  hasActiveFilters, 
  filterSummary, 
  applyPreset, 
  clearFilters 
} = useCommunicationFilters()

// Override matterId if provided
const timelineFilters = computed(() => {
  if (props.matterId) {
    return { ...filters.value, matterId: props.matterId }
  }
  return filters.value
})

const {
  timelineGroups,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  isError,
  error,
  isRealTimeConnected,
  refetch
} = useCommunicationTimeline(timelineFilters, { enabled: true })

// Methods
const updateFilters = (newFilters: CommunicationFilters) => {
  filters.value = newFilters
}

const handleItemClick = (communication: Communication) => {
  emit('itemClick', communication)
}

const handleToggleRead = (communication: Communication) => {
  // In a real app, this would call an API
  console.log('Toggle read status:', communication.id)
}

const handleReply = (communication: Communication) => {
  emit('itemReply', communication)
}

const handleAddNote = (communication: Communication) => {
  emit('itemAddNote', communication)
}

// Infinite scroll
const handleScroll = useDebounceFn(() => {
  if (!timelineRef.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = timelineRef.value
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  
  // Load more when within 200px of bottom
  if (distanceFromBottom < 200 && hasNextPage.value && !isFetchingNextPage.value) {
    fetchNextPage()
  }
}, 100)

// Pull-to-refresh for mobile
const handleTouchStart = ref({ y: 0, time: 0 })
const handleTouchEnd = ref({ y: 0, time: 0 })

const onTouchStart = (event: TouchEvent) => {
  handleTouchStart.value = {
    y: event.touches[0].clientY,
    time: Date.now()
  }
}

const onTouchEnd = (event: TouchEvent) => {
  handleTouchEnd.value = {
    y: event.changedTouches[0].clientY,
    time: Date.now()
  }
  
  const deltaY = handleTouchEnd.value.y - handleTouchStart.value.y
  const deltaTime = handleTouchEnd.value.time - handleTouchStart.value.time
  
  // Check for pull-to-refresh gesture
  if (
    deltaY > 100 && // Pulled down at least 100px
    deltaTime < 500 && // Within 500ms
    timelineRef.value?.scrollTop === 0 // At top of container
  ) {
    performPullRefresh()
  }
}

const performPullRefresh = async () => {
  isPullRefresh.value = true
  try {
    await refetch()
  } finally {
    isPullRefresh.value = false
  }
}

// Auto-refresh
let refreshInterval: NodeJS.Timeout | null = null

onMounted(() => {
  if (props.autoRefresh && !props.embedded) {
    refreshInterval = setInterval(() => {
      if (!isLoading.value && !isFetchingNextPage.value) {
        refetch()
      }
    }, 30000) // Refresh every 30 seconds
  }
  
  // Add touch event listeners for mobile pull-to-refresh
  if (timelineRef.value) {
    timelineRef.value.addEventListener('touchstart', onTouchStart)
    timelineRef.value.addEventListener('touchend', onTouchEnd)
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  
  if (timelineRef.value) {
    timelineRef.value.removeEventListener('touchstart', onTouchStart)
    timelineRef.value.removeEventListener('touchend', onTouchEnd)
  }
})
</script>

<style scoped>
.communication-timeline {
  @apply flex flex-col h-full bg-background;
}

.communication-timeline.embedded {
  @apply border rounded-lg;
}

.timeline-filters {
  @apply border-b bg-muted/50 p-4;
}

.connection-status {
  @apply flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground bg-muted/30;
}

.status-dot {
  @apply w-2 h-2 bg-green-500 rounded-full animate-pulse;
}

.status-text {
  @apply font-medium;
}

.timeline-container {
  @apply flex-1 overflow-auto;
  @apply scrollbar-thin scrollbar-thumb-muted scrollbar-track-muted/50;
}

.timeline-content {
  @apply px-4 py-6;
}

.timeline-items {
  @apply space-y-0;
}

.error-state {
  @apply flex flex-col items-center justify-center h-64 gap-4 text-center px-4;
}

.error-icon {
  @apply size-12 text-destructive;
}

.error-title {
  @apply text-lg font-semibold text-foreground;
}

.error-description {
  @apply text-muted-foreground max-w-md;
}

.pull-refresh-indicator {
  @apply fixed top-0 left-0 right-0 bg-background border-b border-border;
  @apply flex items-center justify-center gap-2 py-3 z-50;
  @apply transform transition-transform duration-300;
}

.refresh-spinner {
  @apply w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin;
}

.refresh-text {
  @apply text-sm font-medium text-muted-foreground;
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .timeline-container {
    @apply -mx-4;
    
    /* iOS bounce scrolling */
    -webkit-overflow-scrolling: touch;
    
    /* Prevent overscroll on Android */
    overscroll-behavior: contain;
  }
  
  .timeline-filters {
    @apply px-2;
  }
  
  .timeline-content {
    @apply px-2 py-4;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .timeline-container {
    @apply scrollbar-thumb-muted-foreground/20 scrollbar-track-background;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .status-dot {
    @apply animate-none;
  }
  
  .refresh-spinner {
    @apply animate-none;
  }
  
  .pull-refresh-indicator {
    @apply transition-none;
  }
}
</style>