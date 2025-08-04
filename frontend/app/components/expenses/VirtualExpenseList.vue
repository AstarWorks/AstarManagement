<template>
  <div 
    ref="containerRef" 
    class="virtual-expense-list"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
  >
    <!-- Virtual scrolling container -->
    <div 
      class="virtual-content"
      :style="{ height: totalHeight + 'px', position: 'relative' }"
    >
      <!-- Visible items -->
      <div 
        class="virtual-items"
        :style="{ 
          transform: `translateY(${offsetY}px)`,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0
        }"
      >
        <ExpenseListItem
          v-for="(expense, index) in visibleExpenses"
          :key="expense.id"
          :expense="expense"
          :index="startIndex + index"
          :selected="selectedIds.includes(expense.id)"
          :style="{ height: itemHeight + 'px' }"
          @select="handleSelect"
          @edit="handleEdit"
          @view="handleView"
          @delete="handleDelete"
          @duplicate="handleDuplicate"
        />
      </div>
    </div>

    <!-- Loading indicator -->
    <div 
      v-if="loading" 
      class="loading-overlay flex items-center justify-center absolute inset-0 bg-background/80"
    >
      <div class="flex items-center gap-2">
        <Icon name="lucide:loader" class="w-4 h-4 animate-spin" />
        <span class="text-sm text-muted-foreground">{{ $t('expense.list.loading') }}</span>
      </div>
    </div>

    <!-- Empty state -->
    <div 
      v-if="!loading && expenses.length === 0" 
      class="empty-state flex flex-col items-center justify-center h-full text-center p-8"
    >
      <Icon name="lucide:receipt" class="w-16 h-16 text-muted-foreground mb-4" />
      <h3 class="text-lg font-medium mb-2">{{ $t('expense.list.empty.title') }}</h3>
      <p class="text-muted-foreground mb-4 max-w-md">
        {{ $t('expense.list.empty.description') }}
      </p>
      <Button @click="$emit('createExpense')">
        <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
        {{ $t('expense.actions.create') }}
      </Button>
    </div>

    <!-- Scroll indicators -->
    <div v-if="showScrollIndicators" class="scroll-indicators">
      <!-- Top indicator -->
      <div 
        v-if="canScrollUp"
        class="scroll-indicator scroll-indicator-top absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background to-transparent pointer-events-none z-10"
      />
      
      <!-- Bottom indicator -->
      <div 
        v-if="canScrollDown"
        class="scroll-indicator scroll-indicator-bottom absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none z-10"
      />
    </div>

    <!-- Performance metrics (development only) -->
    <div 
      v-if="showPerformanceMetrics && isDevelopment"
      class="performance-metrics absolute top-2 right-2 bg-black/80 text-white text-xs p-2 rounded font-mono z-20"
    >
      <div>Visible: {{ visibleExpenses.length }}/{{ expenses.length }}</div>
      <div>Range: {{ startIndex }}-{{ endIndex }}</div>
      <div>Scroll: {{ scrollTop }}px</div>
      <div>FPS: {{ fps }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useThrottleFn, useRafFn } from '@vueuse/core'
import type { IExpense } from '~/types/expense'
import { Button } from '~/components/ui/button'
import ExpenseListItem from './ExpenseListItem.vue'

interface Props {
  expenses: IExpense[]
  selectedIds?: string[]
  itemHeight?: number
  containerHeight?: number
  overscan?: number
  loading?: boolean
  showScrollIndicators?: boolean
  showPerformanceMetrics?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectedIds: () => [],
  itemHeight: 80,
  containerHeight: 400,
  overscan: 5,
  loading: false,
  showScrollIndicators: true,
  showPerformanceMetrics: false
})

const emit = defineEmits<{
  'select': [{ expenseId: string; selected: boolean }]
  'edit': [IExpense]
  'view': [IExpense]
  'delete': [IExpense]
  'duplicate': [IExpense]
  'createExpense': []
  'scroll': [{ scrollTop: number; scrollLeft: number }]
  'visibleRangeChange': [{ startIndex: number; endIndex: number }]
}>()

// Refs
const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)
const scrollLeft = ref(0)

// Performance tracking
const fps = ref(0)
const frameCount = ref(0)
const lastTime = ref(Date.now())
const isDevelopment = computed(() => process.env.NODE_ENV === 'development')

// Computed properties
const totalHeight = computed(() => props.expenses.length * props.itemHeight)

const visibleCount = computed(() => 
  Math.ceil(props.containerHeight / props.itemHeight) + props.overscan * 2
)

const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / props.itemHeight) - props.overscan
  return Math.max(0, index)
})

const endIndex = computed(() => {
  const index = startIndex.value + visibleCount.value
  return Math.min(props.expenses.length - 1, index)
})

const visibleExpenses = computed(() => 
  props.expenses.slice(startIndex.value, endIndex.value + 1)
)

const offsetY = computed(() => startIndex.value * props.itemHeight)

