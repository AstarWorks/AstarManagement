<!--
  Activity Filters Component
  
  Provides advanced filtering options for the activity timeline:
  - Activity type filtering with multi-select
  - User/actor filtering
  - Date range selection
  - Quick filter presets
  - Clear all filters functionality
-->

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  Calendar, 
  Users, 
  Filter, 
  X, 
  Clock,
  FileText,
  MessageSquare,
  CheckSquare,
  Settings,
  ChevronDown
} from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Label } from '~/components/ui/label'
import { Checkbox } from '~/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '~/components/ui/select'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '~/components/ui/popover'
import { DatePicker } from '~/components/ui/date-picker'

// Types
import type { ActivityFilters, ActivityType } from '~/types/activity'

interface Props {
  /** Current filters */
  filters: ActivityFilters
  /** Matter ID for user filtering */
  matterId: string
  /** Show advanced options */
  showAdvanced?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showAdvanced: true
})

// Emits
const emit = defineEmits<{
  'update:filters': [filters: ActivityFilters]
  'clear': []
}>()

// Local state  
const selectedTypes = ref<ActivityType[]>([...(props.filters.types || [])])
const selectedActors = ref<string[]>([...(props.filters.actors || [])])
const dateRange = ref<{ from: Date; to: Date } | undefined>(
  props.filters.dateRange 
    ? { from: props.filters.dateRange.from, to: props.filters.dateRange.to }
    : undefined
)
const showTypePopover = ref(false)
const showActorPopover = ref(false)
const showDatePopover = ref(false)

// Activity type definitions with groups
const activityTypeGroups = [
  {
    label: 'Documents',
    icon: FileText,
    types: [
      { value: 'document_upload', label: 'Document Upload' },
      { value: 'document_view', label: 'Document View' },
      { value: 'document_download', label: 'Document Download' }
    ]
  },
  {
    label: 'Communications',
    icon: MessageSquare,
    types: [
      { value: 'communication_email', label: 'Email' },
      { value: 'communication_note', label: 'Note' },
      { value: 'communication_call', label: 'Phone Call' }
    ]
  },
  {
    label: 'Matter Changes',
    icon: Settings,
    types: [
      { value: 'matter_created', label: 'Matter Created' },
      { value: 'matter_updated', label: 'Matter Updated' },
      { value: 'matter_status_changed', label: 'Status Changed' },
      { value: 'matter_assigned', label: 'Assignment Changed' }
    ]
  },
  {
    label: 'Tasks & Audit',
    icon: CheckSquare,
    types: [
      { value: 'task_created', label: 'Task Created' },
      { value: 'task_completed', label: 'Task Completed' },
      { value: 'audit_action', label: 'Audit Action' }
    ]
  }
]

// Quick filter presets
const quickFilters = [
  {
    label: 'Today',
    value: 'today',
    getDateRange: () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return { from: today, to: tomorrow }
    }
  },
  {
    label: 'This Week',
    value: 'week',
    getDateRange: () => {
      const today = new Date()
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay()))
      firstDay.setHours(0, 0, 0, 0)
      const lastDay = new Date(firstDay)
      lastDay.setDate(lastDay.getDate() + 7)
      return { from: firstDay, to: lastDay }
    }
  },
  {
    label: 'This Month',
    value: 'month',
    getDateRange: () => {
      const today = new Date()
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 1)
      return { from: firstDay, to: lastDay }
    }
  }
]

// Mock users data - in real app, this would come from API
const availableUsers = ref([
  { id: '1', name: 'John Doe', role: 'lawyer' },
  { id: '2', name: 'Jane Smith', role: 'clerk' },
  { id: '3', name: 'Bob Johnson', role: 'client' },
  { id: '4', name: 'Alice Brown', role: 'lawyer' }
])

// Computed properties
const activeFilterCount = computed(() => {
  let count = 0
  if (selectedTypes.value.length > 0) count++
  if (selectedActors.value.length > 0) count++
  if (dateRange.value) count++
  return count
})

const selectedTypesLabel = computed(() => {
  if (selectedTypes.value.length === 0) return 'All Types'
  if (selectedTypes.value.length === 1) {
    const type = activityTypeGroups
      .flatMap(g => g.types)
      .find(t => t.value === selectedTypes.value[0])
    return type?.label || selectedTypes.value[0]
  }
  return `${selectedTypes.value.length} types selected`
})

const selectedActorsLabel = computed(() => {
  if (selectedActors.value.length === 0) return 'All Users'
  if (selectedActors.value.length === 1) {
    const user = availableUsers.value.find(u => u.id === selectedActors.value[0])
    return user?.name || 'Unknown User'
  }
  return `${selectedActors.value.length} users selected`
})

