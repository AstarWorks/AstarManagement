<template>
  <div 
    ref="containerRef"
    class="virtual-list"
    :style="{ height: containerHeight + 'px' }"
    @scroll="virtualScroll.handlers.handleScroll"
  >
    <!-- Virtual scrolling container -->
    <div 
      class="virtual-content"
      :style="{ 
        height: virtualScroll.totalHeight.value + 'px', 
        position: 'relative' 
      }"
    >
      <!-- Visible items -->
      <div 
        class="virtual-items"
        :style="{ 
          transform: `translateY(${virtualScroll.offsetY.value}px)`,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0
        }"
      >
        <div
          v-for="(item, index) in virtualScroll.visibleItems.value"
          :key="getItemKey(item, virtualScroll.metrics.startIndex.value + index)"
          :style="{ height: itemHeight + 'px' }"
          class="virtual-item"
        >
          <slot 
            name="item" 
            :item="item"
            :index="virtualScroll.metrics.startIndex.value + index"
            :is-visible="true"
          />
        </div>
      </div>
    </div>

    <!-- Loading overlay -->
    <div 
      v-if="loading" 
      class="loading-overlay absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10"
    >
      <slot name="loading">
        <div class="flex items-center gap-2">
          <Icon name="lucide:loader" class="w-4 h-4 animate-spin" />
          <span class="text-sm text-muted-foreground">{{ $t('common.loading') }}</span>
        </div>
      </slot>
    </div>

    <!-- Empty state -->
    <div 
      v-if="!loading && items.length === 0" 
      class="empty-state flex flex-col items-center justify-center h-full"
    >
      <slot name="empty">
        <div class="text-center p-8">
          <Icon name="lucide:inbox" class="w-16 h-16 text-muted-foreground mb-4 mx-auto" />
          <h3 class="text-lg font-medium mb-2">{{ $t('common.empty.title') }}</h3>
          <p class="text-muted-foreground">{{ $t('common.empty.description') }}</p>
        </div>
      </slot>
    </div>

    <!-- Error state -->
    <div 
      v-if="errorBoundary.hasError.value && errorBoundary.shouldShowError.value" 
      class="error-state absolute inset-0 flex items-center justify-center bg-background/90 z-20"
    >
      <slot name="error" :error="errorBoundary.errorState.value">
        <Alert variant="destructive" class="max-w-md">
          <Icon name="lucide:alert-circle" class="h-4 w-4" />
          <AlertTitle>{{ $t('common.error.title') }}</AlertTitle>
          <AlertDescription>
            {{ errorBoundary.getUserFriendlyMessage() }}
          </AlertDescription>
          <div class="mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              @click="errorBoundary.clearError"
            >
              {{ $t('common.error.retry') }}
            </Button>
          </div>
        </Alert>
      </slot>
    </div>

    <!-- Scroll indicators -->
    <div v-if="showScrollIndicators" class="scroll-indicators">
      <!-- Top indicator -->
      <div 
        v-if="virtualScroll.metrics.canScrollUp.value"
        class="scroll-indicator-top absolute top-0 left-0 right-0 h-8 pointer-events-none z-10"
        :style="{ background: 'linear-gradient(to bottom, hsl(var(--background)), transparent)' }"
      />
      
      <!-- Bottom indicator -->
      <div 
        v-if="virtualScroll.metrics.canScrollDown.value"
        class="scroll-indicator-bottom absolute bottom-0 left-0 right-0 h-8 pointer-events-none z-10"
        :style="{ background: 'linear-gradient(to top, hsl(var(--background)), transparent)' }"
      />
    </div>

    <!-- Performance metrics (development only) -->
    <div 
      v-if="showPerformanceMetrics && virtualScroll.isDevelopment.value"
      class="performance-metrics absolute top-2 right-2 bg-black/80 text-white text-xs p-2 rounded font-mono z-30 select-none"
    >
      <div>Visible: {{ virtualScroll.visibleItems.value.length }}/{{ items.length }}</div>
      <div>Range: {{ virtualScroll.metrics.startIndex.value }}-{{ virtualScroll.metrics.endIndex.value }}</div>
      <div>Scroll: {{ virtualScroll.metrics.scrollTop.value }}px</div>
      <div>FPS: {{ virtualScroll.metrics.fps.value }}</div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import { toRef, watch } from 'vue'
