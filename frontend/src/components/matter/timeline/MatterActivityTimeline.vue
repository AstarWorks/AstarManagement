<!--
  Matter Activity Timeline Component
  
  Displays a comprehensive timeline of all matter-related activities including:
  - Document uploads, views, downloads
  - Email communications and notes
  - Matter status changes and updates
  - Task creation and completion
  - Audit trail events
  
  Features:
  - Multiple view modes (compact, detailed, grouped)
  - Real-time updates via WebSocket
  - Infinite scroll pagination
  - Advanced filtering and search
  - Export functionality
  - Mobile-responsive design
-->

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  Calendar, 
  Clock,
  Eye,
  EyeOff,
  Grid3X3,
  List,
  Users
} from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { ScrollArea } from '~/components/ui/scroll-area'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '~/components/ui/select'

// Timeline Components
import ActivityTimelineItem from './ActivityTimelineItem.vue'
import ActivityFilters from './ActivityFilters.vue'
import ActivityExportDialog from './ActivityExportDialog.vue'

// Composables and Types
import { useActivityTimeline, useActivityRealTime } from '~/composables/useActivityTimeline'
import type { ActivityViewMode, ActivityFilters as Filters } from '~/types/activity'

interface Props {
  /** Matter ID for filtering activities */
  matterId: string
  /** Initial view mode */
  initialViewMode?: ActivityViewMode
  /** Enable real-time updates */
  enableRealTime?: boolean
  /** Show header with controls */
  showHeader?: boolean
  /** Maximum height for scrollable area */
  maxHeight?: string
  /** Enable export functionality */
  enableExport?: boolean
  /** Enable advanced filtering */
  enableFiltering?: boolean
  /** Number of activities to load per page */
  pageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialViewMode: 'detailed',
  enableRealTime: true,
  showHeader: true,
  maxHeight: '600px',
  enableExport: true,
  enableFiltering: true,
  pageSize: 20
})

// Composables
const {
  activities,
  groupedActivities,
  totalActivities,
  filters,
  viewMode,
  searchTerm,
  loading,
  error,
  hasNextPage,
  isFetchingNextPage,
  setTypeFilter,
  setActorFilter,
  setDateRangeFilter,
  clearFilters,
  setSearchTerm,
  setViewMode,
  loadMore,
  refresh,
  exportActivities
} = useActivityTimeline(props.matterId)

const { connect: connectRealTime, disconnect: disconnectRealTime } = useActivityRealTime(props.matterId)

// Local state
const showFilters = ref(false)
const showExportDialog = ref(false)
const searchInputRef = ref<HTMLInputElement>()
const timelineRef = ref<HTMLElement>()

// Computed properties
const displayedActivities = computed(() => {
  return viewMode.value === 'grouped' ? groupedActivities.value : activities.value
})

const hasActivities = computed(() => {
  return viewMode.value === 'grouped' 
    ? groupedActivities.value.length > 0
    : activities.value.length > 0
})

const isFilterActive = computed(() => {
  return !!(
    filters.value.types?.length ||
    filters.value.actors?.length ||
    filters.value.dateRange ||
    searchTerm.value
  )
})

// View mode options
const viewModeOptions = [
  { value: 'compact', label: 'Compact', icon: List },
  { value: 'detailed', label: 'Detailed', icon: Eye },
  { value: 'grouped', label: 'Grouped', icon: Calendar }
]

// Methods
const handleSearch = (value: string) => {
  setSearchTerm(value)
}

const handleViewModeChange = (mode: string) => {
  setViewMode(mode as ActivityViewMode)
}

const handleFilterChange = (newFilters: Filters) => {
  if (newFilters.types) setTypeFilter(newFilters.types)
  if (newFilters.actors) setActorFilter(newFilters.actors)
  if (newFilters.dateRange) setDateRangeFilter(newFilters.dateRange)
}

const handleClearFilters = () => {
  clearFilters()
  showFilters.value = false
}

const handleRefresh = () => {
  refresh()
}

