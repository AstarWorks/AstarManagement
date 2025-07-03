<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CalendarDays, Filter, RotateCcw, Download, Users, Building, Tag } from 'lucide-vue-next'
import type { FinancialFilters, TimePeriod } from '~/types/financial'

/**
 * Financial Dashboard Filters Component
 * 
 * Provides comprehensive filtering controls for the financial dashboard.
 * Includes time period selection, matter filtering, lawyer filtering, and category selection.
 */

interface Props {
  /** Current filter values */
  filters: FinancialFilters
  /** Available matters for filtering */
  availableMatters?: Array<{ id: string; title: string }>
  /** Available lawyers for filtering */
  availableLawyers?: Array<{ id: string; name: string }>
  /** Available expense categories */
  availableCategories?: string[]
  /** Show export options */
  showExport?: boolean
  /** Compact layout for smaller screens */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  availableMatters: () => [
    { id: 'matter-1', title: 'Corporate Merger - ABC Corp' },
    { id: 'matter-2', title: 'Patent Dispute - XYZ Inc' },
    { id: 'matter-3', title: 'Contract Review - DEF Ltd' },
    { id: 'matter-4', title: 'Litigation - GHI Corp' }
  ],
  availableLawyers: () => [
    { id: 'lawyer-1', name: 'Tanaka, Hiroshi' },
    { id: 'lawyer-2', name: 'Sato, Yuki' },
    { id: 'lawyer-3', name: 'Yamamoto, Kenji' }
  ],
  availableCategories: () => [
    'Legal Research',
    'Court Fees', 
    'Office Supplies',
    'Travel',
    'Technology'
  ],
  showExport: true,
  compact: false
})

const emit = defineEmits<{
  /** Emitted when filters change */
  filtersChange: [filters: FinancialFilters]
  /** Emitted when export is requested */
  export: [format: 'csv' | 'json' | 'pdf']
  /** Emitted when filters are reset */
  reset: []
}>()

// Local filter state
const localFilters = ref<FinancialFilters>({ ...props.filters })

// Time period options
const timePeriodOptions: Array<{ value: TimePeriod; label: string; description: string }> = [
  { value: 'week', label: 'This Week', description: 'Last 7 days' },
  { value: 'month', label: 'This Month', description: 'Current month' },
  { value: 'quarter', label: 'This Quarter', description: 'Current quarter' },
  { value: 'year', label: 'This Year', description: 'Current year' },
  { value: 'custom', label: 'Custom Range', description: 'Select custom date range' }
]

// Show advanced filters
const showAdvancedFilters = ref(false)

// Custom date range visibility
const showCustomDateRange = computed(() => localFilters.value.period === 'custom')

// Active filter count for badge
const activeFilterCount = computed(() => {
  let count = 0
  if (localFilters.value.matterIds.length > 0) count++
  if (localFilters.value.lawyerIds.length > 0) count++
  if (localFilters.value.categories.length > 0) count++
  if (localFilters.value.startDate || localFilters.value.endDate) count++
  if (localFilters.value.includeProjected) count++
  return count
})

// Apply filters
const applyFilters = () => {
  emit('filtersChange', { ...localFilters.value })
}

// Reset filters to default
const resetFilters = () => {
  localFilters.value = {
    period: 'month',
    startDate: undefined,
    endDate: undefined,
    matterIds: [],
    lawyerIds: [],
    categories: [],
    includeProjected: false
  }
  applyFilters()
  emit('reset')
}

// Handle period change
const handlePeriodChange = (period: TimePeriod) => {
  localFilters.value.period = period
  
  // Clear custom dates when switching away from custom
  if (period !== 'custom') {
    localFilters.value.startDate = undefined
    localFilters.value.endDate = undefined
  }
  
  applyFilters()
}

// Handle multi-select changes
const toggleMatter = (matterId: string) => {
  const index = localFilters.value.matterIds.indexOf(matterId)
  if (index > -1) {
    localFilters.value.matterIds.splice(index, 1)
  } else {
    localFilters.value.matterIds.push(matterId)
  }
  applyFilters()
}

const toggleLawyer = (lawyerId: string) => {
  const index = localFilters.value.lawyerIds.indexOf(lawyerId)
  if (index > -1) {
    localFilters.value.lawyerIds.splice(index, 1)
  } else {
    localFilters.value.lawyerIds.push(lawyerId)
  }
  applyFilters()
}

const toggleCategory = (category: string) => {
  const index = localFilters.value.categories.indexOf(category)
  if (index > -1) {
    localFilters.value.categories.splice(index, 1)
  } else {
    localFilters.value.categories.push(category)
  }
  applyFilters()
}

// Export functions
const handleExport = (format: 'csv' | 'json' | 'pdf') => {
  emit('export', format)
}

// Watch for external filter changes
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
}, { deep: true })

// Format date for input
const formatDateForInput = (date: Date | undefined): string => {
  if (!date) return ''
  return date.toISOString().split('T')[0]
}

// Parse date from input
const parseDateFromInput = (dateString: string): Date | undefined => {
  if (!dateString) return undefined
  return new Date(dateString)
}
</script>

