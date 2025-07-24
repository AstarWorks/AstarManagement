<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '~/components/ui/dropdown-menu'
import TextFilter from './TextFilter.vue'
import SelectFilter from './SelectFilter.vue'
import DateRangeFilter from './DateRangeFilter.vue'
import TagFilter from './TagFilter.vue'
import FilterPresetDialog from './FilterPresetDialog.vue'
import type { 
  FilterConfig, 
  FilterValue, 
  FilterState, 
  FilterPreset
} from './FilterConfig'
import { useFilterPresets } from '~/composables/useFilterPresets'

interface Props {
  configs: FilterConfig[]
  presets?: FilterPreset[]
  modelValue?: FilterState
  loading?: boolean
  collapsible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  presets: () => [],
  loading: false,
  collapsible: true
})

// Use the new preset composable
const {
  allPresets,
  applyPreset: applyPresetFromComposable,
  error: presetError
} = useFilterPresets()

const emit = defineEmits<{
  'update:modelValue': [value: FilterState]
  'preset:apply': [preset: FilterPreset]
  'preset:save': [name: string, filters: FilterValue[]]
  'preset:delete': [presetId: string]
  'export': [format: 'csv' | 'excel']
}>()

const isExpanded = ref(true)
const quickSearch = ref('')
const activeFilters = ref<Record<string, any>>({})

// Preset dialog state
const isPresetDialogOpen = ref(false)
const presetDialogMode = ref<'create' | 'edit' | 'manage'>('create')
const selectedPresetForEdit = ref<FilterPreset | undefined>(undefined)

// Initialize from model value
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    quickSearch.value = newValue.quickSearch || ''
    // Convert FilterValue array to Record for easier manipulation
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
  
  // Add quick search as a filter
  if (quickSearch.value.trim()) {
    filters.push({
      field: 'quickSearch',
      operator: 'contains',
      value: quickSearch.value.trim()
    })
  }
  
  // Add active filters
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
    sortBy: props.modelValue?.sortBy,
    sortDirection: props.modelValue?.sortDirection
  }
})

// Emit changes
watch(currentFilterState, (newState) => {
  emit('update:modelValue', newState)
}, { deep: true })

// Active filter count
const activeFilterCount = computed(() => {
  return currentFilterState.value.filters.length
})

// Visible filter configs
const visibleConfigs = computed(() => {
  if (isExpanded.value) {
    return props.configs
  }
  // Show only configs with active values when collapsed
  return props.configs.filter(config => 
    activeFilters.value[config.field] !== undefined
  )
})

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
    // Clear current filters
    clearAllFilters()
    
    // Apply preset filters
    preset.filters.forEach(filter => {
      activeFilters.value[filter.field] = filter.value
    })
    
    emit('preset:apply', preset)
  }
}

// Preset dialog handlers
const openCreatePresetDialog = () => {
  presetDialogMode.value = 'create'
  selectedPresetForEdit.value = undefined
  isPresetDialogOpen.value = true
}

const openManagePresetsDialog = () => {
  presetDialogMode.value = 'manage'
  selectedPresetForEdit.value = undefined
  isPresetDialogOpen.value = true
}

const openEditPresetDialog = (preset: FilterPreset) => {
  presetDialogMode.value = 'edit'
  selectedPresetForEdit.value = preset
  isPresetDialogOpen.value = true
}

const handlePresetCreated = (preset: FilterPreset) => {
  emit('preset:apply', preset)
}

const handlePresetUpdated = (preset: FilterPreset) => {
  // Optionally refresh the preset list or emit an event
}

const handlePresetDeleted = (presetId: string) => {
  emit('preset:delete', presetId)
}

const handlePresetApplied = (preset: FilterPreset) => {
  applyPreset(preset)
}

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

