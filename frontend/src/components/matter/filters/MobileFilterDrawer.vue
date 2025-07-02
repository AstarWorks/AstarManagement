<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Switch } from '~/components/ui/switch'
import { Separator } from '~/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet'
import TextFilter from './TextFilter.vue'
import SelectFilter from './SelectFilter.vue'
import DateRangeFilter from './DateRangeFilter.vue'
import TagFilter from './TagFilter.vue'
import FilterPresetDialog from './FilterPresetDialog.vue'
import type { FilterConfig, FilterState, FilterValue, FilterPreset } from './FilterConfig'
import { useFilterPresets } from '~/composables/useFilterPresets'

interface Props {
  configs: FilterConfig[]
  modelValue?: FilterState
  loading?: boolean
  open?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  open: false
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:modelValue': [value: FilterState]
  'preset:apply': [preset: FilterPreset]
  'export': [format: 'csv' | 'excel']
}>()

// Mobile-specific state
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const quickSearch = ref('')
const activeFilters = ref<Record<string, any>>({})
const expandedSections = ref<Set<string>>(new Set(['search', 'presets']))
const lastTouchY = ref(0)
const isDragging = ref(false)

// Use preset composable
const {
  allPresets,
  applyPreset: applyPresetFromComposable
} = useFilterPresets()

// Preset dialog state
const isPresetDialogOpen = ref(false)
const presetDialogMode = ref<'create' | 'manage'>('create')

// Touch gesture handling
const touchThreshold = 50 // pixels to swipe to close

// Initialize from model value
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    quickSearch.value = newValue.quickSearch || ''
    const filtersRecord: Record<string, any> = {}
    newValue.filters.forEach(filter => {
      filtersRecord[filter.field] = filter.value
    })
    activeFilters.value = filtersRecord
  }
}, { immediate: true })

// Compute current filter state
const currentFilterState = computed<FilterState>(() => {
  const filters: FilterValue[] = []
  
  if (quickSearch.value.trim()) {
    filters.push({
      field: 'quickSearch',
      operator: 'contains',
      value: quickSearch.value.trim()
    })
  }
  
  Object.entries(activeFilters.value).forEach(([field, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const config = props.configs.find(c => c.field === field)
      if (config) {
        filters.push({
          field,
          operator: getDefaultOperatorForType(config.type),
          value
        })
      }
    }
  })
  
  return {
    filters,
    quickSearch: quickSearch.value,
    activePreset: props.modelValue?.activePreset,
    sortBy: props.modelValue?.sortBy || 'createdAt',
    sortDirection: props.modelValue?.sortDirection || 'desc'
  }
})

// Active filter count
const activeFilterCount = computed(() => currentFilterState.value.filters.length)

// Group configs by category for mobile organization
const filterGroups = computed(() => {
  const groups = [
    {
      id: 'search',
      title: 'Search',
      icon: 'lucide:search',
      configs: props.configs.filter(c => c.type === 'text')
    },
    {
      id: 'status',
      title: 'Status & Priority',
      icon: 'lucide:flag',
      configs: props.configs.filter(c => ['status', 'priority'].includes(c.field))
    },
    {
      id: 'people',
      title: 'People',
      icon: 'lucide:users',
      configs: props.configs.filter(c => ['assignedLawyer', 'assignedClerk', 'clientName', 'opponentName'].includes(c.field))
    },
    {
      id: 'dates',
      title: 'Dates',
      icon: 'lucide:calendar',
      configs: props.configs.filter(c => c.type === 'daterange' || c.type === 'date')
    },
    {
      id: 'tags',
      title: 'Tags',
      icon: 'lucide:tag',
      configs: props.configs.filter(c => c.type === 'tags')
    }
  ].filter(group => group.configs.length > 0)
  
  return groups
})

// Emit changes
watch(currentFilterState, (newState) => {
  emit('update:modelValue', newState)
}, { deep: true })

// Filter manipulation methods
const updateFilter = (field: string, value: any) => {
  if (value === undefined || value === null || value === '') {
    delete activeFilters.value[field]
  } else {
    activeFilters.value[field] = value
  }
}

const clearFilter = (field: string) => {
  delete activeFilters.value[field]
}

const clearAllFilters = () => {
  quickSearch.value = ''
  activeFilters.value = {}
}