<template>
  <Card class="financial-filters-card">
    <CardHeader>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Filter class="w-5 h-5" />
          <CardTitle>Dashboard Filters</CardTitle>
          <Badge v-if="activeFilterCount > 0" variant="secondary" class="text-xs">
            {{ activeFilterCount }} active
          </Badge>
        </div>
        
        <div class="flex items-center gap-2">
          <!-- Export dropdown -->
          <DropdownMenu v-if="showExport">
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm">
                <Download class="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="handleExport('csv')">
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem @click="handleExport('json')">
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem @click="handleExport('pdf')">
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <!-- Reset filters -->
          <Button 
            variant="ghost" 
            size="sm" 
            @click="resetFilters"
            :disabled="activeFilterCount === 0"
          >
            <RotateCcw class="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </CardHeader>
    
    <CardContent>
      <div class="space-y-6">
        <!-- Time Period Selection -->
        <div class="filter-section">
          <h4 class="filter-section-title">
            <CalendarDays class="w-4 h-4" />
            Time Period
          </h4>
          
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            <Button
              v-for="option in timePeriodOptions"
              :key="option.value"
              @click="handlePeriodChange(option.value)"
              :variant="localFilters.period === option.value ? 'default' : 'outline'"
              size="sm"
              class="justify-start h-auto p-3"
            >
              <div class="text-left">
                <div class="font-medium">{{ option.label }}</div>
                <div class="text-xs text-muted-foreground">{{ option.description }}</div>
              </div>
            </Button>
          </div>
          
          <!-- Custom Date Range -->
          <div v-if="showCustomDateRange" class="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label for="start-date" class="block text-sm font-medium mb-2">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                :value="formatDateForInput(localFilters.startDate)"
                @input="localFilters.startDate = parseDateFromInput(($event.target as HTMLInputElement).value); applyFilters()"
                class="form-input"
              />
            </div>
            <div>
              <label for="end-date" class="block text-sm font-medium mb-2">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                :value="formatDateForInput(localFilters.endDate)"
                @input="localFilters.endDate = parseDateFromInput(($event.target as HTMLInputElement).value); applyFilters()"
                class="form-input"
              />
            </div>
          </div>
        </div>
        
        <!-- Advanced Filters Toggle -->
        <div class="border-t pt-4">
          <Button
            variant="ghost"
            @click="showAdvancedFilters = !showAdvancedFilters"
            class="w-full justify-between"
          >
            <span>Advanced Filters</span>
            <ChevronDown 
              class="w-4 h-4 transition-transform"
              :class="{ 'rotate-180': showAdvancedFilters }"
            />
          </Button>
        </div>
        
        <!-- Advanced Filters -->
        <div v-if="showAdvancedFilters" class="space-y-6">
          <!-- Matter Selection -->
          <div class="filter-section">
            <h4 class="filter-section-title">
              <Building class="w-4 h-4" />
              Matters
              <Badge v-if="localFilters.matterIds.length > 0" variant="secondary" class="text-xs">
                {{ localFilters.matterIds.length }} selected
              </Badge>
            </h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div
                v-for="matter in availableMatters"
                :key="matter.id"
                class="flex items-center space-x-2"
              >
                <Checkbox
                  :id="`matter-${matter.id}`"
                  :checked="localFilters.matterIds.includes(matter.id)"
                  @update:checked="toggleMatter(matter.id)"
                />
                <label
                  :for="`matter-${matter.id}`"
                  class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {{ matter.title }}
                </label>
              </div>
            </div>
          </div>
          
          <!-- Lawyer Selection -->
          <div class="filter-section">
            <h4 class="filter-section-title">
              <Users class="w-4 h-4" />
              Lawyers
              <Badge v-if="localFilters.lawyerIds.length > 0" variant="secondary" class="text-xs">
                {{ localFilters.lawyerIds.length }} selected
              </Badge>
            </h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <div
                v-for="lawyer in availableLawyers"
                :key="lawyer.id"
                class="flex items-center space-x-2"
              >
                <Checkbox
                  :id="`lawyer-${lawyer.id}`"
                  :checked="localFilters.lawyerIds.includes(lawyer.id)"
                  @update:checked="toggleLawyer(lawyer.id)"
                />
                <label
                  :for="`lawyer-${lawyer.id}`"
                  class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {{ lawyer.name }}
                </label>
              </div>
            </div>
          </div>
          
          <!-- Category Selection -->
          <div class="filter-section">
            <h4 class="filter-section-title">
              <Tag class="w-4 h-4" />
              Categories
              <Badge v-if="localFilters.categories.length > 0" variant="secondary" class="text-xs">
                {{ localFilters.categories.length }} selected
              </Badge>
            </h4>
            
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              <div
                v-for="category in availableCategories"
                :key="category"
                class="flex items-center space-x-2"
              >
                <Checkbox
                  :id="`category-${category}`"
                  :checked="localFilters.categories.includes(category)"
                  @update:checked="toggleCategory(category)"
                />
                <label
                  :for="`category-${category}`"
                  class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {{ category }}
                </label>
              </div>
            </div>
          </div>
          
          <!-- Additional Options -->
          <div class="filter-section">
            <h4 class="filter-section-title">
              Options
            </h4>
            
            <div class="flex items-center space-x-2">
              <Checkbox
                id="include-projected"
                :checked="localFilters.includeProjected"
                @update:checked="localFilters.includeProjected = $event; applyFilters()"
              />
              <label
                for="include-projected"
                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Include projected expenses
              </label>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.financial-filters-card {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
}

.filter-section {
  --section-spacing: 1rem;
}

.filter-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.form-input {
  width: 100%;
  min-height: 2.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: calc(var(--radius) - 2px);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .grid-cols-3 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .grid-cols-5 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .grid-cols-2,
  .grid-cols-3,
  .grid-cols-5 {
    grid-template-columns: repeat(1, 1fr);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .financial-filters-card {
    border-width: 2px;
  }
  
  .form-input {
    border-width: 2px;
  }
}

/* Animation for advanced filters */
.filter-section {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Improved checkbox alignment */
.flex.items-center.space-x-2 {
  align-items: flex-start;
  padding: 0.25rem 0;
}

.flex.items-center.space-x-2 label {
  line-height: 1.4;
  margin-top: 0.125rem;
}
</style>