const handleExport = () => {
  showExportDialog.value = true
}

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  const { scrollTop, scrollHeight, clientHeight } = target
  
  // Load more when user scrolls near bottom
  if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasNextPage.value && !isFetchingNextPage.value) {
    loadMore()
  }
}

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'f':
        event.preventDefault()
        searchInputRef.value?.focus()
        break
      case 'r':
        event.preventDefault()
        handleRefresh()
        break
      case 'e':
        if (props.enableExport) {
          event.preventDefault()
          handleExport()
        }
        break
    }
  }
}

// Lifecycle
onMounted(() => {
  // Set initial view mode
  setViewMode(props.initialViewMode)
  
  // Connect real-time updates if enabled
  if (props.enableRealTime) {
    connectRealTime()
  }
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // Disconnect real-time updates
  if (props.enableRealTime) {
    disconnectRealTime()
  }
  
  // Remove keyboard shortcuts
  document.removeEventListener('keydown', handleKeydown)
})

// Watch for view mode changes
watch(() => props.initialViewMode, (newMode) => {
  setViewMode(newMode)
})
</script>

<template>
  <div class="matter-activity-timeline">
    <!-- Header with controls -->
    <div v-if="showHeader" class="timeline-header">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <h3 class="text-lg font-semibold">Activity Timeline</h3>
          <Badge variant="secondary" class="text-xs">
            {{ totalActivities }} {{ totalActivities === 1 ? 'activity' : 'activities' }}
          </Badge>
        </div>
        
        <div class="flex items-center gap-2">
          <!-- View Mode Selector -->
          <Select :value="viewMode" @update:value="handleViewModeChange">
            <SelectTrigger class="w-32">
              <SelectValue placeholder="View mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem 
                v-for="option in viewModeOptions" 
                :key="option.value" 
                :value="option.value"
              >
                <div class="flex items-center gap-2">
                  <component :is="option.icon" class="w-4 h-4" />
                  {{ option.label }}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <!-- Filter Toggle -->
          <Button 
            v-if="enableFiltering"
            variant="outline" 
            size="sm"
            @click="showFilters = !showFilters"
            :class="{ 'bg-accent': isFilterActive }"
          >
            <Filter class="w-4 h-4 mr-2" />
            Filters
            <Badge v-if="isFilterActive" variant="destructive" class="ml-2 px-1 text-xs">
              !
            </Badge>
          </Button>
          
          <!-- Refresh Button -->
          <Button 
            variant="outline" 
            size="sm" 
            @click="handleRefresh"
            :disabled="loading"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          </Button>
          
          <!-- Export Button -->
          <Button 
            v-if="enableExport"
            variant="outline" 
            size="sm" 
            @click="handleExport"
          >
            <Download class="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <!-- Search Bar -->
      <div class="relative mb-4">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref="searchInputRef"
          :value="searchTerm"
          @update:value="handleSearch"
          placeholder="Search activities... (Ctrl+F)"
          class="pl-10"
        />
      </div>
      
      <!-- Filters Panel -->
      <div v-if="showFilters && enableFiltering" class="mb-4">
        <ActivityFilters
          :filters="filters"
          :matter-id="matterId"
          @update:filters="handleFilterChange"
          @clear="handleClearFilters"
        />
      </div>
    </div>
    
    <!-- Timeline Content -->
    <div class="timeline-content">
      <!-- Loading State -->
      <div v-if="loading && !hasActivities" class="space-y-4">
        <div v-for="i in 5" :key="i" class="flex gap-4">
          <Skeleton class="w-8 h-8 rounded-full flex-shrink-0" />
          <div class="flex-1 space-y-2">
            <Skeleton class="h-4 w-3/4" />
            <Skeleton class="h-3 w-1/2" />
          </div>
        </div>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="text-center py-8">
        <div class="text-muted-foreground mb-4">
          <Clock class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Failed to load activities</p>
          <p class="text-sm">{{ error }}</p>
        </div>
        <Button @click="handleRefresh" variant="outline">
          <RefreshCw class="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="!hasActivities" class="text-center py-8">
        <div class="text-muted-foreground">
          <Clock class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No activities found</p>
          <p v-if="isFilterActive" class="text-sm">
            Try adjusting your filters or search term
          </p>
        </div>
        <Button v-if="isFilterActive" @click="handleClearFilters" variant="outline" class="mt-4">
          Clear Filters
        </Button>
      </div>
      
      <!-- Timeline Items -->
      <ScrollArea 
        v-else
        ref="timelineRef"
        :class="maxHeight ? `max-h-[${maxHeight}]` : 'max-h-[600px]'"
        @scroll="handleScroll"
      >
        <div class="space-y-4 pr-4">
          <!-- Grouped View -->
          <template v-if="viewMode === 'grouped'">
            <div v-for="group in groupedActivities" :key="group.date" class="space-y-4">
              <!-- Date Header -->
              <div class="flex items-center gap-4 my-6">
                <div class="bg-muted px-3 py-1 rounded-full text-sm font-medium">
                  {{ new Date(group.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) }}
                </div>
                <div class="flex-1 h-px bg-border"></div>
                <Badge variant="outline" class="text-xs">
                  {{ group.totalCount }} {{ group.totalCount === 1 ? 'activity' : 'activities' }}
                </Badge>
              </div>
              
              <!-- Activities for this date -->
              <div class="space-y-4">
                <ActivityTimelineItem
                  v-for="activity in group.activities"
                  :key="activity.id"
                  :activity="activity"
                  :view-mode="viewMode"
                  :matter-id="matterId"
                />
              </div>
            </div>
          </template>
          
          <!-- List View (Compact/Detailed) -->
          <template v-else>
            <ActivityTimelineItem
              v-for="activity in activities"
              :key="activity.id"
              :activity="activity"
              :view-mode="viewMode"
              :matter-id="matterId"
            />
          </template>
          
          <!-- Load More Trigger -->
          <div v-if="hasNextPage" class="text-center py-4">
            <Button 
              @click="loadMore" 
              :disabled="isFetchingNextPage"
              variant="outline"
            >
              <RefreshCw v-if="isFetchingNextPage" class="w-4 h-4 mr-2 animate-spin" />
              {{ isFetchingNextPage ? 'Loading...' : 'Load More' }}
            </Button>
          </div>
          
          <!-- End of Timeline -->
          <div v-else-if="hasActivities" class="text-center py-4 text-muted-foreground text-sm">
            <div class="flex items-center justify-center gap-2">
              <div class="w-2 h-2 bg-muted-foreground rounded-full"></div>
              <span>You've reached the beginning</span>
              <div class="w-2 h-2 bg-muted-foreground rounded-full"></div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
    
    <!-- Export Dialog -->
    <ActivityExportDialog
      v-if="enableExport"
      v-model:open="showExportDialog"
      :matter-id="matterId"
      :filters="filters"
      :search-term="searchTerm"
      @export="exportActivities"
    />
  </div>
