<script setup lang="ts">
// 1. Imports - external libraries first, then internal
import { ref, computed, onMounted, watch } from 'vue'
import type { KanbanColumn, KanbanBoardProps } from '~/types/kanban'
import type { Matter } from '~/types/matter'
import { DEFAULT_KANBAN_COLUMNS, BREAKPOINTS } from '~/constants/kanban'
import { useKanbanColumns } from '~/composables/useKanbanColumns'
import { ScrollArea, ScrollBar } from '~/components/ui/scroll-area'

// 2. Props definition with TypeScript and defaults
interface Props {
  title?: string
  columns?: KanbanColumn[]
  showJapanese?: boolean
  className?: string
  matters?: Matter[]
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Matter Management Board',
  showJapanese: true,
  className: '',
  matters: () => []
})

// 3. Emits definition
const emit = defineEmits<{
  columnClick: [columnId: string]
  languageToggle: [language: 'ja' | 'en']
  tabChange: [index: number]
}>()

// 4. Reactive state using Composition API
const activeTabIndex = ref(0)
const isLoading = ref(false)
const boardRef = ref<HTMLElement>()

// 5. Setup composables
const mattersRef = ref(props.matters)
const { mattersByColumn, columnsWithCounts } = useKanbanColumns(mattersRef)

// 6. Computed properties
const displayColumns = computed(() => 
  props.columns || DEFAULT_KANBAN_COLUMNS
)

const currentColumn = computed(() => 
  displayColumns.value[activeTabIndex.value]
)

// Calculate responsive behavior
const minBoardWidth = computed(() => 
  displayColumns.value.length * 296 // 280px + 16px gap
)

// Dynamic CSS classes for the board
const boardClasses = computed(() => [
  'kanban-board',
  props.className,
  {
    'is-loading': isLoading.value
  }
])

// Tab button classes for mobile navigation
const tabButtonClasses = (index: number) => [
  'tab-button',
  {
    'tab-button--active': index === activeTabIndex.value
  }
]

// Column styles
const columnStyle = computed(() => ({
  width: '280px',
  minWidth: '280px'
}))

// 7. Methods
const handleTabChange = (index: number) => {
  activeTabIndex.value = index
  emit('tabChange', index)
  emit('columnClick', displayColumns.value[index].id)
}

const toggleLanguage = () => {
  emit('languageToggle', props.showJapanese ? 'en' : 'ja')
}

const handleColumnHeaderClick = (column: KanbanColumn) => {
  emit('columnClick', column.id)
}

// 8. Lifecycle hooks
onMounted(() => {
  // Update matters when props change
  watch(() => props.matters, (newMatters) => {
    mattersRef.value = newMatters
  }, { immediate: true })
})
</script>

