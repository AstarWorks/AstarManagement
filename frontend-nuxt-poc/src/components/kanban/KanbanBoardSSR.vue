<script setup lang="ts">
import { computed } from 'vue'
import type { MatterCard } from '~/types/kanban'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Skeleton } from '~/components/ui/skeleton'
import { Calendar, Clock, User, AlertTriangle, AlertCircle, Info, Minus } from 'lucide-vue-next'
import { cn } from '~/lib/utils'
import { useKanbanMattersQuery } from '~/composables/useKanbanQuery'
import { DEFAULT_KANBAN_COLUMNS } from '~/constants/kanban'

// Props for SSR-optimized Kanban board
interface Props {
  filters?: any // MatterFilters
  showJapanese?: boolean
  viewMode?: 'compact' | 'normal' | 'detailed'
  ssrMatters?: MatterCard[] // Optional pre-fetched data for SSR
  ssrStatusCounts?: Record<string, number> // Optional pre-fetched counts
}

const props = withDefaults(defineProps<Props>(), {
  filters: undefined,
  showJapanese: true,
  viewMode: 'normal',
  ssrMatters: undefined,
  ssrStatusCounts: undefined
})

// Use TanStack Query with SSR support
const {
  matterCards,
  mattersByStatus,
  columnsWithCounts,
  isLoading,
  isError,
  error
} = useKanbanMattersQuery(props.filters, {
  // Use SSR data if available
  initialData: props.ssrMatters ? {
    data: props.ssrMatters,
    total: props.ssrMatters.length,
    page: 1,
    pageSize: 100
  } : undefined,
  staleTime: props.ssrMatters ? 5 * 60 * 1000 : 0 // 5 minutes if SSR data
})

// Use SSR data or query data
const matters = computed(() => props.ssrMatters || matterCards.value)
const loading = computed(() => !props.ssrMatters && isLoading.value)

// Columns configuration
const columns = computed(() => {
  return DEFAULT_KANBAN_COLUMNS.map(col => ({
    id: col.id,
    label: col.titleJa,
    labelEn: col.title,
    color: col.color,
    count: props.ssrStatusCounts?.[col.id] || columnsWithCounts.value.find(c => c.id === col.id)?.count || 0
  }))
})

// Priority configuration for consistent styling
const PRIORITY_COLORS = {
  URGENT: {
    border: 'border-l-red-500',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: AlertTriangle
  },
  HIGH: {
    border: 'border-l-orange-500',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    icon: AlertCircle
  },
  MEDIUM: {
    border: 'border-l-blue-500',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: Info
  },
  LOW: {
    border: 'border-l-gray-500',
    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    icon: Minus
  }
}

// Helper functions
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return 'Invalid date'
  }
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getPriorityConfig = (priority: string) => {
  return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.LOW
}

// Server-side safe rendering
const isServerSafe = (value: any) => {
  return value !== null && value !== undefined
}
</script>