const applyPreset = async (preset: FilterPreset) => {
  const filterState = await applyPresetFromComposable(preset.id)
  if (filterState) {
    clearAllFilters()
    preset.filters.forEach(filter => {
      activeFilters.value[filter.field] = filter.value
    })
    emit('preset:apply', preset)
  }
}

// Section expansion
const toggleSection = (sectionId: string) => {
  if (expandedSections.value.has(sectionId)) {
    expandedSections.value.delete(sectionId)
  } else {
    expandedSections.value.add(sectionId)
  }
}

// Touch gesture handlers
const handleTouchStart = (event: TouchEvent) => {
  lastTouchY.value = event.touches[0].clientY
  isDragging.value = false
}

const handleTouchMove = (event: TouchEvent) => {
  if (!isDragging.value) {
    const currentY = event.touches[0].clientY
    const deltaY = currentY - lastTouchY.value
    
    if (deltaY > 10) {
      isDragging.value = true
    }
  }
}

const handleTouchEnd = (event: TouchEvent) => {
  if (isDragging.value) {
    const endY = event.changedTouches[0].clientY
    const deltaY = endY - lastTouchY.value
    
    if (deltaY > touchThreshold) {
      isOpen.value = false
    }
  }
  isDragging.value = false
}

// Preset dialog handlers
const openCreatePresetDialog = () => {
  presetDialogMode.value = 'create'
  isPresetDialogOpen.value = true
}

const openManagePresetsDialog = () => {
  presetDialogMode.value = 'manage'
  isPresetDialogOpen.value = true
}

