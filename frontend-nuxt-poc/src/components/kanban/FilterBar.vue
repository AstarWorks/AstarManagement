<template>
  <div class="filter-bar bg-card border-b border-border">
    <!-- Mobile Header -->
    <div class="flex items-center justify-between p-4 lg:hidden">
      <div class="flex items-center gap-2">
        <Filter class="w-4 h-4 text-muted-foreground" />
        <span class="text-sm font-medium">Filters</span>
        <Badge v-if="filterStats.activeFiltersCount > 0" variant="secondary" class="text-xs">
          {{ filterStats.activeFiltersCount }}
        </Badge>
      </div>
      <Button
        variant="ghost"
        size="sm"
        @click="isCollapsed = !isCollapsed"
        class="p-1"
      >
        <ChevronDown v-if="isCollapsed" class="w-4 h-4" />
        <ChevronUp v-else class="w-4 h-4" />
      </Button>
    </div>

    <!-- Filter Content with Vue 3 Transitions -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div 
        v-show="!isCollapsed || !isMobile"
        class="p-4 space-y-4 lg:space-y-0 lg:flex lg:items-start lg:gap-4"
      >
        <!-- Advanced Search Section -->
        <div class="flex-1 space-y-3 lg:max-w-md">
          <!-- Search Input with Suggestions -->
          <div class="relative">
            <div class="relative">
              <Search class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                ref="searchInputRef"
                v-model="searchQuery"
                type="search"
                placeholder="Search matters... (try 'client:Name' or 'case:123')"
                class="w-full pl-9 pr-20"
                @focus="handleSearchFocus"
                @blur="handleSearchBlur"
                @keydown="handleSearchKeydown"
              />
              
              <!-- Search Mode Toggle -->
              <div class="absolute right-2 top-2 flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        class="h-6 w-6 p-0"
                        @click="cycleSearchMode"
                      >
                        <component :is="searchModeIcon" class="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{{ searchModeTooltip }}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <!-- Search Suggestions Dropdown -->
            <Transition
              enter-active-class="transition-all duration-150 ease-out"
              enter-from-class="opacity-0 scale-95 -translate-y-1"
              enter-to-class="opacity-100 scale-100 translate-y-0"
              leave-active-class="transition-all duration-100 ease-in"
              leave-from-class="opacity-100 scale-100 translate-y-0"
              leave-to-class="opacity-0 scale-95 -translate-y-1"
            >
              <div
                v-if="showSuggestions && suggestions.length > 0"
                class="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                <div class="p-2">
                  <div class="text-xs text-muted-foreground mb-2">Suggestions</div>
                  <div 
                    v-for="(suggestion, index) in suggestions"
                    :key="suggestion.id"
                    class="flex items-center justify-between px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-accent"
                    :class="{
                      'bg-accent': index === selectedSuggestionIndex
                    }"
                    @click="selectSuggestion(suggestion)"
                  >
                    <div class="flex items-center gap-2">
                      <component :is="getSuggestionIcon(suggestion.type)" class="w-3 h-3 text-muted-foreground" />
                      <span>{{ suggestion.value }}</span>
                    </div>
                    <Badge variant="secondary" class="text-xs">{{ suggestion.count }}</Badge>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Search Help -->
          <div v-if="isFieldSearch && searchQuery.length > 0" class="text-xs text-muted-foreground">
            <p>Field search examples: case:123, client:"John Doe", lawyer:Smith, status:active</p>
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="space-y-4 lg:space-y-0 lg:flex lg:items-start lg:gap-4 lg:flex-wrap">
          <!-- Lawyer Multi-Select -->
          <div class="space-y-2">
            <Label class="text-sm font-medium">Assigned Lawyers</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  class="w-48 justify-between"
                >
                  <span class="truncate">
                    {{ selectedLawyers.length === 0 ? 'All Lawyers' : 
                       selectedLawyers.length === 1 ? selectedLawyers[0] : 
                       `${selectedLawyers.length} selected` }}
                  </span>
                  <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-48 p-0">
                <div class="max-h-60 overflow-y-auto">
                  <div class="p-2">
                    <div 
                      v-for="lawyer in availableLawyers" 
                      :key="lawyer.id"
                      class="flex items-center space-x-2 p-1 hover:bg-accent rounded"
                    >
                      <Checkbox
                        :id="`lawyer-${lawyer.id}`"
                        :checked="selectedLawyers.includes(lawyer.id)"
                        @update:checked="(checked: boolean) => toggleLawyer(lawyer.id, checked)"
                      />
                      <Label 
                        :for="`lawyer-${lawyer.id}`" 
                        class="text-sm cursor-pointer flex-1 flex items-center justify-between"
                      >
                        <span>{{ lawyer.name }}</span>
                        <Badge v-if="lawyer.caseCount" variant="secondary" class="text-xs">
                          {{ lawyer.caseCount }}
                        </Badge>
                      </Label>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <!-- Priority Multi-Select -->
          <div class="space-y-2">
            <Label class="text-sm font-medium">Priority Levels</Label>
            <div class="grid grid-cols-2 gap-2">
              <div 
                v-for="priority in priorityOptions" 
                :key="priority.value"
                class="flex items-center space-x-2"
              >
                <Checkbox
                  :id="`priority-${priority.value}`"
                  :checked="selectedPriorities.includes(priority.value)"
                  @update:checked="(checked: boolean) => togglePriority(priority.value, checked)"
                />
                <Label 
                  :for="`priority-${priority.value}`" 
                  class="text-sm cursor-pointer flex items-center gap-1"
                >
                  <div 
                    class="w-2 h-2 rounded-full" 
                    :class="priority.colorClass"
                  />
                  {{ priority.label }}
                </Label>
              </div>
            </div>
          </div>

          <!-- Status Multi-Select -->
          <div class="space-y-2">
            <Label class="text-sm font-medium">Status</Label>
            <div class="grid grid-cols-2 gap-2">
              <div 
                v-for="status in statusOptions" 
                :key="status.value"
                class="flex items-center space-x-2"
              >
                <Checkbox
                  :id="`status-${status.value}`"
                  :checked="selectedStatuses.includes(status.value)"
                  @update:checked="(checked: boolean) => toggleStatus(status.value, checked)"
                />
                <Label 
                  :for="`status-${status.value}`" 
                  class="text-sm cursor-pointer"
                >
                  {{ status.label }}
                </Label>
              </div>
            </div>
          </div>

          <!-- Additional Options -->
          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <Checkbox
                id="show-closed"
                :checked="showClosed"
                @update:checked="(checked: boolean) => updateFilters({ showClosed: checked })"
              />
              <Label for="show-closed" class="text-sm cursor-pointer">
                Show Closed/Archived
              </Label>
            </div>
          </div>
        </div>

        <!-- Filter Actions -->
        <div class="flex items-center gap-2 lg:ml-auto">
          <!-- Filter Statistics -->
          <div class="text-xs text-muted-foreground hidden sm:block">
            {{ filterStats.filteredCount }} of {{ filterStats.totalMatters }}
          </div>

          <!-- Quick Actions -->
          <div class="flex items-center gap-1">
            <!-- Undo/Redo -->
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-8 w-8 p-0"
                    :disabled="!canUndo"
                    @click="undoFilter"
                  >
                    <Undo2 class="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Undo filter change</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-8 w-8 p-0"
                    :disabled="!canRedo"
                    @click="redoFilter"
                  >
                    <Redo2 class="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Redo filter change</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <!-- Clear Filters -->
            <Button
              v-if="filterStats.activeFiltersCount > 0"
              variant="outline"
              size="sm"
              @click="clearAllFilters"
              class="text-xs"
            >
              Clear All
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { watchDebounced, useWindowSize, onClickOutside } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  ChevronsUpDown,
  FileText,
  User,
  Users,
  Tag,
  Target,
  Type,
  Zap,
  Undo2,
  Redo2
} from 'lucide-vue-next'

