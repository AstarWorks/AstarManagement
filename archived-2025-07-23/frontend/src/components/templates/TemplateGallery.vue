<template>
  <div class="template-gallery">
    <!-- Popular templates section -->
    <div v-if="showPopular && popularTemplates.length > 0" class="popular-section">
      <h3 class="section-title">
        <TrendingUp class="section-icon" />
        Popular Templates
      </h3>
      <div class="popular-templates">
        <TemplateCard
          v-for="template in popularTemplates"
          :key="template.id"
          :template="template"
          :compact="true"
          view-mode="grid"
          @click="$emit('select', template)"
          @preview="$emit('preview', template)"
          @toggle-favorite="$emit('toggle-favorite', $event)"
        />
      </div>
    </div>

    <!-- Recently used section -->
    <div v-if="showRecent && recentTemplates.length > 0" class="recent-section">
      <h3 class="section-title">
        <Clock class="section-icon" />
        Recently Used
      </h3>
      <div class="recent-templates">
        <TemplateCard
          v-for="template in recentTemplates"
          :key="template.id"
          :template="template"
          :compact="true"
          view-mode="grid"
          @click="$emit('select', template)"
          @preview="$emit('preview', template)"
          @toggle-favorite="$emit('toggle-favorite', $event)"
        />
      </div>
    </div>

    <!-- View controls -->
    <div v-if="templates.length > 0" class="view-controls">
      <div class="results-info">
        <span class="results-count">
          {{ templates.length }} template{{ templates.length === 1 ? '' : 's' }}
          <span v-if="totalCount && totalCount !== templates.length">
            of {{ totalCount }}
          </span>
        </span>
      </div>
      
      <div class="view-actions">
        <!-- Sort dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              <ArrowUpDown class="h-4 w-4 mr-2" />
              Sort by {{ getSortLabel(sortBy.field) }}
              <ChevronDown class="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="handleSort('name')">
              <Check v-if="sortBy.field === 'name'" class="h-4 w-4 mr-2" />
              <span class="mr-2" v-else></span>
              Name
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleSort('date')">
              <Check v-if="sortBy.field === 'date'" class="h-4 w-4 mr-2" />
              <span class="mr-2" v-else></span>
              Date Updated
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleSort('usage')">
              <Check v-if="sortBy.field === 'usage'" class="h-4 w-4 mr-2" />
              <span class="mr-2" v-else></span>
              Most Used
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleSort('rating')">
              <Check v-if="sortBy.field === 'rating'" class="h-4 w-4 mr-2" />
              <span class="mr-2" v-else></span>
              Rating
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleSort('estimatedTime')">
              <Check v-if="sortBy.field === 'estimatedTime'" class="h-4 w-4 mr-2" />
              <span class="mr-2" v-else></span>
              Time to Complete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <!-- View mode toggle -->
        <div class="view-mode-toggle">
          <Button
            size="icon"
            variant="ghost"
            :class="gridButtonClass"
            @click="$emit('update:view-mode', 'grid')"
            aria-label="Grid view"
          >
            <Grid3X3 class="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            :class="listButtonClass"
            @click="$emit('update:view-mode', 'list')"
            aria-label="List view"
          >
            <List class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Main gallery -->
    <div 
      :class="[
        'gallery-grid',
        viewMode === 'list' ? 'list-view' : 'grid-view'
      ]"
    >
      <TransitionGroup name="template-card" appear>
        <TemplateCard
          v-for="template in templates"
          :key="template.id"
          :template="template"
          :view-mode="viewMode"
          @click="$emit('select', template)"
          @preview="$emit('preview', template)"
          @toggle-favorite="$emit('toggle-favorite', $event)"
        />
      </TransitionGroup>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && templates.length === 0" class="empty-state">
      <div class="empty-content">
        <FileX class="empty-icon" />
        <h3 class="empty-title">No templates found</h3>
        <p class="empty-description">
          {{ hasActiveFilters 
            ? 'Try adjusting your filters or search terms.' 
            : 'No templates are available at the moment.' 
          }}
        </p>
        <div class="empty-actions">
          <Button 
            v-if="hasActiveFilters"
            variant="outline" 
            @click="$emit('clear-filters')"
          >
            Clear filters
          </Button>
          <Button variant="default">
            Browse all templates
          </Button>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="skeleton-grid" :class="viewMode === 'list' ? 'list-view' : 'grid-view'">
        <CardSkeleton 
          v-for="i in 8" 
          :key="i" 
          :view-mode="viewMode"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  TrendingUp, 
  Clock, 
  ArrowUpDown, 
  ChevronDown, 
  Check, 
  Grid3X3, 
  List, 
  FileX
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import TemplateCard from './TemplateCard.vue'
import CardSkeleton from './CardSkeleton.vue'
import type { Template, TemplateSortOptions } from '~/types/template'

