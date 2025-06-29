<template>
  <div class="template-browser">
    <!-- Header -->
    <div class="browser-header">
      <div class="header-content">
        <div class="header-info">
          <h2 class="browser-title">Template Browser</h2>
          <p class="browser-description">
            Browse and select from our collection of professional document templates
          </p>
        </div>
        
        <div class="header-actions">
          <Button 
            variant="outline"
            size="sm"
            @click="refreshTemplates"
            :disabled="loading"
          >
            <RotateCcw class="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <!-- Search bar -->
      <div class="search-container">
        <TemplateSearch 
          @search="handleSearch"
          :show-suggestions="!hasActiveFilters"
        />
      </div>
    </div>

    <!-- Main content -->
    <div class="browser-content">
      <!-- Sidebar -->
      <div 
        :class="[
          'browser-sidebar',
          { 'sidebar-collapsed': sidebarCollapsed }
        ]"
      >
        <div class="sidebar-header">
          <Button
            size="icon"
            variant="ghost"
            class="sidebar-toggle"
            @click="toggleSidebar"
            :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          >
            <ChevronLeft 
              class="h-4 w-4 transition-transform duration-200"
              :class="{ 'rotate-180': sidebarCollapsed }"
            />
          </Button>
        </div>
        
        <div v-show="!sidebarCollapsed" class="sidebar-content">
          <TemplateCategorySidebar
            :categories="categories"
            :show-counts="true"
          />
        </div>
      </div>

      <!-- Gallery -->
      <div class="gallery-container">
        <!-- Quick access tabs -->
        <Tabs v-model="activeTab" class="gallery-tabs">
          <TabsList class="tabs-list">
            <TabsTrigger value="all">
              All Templates
              <Badge variant="secondary" class="ml-2">
                {{ templateStats.total }}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="favorites">
              Favorites
              <Badge variant="secondary" class="ml-2">
                {{ templateStats.favorites }}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="recent">
              Recent
              <Badge variant="secondary" class="ml-2">
                {{ recentTemplates.length }}
              </Badge>
            </TabsTrigger>
          </TabsList>
          
          <!-- All Templates Tab -->
          <TabsContent value="all" class="tab-content">
            <TemplateGallery
              :templates="filteredTemplates"
              :popular-templates="popularTemplates"
              :recent-templates="recentTemplates"
              :loading="loading"
              :view-mode="viewMode"
              :sort-by="sortBy"
              :show-popular="!hasActiveFilters"
              :show-recent="!hasActiveFilters"
              :has-active-filters="hasActiveFilters"
              :total-count="templateStats.total"
              @select="handleTemplateSelect"
              @preview="handleTemplatePreview"
              @toggle-favorite="handleToggleFavorite"
              @update:view-mode="viewMode = $event"
              @update:sort-by="handleSortChange"
              @clear-filters="clearAllFilters"
            />
          </TabsContent>
          
          <!-- Favorites Tab -->
          <TabsContent value="favorites" class="tab-content">
            <TemplateGallery
              :templates="favoriteTemplates"
              :loading="loading"
              :view-mode="viewMode"
              :sort-by="sortBy"
              :show-popular="false"
              :show-recent="false"
              :has-active-filters="false"
              @select="handleTemplateSelect"
              @preview="handleTemplatePreview"
              @toggle-favorite="handleToggleFavorite"
              @update:view-mode="viewMode = $event"
              @update:sort-by="handleSortChange"
            />
          </TabsContent>
          
          <!-- Recent Tab -->
          <TabsContent value="recent" class="tab-content">
            <TemplateGallery
              :templates="recentTemplates"
              :loading="loading"
              :view-mode="viewMode"
              :sort-by="sortBy"
              :show-popular="false"
              :show-recent="false"
              :has-active-filters="false"
              @select="handleTemplateSelect"
              @preview="handleTemplatePreview"
              @toggle-favorite="handleToggleFavorite"
              @update:view-mode="viewMode = $event"
              @update:sort-by="handleSortChange"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>

    <!-- Preview Modal -->
    <TemplatePreviewModal
      v-model:open="showPreview"
      :template="selectedTemplate"
      @use="handleUseTemplate"
    />

    <!-- Error Toast -->
    <div v-if="error" class="error-toast">
      <Alert variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {{ error }}
          <Button
            size="sm"
            variant="outline"
            class="ml-2"
            @click="error = null"
          >
            Dismiss
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  RotateCcw, 
  ChevronLeft, 
  AlertCircle 
} from 'lucide-vue-next'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import TemplateSearch from './TemplateSearch.vue'
import TemplateCategorySidebar from './TemplateCategorySidebar.vue'
import TemplateGallery from './TemplateGallery.vue'
import TemplatePreviewModal from './TemplatePreviewModal.vue'
import { useTemplateBrowserStore } from '@/stores/templateBrowser'
import { storeToRefs } from 'pinia'
import type { Template, TemplateSortOptions } from '@/types/template'