<template>
  <div class="kanban-board-ssr">
    <!-- Column headers with Japanese/English labels -->
    <div class="kanban-columns">
      <div
        v-for="column in columns"
        :key="column.id"
        class="kanban-column"
        :data-column-id="column.id"
        :class="column.color"
      >
        <!-- Column header -->
        <div class="column-header">
          <h2 class="column-title">
            {{ showJapanese ? column.label : column.labelEn }}
          </h2>
          <div class="column-count">
            <span class="count-badge">
              {{ column.count }}
            </span>
          </div>
        </div>

        <!-- Column content -->
        <div class="column-content" :class="{ 'loading': loading }">
          <!-- Loading skeletons -->
          <template v-if="loading">
            <div v-for="i in 3" :key="`skeleton-${i}`" class="matter-skeleton">
              <Skeleton class="h-24 w-full" />
            </div>
          </template>

          <!-- Error state -->
          <template v-else-if="isError">
            <div class="error-state">
              <p class="text-sm text-destructive text-center py-4">
                Failed to load matters
              </p>
            </div>
          </template>

          <!-- Matter cards -->
          <template v-else>
            <div
              v-for="matter in mattersByStatus[column.id]"
              :key="matter.id"
              class="matter-card-ssr"
              :data-matter-id="matter.id"
              :data-priority="matter.priority"
            >
              <Card :class="cn(
                'matter-card',
                'border-l-4',
                getPriorityConfig(matter.priority).border,
                viewMode === 'compact' ? 'h-20' : viewMode === 'detailed' ? 'h-36' : 'h-28'
              )">
                <!-- Card header with title and priority -->
                <CardHeader class="pb-2 pt-3">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <h3 class="font-medium text-sm text-foreground truncate">
                          {{ matter.title }}
                        </h3>
                        <Badge
                          variant="secondary"
                          :class="cn(
                            getPriorityConfig(matter.priority).badge,
                            'text-xs flex items-center gap-1'
                          )"
                        >
                          <component
                            :is="getPriorityConfig(matter.priority).icon"
                            class="w-3 h-3"
                          />
                          <span class="sr-only">Priority:</span>
                          {{ matter.priority }}
                        </Badge>
                      </div>
                      
                      <!-- Case number and status -->
                      <div class="flex items-center gap-2 text-xs text-muted-foreground">
                        <span class="truncate">#{{ matter.caseNumber }}</span>
                        <span class="text-muted-foreground/50">•</span>
                        <span v-if="matter.statusDuration && viewMode !== 'compact'">
                          {{ matter.statusDuration }}d in status
                        </span>
                        <span v-else>
                          {{ matter.status.replace(/_/g, ' ').toLowerCase() }}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <!-- Card content -->
                <CardContent class="pt-0 pb-3">
                  <div class="space-y-2">
                    <!-- Client information -->
                    <div class="flex items-center gap-2 text-xs text-muted-foreground">
                      <User class="w-3 h-3 flex-shrink-0" />
                      <span class="truncate">{{ matter.clientName }}</span>
                      <span v-if="matter.opponentName" class="text-muted-foreground truncate">
                        vs {{ matter.opponentName }}
                      </span>
                    </div>

                    <!-- Due date with overdue indicator -->
                    <div
                      v-if="isServerSafe(matter.dueDate) && viewMode !== 'compact'"
                      class="flex items-center gap-2 text-xs"
                    >
                      <Calendar class="w-3 h-3 flex-shrink-0" />
                      <span :class="cn(
                        'truncate',
                        'text-muted-foreground'
                      )">
                        {{ formatDate(matter.dueDate!) }}
                      </span>
                    </div>

                    <!-- Last updated and document count -->
                    <div class="flex items-center justify-between text-xs text-muted-foreground">
                      <div class="flex items-center gap-2">
                        <Clock class="w-3 h-3 flex-shrink-0" />
                        <span>Updated {{ formatDate(matter.updatedAt) }}</span>
                      </div>
                      
                      <div
                        v-if="matter.relatedDocuments && viewMode !== 'compact'"
                        class="flex items-center gap-1"
                      >
                        <span>{{ matter.relatedDocuments }} docs</span>
                      </div>
                    </div>

                    <!-- Assignees (normal/detailed views) -->
                    <div
                      v-if="viewMode !== 'compact' && (matter.assignedLawyer || matter.assignedClerk)"
                      class="flex items-center gap-2 mt-2"
                    >
                      <div class="flex -space-x-1">
                        <Avatar
                          v-if="matter.assignedLawyer"
                          size="xs"
                          :aria-label="`Assigned lawyer: ${matter.assignedLawyer.name}`"
                        >
                          <AvatarImage
                            :src="matter.assignedLawyer.avatar || ''"
                            :alt="matter.assignedLawyer.name"
                          />
                          <AvatarFallback class="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                            {{ matter.assignedLawyer.initials || getInitials(matter.assignedLawyer.name) }}
                          </AvatarFallback>
                        </Avatar>

                        <Avatar
                          v-if="matter.assignedClerk"
                          size="xs"
                          :aria-label="`Assigned clerk: ${matter.assignedClerk.name}`"
                        >
                          <AvatarImage
                            :src="matter.assignedClerk.avatar || ''"
                            :alt="matter.assignedClerk.name"
                          />
                          <AvatarFallback class="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                            {{ matter.assignedClerk.initials || getInitials(matter.assignedClerk.name) }}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <span class="text-xs text-muted-foreground truncate">
                        {{ matter.assignedLawyer?.name }}
                        <span v-if="matter.assignedClerk">
                          & {{ matter.assignedClerk.name }}
                        </span>
                      </span>
                    </div>

                    <!-- Tags (detailed view only) -->
                    <div
                      v-if="viewMode === 'detailed' && matter.tags?.length"
                      class="flex flex-wrap gap-1 mt-2"
                    >
                      <Badge
                        v-for="tag in matter.tags.slice(0, 3)"
                        :key="tag"
                        variant="outline"
                        class="text-xs px-1.5 py-0"
                      >
                        {{ tag }}
                      </Badge>
                      <Badge
                        v-if="matter.tags.length > 3"
                        variant="outline"
                        class="text-xs px-1.5 py-0"
                      >
                        +{{ matter.tags.length - 3 }}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </template>

          <!-- Empty state -->
          <div
            v-if="!loading && !isError && (!mattersByStatus[column.id] || mattersByStatus[column.id].length === 0)"
            class="empty-column"
          >
            <p class="text-sm text-muted-foreground text-center py-8">
              No {{ showJapanese ? column.label : column.labelEn.toLowerCase() }} cases
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Static loading indicator for server-side rendering -->
    <div v-if="loading" class="loading-overlay" aria-live="polite">
      <div class="loading-content">
        <div class="loading-spinner" />
        <p>Loading kanban board...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Critical CSS optimized for server-side rendering */
