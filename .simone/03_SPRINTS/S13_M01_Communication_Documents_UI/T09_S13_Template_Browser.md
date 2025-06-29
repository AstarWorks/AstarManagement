# T09_S13 Template Browser - Template library with selection wizard

**Status**: TODO
**Assignee**: Unassigned
**Priority**: Medium
**Complexity**: Low (2-3 hours)
**Dependencies**: None

## Task Description

Implement a comprehensive template browser component that allows users to browse, search, preview, and select document templates. The browser should include categorization, search functionality, template preview, metadata display, favorites management, and usage statistics.

## Requirements

### Functional Requirements

1. **Template Gallery**
   - Grid layout with template cards showing:
     - Template name
     - Category badge
     - Preview thumbnail
     - Last updated date
     - Usage count
   - Responsive grid (4 columns desktop, 2 tablet, 1 mobile)
   - Hover effects with quick actions

2. **Template Categories**
   - Legal categories (Contracts, Agreements, Letters, Forms)
   - Business categories (Invoices, Reports, Proposals)
   - Communication categories (Memos, Notices, Emails)
   - Custom categories support
   - Category filtering sidebar

3. **Search & Filter**
   - Text search across template names and descriptions
   - Filter by category
   - Filter by date range (created/updated)
   - Filter by usage frequency
   - Sort options (name, date, popularity, recent)

4. **Template Preview**
   - Modal-based preview
   - Full template content display
   - Zoom controls
   - Page navigation for multi-page templates
   - Download preview option

5. **Template Metadata**
   - Created/updated dates
   - Author information
   - Version history
   - Required fields/variables
   - Estimated completion time
   - Related templates

6. **Favorites System**
   - Star/unstar templates
   - Quick access to favorites
   - Persistent favorites storage
   - Favorites count display

7. **Usage Statistics**
   - Times used counter
   - Last used date
   - Popular templates section
   - Usage trends visualization

### Non-Functional Requirements

1. **Performance**
   - Lazy loading for template thumbnails
   - Virtual scrolling for large template lists
   - Optimistic UI updates for favorites
   - Cached preview generation

2. **User Experience**
   - Intuitive navigation
   - Quick template selection
   - Clear visual hierarchy
   - Smooth animations/transitions

## Technical Guidance

### Component Structure

```vue
<!-- TemplateBrowser.vue -->
<template>
  <div class="template-browser">
    <!-- Header with search and view controls -->
    <div class="browser-header">
      <TemplateSearch 
        v-model="searchQuery"
        @search="handleSearch"
      />
      <TemplateViewControls
        v-model:view-mode="viewMode"
        v-model:sort-by="sortBy"
      />
    </div>

    <!-- Main content area -->
    <div class="browser-content">
      <!-- Categories sidebar -->
      <TemplateCategorySidebar
        v-model:selected-categories="selectedCategories"
        :categories="categories"
        :show-counts="true"
      />

      <!-- Template gallery -->
      <TemplateGallery
        :templates="filteredTemplates"
        :view-mode="viewMode"
        :loading="isLoading"
        @select="handleTemplateSelect"
        @preview="handleTemplatePreview"
        @toggle-favorite="handleToggleFavorite"
      />
    </div>

    <!-- Preview modal -->
    <TemplatePreviewModal
      v-model:open="showPreview"
      :template="selectedTemplate"
      @use="handleUseTemplate"
    />
  </div>
</template>
```

### Data Models

```typescript
interface Template {
  id: string
  name: string
  description: string
  category: TemplateCategory
  subcategory?: string
  thumbnailUrl: string
  previewUrl: string
  content: string
  variables: TemplateVariable[]
  metadata: TemplateMetadata
  statistics: TemplateStatistics
  isFavorite: boolean
  tags: string[]
  version: string
  createdAt: string
  updatedAt: string
  createdBy: User
}

interface TemplateCategory {
  id: string
  name: string
  icon: string
  color: string
  count: number
  subcategories?: TemplateCategory[]
}

interface TemplateVariable {
  key: string
  label: string
  type: 'text' | 'date' | 'number' | 'select'
  required: boolean
  defaultValue?: any
  options?: string[] // for select type
}

interface TemplateMetadata {
  language: 'en' | 'ja'
  fileType: 'docx' | 'pdf' | 'html'
  pageCount: number
  estimatedTime: number // minutes
  requiredFields: string[]
  relatedTemplates: string[]
}

interface TemplateStatistics {
  usageCount: number
  lastUsedAt?: string
  averageCompletionTime?: number
  userRating?: number
  favoriteCount: number
}
```