// Helper function (needs to be imported from FilterConfig)
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
  <div class="filter-bar bg-card border rounded-lg p-4 space-y-4">
    <!-- Header with quick search and controls -->
    <div class="flex items-center gap-4">
      <!-- Quick search -->
      <div class="flex-1 max-w-md">
        <TextFilter
          :config="{
            field: 'quickSearch',
            type: 'text',
            label: 'Quick Search',
            placeholder: 'Search matters...',
            clearable: true
          }"
          v-model="quickSearch"
          :disabled="loading"
        />
      </div>
      
      <!-- Filter presets dropdown -->
      <DropdownMenu v-if="allPresets.length > 0">
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm">
            <Icon name="lucide:filter" class="mr-2 h-4 w-4" />
            Presets
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-56">
          <DropdownMenuItem
            v-for="preset in allPresets.slice(0, 8)"
            :key="preset.id"
            @click="applyPreset(preset)"
            class="cursor-pointer"
          >
            <div class="flex flex-col w-full">
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ preset.name }}</span>
                <Badge v-if="preset.isSystem" variant="outline" class="text-xs ml-2">
                  System
                </Badge>
              </div>
              <span v-if="preset.description" class="text-xs text-muted-foreground">
                {{ preset.description }}
              </span>
              <span class="text-xs text-muted-foreground">
                {{ preset.filters.length }} filter{{ preset.filters.length === 1 ? '' : 's' }}
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem @click="openCreatePresetDialog" class="cursor-pointer">
            <Icon name="lucide:save" class="mr-2 h-4 w-4" />
            Save Current Filters
          </DropdownMenuItem>
          
          <DropdownMenuItem @click="openManagePresetsDialog" class="cursor-pointer">
            <Icon name="lucide:settings" class="mr-2 h-4 w-4" />
            Manage Presets
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            v-if="allPresets.length > 8" 
            @click="openManagePresetsDialog" 
            class="cursor-pointer text-muted-foreground"
          >
            <Icon name="lucide:more-horizontal" class="mr-2 h-4 w-4" />
            View All ({{ allPresets.length }})
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <!-- Export dropdown -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm">
            <Icon name="lucide:download" class="mr-2 h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem @click="$emit('export', 'csv')">
            <Icon name="lucide:file-text" class="mr-2 h-4 w-4" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem @click="$emit('export', 'excel')">
            <Icon name="lucide:file-spreadsheet" class="mr-2 h-4 w-4" />
            Export as Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <!-- Expand/collapse toggle -->
      <Button
        v-if="collapsible"
        variant="ghost"
        size="sm"
        @click="toggleExpanded"
      >
        <Icon 
          :name="isExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'" 
          class="h-4 w-4" 
        />
        <span class="sr-only">{{ isExpanded ? 'Collapse' : 'Expand' }} filters</span>
      </Button>
      
      <!-- Clear all button -->
      <Button
        v-if="activeFilterCount > 0"
        variant="ghost"
        size="sm"
        @click="clearAllFilters"
      >
        <Icon name="lucide:x" class="mr-2 h-4 w-4" />
        Clear All
      </Button>
    </div>
    
    <!-- Active filter badges -->
    <div v-if="activeFilterCount > 0" class="flex flex-wrap gap-2">
      <Badge
        v-for="filter in currentFilterState.filters"
        :key="`${filter.field}-${filter.operator}`"
        variant="secondary"
        class="gap-1"
      >
        <span class="text-xs">
          {{ configs.find(c => c.field === filter.field)?.label || filter.field }}:
          {{ Array.isArray(filter.value) ? filter.value.join(', ') : String(filter.value) }}
        </span>
        <Button
          variant="ghost"
          size="sm"
          class="h-auto p-0 ml-1 hover:bg-transparent"
          @click="clearFilter(filter.field)"
        >
          <Icon name="lucide:x" class="h-3 w-3" />
        </Button>
      </Badge>
    </div>
    
    <!-- Filter controls -->
    <div 
      v-if="isExpanded && visibleConfigs.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <div
        v-for="config in visibleConfigs"
        :key="config.field"
        class="space-y-2"
      >
        <label class="text-sm font-medium">{{ config.label }}</label>
        
        <!-- Text filter -->
        <TextFilter
          v-if="config.type === 'text'"
          :config="config"
          :model-value="activeFilters[config.field]"
          :disabled="loading"
          @update:model-value="updateFilter(config.field, $event)"
          @clear="clearFilter(config.field)"
        />
        
        <!-- Select/Multi-select filter -->
        <SelectFilter
          v-else-if="config.type === 'select' || config.type === 'multiselect'"
          :config="config"
          :model-value="activeFilters[config.field]"
          :disabled="loading"
          @update:model-value="updateFilter(config.field, $event)"
          @clear="clearFilter(config.field)"
        />
        
        <!-- Date range filter -->
        <DateRangeFilter
          v-else-if="config.type === 'daterange'"
          :config="config"
          :model-value="activeFilters[config.field]"
          :disabled="loading"
          @update:model-value="updateFilter(config.field, $event)"
          @clear="clearFilter(config.field)"
        />
        
        <!-- Tags filter -->
        <TagFilter
          v-else-if="config.type === 'tags'"
          :config="config"
          :model-value="activeFilters[config.field]"
          :disabled="loading"
          @update:model-value="updateFilter(config.field, $event)"
          @clear="clearFilter(config.field)"
        />
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="text-center py-4">
      <Icon name="lucide:loader-2" class="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
      <p class="text-sm text-muted-foreground mt-2">Applying filters...</p>
    </div>
  </div>

  <!-- Preset Management Dialog -->
  <FilterPresetDialog
    v-model:open="isPresetDialogOpen"
    :mode="presetDialogMode"
    :preset="selectedPresetForEdit"
    :filters="currentFilterState.filters"
    @preset:created="handlePresetCreated"
    @preset:updated="handlePresetUpdated"
    @preset:deleted="handlePresetDeleted"
    @preset:applied="handlePresetApplied"
    @preset:edit="openEditPresetDialog"
  />
</template>

<style scoped>
.filter-bar {
  @apply transition-all duration-200;
}
</style>