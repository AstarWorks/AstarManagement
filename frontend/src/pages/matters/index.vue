<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Grid3x3, Plus, Filter, Search, Download, Settings2 } from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

// Matter Components
import ViewSwitcher from '~/components/matter/ViewSwitcher.vue'
import KanbanBoard from '~/components/kanban/KanbanBoard.vue'
import MatterTableView from '~/components/matter/table/MatterTableView.vue'
import MatterTableVirtual from '~/components/matter/table/MatterTableVirtual.vue'
import FilterBar from '~/components/matter/filters/FilterBar.vue'
import { MATTER_FILTER_CONFIGS, MATTER_FILTER_PRESETS } from '~/components/matter/filters/FilterConfig'

// Types
import type { ViewMode } from '~/components/matter/ViewSwitcher.vue'
import type { Matter } from '~/types/matter'
import type { FilterState } from '~/components/matter/filters/FilterConfig'

// Composables
import { useFilterOptions } from '~/composables/useFilterOptions'

// Store
import { useKanbanStore } from '~/stores/kanban'
import { storeToRefs } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

// Meta and SEO
definePageMeta({
  title: 'Matters',
  description: 'Legal matter management dashboard'
})

useSeoMeta({
  title: 'Matters - Aster Management',
  description: 'Manage your legal matters with our comprehensive dashboard. View matters in Kanban board or table format.',
  ogTitle: 'Legal Matter Management',
  ogDescription: 'Comprehensive legal matter management system',
  ogType: 'website'
})

// Use breadcrumbs
const { setBreadcrumbs } = useBreadcrumbs()

// Store and reactive state
const kanbanStore = useKanbanStore()
const { matters, filteredMatters, isLoading, error } = storeToRefs(kanbanStore)

// View preferences (persisted in localStorage)
const currentView = useLocalStorage<ViewMode>('matters-view-mode', 'kanban')
const tableDensity = useLocalStorage<'compact' | 'comfortable' | 'spacious'>('matters-table-density', 'comfortable')
const enableVirtualScrolling = useLocalStorage('matters-virtual-scrolling', true)

// Filter state management
const filterState = ref<FilterState>({
  filters: [],
  quickSearch: '',
  activePreset: undefined,
  sortBy: 'createdAt',
  sortDirection: 'desc'
})

const { getReactiveFilterConfigs, initializeFilterOptions, isLoading: filtersLoading } = useFilterOptions()

// Get reactive filter configs that update when user data loads
const filterConfigs = getReactiveFilterConfigs(MATTER_FILTER_CONFIGS)

// Local state
const searchQuery = ref('')
const showFilters = ref(false)
const showViewSettings = ref(false)

// Computed properties
const totalMatters = computed(() => matters.value.length)
const filteredCount = computed(() => filteredMatters.value.length)

const viewStats = computed(() => ({
  total: totalMatters.value,
  filtered: filteredCount.value,
  loading: isLoading.value,
  hasFilters: filteredCount.value !== totalMatters.value
}))

// Page actions
const handleCreateMatter = () => {
  navigateTo('/matters/create')
}

const handleMatterClick = (matter: Matter) => {
  navigateTo(`/matters/${matter.id}`)
}

const handleMatterEdit = (matter: Matter) => {
  navigateTo(`/matters/${matter.id}/edit`)
}

const handleViewChange = (view: ViewMode) => {
  currentView.value = view
}

const handleBulkExport = () => {
  // TODO: Implement bulk export functionality
  console.log('Bulk export requested')
}