### State Management

```typescript
// stores/template-browser.ts
export const useTemplateBrowserStore = defineStore('template-browser', () => {
  // State
  const templates = ref<Template[]>([])
  const categories = ref<TemplateCategory[]>([])
  const favorites = ref<Set<string>>(new Set())
  const searchQuery = ref('')
  const selectedCategories = ref<string[]>([])
  const sortBy = ref<'name' | 'date' | 'usage'>('name')
  const viewMode = ref<'grid' | 'list'>('grid')
  
  // Computed
  const filteredTemplates = computed(() => {
    return templates.value.filter(template => {
      // Search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        const matchesSearch = 
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.tags.some(tag => tag.toLowerCase().includes(query))
        
        if (!matchesSearch) return false
      }
      
      // Category filter
      if (selectedCategories.value.length > 0) {
        if (!selectedCategories.value.includes(template.category.id)) {
          return false
        }
      }
      
      return true
    }).sort((a, b) => {
      switch (sortBy.value) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'date':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'usage':
          return b.statistics.usageCount - a.statistics.usageCount
        default:
          return 0
      }
    })
  })
  
  const favoriteTemplates = computed(() => 
    templates.value.filter(t => favorites.value.has(t.id))
  )
  
  const popularTemplates = computed(() =>
    [...templates.value]
      .sort((a, b) => b.statistics.usageCount - a.statistics.usageCount)
      .slice(0, 6)
  )
  
  // Actions
  const loadTemplates = async () => {
    const data = await $fetch('/api/templates')
    templates.value = data.templates
    categories.value = data.categories
  }
  
  const toggleFavorite = async (templateId: string) => {
    const isFavorite = favorites.value.has(templateId)
    
    if (isFavorite) {
      favorites.value.delete(templateId)
    } else {
      favorites.value.add(templateId)
    }
    
    // Update template
    const template = templates.value.find(t => t.id === templateId)
    if (template) {
      template.isFavorite = !isFavorite
      template.statistics.favoriteCount += isFavorite ? -1 : 1
    }
    
    // Persist to backend
    await $fetch(`/api/templates/${templateId}/favorite`, {
      method: 'POST',
      body: { isFavorite: !isFavorite }
    })
  }
  
  const recordUsage = async (templateId: string) => {
    const template = templates.value.find(t => t.id === templateId)
    if (template) {
      template.statistics.usageCount++
      template.statistics.lastUsedAt = new Date().toISOString()
    }
    
    await $fetch(`/api/templates/${templateId}/usage`, {
      method: 'POST'
    })
  }
  
  return {
    // State
    templates: readonly(templates),
    categories: readonly(categories),
    searchQuery,
    selectedCategories,
    sortBy,
    viewMode,
    
    // Computed
    filteredTemplates,
    favoriteTemplates,
    popularTemplates,
    
    // Actions
    loadTemplates,
    toggleFavorite,
    recordUsage
  }
})
```

### Template Gallery Component