// Helper function
const getDefaultOperatorForType = (type: FilterConfig['type']) => {
  switch (type) {
    case 'text': return 'contains'
    case 'select':
    case 'multiselect': return 'in'
    case 'date':
    case 'daterange': return 'between'
    case 'tags': return 'in'
    default: return 'equals'
  }
}
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetTrigger as-child>
      <Button variant="outline" size="sm" class="lg:hidden">
        <Icon name="lucide:filter" class="mr-2 h-4 w-4" />
        Filters
        <Badge v-if="activeFilterCount > 0" variant="secondary" class="ml-2 h-5 min-w-5 text-xs">
          {{ activeFilterCount }}
        </Badge>
      </Button>
    </SheetTrigger>
    
    <SheetContent 
      side="bottom" 
      class="h-[90vh] overflow-hidden flex flex-col p-0"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- Drag Handle -->
      <div class="flex justify-center py-3 bg-background border-b">
        <div class="w-12 h-1 bg-muted-foreground/30 rounded-full"></div>
      </div>
      
      <SheetHeader class="px-6 py-4 border-b">
        <div class="flex items-center justify-between">
          <SheetTitle class="text-lg font-semibold">
            Filters
            <span v-if="activeFilterCount > 0" class="text-muted-foreground ml-2">
              ({{ activeFilterCount }} active)
            </span>
          </SheetTitle>
          
          <div class="flex space-x-2">
            <Button
              v-if="activeFilterCount > 0"
              variant="ghost"
              size="sm"
              @click="clearAllFilters"
              class="text-destructive hover:text-destructive"
            >
              Clear All
            </Button>
            <Button variant="ghost" size="sm" @click="isOpen = false">
              <Icon name="lucide:x" class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetHeader>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto">
        <!-- Quick Search -->
        <div class="p-6 border-b">
          <div class="space-y-3">
            <h3 class="font-medium text-sm text-muted-foreground">QUICK SEARCH</h3>
            <TextFilter
              :config="{
                field: 'quickSearch',
                type: 'text',
                label: '',
                placeholder: 'Search matters...',
                clearable: true
              }"
              v-model="quickSearch"
              :disabled="loading"
              class="touch-optimized"
            />
          </div>
        </div>

        <!-- Presets -->
        <div class="p-6 border-b">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-medium text-sm text-muted-foreground">PRESETS</h3>
              <Button variant="ghost" size="sm" @click="openManagePresetsDialog">
                <Icon name="lucide:settings" class="h-4 w-4" />
              </Button>
            </div>
            
            <div class="grid grid-cols-1 gap-2">
              <Button
                v-for="preset in allPresets.slice(0, 4)"
                :key="preset.id"
                variant="outline"
                size="sm"
                @click="applyPreset(preset)"
                class="justify-start h-auto p-3 touch-target"
              >
                <div class="flex flex-col items-start w-full">
                  <div class="flex items-center justify-between w-full">
                    <span class="font-medium">{{ preset.name }}</span>
                    <Badge v-if="preset.isSystem" variant="outline" class="text-xs">
                      System
                    </Badge>
                  </div>
                  <span class="text-xs text-muted-foreground mt-1">
                    {{ preset.filters.length }} filter{{ preset.filters.length === 1 ? '' : 's' }}
                  </span>
                </div>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                @click="openCreatePresetDialog"
                :disabled="activeFilterCount === 0"
                class="justify-start h-auto p-3 touch-target"
              >
                <Icon name="lucide:save" class="mr-2 h-4 w-4" />
                Save Current Filters
              </Button>
            </div>
          </div>
        </div>

        <!-- Filter Groups -->
        <div v-for="group in filterGroups" :key="group.id" class="border-b">
          <button
            @click="toggleSection(group.id)"
            class="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 touch-target"
          >
            <div class="flex items-center space-x-3">
              <Icon :name="group.icon" class="h-4 w-4 text-muted-foreground" />
              <h3 class="font-medium text-sm text-muted-foreground uppercase">{{ group.title }}</h3>
            </div>
            <Icon 
              :name="expandedSections.has(group.id) ? 'lucide:chevron-up' : 'lucide:chevron-down'" 
              class="h-4 w-4 text-muted-foreground" 
            />
          </button>
          
          <div 
            v-if="expandedSections.has(group.id)" 
            class="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200"
          >
            <div v-for="config in group.configs" :key="config.field" class="space-y-2">
              <label class="text-sm font-medium">{{ config.label }}</label>
              
              <!-- Text filter -->
              <TextFilter
                v-if="config.type === 'text'"
                :config="config"
                :model-value="activeFilters[config.field]"
                :disabled="loading"
                @update:model-value="updateFilter(config.field, $event)"
                @clear="clearFilter(config.field)"
                class="touch-optimized"
              />
              
              <!-- Select/Multi-select filter -->
              <SelectFilter
                v-else-if="config.type === 'select' || config.type === 'multiselect'"
                :config="config"
                :model-value="activeFilters[config.field]"
                :disabled="loading"
                @update:model-value="updateFilter(config.field, $event)"
                @clear="clearFilter(config.field)"
                class="touch-optimized"
              />
              
              <!-- Date range filter -->
              <DateRangeFilter
                v-else-if="config.type === 'daterange'"
                :config="config"
                :model-value="activeFilters[config.field]"
                :disabled="loading"
                @update:model-value="updateFilter(config.field, $event)"
                @clear="clearFilter(config.field)"
                class="touch-optimized"
              />
              
              <!-- Tags filter -->
              <TagFilter
                v-else-if="config.type === 'tags'"
                :config="config"
                :model-value="activeFilters[config.field]"
                :disabled="loading"
                @update:model-value="updateFilter(config.field, $event)"
                @clear="clearFilter(config.field)"
                class="touch-optimized"
              />
            </div>
          </div>
        </div>

        <!-- Export Options -->
        <div class="p-6">
          <div class="space-y-3">
            <h3 class="font-medium text-sm text-muted-foreground">EXPORT</h3>
            <div class="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" @click="$emit('export', 'csv')" class="touch-target">
                <Icon name="lucide:file-text" class="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" @click="$emit('export', 'excel')" class="touch-target">
                <Icon name="lucide:file-spreadsheet" class="mr-2 h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div v-if="loading" class="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
        <div class="flex flex-col items-center space-y-2">
          <Icon name="lucide:loader-2" class="h-6 w-6 animate-spin text-muted-foreground" />
          <p class="text-sm text-muted-foreground">Applying filters...</p>
        </div>
      </div>
    </SheetContent>
  </Sheet>

  <!-- Preset Management Dialog -->
  <FilterPresetDialog
    v-model:open="isPresetDialogOpen"
    :mode="presetDialogMode"
    :filters="currentFilterState.filters"
    @preset:created="applyPreset"
    @preset:applied="applyPreset"
  />
</template>

<style scoped>
/* Touch-optimized styles */
.touch-target {
  @apply min-h-[44px] min-w-[44px]; /* iOS touch target guidelines */
}

.touch-optimized {
  @apply text-base; /* Prevent zoom on iOS */
}

/* Enhanced scrolling */
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* Smooth animations */
.animate-in {
  animation-fill-mode: both;
}

@keyframes slide-in-from-top-2 {
  from {
    transform: translateY(-0.5rem);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Custom scrollbar for mobile */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 2px;
}
</style>