<script setup lang="ts">
import type { KanbanColumn } from '~/types/kanban'
import type { Matter } from '~/types/matter'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader } from '~/components/ui/card'

interface Props {
  column: KanbanColumn
  matters?: Matter[]
  showJapanese?: boolean
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  matters: () => [],
  showJapanese: true,
  className: ''
})

const emit = defineEmits<{
  headerClick: [column: KanbanColumn]
  matterClick: [matter: Matter]
}>()

// Computed properties
const columnTitle = computed(() => 
  props.showJapanese ? props.column.titleJa : props.column.title
)

const matterCount = computed(() => props.matters.length)

const columnClasses = computed(() => [
  'kanban-column',
  props.className,
  props.column.color
])

// Methods
const handleHeaderClick = () => {
  emit('headerClick', props.column)
}

const handleMatterClick = (matter: Matter) => {
  emit('matterClick', matter)
}
</script>

<template>
  <div :class="columnClasses" :data-column-id="column.id">
    <!-- Column Header -->
    <header 
      class="column-header"
      :id="`column-header-${column.id}`"
      @click="handleHeaderClick"
    >
      <div class="header-content">
        <h2 class="column-title">
          {{ columnTitle }}
        </h2>
        <Badge 
          variant="secondary" 
          class="matter-count"
          :aria-label="`${matterCount} matters in ${columnTitle}`"
        >
          {{ matterCount }}
        </Badge>
      </div>
    </header>

    <!-- Column Body -->
    <div class="column-body" :data-testid="`column-${column.id}`">
      <!-- Matter Cards -->
      <div v-if="matters.length > 0" class="matters-list">
        <Card
          v-for="matter in matters"
          :key="matter.id"
          class="matter-card"
          tabindex="0"
          role="button"
          :aria-label="`Matter: ${matter.title}`"
          @click="handleMatterClick(matter)"
          @keydown.enter="handleMatterClick(matter)"
          @keydown.space.prevent="handleMatterClick(matter)"
        >
          <CardHeader class="card-header">
            <div class="matter-title">{{ matter.title }}</div>
            <div class="matter-meta">
              <span class="case-number">{{ matter.caseNumber }}</span>
              <Badge 
                :variant="matter.priority === 'high' ? 'destructive' : 
                         matter.priority === 'medium' ? 'default' : 'secondary'"
                class="priority-badge"
              >
                {{ matter.priority }}
              </Badge>
            </div>
          </CardHeader>
          <CardContent class="card-content">
            <div class="client-info">
              <span class="client-name">{{ matter.clientName }}</span>
            </div>
            <div v-if="matter.assignedLawyer" class="lawyer-info">
              <span class="lawyer-name">{{ matter.assignedLawyer }}</span>
            </div>
            <div v-if="matter.dueDate" class="due-date">
              Due: {{ new Date(matter.dueDate).toLocaleDateString() }}
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Empty State -->
      <div 
        v-else 
        class="empty-state"
        :aria-label="`No matters in ${columnTitle}`"
      >
        <div class="empty-content">
          <div class="empty-icon">📋</div>
          <div class="empty-text">No matters</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Column container */
.kanban-column {
  @apply flex flex-col h-full border border-gray-200 rounded-lg bg-white;
  @apply min-h-0; /* Allow column to shrink */
}

/* Column header */
.column-header {
  @apply flex-shrink-0 p-3 border-b border-gray-200 cursor-pointer;
  @apply hover:bg-gray-50 transition-colors;
}

.header-content {
  @apply flex items-center justify-between;
}

.column-title {
  @apply text-sm font-semibold text-gray-900 truncate;
  @apply mr-2; /* Space for badge */
}

.matter-count {
  @apply text-xs font-medium flex-shrink-0;
}

/* Column body */
.column-body {
  @apply flex-1 p-3 overflow-y-auto min-h-0;
}

.matters-list {
  @apply space-y-3;
}

/* Matter cards */
.matter-card {
  @apply cursor-pointer transition-all duration-150;
  @apply hover:shadow-md hover:scale-[1.02];
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
  @apply active:scale-[0.98];
}

.card-header {
  @apply p-3 pb-2;
}

.matter-title {
  @apply text-sm font-medium text-gray-900 line-clamp-2 mb-2;
}

.matter-meta {
  @apply flex items-center justify-between gap-2;
}

.case-number {
  @apply text-xs text-gray-500 font-mono;
}

.priority-badge {
  @apply text-xs;
}

.card-content {
  @apply p-3 pt-0 space-y-1;
}

.client-info,
.lawyer-info {
  @apply text-xs text-gray-600;
}

.client-name,
.lawyer-name {
  @apply font-medium;
}

.due-date {
  @apply text-xs text-orange-600 font-medium;
}

/* Empty state */
.empty-state {
  @apply flex-1 flex items-center justify-center;
  @apply min-h-[200px];
}

.empty-content {
  @apply text-center;
}

.empty-icon {
  @apply text-2xl mb-2 opacity-50;
}

.empty-text {
  @apply text-sm text-gray-500;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .kanban-column {
    @apply h-full;
  }
  
  .column-body {
    @apply pb-20; /* Space for mobile navigation */
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .matter-card {
    @apply border-2;
  }
  
  .matter-card:hover {
    @apply border-gray-900;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .matter-card {
    @apply transition-none;
  }
}

/* Text truncation utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>