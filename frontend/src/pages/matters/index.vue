<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import FilterBar from '~/components/matter/filters/FilterBar.vue'
import { MATTER_FILTER_CONFIGS, MATTER_FILTER_PRESETS } from '~/components/matter/filters/FilterConfig'
import type { FilterState } from '~/components/matter/filters/FilterConfig'
import { useFilterOptions } from '~/composables/useFilterOptions'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

// SEO and meta
definePageMeta({
  title: 'Matters - Filter Test',
  description: 'Testing the filter components for matter management',
  layout: 'app'
})

// Use breadcrumbs
const { setBreadcrumbs } = useBreadcrumbs()

// Filter state management
const filterState = ref<FilterState>({
  filters: [],
  quickSearch: '',
  activePreset: undefined,
  sortBy: 'createdAt',
  sortDirection: 'desc'
})

const { getReactiveFilterConfigs, initializeFilterOptions, isLoading } = useFilterOptions()

// Get reactive filter configs that update when user data loads
const filterConfigs = getReactiveFilterConfigs(MATTER_FILTER_CONFIGS)

// Mock matter data for demonstration
const mockMatters = ref([
  {
    id: '1',
    title: 'Corporate Merger Case - ABC Corp',
    caseNumber: 'CC-2024-001',
    clientName: 'ABC Corporation',
    opponentName: 'XYZ Ltd',
    assignedLawyer: '1', // Takeshi Yamamoto
    assignedClerk: '10', // Yuki Suzuki
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: new Date('2024-08-15'),
    createdAt: new Date('2024-07-01'),
    tags: ['corporate', 'merger', 'high-priority']
  },
  {
    id: '2',
    title: 'Employment Dispute Resolution',
    caseNumber: 'ED-2024-002',
    clientName: 'John Doe',
    opponentName: 'Tech Solutions Inc',
    assignedLawyer: '2', // Kenji Nakamura
    assignedClerk: '11', // Maki Watanabe
    status: 'REVIEW',
    priority: 'MEDIUM',
    dueDate: new Date('2024-07-30'),
    createdAt: new Date('2024-06-15'),
    tags: ['employment', 'dispute']
  },
  {
    id: '3',
    title: 'Real Estate Transaction',
    caseNumber: 'RE-2024-003',
    clientName: 'Property Holdings LLC',
    opponentName: 'City Planning Department',
    assignedLawyer: '3', // Hiroshi Tanaka
    assignedClerk: '12', // Rina Kobayashi
    status: 'WAITING_CLIENT',
    priority: 'LOW',
    dueDate: new Date('2024-09-01'),
    createdAt: new Date('2024-06-20'),
    tags: ['real-estate', 'transaction']
  }
])

// Apply filters to matter data
const filteredMatters = computed(() => {
  let filtered = [...mockMatters.value]
  
  filterState.value.filters.forEach(filter => {
    switch (filter.field) {
      case 'quickSearch':
        const searchTerm = filter.value.toLowerCase()
        filtered = filtered.filter(matter => 
          matter.title.toLowerCase().includes(searchTerm) ||
          matter.caseNumber.toLowerCase().includes(searchTerm) ||
          matter.clientName.toLowerCase().includes(searchTerm)
        )
        break
        
      case 'title':
        filtered = filtered.filter(matter => 
          matter.title.toLowerCase().includes(filter.value.toLowerCase())
        )
        break
        
      case 'caseNumber':
        filtered = filtered.filter(matter => 
          matter.caseNumber.toLowerCase().includes(filter.value.toLowerCase())
        )
        break
        
      case 'clientName':
        filtered = filtered.filter(matter => 
          matter.clientName.toLowerCase().includes(filter.value.toLowerCase())
        )
        break
        
      case 'opponentName':
        filtered = filtered.filter(matter => 
          matter.opponentName.toLowerCase().includes(filter.value.toLowerCase())
        )
        break
        
      case 'assignedLawyer':
        filtered = filtered.filter(matter => 
          Array.isArray(filter.value) 
            ? filter.value.includes(matter.assignedLawyer)
            : matter.assignedLawyer === filter.value
        )
        break
        
      case 'assignedClerk':
        filtered = filtered.filter(matter => 
          Array.isArray(filter.value) 
            ? filter.value.includes(matter.assignedClerk)
            : matter.assignedClerk === filter.value
        )
        break
        
      case 'status':
        if (Array.isArray(filter.value)) {
          filtered = filtered.filter(matter => 
            filter.value.includes(matter.status)
          )
        }
        break
        
      case 'priority':
        if (Array.isArray(filter.value)) {
          filtered = filtered.filter(matter => 
            filter.value.includes(matter.priority)
          )
        }
        break
        
      case 'tags':
        if (Array.isArray(filter.value)) {
          filtered = filtered.filter(matter => 
            filter.value.some((tag: any) => matter.tags.includes(tag))
          )
        }
        break
        
      case 'dueDate':
      case 'createdAt':
        if (Array.isArray(filter.value) && filter.value.length === 2) {
          const [start, end] = filter.value
          filtered = filtered.filter(matter => {
            const fieldDate = filter.field === 'dueDate' ? matter.dueDate : matter.createdAt
            return fieldDate >= start && fieldDate <= end
          })
        }
        break
    }
  })
  
  return filtered
})