// UI Components
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Label } from '~/components/ui/label'
import { Checkbox } from '~/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'

// Composables
import { useAdvancedSearch } from '~/composables/useAdvancedSearch'
import { useFilterPersistence } from '~/composables/useFilterPersistence'

// Types
import type { FilterState, Priority, MatterStatus, SearchSuggestion, Matter } from '~/types/matter'

interface Props {
  className?: string
  initialFilters?: Partial<FilterState>
  showAdvancedSearch?: boolean
  maxSuggestions?: number
  persistenceKey?: string
  matters?: Matter[]
}

const props = withDefaults(defineProps<Props>(), {
  className: '',
  initialFilters: () => ({}),
  showAdvancedSearch: true,
  maxSuggestions: 10,
  persistenceKey: 'kanban-filters',
  matters: () => []
})

const emit = defineEmits<{
  filtersChanged: [filters: FilterState]
  searchPerformed: [query: string]
  suggestionSelected: [suggestion: SearchSuggestion]
}>()

// Store integration
const kanbanStore = useKanbanStore()
const { filteredMatters, isLoading } = storeToRefs(kanbanStore)

// Composables
const {
  searchQuery,
  suggestions,
  isSearching,
  searchMode,
  showSuggestions,
  selectedSuggestionIndex,
  performSearch,
  selectSuggestion,
  hideSuggestions,
  clearSearch,
  setSearchMode,
  isFieldSearch,
  isExactSearch,
  isFuzzySearch
} = useAdvancedSearch()

