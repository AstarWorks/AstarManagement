<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSwipe } from '@vueuse/core'
import type { KanbanColumn } from '~/types/kanban'
import { cn } from '~/lib/utils'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Filter, Plus, Search } from 'lucide-vue-next'
import { useStatusCountsQuery } from '~/composables/useMattersQuery'

interface Props {
  columns: KanbanColumn[]
  activeColumnId: string
  showJapanese?: boolean
  filterCount?: number
  canAddMatter?: boolean
  useQueryData?: boolean // Enable TanStack Query integration
}

const props = withDefaults(defineProps<Props>(), {
  showJapanese: true,
  filterCount: 0,
  canAddMatter: true,
  useQueryData: true
})

const emit = defineEmits<{
  'column-change': [columnId: string]
  'filter-click': []
  'search-click': []
  'add-matter': []
}>()

// Template refs
const navRef = ref<HTMLElement>()
const tabsContainerRef = ref<HTMLElement>()

// State
const activeTabIndex = ref(0)
const isScrolling = ref(false)
const showScrollIndicator = ref({ left: false, right: false })

// TanStack Query for status counts
const { data: statusCounts, isLoading: countsLoading } = useStatusCountsQuery({
  enabled: props.useQueryData,
  refetchInterval: 30000 // Refresh every 30 seconds
})

// Find active column index
const activeColumnIndex = computed(() => 
  props.columns.findIndex(col => col.id === props.activeColumnId)
)

// Update active tab when column changes
watch(() => props.activeColumnId, (newId) => {
  const index = props.columns.findIndex(col => col.id === newId)
  if (index !== -1) {
    activeTabIndex.value = index
    scrollToTab(index)
  }
})

// Swipe detection for navigation
const { isSwiping, direction } = useSwipe(navRef, {
  threshold: 50,
  onSwipeEnd() {
    if (direction.value === 'left' && activeTabIndex.value < props.columns.length - 1) {
      changeTab(activeTabIndex.value + 1)
    } else if (direction.value === 'right' && activeTabIndex.value > 0) {
      changeTab(activeTabIndex.value - 1)
    }
  }
})

// Methods
const changeTab = (index: number) => {
  if (index >= 0 && index < props.columns.length) {
    activeTabIndex.value = index
    emit('column-change', props.columns[index].id)
    scrollToTab(index)
  }
}

const scrollToTab = (index: number) => {
  if (!tabsContainerRef.value) return
  
  const container = tabsContainerRef.value
  const tabs = container.querySelectorAll('.tab-item')
  const targetTab = tabs[index] as HTMLElement
  
  if (targetTab) {
    const containerWidth = container.clientWidth
    const tabLeft = targetTab.offsetLeft
    const tabWidth = targetTab.offsetWidth
    const scrollLeft = tabLeft - (containerWidth - tabWidth) / 2
    
    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    })
  }
}

const checkScrollIndicators = () => {
  if (!tabsContainerRef.value) return
  
  const container = tabsContainerRef.value
  showScrollIndicator.value = {
    left: container.scrollLeft > 0,
    right: container.scrollLeft < container.scrollWidth - container.clientWidth
  }
}

const handleScrollStart = () => {
  isScrolling.value = true
}

const handleScrollEnd = () => {
  setTimeout(() => {
    isScrolling.value = false
  }, 150)
  checkScrollIndicators()
}

// Tab indicator position
const indicatorStyle = computed(() => {
  const width = 100 / props.columns.length
  const left = activeTabIndex.value * width
  return {
    width: `${width}%`,
    transform: `translateX(${left}%)`
  }
})

// Get column title
const getColumnTitle = (column: KanbanColumn) => {
  return props.showJapanese ? column.titleJa : column.title
}

// Get matter count for column
const getMatterCount = (column: KanbanColumn) => {
  if (!props.useQueryData || !statusCounts.value) {
    return 0
  }
  return statusCounts.value[column.id] || 0
}

// Total matters count
const totalMatters = computed(() => {
  if (!props.useQueryData || !statusCounts.value) {
    return 0
  }
  return Object.values(statusCounts.value).reduce((sum, count) => sum + count, 0)
})

// Initialize
onMounted(() => {
  if (activeColumnIndex.value !== -1) {
    activeTabIndex.value = activeColumnIndex.value
    scrollToTab(activeColumnIndex.value)
  }
  checkScrollIndicators()
})
</script>