// Helper function to get display value for filter
const getFilterDisplayValue = (filter: any) => {
  if (Array.isArray(filter.value)) {
    return filter.value.join(', ')
  }
  if (filter.value instanceof Date) {
    return filter.value.toLocaleDateString()
  }
  return String(filter.value)
}

// Filter event handlers
const handleFilterChange = (newState: FilterState) => {
  filterState.value = newState
}

const handlePresetApply = (preset: any) => {
  console.log('Applied preset:', preset.name)
}

const handlePresetSave = (name: string, filters: any[]) => {
  console.log('Save preset:', name, filters)
}

const handlePresetDelete = (presetId: string) => {
  console.log('Delete preset:', presetId)
}

const handleExport = (format: 'csv' | 'excel') => {
  console.log('Export as:', format)
}

// Initialize filter options on mount
onMounted(() => {
  setBreadcrumbs([
    { label: 'Home', path: '/' },
    { label: 'Matters', current: true }
  ])
  initializeFilterOptions()
})
</script>

<template>
  <div class="matters-page container mx-auto p-6 space-y-6">
    <Breadcrumbs />
    
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Matters</h1>
        <p class="text-muted-foreground">Filter component testing and demonstration</p>
      </div>
      
      <Badge variant="secondary" class="text-sm">
        {{ filteredMatters.length }} / {{ mockMatters.length }} matters
      </Badge>
    </div>

    <!-- Filter Panel -->
    <FilterBar
      :configs="filterConfigs"
      :presets="MATTER_FILTER_PRESETS"
      v-model="filterState"
      :loading="isLoading"
      @preset:apply="handlePresetApply"
      @preset:save="handlePresetSave"
      @preset:delete="handlePresetDelete"
      @export="handleExport"
    />

    <!-- Active Filters Summary -->
    <div v-if="filterState.filters.length > 0" class="bg-muted/50 rounded-lg p-4">
      <h3 class="text-sm font-medium mb-2">Active Filters ({{ filterState.filters.length }}):</h3>
      <div class="space-y-1 text-sm text-muted-foreground">
        <div v-for="filter in filterState.filters" :key="`${filter.field}-${filter.operator}`">
          <strong>{{ filterConfigs.find(c => c.field === filter.field)?.label || filter.field }}:</strong>
          {{ getFilterDisplayValue(filter) }}
        </div>
      </div>
    </div>

    <!-- Results Grid -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="matter in filteredMatters" :key="matter.id" class="hover:shadow-md transition-shadow">
        <CardHeader class="pb-3">
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <CardTitle class="text-lg leading-6">{{ matter.title }}</CardTitle>
              <p class="text-sm text-muted-foreground">{{ matter.caseNumber }}</p>
            </div>
            <Badge :variant="matter.priority === 'HIGH' ? 'destructive' : matter.priority === 'MEDIUM' ? 'default' : 'secondary'">
              {{ matter.priority }}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent class="space-y-3">
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Client:</span>
              <span class="font-medium">{{ matter.clientName }}</span>
            </div>
            
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Opponent:</span>
              <span>{{ matter.opponentName }}</span>
            </div>
            
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Status:</span>
              <Badge variant="outline" class="text-xs">{{ matter.status.replace('_', ' ') }}</Badge>
            </div>
            
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Due Date:</span>
              <span>{{ matter.dueDate.toLocaleDateString() }}</span>
            </div>
          </div>
          
          <!-- Tags -->
          <div v-if="matter.tags.length > 0" class="flex flex-wrap gap-1">
            <Badge v-for="tag in matter.tags" :key="tag" variant="secondary" class="text-xs">
              {{ tag }}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Empty State -->
    <div v-if="filteredMatters.length === 0" class="text-center py-12">
      <Icon name="lucide:search" class="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 class="mt-4 text-lg font-semibold">No matters found</h3>
      <p class="text-muted-foreground">Try adjusting your filters or search terms.</p>
    </div>
  </div>
</template>

<style scoped>
.matters-page {
  min-height: 100vh;
}
</style>