interface Props {
  matterId?: string
  initialCategory?: string
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

const emit = defineEmits<{
  'template-selected': [template: Template]
  'template-used': [template: Template]
}>()

// Store
const store = useTemplateBrowserStore()
const {
  templates,
  categories,
  filteredTemplates,
  favoriteTemplates,
  popularTemplates,
  recentTemplates,
  templateStats,
  loading,
  error,
  selectedTemplate,
  showPreview,
  viewMode,
  sortBy
} = storeToRefs(store)

// Local state
const activeTab = ref('all')
const sidebarCollapsed = ref(false)

// Computed
const hasActiveFilters = computed(() => 
  store.searchQuery.trim() !== '' ||
  store.selectedCategories.length > 0 ||
  store.selectedFileTypes.length > 0 ||
  store.selectedLanguages.length > 0 ||
  store.favoritesOnly ||
  store.recentlyUsedOnly
)

// Methods
const handleSearch = (query: string) => {
  // Search is handled by the store automatically
  console.log('Search query:', query)
}

const handleTemplateSelect = (template: Template) => {
  emit('template-selected', template)
}

const handleTemplatePreview = (template: Template) => {
  store.openPreview(template)
}

const handleToggleFavorite = async (templateId: string) => {
  try {
    await store.toggleFavorite(templateId)
  } catch (err) {
    console.error('Failed to toggle favorite:', err)
  }
}

const handleUseTemplate = async (template: Template) => {
  try {
    await store.recordUsage(template.id)
    emit('template-used', template)
  } catch (err) {
    console.error('Failed to record usage:', err)
  }
}

const handleSortChange = (sort: TemplateSortOptions) => {
  store.setSort(sort.field, sort.direction)
}

const clearAllFilters = () => {
  store.clearFilters()
}

const refreshTemplates = async () => {
  await store.loadTemplates(true)
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// Watchers
watch(() => props.initialCategory, (categoryId) => {
  if (categoryId && store.selectedCategories.length === 0) {
    store.selectedCategories = [categoryId]
  }
})

// Initialize
onMounted(async () => {
  await store.loadTemplates()
  
  // Set initial category if provided
  if (props.initialCategory) {
    store.selectedCategories = [props.initialCategory]
  }
})
</script>

<style scoped>
.template-browser {
  @apply flex flex-col h-full bg-background;
}

/* Header */
.browser-header {
  @apply space-y-4 p-6 border-b border-border bg-card;
}

.header-content {
  @apply flex items-start justify-between;
}

.header-info {
  @apply space-y-1;
}

.browser-title {
  @apply text-2xl font-bold text-foreground;
}

.browser-description {
  @apply text-muted-foreground;
}

.header-actions {
  @apply flex gap-2;
}

.search-container {
  @apply max-w-2xl;
}

/* Content */
.browser-content {
  @apply flex flex-1 overflow-hidden;
}

/* Sidebar */
.browser-sidebar {
  @apply relative bg-card border-r border-border transition-all duration-300 ease-in-out;
  width: 280px;
}

.sidebar-collapsed {
  width: 48px;
}

.sidebar-header {
  @apply p-2 border-b border-border;
}

.sidebar-toggle {
  @apply w-full;
}

.sidebar-content {
  @apply overflow-y-auto;
  height: calc(100% - 56px);
}

/* Gallery */
.gallery-container {
  @apply flex-1 flex flex-col overflow-hidden;
}

.gallery-tabs {
  @apply flex-1 flex flex-col;
}

.tabs-list {
  @apply mx-6 mt-4;
}

.tab-content {
  @apply flex-1 overflow-auto px-6 py-4;
}

/* Error toast */
.error-toast {
  @apply fixed bottom-4 right-4 z-50 w-96;
}

/* Responsive design */
@media (max-width: 1024px) {
  .browser-sidebar {
    @apply absolute left-0 top-0 bottom-0 z-10 shadow-lg;
  }
  
  .sidebar-collapsed {
    @apply -translate-x-full;
    width: 280px;
  }
  
  .sidebar-toggle {
    @apply fixed top-4 left-4 z-20 bg-background border border-border rounded-md;
  }
}

@media (max-width: 768px) {
  .browser-header {
    @apply p-4;
  }
  
  .header-content {
    @apply flex-col gap-4 items-stretch;
  }
  
  .tab-content {
    @apply px-4;
  }
  
  .error-toast {
    @apply w-full left-4 right-4;
  }
}

@media (max-width: 640px) {
  .browser-title {
    @apply text-xl;
  }
  
  .tabs-list {
    @apply mx-4;
  }
  
  .tab-content {
    @apply px-2;
  }
}

/* Animation for sidebar */
.browser-sidebar {
  transform-origin: left center;
}

/* Improved focus styles */
.sidebar-toggle:focus-visible {
  @apply ring-2 ring-primary ring-offset-2;
}

/* Enhanced visual hierarchy */
.browser-header {
  background: linear-gradient(to bottom, hsl(var(--card)), hsl(var(--card) / 0.95));
}

/* Loading states */
.template-browser[data-loading="true"] {
  @apply pointer-events-none;
}

.template-browser[data-loading="true"] .browser-header {
  @apply opacity-75;
}

/* Scrollbar styling */
.sidebar-content::-webkit-scrollbar {
  @apply w-2;
}

.sidebar-content::-webkit-scrollbar-track {
  @apply bg-muted/30;
}

.sidebar-content::-webkit-scrollbar-thumb {
  @apply bg-muted-foreground/30 rounded-full;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  @apply bg-muted-foreground/50;
}

/* Performance optimizations */
.browser-content {
  contain: layout style paint;
}

.gallery-container {
  will-change: scroll-position;
}

/* Accessibility improvements */
.template-browser {
  @apply focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background;
}

/* Dark mode enhancements */
@media (prefers-color-scheme: dark) {
  .browser-header {
    background: linear-gradient(to bottom, hsl(var(--card)), hsl(var(--card) / 0.98));
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .browser-sidebar {
    @apply border-2;
  }
  
  .sidebar-toggle {
    @apply border-2;
  }
}

/* Reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .browser-sidebar {
    @apply transition-none;
  }
  
  .sidebar-toggle .lucide {
    @apply transition-none;
  }
}
</style>