<template>
  <div class="timeline-filters">
    <div class="filters-header">
      <h3 class="filters-title">Filters</h3>
      <Button 
        v-if="hasActiveFilters"
        variant="ghost" 
        size="sm"
        @click="clearFilters"
      >
        <X class="size-4 mr-2" />
        Clear All
      </Button>
    </div>
    
    <div class="filters-content">
      <!-- Search -->
      <div class="filter-group">
        <label class="filter-label">Search</label>
        <div class="search-box">
          <Search class="search-icon" />
          <input
            :value="filters.search || ''"
            @input="updateSearch"
            type="text"
            placeholder="Search communications..."
            class="search-input"
          />
        </div>
      </div>
      
      <!-- Quick Presets -->
      <div class="filter-group">
        <label class="filter-label">Time Period</label>
        <div class="preset-buttons">
          <Button
            v-for="preset in presets"
            :key="preset.id"
            variant="outline"
            size="sm"
            :class="isPresetActive(preset.id) ? 'preset-active' : ''"
            @click="applyPreset(preset.id)"
          >
            {{ preset.label }}
          </Button>
        </div>
      </div>
      
      <!-- Communication Types -->
      <div class="filter-group">
        <label class="filter-label">Types</label>
        <div class="type-checkboxes">
          <div
            v-for="type in communicationTypes"
            :key="type.id"
            class="type-checkbox"
          >
            <Checkbox
              :id="`type-${type.id}`"
              :checked="isTypeSelected(type.id)"
              @update:checked="(checked: boolean | string) => toggleType(type.id, checked)"
            />
            <label :for="`type-${type.id}`" class="type-label">
              <component :is="type.icon" class="type-icon" />
              {{ type.label }}
              <Badge v-if="type.count" variant="secondary" class="type-count">
                {{ type.count }}
              </Badge>
            </label>
          </div>
        </div>
      </div>
      
      <!-- Date Range -->
      <div class="filter-group">
        <label class="filter-label">Custom Date Range</label>
        <div class="date-inputs">
          <div class="date-input-group">
            <label for="date-from" class="date-label">From</label>
            <input
              id="date-from"
              :value="filters.dateFrom || ''"
              @input="updateDateFrom"
              type="date"
              class="date-input"
            />
          </div>
          <div class="date-input-group">
            <label for="date-to" class="date-label">To</label>
            <input
              id="date-to"
              :value="filters.dateTo || ''"
              @input="updateDateTo"
              type="date"
              class="date-input"
            />
          </div>
        </div>
      </div>
      
      <!-- Matter Filter -->
      <div class="filter-group">
        <label class="filter-label">Matter</label>
        <Select
          :value="filters.matterId || ''"
          onValueChange="updateMatter"
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by matter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Matters</SelectItem>
            <SelectItem
              v-for="matter in matters"
              :key="matter.id"
              :value="matter.id"
            >
              {{ matter.title }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    
    <!-- Active Filters Summary -->
    <div v-if="filterSummary" class="filters-summary">
      <div class="summary-content">
        <Filter class="summary-icon" />
        <span class="summary-text">{{ filterSummary }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  Search, 
  Filter,
  X,
  MessageSquare,
  Mail,
  Phone,
  StickyNote,
  Users,
  FileText
} from 'lucide-vue-next'
import type { CommunicationFilters, FilterPreset } from '~/types/communication'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

interface Props {
  filters: CommunicationFilters
  hasActiveFilters: boolean
  filterSummary: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  updateFilters: [filters: CommunicationFilters]
  applyPreset: [preset: FilterPreset]
  clearFilters: []
}>()

// Time period presets
const presets = [
  { id: 'today' as FilterPreset, label: 'Today' },
  { id: 'week' as FilterPreset, label: 'This Week' },
  { id: 'month' as FilterPreset, label: 'This Month' },
  { id: 'all' as FilterPreset, label: 'All Time' }
]

// Communication types with counts
const communicationTypes = [
  { id: 'memo', label: 'Memos', icon: MessageSquare, count: 12 },
  { id: 'email', label: 'Emails', icon: Mail, count: 23 },
  { id: 'phone', label: 'Phone Calls', icon: Phone, count: 8 },
  { id: 'note', label: 'Notes', icon: StickyNote, count: 15 },
  { id: 'meeting', label: 'Meetings', icon: Users, count: 5 },
  { id: 'document', label: 'Documents', icon: FileText, count: 9 }
]

// Mock matters for filtering
const matters = [
  { id: 'MAT-2024-001', title: 'Acme Corp Service Agreement' },
  { id: 'MAT-2024-002', title: 'Manufacturing Liability Case' },
  { id: 'MAT-2024-003', title: 'Davis Employment Dispute' },
  { id: 'MAT-2024-004', title: 'Tech Startup IP Protection' }
]

// Methods
const updateSearch = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('updateFilters', {
    ...props.filters,
    search: target.value || undefined
  })
}