```vue
<!-- TemplateGallery.vue -->
<template>
  <div class="template-gallery">
    <!-- Popular templates section -->
    <div v-if="showPopular && popularTemplates.length > 0" class="popular-section">
      <h3 class="section-title">Popular Templates</h3>
      <div class="popular-templates">
        <TemplateCard
          v-for="template in popularTemplates"
          :key="template.id"
          :template="template"
          :compact="true"
          @click="$emit('select', template)"
        />
      </div>
    </div>

    <!-- Main gallery -->
    <div 
      :class="[
        'gallery-grid',
        viewMode === 'list' ? 'list-view' : 'grid-view'
      ]"
    >
      <TransitionGroup name="template-card">
        <TemplateCard
          v-for="template in templates"
          :key="template.id"
          :template="template"
          :view-mode="viewMode"
          @click="$emit('select', template)"
          @preview="$emit('preview', template)"
          @toggle-favorite="$emit('toggle-favorite', template.id)"
        />
      </TransitionGroup>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && templates.length === 0" class="empty-state">
      <FileX class="empty-icon" />
      <p>No templates found</p>
      <Button variant="outline" @click="$emit('clear-filters')">
        Clear filters
      </Button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="skeleton-grid">
        <CardSkeleton v-for="i in 8" :key="i" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery-grid {
  display: grid;
  gap: 1.5rem;
}

.grid-view {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.list-view {
  grid-template-columns: 1fr;
}

@media (max-width: 768px) {
  .grid-view {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}

/* Card animations */
.template-card-enter-active,
.template-card-leave-active {
  transition: all 0.3s ease;
}

.template-card-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.template-card-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
```

### Template Card Component

```vue
<!-- TemplateCard.vue -->
<template>
  <Card 
    :class="[
      'template-card',
      { 
        'is-favorite': template.isFavorite,
        'list-mode': viewMode === 'list'
      }
    ]"
    @click="$emit('click', template)"
  >
    <div class="card-thumbnail">
      <img 
        :src="template.thumbnailUrl" 
        :alt="template.name"
        loading="lazy"
      />
      <div class="card-actions">
        <Button 
          size="icon" 
          variant="ghost"
          @click.stop="$emit('preview', template)"
        >
          <Eye class="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="ghost"
          @click.stop="$emit('toggle-favorite', template.id)"
        >
          <Star 
            class="h-4 w-4" 
            :class="{ 'fill-current': template.isFavorite }"
          />
        </Button>
      </div>
    </div>
    
    <CardContent>
      <div class="card-header">
        <h4 class="template-name">{{ template.name }}</h4>
        <Badge 
          :variant="getCategoryVariant(template.category)"
          class="category-badge"
        >
          {{ template.category.name }}
        </Badge>
      </div>
      
      <p class="template-description">
        {{ template.description }}
      </p>
      
      <div class="template-meta">
        <div class="meta-item">
          <FileText class="h-3 w-3" />
          <span>{{ template.metadata.pageCount }} pages</span>
        </div>
        <div class="meta-item">
          <Clock class="h-3 w-3" />
          <span>~{{ template.metadata.estimatedTime }}min</span>
        </div>
        <div class="meta-item">
          <TrendingUp class="h-3 w-3" />
          <span>{{ template.statistics.usageCount }} uses</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
```

### Preview Modal Component

```vue
<!-- TemplatePreviewModal.vue -->
<template>
  <Dialog v-model:open="open">
    <DialogContent class="template-preview-modal">
      <DialogHeader>
        <DialogTitle>{{ template.name }}</DialogTitle>
        <div class="preview-actions">
          <Button variant="outline" size="sm" @click="downloadPreview">
            <Download class="h-4 w-4 mr-2" />
            Download Preview
          </Button>
          <Button @click="$emit('use', template)">
            Use Template
          </Button>
        </div>
      </DialogHeader>
      
      <Tabs v-model="activeTab">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" class="preview-content">
          <div class="preview-controls">
            <Button size="icon" variant="ghost" @click="zoomOut">
              <ZoomOut class="h-4 w-4" />
            </Button>
            <span class="zoom-level">{{ zoomLevel }}%</span>
            <Button size="icon" variant="ghost" @click="zoomIn">
              <ZoomIn class="h-4 w-4" />
            </Button>
          </div>
          
          <div class="preview-viewer" :style="{ zoom: zoomLevel / 100 }">
            <iframe 
              :src="template.previewUrl"
              class="preview-frame"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="details">
          <TemplateDetails :template="template" />
        </TabsContent>
        
        <TabsContent value="variables">
          <TemplateVariables :variables="template.variables" />
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
```