const handleQuickSearch = (query: string) => {
  searchQuery.value = query
  // TODO: Integrate with store search
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

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

// Load matters on mount
onMounted(async () => {
  setBreadcrumbs([
    { label: 'Home', path: '/' },
    { label: 'Matters', current: true }
  ])
  initializeFilterOptions()
  await kanbanStore.loadMatters()
})

// Watch for view changes and save preferences
watch(currentView, (newView) => {
  console.log(`Switched to ${newView} view`)
})

// Handle error state
const handleRetry = async () => {
  await kanbanStore.loadMatters()
}
</script>

<template>
  <div class="matters-page">
    <!-- Page Header -->
    <header class="page-header">
      <div class="header-content">
        <!-- Title Section -->
        <div class="title-section">
          <h1 class="page-title">
            Legal Matters
          </h1>
          <p class="page-description">
            Manage and track all your legal matters in one place
          </p>
        </div>

        <!-- Actions Section -->
        <div class="actions-section">
          <Button @click="handleCreateMatter" class="create-button">
            <Plus class="w-4 h-4 mr-2" />
            New Matter
          </Button>
        </div>
      </div>

      <!-- Stats and Quick Info -->
      <div class="stats-section">
        <div class="stats-grid">
          <Card class="stat-card">
            <CardContent class="stat-content">
              <div class="stat-value">{{ viewStats.total }}</div>
              <div class="stat-label">Total Matters</div>
            </CardContent>
          </Card>
          
          <Card class="stat-card">
            <CardContent class="stat-content">
              <div class="stat-value">{{ viewStats.filtered }}</div>
              <div class="stat-label">
                {{ viewStats.hasFilters ? 'Filtered' : 'Visible' }}
              </div>
            </CardContent>
          </Card>
          
          <Card class="stat-card">
            <CardContent class="stat-content">
              <div class="stat-value">{{ matters.filter((m: Matter) => m.status === 'IN_PROGRESS').length }}</div>
              <div class="stat-label">In Progress</div>
            </CardContent>
          </Card>
          
          <Card class="stat-card">
            <CardContent class="stat-content">
              <div class="stat-value">{{ matters.filter((m: Matter) => m.priority === 'URGENT').length }}</div>
              <div class="stat-label">Urgent</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </header>

    <!-- Controls Bar -->
    <div class="controls-bar">
      <div class="controls-content">
        <!-- Left Side: Search and Filters -->
        <div class="controls-left">
          <!-- Quick Search -->
          <div class="search-container">
            <Search class="search-icon" />
            <Input
              v-model="searchQuery"
              placeholder="Search matters..."
              class="search-input"
              @update:value="handleQuickSearch"
            />
          </div>

          <!-- Filter Toggle -->
          <Button
            @click="toggleFilters"
            variant="outline"
            size="sm"
            :class="showFilters ? 'active' : ''"
          >
            <Filter class="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <!-- Right Side: View Controls -->
        <div class="controls-right">
          <!-- Export Button -->
          <Button
            @click="handleBulkExport"
            variant="outline"
            size="sm"
            :disabled="filteredCount === 0"
          >
            <Download class="w-4 h-4 mr-2" />
            Export
          </Button>

          <!-- View Settings (for table view) -->
          <Button
            v-if="currentView === 'table'"
            @click="showViewSettings = !showViewSettings"
            variant="outline"
            size="sm"
          >
            <Settings2 class="w-4 h-4" />
          </Button>

          <!-- View Switcher -->
          <ViewSwitcher
            v-model="currentView"
            :show-grid="false"
            variant="outline"
            size="sm"
            @update:model-value="handleViewChange"
          />
        </div>
      </div>
    </div>

    <!-- Filter Panel -->
    <div v-if="showFilters" class="filter-panel">
      <FilterBar
        :configs="filterConfigs"
        :presets="MATTER_FILTER_PRESETS"
        v-model="filterState"
        :loading="filtersLoading"
        @preset:apply="handlePresetApply"
        @preset:save="handlePresetSave"
        @preset:delete="handlePresetDelete"
        @export="handleExport"
      />

      <!-- Active Filters Summary -->
      <div v-if="filterState.filters.length > 0" class="active-filters">
        <h3 class="filter-summary-title">Active Filters ({{ filterState.filters.length }}):</h3>
        <div class="filter-summary-list">
          <div v-for="filter in filterState.filters" :key="`${filter.field}-${filter.operator}`">
            <strong>{{ filterConfigs.find(c => c.field === filter.field)?.label || filter.field }}:</strong>
            {{ getFilterDisplayValue(filter) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <main class="main-content">
      <!-- Loading State -->
      <div v-if="isLoading && !matters.length" class="loading-state">
        <div class="loading-spinner" />
        <p>Loading matters...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <h3>Error Loading Matters</h3>
          <p>{{ error }}</p>
          <Button @click="handleRetry" variant="outline">
            Retry
          </Button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!matters.length" class="empty-state">
        <div class="empty-content">
          <Grid3x3 class="empty-icon" />
          <h3>No Matters Found</h3>
          <p>Get started by creating your first legal matter.</p>
          <Button @click="handleCreateMatter">
            <Plus class="w-4 h-4 mr-2" />
            Create First Matter
          </Button>
        </div>
      </div>

      <!-- Kanban View -->
      <div v-else-if="currentView === 'kanban'" class="kanban-container">
        <KanbanBoard
          :show-filters="false"
          @matter-click="handleMatterClick"
          @matter-edit="handleMatterEdit"
        />
      </div>

      <!-- Table View -->
      <div v-else-if="currentView === 'table'" class="table-container">
        <!-- Use virtual table for large datasets -->
        <MatterTableVirtual
          v-if="enableVirtualScrolling && filteredCount > 100"
          :density="tableDensity"
          :show-column-visibility="true"
          @matter-click="handleMatterClick"
          @matter-edit="handleMatterEdit"
        />
        
        <!-- Use regular table for smaller datasets -->
        <MatterTableView
          v-else
          :density="tableDensity"
          :show-column-visibility="true"
          @matter-click="handleMatterClick"
          @matter-edit="handleMatterEdit"
        />
      </div>
    </main>

    <!-- View Settings Panel (Table specific) -->
    <div v-if="showViewSettings && currentView === 'table'" class="view-settings-panel">
      <Card>
        <CardHeader>
          <CardTitle>Table Settings</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Density Setting -->
          <div class="setting-group">
            <label class="setting-label">Row Density</label>
            <select v-model="tableDensity" class="setting-select">
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
              <option value="spacious">Spacious</option>
            </select>
          </div>

          <!-- Virtual Scrolling Toggle -->
          <div class="setting-group">
            <label class="setting-label">
              <input
                v-model="enableVirtualScrolling"
                type="checkbox"
                class="setting-checkbox"
              />
              Enable Virtual Scrolling
            </label>
            <p class="setting-help">
              Improves performance for large datasets (100+ matters)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.matters-page {
  @apply min-h-screen bg-background;
}

/* Page Header Styles */
.page-header {
  @apply border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60;
}

.header-content {
  @apply container mx-auto px-4 py-6 flex items-center justify-between;
}

.title-section {
  @apply space-y-1;
}

.page-title {
  @apply text-2xl font-bold tracking-tight;
}

.page-description {
  @apply text-muted-foreground;
}

.actions-section {
  @apply flex items-center gap-2;
}

.create-button {
  @apply bg-primary text-primary-foreground hover:bg-primary/90;
}

/* Stats Section */
.stats-section {
  @apply container mx-auto px-4 py-4;
}

.stats-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.stat-card {
  @apply border-0 shadow-none bg-muted/50;
}

.stat-content {
  @apply p-4 text-center;
}

.stat-value {
  @apply text-2xl font-bold text-primary;
}

.stat-label {
  @apply text-sm text-muted-foreground;
}

/* Controls Bar */
.controls-bar {
  @apply border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60;
  @apply sticky top-0 z-40;
}

.controls-content {
  @apply container mx-auto px-4 py-3 flex items-center justify-between gap-4;
}

.controls-left,
.controls-right {
  @apply flex items-center gap-2;
}

.search-container {
  @apply relative min-w-[300px];
}

.search-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none;
}

.search-input {
  @apply pl-10;
}

.controls-right .active {
  @apply bg-accent text-accent-foreground;
}

/* Filter Panel */
.filter-panel {
  @apply container mx-auto px-4 py-4 space-y-4;
}

.active-filters {
  @apply bg-muted/50 rounded-lg p-4;
}

.filter-summary-title {
  @apply text-sm font-medium mb-2;
}

.filter-summary-list {
  @apply space-y-1 text-sm text-muted-foreground;
}

/* Main Content */
.main-content {
  @apply container mx-auto px-4 py-6 flex-1;
}

/* Loading State */
.loading-state {
  @apply flex flex-col items-center justify-center py-12 space-y-4;
}

.loading-spinner {
  @apply w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin;
}

/* Error State */
.error-state {
  @apply flex items-center justify-center py-12;
}

.error-content {
  @apply text-center space-y-4 max-w-md;
}

.error-content h3 {
  @apply text-lg font-semibold;
}

.error-content p {
  @apply text-muted-foreground;
}

/* Empty State */
.empty-state {
  @apply flex items-center justify-center py-12;
}

.empty-content {
  @apply text-center space-y-4 max-w-md;
}

.empty-icon {
  @apply w-16 h-16 mx-auto text-muted-foreground opacity-50;
}

.empty-content h3 {
  @apply text-lg font-semibold;
}

.empty-content p {
  @apply text-muted-foreground;
}

/* View Containers */
.kanban-container,
.table-container {
  @apply w-full min-h-[600px];
}

/* View Settings Panel */
.view-settings-panel {
  @apply fixed top-20 right-4 w-80 z-50;
}

.setting-group {
  @apply space-y-2;
}

.setting-label {
  @apply text-sm font-medium flex items-center gap-2;
}

.setting-select {
  @apply w-full px-3 py-2 border border-border rounded-md bg-background text-foreground;
}

.setting-checkbox {
  @apply w-4 h-4 rounded border border-border;
}

.setting-help {
  @apply text-xs text-muted-foreground;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    @apply flex-col items-start gap-4;
  }

  .stats-grid {
    @apply grid-cols-2;
  }

  .controls-content {
    @apply flex-col items-stretch gap-4;
  }

  .controls-left,
  .controls-right {
    @apply justify-between;
  }

  .search-container {
    @apply min-w-full;
  }

  .view-settings-panel {
    @apply fixed inset-x-4 top-20 w-auto;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    @apply animate-none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .stat-card {
    @apply border border-border;
  }

  .controls-bar {
    @apply border-b-2;
  }
}
</style>