const dateRangeLabel = computed(() => {
  if (!dateRange.value) return 'All Time'
  
  const from = dateRange.value.from.toLocaleDateString()
  const to = dateRange.value.to.toLocaleDateString()
  
  if (from === to) return from
  return `${from} - ${to}`
})

// Methods
const handleTypeChange = (type: ActivityType, checked: boolean) => {
  if (checked) {
    selectedTypes.value = [...selectedTypes.value, type]
  } else {
    selectedTypes.value = selectedTypes.value.filter(t => t !== type)
  }
}

const handleActorChange = (actorId: string, checked: boolean) => {
  if (checked) {
    selectedActors.value = [...selectedActors.value, actorId]
  } else {
    selectedActors.value = selectedActors.value.filter(id => id !== actorId)
  }
}

const handleDateRangeChange = (range: { from: Date; to: Date } | undefined) => {
  dateRange.value = range
}

const handleQuickFilter = (filterValue: string) => {
  const filter = quickFilters.find(f => f.value === filterValue)
  if (filter) {
    dateRange.value = filter.getDateRange()
  }
}

const toggleTypeGroup = (group: typeof activityTypeGroups[0]) => {
  const groupTypes = group.types.map(t => t.value as ActivityType)
  const allSelected = groupTypes.every(type => selectedTypes.value.includes(type))
  
  if (allSelected) {
    // Deselect all in group
    selectedTypes.value = selectedTypes.value.filter(type => !groupTypes.includes(type))
  } else {
    // Select all in group
    const newTypes = [...selectedTypes.value]
    groupTypes.forEach(type => {
      if (!newTypes.includes(type)) {
        newTypes.push(type)
      }
    })
    selectedTypes.value = newTypes
  }
}

const clearAllFilters = () => {
  selectedTypes.value = []
  selectedActors.value = []
  dateRange.value = undefined
  emit('clear')
}

const applyFilters = () => {
  const filters: ActivityFilters = {}
  
  if (selectedTypes.value.length > 0) {
    filters.types = selectedTypes.value
  }
  
  if (selectedActors.value.length > 0) {
    filters.actors = selectedActors.value
  }
  
  if (dateRange.value) {
    filters.dateRange = dateRange.value
  }
  
  emit('update:filters', filters)
}

// Watch for changes and auto-apply filters
watch([selectedTypes, selectedActors, dateRange], () => {
  applyFilters()
}, { deep: true })

// Initialize from props
watch(() => props.filters, (newFilters) => {
  selectedTypes.value = [...(newFilters.types || [])]
  selectedActors.value = [...(newFilters.actors || [])]
  dateRange.value = newFilters.dateRange 
    ? { from: newFilters.dateRange.from, to: newFilters.dateRange.to }
    : undefined
}, { immediate: true })
</script>