### User Preferences Storage

```typescript
// composables/useTemplatePreferences.ts
export const useTemplatePreferences = () => {
  const STORAGE_KEY = 'template-browser-preferences'
  
  const preferences = ref({
    viewMode: 'grid' as 'grid' | 'list',
    sortBy: 'name' as 'name' | 'date' | 'usage',
    showCategories: true,
    favoriteIds: [] as string[],
    recentlyUsed: [] as string[],
    categoryExpanded: {} as Record<string, boolean>
  })
  
  // Load from localStorage
  const loadPreferences = () => {
    if (process.client) {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        preferences.value = { ...preferences.value, ...JSON.parse(stored) }
      }
    }
  }
  
  // Save to localStorage
  const savePreferences = () => {
    if (process.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences.value))
    }
  }
  
  // Watch for changes and auto-save
  watch(preferences, savePreferences, { deep: true })
  
  // Initialize
  onMounted(loadPreferences)
  
  return {
    preferences: readonly(preferences),
    updatePreferences: (updates: Partial<typeof preferences.value>) => {
      preferences.value = { ...preferences.value, ...updates }
    }
  }
}
```

## Implementation Steps

1. **Create Core Components**
   - TemplateBrowser.vue (main container)
   - TemplateGallery.vue (grid/list view)
   - TemplateCard.vue (individual template card)
   - TemplateCategorySidebar.vue (category filter)
   - TemplateSearch.vue (search component)
   - TemplatePreviewModal.vue (preview dialog)

2. **Implement State Management**
   - Create template browser store
   - Add API integration
   - Implement filtering logic
   - Add favorites management

3. **Add Search & Filter**
   - Text search with debouncing
   - Category filtering
   - Sort functionality
   - Clear filters action

4. **Create Preview System**
   - Modal-based preview
   - Zoom controls
   - Tab navigation
   - Download functionality

5. **Add Statistics Tracking**
   - Usage counter
   - Last used tracking
   - Popular templates
   - Analytics integration

6. **Implement Favorites**
   - Toggle favorite action
   - Persistent storage
   - Quick access view
   - Sync with backend

## Testing Requirements

1. **Unit Tests**
   - Gallery component rendering
   - Filter logic
   - Search functionality
   - Store actions

2. **Integration Tests**
   - Full browser workflow
   - API integration
   - Preference persistence
   - Modal interactions

3. **E2E Tests**
   - Template selection flow
   - Search and filter
   - Favorite management
   - Preview functionality

## Accessibility

- Keyboard navigation for gallery
- Screen reader announcements
- Focus management in modals
- ARIA labels for actions

## Performance Considerations

- Virtual scrolling for large lists
- Lazy loading images
- Debounced search
- Optimistic UI updates
- Cached preview generation

## References

- Card component pattern: `/frontend/src/components/ui/card/Card.vue`
- Gallery layout: `/frontend/src/components/kanban/MatterCard.vue`
- Modal pattern: `/frontend/src/components/ui/dialog/Dialog.vue`
- Filter pattern: `/frontend/src/components/kanban/FilterBar.vue`
- Statistics API: `/frontend/src/server/api/matters/statistics.get.ts`
- Preferences storage: `/frontend/src/stores/kanban/ui-preferences.ts`

## Acceptance Criteria

- [ ] Template gallery displays all available templates
- [ ] Categories are shown and filterable
- [ ] Search works across template names and descriptions
- [ ] Templates can be previewed in a modal
- [ ] Favorites can be toggled and persisted
- [ ] Usage statistics are tracked and displayed
- [ ] Responsive design works on all screen sizes
- [ ] Performance is optimized for large template lists
- [ ] All components are accessible
- [ ] User preferences are persisted

## Time Estimate

- Component development: 1.5 hours
- State management: 0.5 hours
- API integration: 0.5 hours
- Testing & refinement: 0.5 hours

**Total: 3 hours**