.kanban-board-ssr {
  height: 100%;
  overflow: hidden;
  background: hsl(var(--muted) / 0.1);
}

.kanban-columns {
  display: flex;
  height: 100%;
  gap: 1rem;
  padding: 1rem;
  overflow-x: auto;
  overflow-y: hidden;
}

.kanban-column {
  flex: 0 0 320px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.column-header {
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius) var(--radius) 0 0;
  border-bottom: none;
}

.column-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  flex: 1;
}

.count-badge {
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: calc(var(--radius) - 2px);
  min-width: 1.5rem;
  text-align: center;
}

.column-content {
  flex: 1;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-top: none;
  border-radius: 0 0 var(--radius) var(--radius);
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.column-content.loading {
  opacity: 0.7;
  pointer-events: none;
}

/* Matter card styling optimized for SSR */
.matter-card-ssr {
  flex-shrink: 0;
}

.matter-card {
  cursor: default;
  transition: none; /* Remove transitions for SSR */
  border-left-width: 4px;
}

.matter-skeleton {
  flex-shrink: 0;
}

.empty-column {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Loading overlay for server-side rendering */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: hsl(var(--background) / 0.8);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.loading-content {
  text-align: center;
  color: hsl(var(--foreground));
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid hsl(var(--muted));
  border-top: 2px solid hsl(var(--primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Mobile optimization for SSR */
@media (max-width: 768px) {
  .kanban-columns {
    gap: 0.5rem;
    padding: 0.5rem;
  }
  
  .kanban-column {
    flex: 0 0 280px;
  }
  
  .column-header {
    padding: 0.5rem 0.75rem;
  }
  
  .column-content {
    padding: 0.75rem;
    gap: 0.5rem;
  }
  
  .column-title {
    font-size: 0.8125rem;
  }
  
  .count-badge {
    font-size: 0.6875rem;
    padding: 0.125rem 0.375rem;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .column-header,
  .column-content {
    border-width: 2px;
  }
  
  .matter-card {
    border-left-width: 6px;
  }
}

/* Reduced motion for SSR */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
  }
  
  .matter-card {
    transition: none;
  }
}

/* Print styles */
@media print {
  .kanban-board-ssr {
    height: auto;
  }
  
  .kanban-columns {
    display: block;
    padding: 0;
  }
  
  .kanban-column {
    flex: none;
    margin-bottom: 2rem;
    break-inside: avoid;
  }
  
  .column-content {
    overflow: visible;
    max-height: none;
  }
  
  .loading-overlay {
    display: none;
  }
}

/* Ensure proper rendering in no-JS environments */
.no-js .kanban-board-ssr {
  /* Ensure layout works without JavaScript */
}

/* Critical path optimization */
.kanban-board-ssr * {
  /* Prevent layout shifts during hydration */
  box-sizing: border-box;
}

/* Optimize for Core Web Vitals */
.matter-card {
  /* Prevent CLS during content loading */
  contain: layout style paint;
}

.column-content {
  /* Optimize scrolling performance */
  scroll-behavior: smooth;
  overscroll-behavior: contain;
}
</style>