const canScrollUp = computed(() => scrollTop.value > 0)
const canScrollDown = computed(() => 
  scrollTop.value + props.containerHeight < totalHeight.value
)

// Throttled scroll handler for performance
const handleScroll = useThrottleFn((event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
  scrollLeft.value = target.scrollLeft
  
  emit('scroll', { 
    scrollTop: scrollTop.value, 
    scrollLeft: scrollLeft.value 
  })
}, 16) // ~60fps

// Performance monitoring
const { pause: pauseRaf, resume: resumeRaf } = useRafFn(() => {
  frameCount.value++
  const now = Date.now()
  
  if (now - lastTime.value >= 1000) {
    fps.value = frameCount.value
    frameCount.value = 0
    lastTime.value = now
  }
}, { immediate: false })

// Event handlers
const handleSelect = (data: { expenseId: string; selected: boolean }) => {
  emit('select', data)
}

const handleEdit = (expense: IExpense) => {
  emit('edit', expense)
}

const handleView = (expense: IExpense) => {
  emit('view', expense)
}

const handleDelete = (expense: IExpense) => {
  emit('delete', expense)
}

const handleDuplicate = (expense: IExpense) => {
  emit('duplicate', expense)
}

// Scroll to specific expense
const scrollToExpense = (expenseId: string) => {
  const index = props.expenses.findIndex(expense => expense.id === expenseId)
  if (index !== -1) {
    scrollToIndex(index)
  }
}

const scrollToIndex = (index: number) => {
  if (containerRef.value) {
    const targetScrollTop = index * props.itemHeight
    containerRef.value.scrollTop = targetScrollTop
  }
}

const scrollToTop = () => {
  if (containerRef.value) {
    containerRef.value.scrollTop = 0
  }
}

const scrollToBottom = () => {
  if (containerRef.value) {
    containerRef.value.scrollTop = totalHeight.value
  }
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (!containerRef.value) return
  
  const currentFocus = document.activeElement
  const isInContainer = containerRef.value.contains(currentFocus)
  
  if (!isInContainer) return
  
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      scrollBy(-props.itemHeight)
      break
    case 'ArrowDown':
      event.preventDefault()
      scrollBy(props.itemHeight)
      break
    case 'PageUp':
      event.preventDefault()
      scrollBy(-props.containerHeight)
      break
    case 'PageDown':
      event.preventDefault()
      scrollBy(props.containerHeight)
      break
    case 'Home':
      if (event.ctrlKey) {
        event.preventDefault()
        scrollToTop()
      }
      break
    case 'End':
      if (event.ctrlKey) {
        event.preventDefault()
        scrollToBottom()
      }
      break
    default:
      // No action needed for other keys
      break
  }
}

const scrollBy = (delta: number) => {
  if (containerRef.value) {
    const newScrollTop = Math.max(0, Math.min(
      totalHeight.value - props.containerHeight,
      scrollTop.value + delta
    ))
    containerRef.value.scrollTop = newScrollTop
  }
}

// Watchers
watch([startIndex, endIndex], ([newStart, newEnd]) => {
  emit('visibleRangeChange', { 
    startIndex: newStart, 
    endIndex: newEnd 
  })
})

watch(() => props.expenses.length, async () => {
  // Reset scroll position when expenses change significantly
  await nextTick()
  if (containerRef.value && scrollTop.value > totalHeight.value) {
    containerRef.value.scrollTop = 0
  }
})

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  if (props.showPerformanceMetrics) {
    resumeRaf()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  pauseRaf()
})

// Expose methods for parent components
defineExpose({
  scrollToExpense,
  scrollToIndex,
  scrollToTop,
  scrollToBottom,
  scrollBy
})
</script>

<style scoped>
.virtual-expense-list {
  @apply relative overflow-auto border rounded-lg bg-background;
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
}

.virtual-expense-list::-webkit-scrollbar {
  @apply w-2;
}

.virtual-expense-list::-webkit-scrollbar-track {
  @apply bg-transparent;
}

.virtual-expense-list::-webkit-scrollbar-thumb {
  @apply bg-border rounded-full;
}

.virtual-expense-list::-webkit-scrollbar-thumb:hover {
  @apply bg-border/80;
}

.virtual-content {
  @apply w-full;
}

.virtual-items {
  @apply w-full;
}

.loading-overlay {
  @apply backdrop-blur-sm;
}

.empty-state {
  @apply bg-muted/20;
}

.scroll-indicator {
  @apply pointer-events-none z-10;
}

.scroll-indicator-top {
  background: linear-gradient(to bottom, hsl(var(--background)), transparent);
}

.scroll-indicator-bottom {
  background: linear-gradient(to top, hsl(var(--background)), transparent);
}

.performance-metrics {
  @apply select-none;
  font-size: 10px;
  line-height: 1.2;
}

/* Focus indicators */
.virtual-expense-list:focus-within {
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