interface Props {
  templates: Template[]
  popularTemplates?: Template[]
  recentTemplates?: Template[]
  loading?: boolean
  viewMode?: 'grid' | 'list'
  sortBy?: TemplateSortOptions
  showPopular?: boolean
  showRecent?: boolean
  hasActiveFilters?: boolean
  totalCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  popularTemplates: () => [],
  recentTemplates: () => [],
  loading: false,
  viewMode: 'grid',
  sortBy: () => ({ field: 'name', direction: 'asc' }),
  showPopular: true,
  showRecent: true,
  hasActiveFilters: false
})

const emit = defineEmits<{
  select: [template: Template]
  preview: [template: Template]
  'toggle-favorite': [templateId: string]
  'update:view-mode': [mode: 'grid' | 'list']
  'update:sort-by': [sort: TemplateSortOptions]
  'clear-filters': []
}>()

// Computed
const showPopularSection = computed(() => 
  props.showPopular && 
  props.popularTemplates.length > 0 && 
  !props.hasActiveFilters
)

const showRecentSection = computed(() => 
  props.showRecent && 
  props.recentTemplates.length > 0 && 
  !props.hasActiveFilters
)

const gridButtonClass = computed(() => {
  return props.viewMode === 'grid' ? 'bg-muted' : ''
})

const listButtonClass = computed(() => {
  return props.viewMode === 'list' ? 'bg-muted' : ''
})

// Methods
const getSortLabel = (field: string): string => {
  const labels: Record<string, string> = {
    name: 'Name',
    date: 'Date',
    usage: 'Usage',
    rating: 'Rating',
    estimatedTime: 'Time'
  }
  return labels[field] || field
}

const handleSort = (field: TemplateSortOptions['field']) => {
  const direction = props.sortBy.field === field && props.sortBy.direction === 'asc' ? 'desc' : 'asc'
  emit('update:sort-by', { field, direction })
}
</script>

<style scoped>
.template-gallery {
  @apply space-y-6;
}

/* Section headers */
.section-title {
  @apply flex items-center gap-2 text-lg font-semibold mb-4;
}

.section-icon {
  @apply h-5 w-5 text-primary;
}

/* Popular and recent sections */
.popular-templates,
.recent-templates {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4;
}

/* View controls */
.view-controls {
  @apply flex items-center justify-between py-4 border-b border-border;
}

.results-info {
  @apply flex items-center gap-4;
}

.results-count {
  @apply text-sm text-muted-foreground;
}

.view-actions {
  @apply flex items-center gap-3;
}

.view-mode-toggle {
  @apply flex items-center rounded-md border border-border;
}

.view-mode-toggle .button {
  @apply rounded-none border-0;
}

.view-mode-toggle .button:first-child {
  @apply rounded-l-md;
}

.view-mode-toggle .button:last-child {
  @apply rounded-r-md border-l border-border;
}

/* Gallery grid */
.gallery-grid {
  @apply gap-6;
  min-height: 400px;
}

.grid-view {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4;
}

.list-view {
  @apply flex flex-col;
}

/* Empty state */
.empty-state {
  @apply flex items-center justify-center py-16;
}

.empty-content {
  @apply text-center max-w-md space-y-4;
}

.empty-icon {
  @apply h-16 w-16 mx-auto text-muted-foreground;
}

.empty-title {
  @apply text-xl font-semibold;
}

.empty-description {
  @apply text-muted-foreground;
}

.empty-actions {
  @apply flex justify-center gap-3;
}

/* Loading state */
.loading-state {
  @apply py-8;
}

.skeleton-grid {
  @apply gap-6;
}

.skeleton-grid.grid-view {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4;
}

.skeleton-grid.list-view {
  @apply flex flex-col;
}

/* Card animations */
.template-card-enter-active,
.template-card-leave-active {
  @apply transition-all duration-300 ease-out;
}

.template-card-enter-from {
  @apply opacity-0 transform translate-y-4 scale-95;
}

.template-card-leave-to {
  @apply opacity-0 transform translate-y-2 scale-95;
}

.template-card-move {
  @apply transition-transform duration-300 ease-out;
}

/* Responsive design */
@media (max-width: 1024px) {
  .grid-view {
    @apply grid-cols-1 sm:grid-cols-2 lg:grid-cols-3;
  }
}

@media (max-width: 768px) {
  .grid-view {
    @apply grid-cols-1 sm:grid-cols-2;
  }
  
  .view-controls {
    @apply flex-col gap-4 items-stretch;
  }
  
  .view-actions {
    @apply justify-between;
  }
  
  .popular-templates,
  .recent-templates {
    @apply grid-cols-1 sm:grid-cols-2;
  }
}

@media (max-width: 640px) {
  .grid-view {
    @apply grid-cols-1;
  }
  
  .popular-templates,
  .recent-templates {
    @apply grid-cols-1;
  }
}

/* Accessibility */
.view-mode-toggle .button:focus-visible {
  @apply ring-2 ring-primary ring-offset-2 relative z-10;
}

/* Performance optimization */
.gallery-grid {
  contain: layout style paint;
}

.template-card-enter-active,
.template-card-leave-active {
  will-change: transform, opacity;
}
</style>