<template>
  <nav 
    ref="navRef"
    class="mobile-kanban-nav"
    :class="{ 'is-swiping': isSwiping }"
  >
    <!-- Top Action Bar -->
    <div class="action-bar">
      <div class="action-bar-content">
        <!-- Search Button -->
        <Button
          variant="ghost"
          size="icon"
          class="action-button"
          @click="emit('search-click')"
          aria-label="Search matters"
        >
          <Search class="h-5 w-5" />
        </Button>
        
        <!-- Filter Button with Count -->
        <Button
          variant="ghost"
          size="icon"
          class="action-button relative"
          @click="emit('filter-click')"
          aria-label="Filter matters"
        >
          <Filter class="h-5 w-5" />
          <Badge 
            v-if="filterCount > 0"
            variant="destructive"
            class="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
          >
            {{ filterCount }}
          </Badge>
        </Button>
        
        <!-- Total Count Badge -->
        <Badge 
          v-if="useQueryData && totalMatters > 0"
          variant="outline"
          class="total-badge"
        >
          Total: {{ totalMatters }}
        </Badge>
        
        <!-- Add Matter Button -->
        <Button
          v-if="canAddMatter"
          variant="default"
          size="sm"
          class="add-button"
          @click="emit('add-matter')"
        >
          <Plus class="h-4 w-4 mr-1" />
          New Matter
        </Button>
      </div>
    </div>
    
    <!-- Swipeable Tabs -->
    <div class="tabs-wrapper">
      <!-- Scroll Indicators -->
      <div 
        v-if="showScrollIndicator.left"
        class="scroll-indicator scroll-indicator-left"
        aria-hidden="true"
      />
      <div 
        v-if="showScrollIndicator.right"
        class="scroll-indicator scroll-indicator-right"
        aria-hidden="true"
      />
      
      <!-- Tabs Container -->
      <div 
        ref="tabsContainerRef"
        class="tabs-container"
        @scroll="handleScrollStart"
        @scrollend="handleScrollEnd"
      >
        <div class="tabs-track">
          <button
            v-for="(column, index) in columns"
            :key="column.id"
            class="tab-item"
            :class="{
              'active': index === activeTabIndex,
              'has-matters': getMatterCount(column) > 0
            }"
            @click="changeTab(index)"
            :aria-selected="index === activeTabIndex"
            :aria-label="`${getColumnTitle(column)} - ${getMatterCount(column)} matters`"
          >
            <span class="tab-title">{{ getColumnTitle(column) }}</span>
            <Badge 
              variant="secondary"
              class="tab-count"
              :class="{
                'animate-pulse': countsLoading && useQueryData
              }"
            >
              {{ getMatterCount(column) }}
            </Badge>
          </button>
        </div>
        
        <!-- Active Tab Indicator -->
        <div 
          class="tab-indicator"
          :style="indicatorStyle"
          aria-hidden="true"
        />
      </div>
    </div>
    
    <!-- Swipe Hint -->
    <transition name="fade">
      <div 
        v-if="isSwiping"
        class="swipe-hint"
        aria-live="polite"
      >
        <span v-if="direction === 'left'">→ Next column</span>
        <span v-else-if="direction === 'right'">← Previous column</span>
      </div>
    </transition>
  </nav>
</template>

<style scoped>
.mobile-kanban-nav {
  @apply sticky top-0 z-20 bg-background border-b;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

/* Action Bar */
.action-bar {
  @apply border-b;
}

.action-bar-content {
  @apply flex items-center justify-between px-4 py-2;
}

.action-button {
  @apply h-10 w-10;
}

.add-button {
  @apply ml-auto;
}

.total-badge {
  @apply ml-auto mr-2 text-xs;
}

/* Tabs Wrapper */
.tabs-wrapper {
  @apply relative overflow-hidden;
}

/* Scroll Indicators */
.scroll-indicator {
  @apply absolute top-0 bottom-0 w-8 pointer-events-none z-10;
  @apply bg-gradient-to-r from-background to-transparent;
}

.scroll-indicator-left {
  @apply left-0;
  background: linear-gradient(to right, hsl(var(--background)), transparent);
}

.scroll-indicator-right {
  @apply right-0;
  background: linear-gradient(to left, hsl(var(--background)), transparent);
}

/* Tabs Container */
.tabs-container {
  @apply relative overflow-x-auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tabs-container::-webkit-scrollbar {
  display: none;
}

/* Tabs Track */
.tabs-track {
  @apply flex relative;
  min-width: 100%;
  padding: 0 1rem;
}

/* Tab Items */
.tab-item {
  @apply flex items-center gap-2 px-4 py-3 whitespace-nowrap;
  @apply text-sm font-medium text-muted-foreground;
  @apply transition-colors duration-200;
  @apply min-w-0 flex-1;
  background: none;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.tab-item:active {
  @apply scale-95;
}

.tab-item.active {
  @apply text-foreground;
}

.tab-title {
  @apply truncate;
}

.tab-count {
  @apply text-xs;
}

.tab-count.active-count {
  @apply bg-primary text-primary-foreground;
}

/* Tab Indicator */
.tab-indicator {
  @apply absolute bottom-0 left-0 h-0.5 bg-primary;
  @apply transition-transform duration-300 ease-out;
}

.is-swiping .tab-indicator {
  @apply transition-none;
}

/* Swipe Hint */
.swipe-hint {
  @apply absolute bottom-full left-1/2 transform -translate-x-1/2;
  @apply bg-gray-900 text-white text-xs rounded-full px-3 py-1 mb-2;
  @apply whitespace-nowrap;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .mobile-kanban-nav {
    @apply bg-background/95;
  }
  
  .swipe-hint {
    @apply bg-gray-100 text-gray-900;
  }
}

/* Landscape adjustments */
@media (orientation: landscape) {
  .action-bar-content {
    @apply py-1;
  }
  
  .tab-item {
    @apply py-2;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .tab-indicator {
    @apply h-1;
  }
  
  .tab-item.active {
    @apply font-bold;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .tab-indicator,
  .tab-item,
  .fade-enter-active,
  .fade-leave-active {
    transition: none !important;
  }
}
</style>