<template>
  <div ref="boardRef" :class="boardClasses">
    <!-- Board Header -->
    <header class="board-header">
      <div class="board-title-section">
        <h1 class="board-title">{{ title }}</h1>
        <button
          class="language-toggle"
          @click="toggleLanguage"
          :aria-label="showJapanese ? 'Switch to English' : 'Switch to Japanese'"
        >
          {{ showJapanese ? 'EN' : 'JA' }}
        </button>
      </div>
      
      <!-- Column summary for screen readers -->
      <div class="sr-only" aria-live="polite">
        Board with {{ displayColumns.length }} columns: 
        <span v-for="(column, index) in columnsWithCounts" :key="column.id">
          {{ showJapanese ? column.titleJa : column.title }} ({{ column.count }} items)
          <span v-if="index < displayColumns.length - 1">, </span>
        </span>
      </div>
    </header>

    <!-- Desktop & Tablet Layout (768px+) -->
    <div class="hidden md:flex flex-1 overflow-hidden">
      <ScrollArea class="w-full h-full">
        <div 
          class="flex h-full gap-4 p-4"
          :style="{ minWidth: `${minBoardWidth}px` }"
          role="tablist"
          aria-label="Matter status columns"
        >
          <KanbanColumn
            v-for="column in displayColumns"
            :key="column.id"
            :column="column"
            :matters="mattersByColumn[column.id] || []"
            :show-japanese="showJapanese"
            :style="columnStyle"
            class="flex-shrink-0"
            role="tabpanel"
            :aria-labelledby="`column-header-${column.id}`"
            @header-click="handleColumnHeaderClick(column)"
          />
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>

    <!-- Mobile Layout (<768px) with Vue Transitions -->
    <div class="md:hidden flex-1 flex flex-col">
      <!-- Tab Navigation -->
      <nav class="tabs-navigation" role="tablist" aria-label="Matter status tabs">
        <button
          v-for="(column, index) in displayColumns"
          :key="column.id"
          :class="tabButtonClasses(index)"
          role="tab"
          :aria-selected="index === activeTabIndex"
          :aria-controls="`panel-${column.id}`"
          :id="`tab-${column.id}`"
          @click="handleTabChange(index)"
        >
          <span class="tab-title">
            {{ showJapanese ? column.titleJa : column.title }}
          </span>
          <span class="tab-count" :aria-label="`${mattersByColumn[column.id]?.length || 0} matters`">
            {{ mattersByColumn[column.id]?.length || 0 }}
          </span>
        </button>
      </nav>
      
      <!-- Mobile Column Content with Transition -->
      <Transition name="slide" mode="out-in">
        <div 
          :key="activeTabIndex" 
          class="flex-1 p-4"
          role="tabpanel"
          :id="`panel-${currentColumn?.id}`"
          :aria-labelledby="`tab-${currentColumn?.id}`"
        >
          <KanbanColumn
            v-if="currentColumn"
            :column="currentColumn"
            :matters="mattersByColumn[currentColumn.id] || []"
            :show-japanese="showJapanese"
            class="h-full"
          />
        </div>
      </Transition>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner" aria-label="Loading matters...">
        <div class="spinner"></div>
        <span class="loading-text">Loading matters...</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Base kanban board styles */
.kanban-board {
  @apply flex flex-col h-full w-full bg-gray-50;
}

.board-header {
  @apply flex-shrink-0 p-4 bg-white border-b border-gray-200;
}

.board-title-section {
  @apply flex items-center justify-between;
}

.board-title {
  @apply text-xl font-semibold text-gray-900;
}

.language-toggle {
  @apply px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}

/* Desktop layout */
.board-content-desktop {
  @apply flex-1 overflow-hidden;
}

/* Mobile tabs navigation */
.tabs-navigation {
  @apply flex-shrink-0 border-b bg-white border-gray-200;
  @apply overflow-x-auto scrollbar-hide;
  @apply px-4;
}

.tab-button {
  @apply flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600;
  @apply border-b-2 border-transparent whitespace-nowrap;
  @apply hover:text-gray-900 hover:border-gray-300 transition-colors;
  @apply focus:outline-none focus:text-blue-600 focus:border-blue-600;
}

.tab-button--active {
  @apply text-blue-600 border-blue-600;
}

.tab-title {
  @apply font-medium;
}

.tab-count {
  @apply bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium;
}

.tab-button--active .tab-count {
  @apply bg-blue-100 text-blue-600;
}

/* Vue Transition Classes */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease-in-out;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Loading state */
.loading-overlay {
  @apply absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center;
  z-index: 50;
}

.loading-spinner {
  @apply flex flex-col items-center gap-3;
}

.spinner {
  @apply w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin;
}

.loading-text {
  @apply text-sm text-gray-600;
}

/* Responsive Design */
@media (max-width: 768px) {
  .kanban-board {
    --column-width: 100%;
    --column-gap: 0;
  }
  
  .board-title {
    @apply text-lg;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .tab-button {
    @apply border-gray-400;
  }
  
  .tab-button--active {
    @apply border-black;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .slide-enter-active,
  .slide-leave-active {
    transition: none;
  }
  
  .spinner {
    animation: none;
  }
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Scrollbar hide utility */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>