const updateDateFrom = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('updateFilters', {
    ...props.filters,
    dateFrom: target.value || undefined
  })
}

const updateDateTo = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('updateFilters', {
    ...props.filters,
    dateTo: target.value || undefined
  })
}

const updateMatter = (matterId: string) => {
  emit('updateFilters', {
    ...props.filters,
    matterId: matterId || undefined
  })
}

const toggleType = (typeId: string, checked: boolean | string) => {
  const currentTypes = props.filters.types || []
  let newTypes: string[]
  
  if (checked) {
    newTypes = [...currentTypes, typeId]
  } else {
    newTypes = currentTypes.filter(t => t !== typeId)
  }
  
  emit('updateFilters', {
    ...props.filters,
    types: newTypes.length > 0 ? newTypes : undefined
  })
}

const isTypeSelected = (typeId: string) => {
  return props.filters.types?.includes(typeId) || false
}

const isPresetActive = (presetId: FilterPreset) => {
  // This would check if current date range matches the preset
  // For now, just return false
  return false
}

const applyPreset = (preset: FilterPreset) => {
  emit('applyPreset', preset)
}

const clearFilters = () => {
  emit('clearFilters')
}
</script>

<style scoped>
.timeline-filters {
  @apply space-y-4;
}

.filters-header {
  @apply flex items-center justify-between;
}

.filters-title {
  @apply text-sm font-medium text-foreground;
}

.filters-content {
  @apply space-y-4;
}

.filter-group {
  @apply space-y-2;
}

.filter-label {
  @apply block text-xs font-medium text-muted-foreground uppercase tracking-wide;
}

.search-box {
  @apply relative;
}

.search-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground;
}

.search-input {
  @apply w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md;
  @apply bg-background text-foreground placeholder:text-muted-foreground;
  @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
}

.preset-buttons {
  @apply flex flex-wrap gap-2;
}

.preset-active {
  @apply bg-primary text-primary-foreground;
}

.type-checkboxes {
  @apply space-y-2;
}

.type-checkbox {
  @apply flex items-center gap-2;
}

.type-label {
  @apply flex items-center gap-2 text-sm text-foreground cursor-pointer;
}

.type-icon {
  @apply size-4;
}

.type-count {
  @apply text-xs;
}

.date-inputs {
  @apply grid grid-cols-2 gap-3;
}

.date-input-group {
  @apply space-y-1;
}

.date-label {
  @apply block text-xs text-muted-foreground;
}

.date-input {
  @apply w-full px-3 py-2 text-sm border border-input rounded-md;
  @apply bg-background text-foreground;
  @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
}

.filters-summary {
  @apply border-t border-border pt-4;
}

.summary-content {
  @apply flex items-center gap-2 text-sm text-muted-foreground;
}

.summary-icon {
  @apply size-4 flex-shrink-0;
}

.summary-text {
  @apply truncate;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .preset-buttons {
    @apply grid grid-cols-2;
  }
  
  .date-inputs {
    @apply grid-cols-1 gap-2;
  }
}
</style>