import { useVirtualScrolling } from '~/foundation/composables/table/useVirtualScrolling'
import { useErrorBoundary } from '~/foundation/composables/ui/useErrorBoundary'
import { Button } from '~/foundation/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '~/foundation/components/ui/alert'

interface Props {
  /** Array of items to render */
  items: T[]
  /** Height of each item in pixels */
  itemHeight?: number
  /** Height of the container in pixels */
  containerHeight?: number
  /** Number of items to render outside visible area */
  overscan?: number
  /** Whether the list is loading */
  loading?: boolean
  /** Show scroll indicators */
  showScrollIndicators?: boolean
  /** Show performance metrics in development */
  showPerformanceMetrics?: boolean
  /** Function to get unique key for each item */
  getItemKey?: (item: T, index: number) => string | number
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 50,
  containerHeight: 400,
  overscan: 5,
  loading: false,
  showScrollIndicators: true,
  showPerformanceMetrics: false,
  getItemKey: (item: T, index: number) => index
})

const emit = defineEmits<{
  'scroll': [data: { scrollTop: number; scrollLeft: number }]
  'visibleRangeChange': [data: { startIndex: number; endIndex: number }]
}>()

// Virtual scrolling logic
const virtualScroll = useVirtualScrolling(
  toRef(props, 'items'),
  {
    itemHeight: props.itemHeight,
    containerHeight: props.containerHeight,
    overscan: props.overscan,
    showPerformanceMetrics: props.showPerformanceMetrics,
    showScrollIndicators: props.showScrollIndicators
  }
)

// Error boundary
const errorBoundary = useErrorBoundary()

// Wrap visible items calculation with error boundary
const _safeVisibleItems = errorBoundary.withErrorBoundary(() => 
  virtualScroll.visibleItems.value
) || []

// Enhanced scroll handler with error boundary and emit
const _handleScrollWithEmit = (event: Event) => {
  errorBoundary.withErrorBoundary(() => {
    virtualScroll.handlers.handleScroll(event)
    const target = event.target as HTMLElement
    emit('scroll', { 
      scrollTop: target.scrollTop, 
      scrollLeft: target.scrollLeft 
    })
  })
}

// Watch for visible range changes and emit
watch([virtualScroll.metrics.startIndex, virtualScroll.metrics.endIndex], 
  ([startIndex, endIndex]) => {
    emit('visibleRangeChange', { startIndex, endIndex })
  }
)

// Expose methods for parent components
defineExpose({
  scrollToIndex: virtualScroll.handlers.scrollToIndex,
  scrollToTop: virtualScroll.handlers.scrollToTop,
  scrollToBottom: virtualScroll.handlers.scrollToBottom,
  scrollBy: virtualScroll.handlers.scrollBy,
  clearError: errorBoundary.clearError
})

// Use the container ref from virtual scrolling
const { containerRef } = virtualScroll
</script>

<style scoped>
.virtual-list {
  @apply relative overflow-auto border rounded-lg bg-background;
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
}

.virtual-list::-webkit-scrollbar {
  @apply w-2;
}

.virtual-list::-webkit-scrollbar-track {
  @apply bg-transparent;
}

.virtual-list::-webkit-scrollbar-thumb {
  @apply bg-border rounded-full;
}

.virtual-list::-webkit-scrollbar-thumb:hover {
  @apply bg-border/80;
}

.virtual-content {
  @apply w-full;
}

.virtual-items {
  @apply w-full;
}

.virtual-item {
  @apply w-full;
}

.empty-state {
  @apply bg-muted/20;
}

.performance-metrics {
  font-size: 10px;
  line-height: 1.2;
}

/* Focus indicators */
.virtual-list:focus-within {
  @apply ring-2 ring-offset-2 ring-primary;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .scroll-indicator-top,
  .scroll-indicator-bottom {
    @apply border-b border-border;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .virtual-items {
    transition: none !important;
  }
}
</style>