const {
  currentFilters,
  canUndo,
  canRedo,
  updateFilters,
  clearFilters,
  undoFilter,
  redoFilter,
  toggleLawyer: persistenceToggleLawyer,
  togglePriority: persistenceTogglePriority,
  toggleStatus: persistenceToggleStatus
} = useFilterPersistence(props.persistenceKey)

// Responsive design
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 1024)
const isCollapsed = ref(false)

// Search input reference
const searchInputRef = ref<HTMLInputElement>()

// Local reactive state
const selectedLawyers = computed(() => currentFilters.value.selectedLawyers)
const selectedPriorities = computed(() => currentFilters.value.selectedPriorities)
const selectedStatuses = computed(() => currentFilters.value.selectedStatuses)
const showClosed = computed(() => currentFilters.value.showClosed)

// Priority options with visual indicators
const priorityOptions = [
  { value: 'low' as Priority, label: 'Low', colorClass: 'bg-green-500' },
  { value: 'medium' as Priority, label: 'Medium', colorClass: 'bg-yellow-500' },
  { value: 'high' as Priority, label: 'High', colorClass: 'bg-orange-500' },
  { value: 'urgent' as Priority, label: 'Urgent', colorClass: 'bg-red-500' }
]

// Status options
const statusOptions = [
  { value: 'new' as MatterStatus, label: 'New' },
  { value: 'in_progress' as MatterStatus, label: 'In Progress' },
  { value: 'review' as MatterStatus, label: 'Review' },
  { value: 'waiting' as MatterStatus, label: 'Waiting' },
  { value: 'completed' as MatterStatus, label: 'Completed' },
  { value: 'archived' as MatterStatus, label: 'Archived' },
  { value: 'cancelled' as MatterStatus, label: 'Cancelled' }
]

// Computed available lawyers with case counts
const availableLawyers = computed(() => {
  const lawyerMap = new Map<string, { id: string; name: string; caseCount: number }>()
  
  props.matters.forEach(matter => {
    if (matter.assignedLawyer) {
      const existing = lawyerMap.get(matter.assignedLawyer)
      if (existing) {
        existing.caseCount++
      } else {
        lawyerMap.set(matter.assignedLawyer, {
          id: matter.assignedLawyer,
          name: matter.assignedLawyer,
          caseCount: 1
        })
      }
    }
  })
  
  return Array.from(lawyerMap.values()).sort((a, b) => a.name.localeCompare(b.name))
})