</template>

<style scoped>
.matter-activity-timeline {
  @apply w-full;
}

.timeline-header {
  @apply border-b border-border pb-4 mb-6;
}

.timeline-content {
  @apply relative;
}

/* Custom scrollbar for timeline */
.timeline-content :deep(.scroll-area-viewport) {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--muted-foreground)) transparent;
}

.timeline-content :deep(.scroll-area-viewport)::-webkit-scrollbar {
  width: 6px;
}

.timeline-content :deep(.scroll-area-viewport)::-webkit-scrollbar-track {
  background: transparent;
}

.timeline-content :deep(.scroll-area-viewport)::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground));
  border-radius: 3px;
}

.timeline-content :deep(.scroll-area-viewport)::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--foreground));
}

/* Mobile responsive adjustments */
@media (max-width: 640px) {
  .timeline-header {
    @apply space-y-4;
  }
  
  .timeline-header .flex {
    @apply flex-col items-start gap-2;
  }
  
  .timeline-header .flex:first-child {
    @apply w-full;
  }
  
  .timeline-header .flex:last-child {
    @apply w-full justify-end;
  }
}

/* Focus states for accessibility */
.timeline-content :focus-visible {
  @apply outline-2 outline-offset-2 outline-ring;
}

/* Animation for smooth scrolling */
.timeline-content {
  scroll-behavior: smooth;
}

/* Loading animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>