<template>
  <Card class="activity-filters">
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <CardTitle class="text-base flex items-center gap-2">
          <Filter class="w-4 h-4" />
          Filters
          <Badge v-if="activeFilterCount > 0" variant="secondary" class="text-xs">
            {{ activeFilterCount }}
          </Badge>
        </CardTitle>
        
        <Button 
          v-if="activeFilterCount > 0"
          @click="clearAllFilters"
          variant="ghost" 
          size="sm"
          class="text-xs"
        >
          <X class="w-3 h-3 mr-1" />
          Clear All
        </Button>
      </div>
    </CardHeader>
    
    <CardContent class="space-y-4">
      <!-- Quick Date Filters -->
      <div class="space-y-2">
        <Label class="text-sm font-medium">Quick Filters</Label>
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="filter in quickFilters"
            :key="filter.value"
            @click="handleQuickFilter(filter.value)"
            variant="outline"
            size="sm"
            class="text-xs"
          >
            <Clock class="w-3 h-3 mr-1" />
            {{ filter.label }}
          </Button>
        </div>
      </div>
      
      <!-- Filter Controls -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Activity Types Filter -->
        <div class="space-y-2">
          <Label class="text-sm font-medium">Activity Types</Label>
          <Popover v-model:open="showTypePopover">
            <PopoverTrigger asChild>
              <Button variant="outline" class="w-full justify-between text-left">
                <span class="truncate">{{ selectedTypesLabel }}</span>
                <ChevronDown class="w-4 h-4 ml-2 flex-shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-80">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h4 class="font-medium">Select Activity Types</h4>
                  <Button
                    v-if="selectedTypes.length > 0"
                    @click="selectedTypes = []"
                    variant="ghost"
                    size="sm"
                    class="text-xs"
                  >
                    Clear
                  </Button>
                </div>
                
                <div class="space-y-3">
                  <div 
                    v-for="group in activityTypeGroups" 
                    :key="group.label"
                    class="space-y-2"
                  >
                    <!-- Group Header -->
                    <div class="flex items-center gap-2">
                      <Button
                        @click="toggleTypeGroup(group)"
                        variant="ghost"
                        size="sm"
                        class="h-auto p-0 font-medium text-xs"
                      >
                        <component :is="group.icon" class="w-3 h-3 mr-1" />
                        {{ group.label }}
                      </Button>
                      <div class="flex-1 h-px bg-border"></div>
                    </div>
                    
                    <!-- Group Items -->
                    <div class="space-y-1 ml-4">
                      <div 
                        v-for="type in group.types" 
                        :key="type.value"
                        class="flex items-center space-x-2"
                      >
                        <Checkbox
                          :id="type.value"
                          :checked="selectedTypes.includes(type.value as ActivityType)"
                          @update:checked="(checked: boolean) => handleTypeChange(type.value as ActivityType, checked)"
                        />
                        <Label :for="type.value" class="text-xs">
                          {{ type.label }}
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <!-- Users Filter -->
        <div class="space-y-2">
          <Label class="text-sm font-medium">Users</Label>
          <Popover v-model:open="showActorPopover">
            <PopoverTrigger asChild>
              <Button variant="outline" class="w-full justify-between text-left">
                <span class="truncate">{{ selectedActorsLabel }}</span>
                <ChevronDown class="w-4 h-4 ml-2 flex-shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-64">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h4 class="font-medium">Select Users</h4>
                  <Button
                    v-if="selectedActors.length > 0"
                    @click="selectedActors = []"
                    variant="ghost"
                    size="sm"
                    class="text-xs"
                  >
                    Clear
                  </Button>
                </div>
                
                <div class="space-y-2">
                  <div 
                    v-for="user in availableUsers" 
                    :key="user.id"
                    class="flex items-center space-x-2"
                  >
                    <Checkbox
                      :id="`user-${user.id}`"
                      :checked="selectedActors.includes(user.id)"
                      @update:checked="(checked: boolean) => handleActorChange(user.id, checked)"
                    />
                    <Label :for="`user-${user.id}`" class="flex items-center gap-2 text-sm">
                      <span>{{ user.name }}</span>
                      <Badge variant="outline" class="text-xs">
                        {{ user.role }}
                      </Badge>
                    </Label>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <!-- Date Range Filter -->
        <div class="space-y-2">
          <Label class="text-sm font-medium">Date Range</Label>
          <Popover v-model:open="showDatePopover">
            <PopoverTrigger asChild>
              <Button variant="outline" class="w-full justify-between text-left">
                <span class="truncate">{{ dateRangeLabel }}</span>
                <Calendar class="w-4 h-4 ml-2 flex-shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="end">
              <DatePicker
                v-model:range="dateRange"
                :enable-range="true"
                @update:range="handleDateRangeChange"
              />
              
              <div class="p-3 border-t">
                <Button
                  v-if="dateRange"
                  @click="dateRange = undefined"
                  variant="ghost"
                  size="sm"
                  class="w-full"
                >
                  Clear Date Range
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <!-- Active Filters Summary -->
      <div v-if="activeFilterCount > 0" class="space-y-2">
        <Label class="text-sm font-medium">Active Filters</Label>
        <div class="flex flex-wrap gap-2">
          <Badge 
            v-if="selectedTypes.length > 0"
            variant="secondary" 
            class="text-xs"
          >
            {{ selectedTypes.length }} type{{ selectedTypes.length > 1 ? 's' : '' }}
            <Button
              @click="selectedTypes = []"
              variant="ghost"
              size="sm"
              class="h-auto w-auto p-0 ml-1"
            >
              <X class="w-3 h-3" />
            </Button>
          </Badge>
          
          <Badge 
            v-if="selectedActors.length > 0"
            variant="secondary" 
            class="text-xs"
          >
            {{ selectedActors.length }} user{{ selectedActors.length > 1 ? 's' : '' }}
            <Button
              @click="selectedActors = []"
              variant="ghost"
              size="sm"
              class="h-auto w-auto p-0 ml-1"
            >
              <X class="w-3 h-3" />
            </Button>
          </Badge>
          
          <Badge 
            v-if="dateRange"
            variant="secondary" 
            class="text-xs"
          >
            Date range
            <Button
              @click="dateRange = undefined"
              variant="ghost"
              size="sm"
              class="h-auto w-auto p-0 ml-1"
            >
              <X class="w-3 h-3" />
            </Button>
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.activity-filters {
  @apply w-full;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .activity-filters :deep(.grid-cols-3) {
    @apply grid-cols-1;
  }
}

/* Focus states for accessibility */
.activity-filters :focus-visible {
  @apply outline-2 outline-offset-2 outline-ring;
}

/* Custom checkbox styles */
.activity-filters :deep(.checkbox) {
  @apply transition-colors duration-200;
}

/* Popover content scrolling */
.activity-filters :deep(.popover-content) {
  max-height: 400px;
  overflow-y: auto;
}
</style>