// Filter statistics
const filterStats = computed(() => ({
  totalMatters: props.matters.length,
  filteredCount: filteredMatters.value.length,
  activeFiltersCount: [
    currentFilters.value.searchQuery ? 1 : 0,
    currentFilters.value.selectedLawyers.length > 0 ? 1 : 0,
    currentFilters.value.selectedPriorities.length > 0 ? 1 : 0,
    currentFilters.value.selectedStatuses.length > 0 ? 1 : 0,
    !currentFilters.value.showClosed ? 1 : 0
  ].reduce((sum, active) => sum + active, 0)
}))

// Search mode UI helpers
const searchModeIcon = computed(() => {
  switch (searchMode.value) {
    case 'exact': return Target
    case 'field': return Type
    default: return Zap
  }
})

const searchModeTooltip = computed(() => {
  switch (searchMode.value) {
    case 'exact': return 'Exact search mode - use quotes for exact matches'
    case 'field': return 'Field search mode - use field:value syntax'
    default: return 'Fuzzy search mode - matches partial text'
  }
})

// Search suggestion icon helper
const getSuggestionIcon = (type: SearchSuggestion['type']) => {
  switch (type) {
    case 'case': return FileText
    case 'client': return User
    case 'lawyer': return Users
    case 'tag': return Tag
    default: return Search
  }
}

// Auto-collapse on mobile
watch(isMobile, (mobile) => {
  if (mobile && filterStats.value.activeFiltersCount === 0) {
    isCollapsed.value = true
  } else if (!mobile) {
    isCollapsed.value = false
  }
})

// Watch search query and sync with internal state
watchDebounced(
  searchQuery,
  (query) => {
    updateFilters({ searchQuery: query })
    if (query.trim().length >= 2) {
      performSearch(query, props.matters)
      emit('searchPerformed', query)
    }
  },
  { debounce: 300 }
)

// Watch filters and emit changes
watch(
  currentFilters,
  (filters) => {
    emit('filtersChanged', filters)
  },
  { deep: true, immediate: true }
)

// Click outside handler for suggestions
onClickOutside(searchInputRef, () => {
  hideSuggestions()
})

// Multi-select toggle functions
const toggleLawyer = (lawyerId: string, checked: boolean) => {
  persistenceToggleLawyer(lawyerId)
}

const togglePriority = (priority: Priority, checked: boolean) => {
  persistenceTogglePriority(priority)
}

const toggleStatus = (status: MatterStatus, checked: boolean) => {
  persistenceToggleStatus(status)
}

// Search mode cycling
const cycleSearchMode = () => {
  const modes: Array<'fuzzy' | 'exact' | 'field'> = ['fuzzy', 'exact', 'field']
  const currentIndex = modes.indexOf(searchMode.value)
  const nextIndex = (currentIndex + 1) % modes.length
  setSearchMode(modes[nextIndex])
  updateFilters({ searchMode: modes[nextIndex] })
}

// Search event handlers
const handleSearchFocus = () => {
  if (suggestions.value.length > 0) {
    showSuggestions.value = true
  }
}

const handleSearchBlur = () => {
  // Delay hiding to allow for suggestion clicks
  setTimeout(() => {
    hideSuggestions()
  }, 200)
}

const handleSearchKeydown = (event: KeyboardEvent) => {
  // Keyboard navigation is handled by useMagicKeys in the composable
  // This is just for additional handling if needed
  if (event.key === 'Escape') {
    searchInputRef.value?.blur()
  }
}

// Clear all filters
const clearAllFilters = () => {
  clearFilters()
  clearSearch()
}

// Initialize filters
onMounted(() => {
  if (Object.keys(props.initialFilters).length > 0) {
    updateFilters(props.initialFilters)
  }
  
  // Initialize search query from current filters
  searchQuery.value = currentFilters.value.searchQuery
})
</script>

<style scoped>
.filter-bar {
  background: hsl(var(--card));
  border-bottom: 1px solid hsl(var(--border));
}

/* Custom scrollbar for suggestion dropdown */
.max-h-60::-webkit-scrollbar {
  width: 6px;
}

.max-h-60::-webkit-scrollbar-track {
  background: hsl(var(--muted));
  border-radius: 3px;
}

.max-h-60::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 3px;
}

.max-h-60::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}
</style>