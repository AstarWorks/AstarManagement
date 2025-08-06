---
task_id: T07_S03_M003
title: Tag Management UI with CRUD Operations and Usage Statistics
status: pending
estimated_hours: 8
actual_hours: null
assigned_to: Claude
dependencies: ["T05_S02_M003_Mock_Data_Service"]
complexity: Medium
updated: null
completed: null
---

# T07_S03_M003: Tag Management UI with CRUD Operations and Usage Statistics

## Description
Implement comprehensive tag management interface with full CRUD operations, tag assignment to expenses, hierarchical display of tenant vs personal tags, and detailed usage statistics. Build upon the existing tag domain model and API to provide users with powerful categorization tools for expense organization and reporting.

## Acceptance Criteria
- [ ] Create tag management dashboard with list view and creation form
- [ ] Implement tag CRUD operations (Create, Read, Update, Delete)
- [ ] Add tag assignment interface for expense categorization
- [ ] Display tag hierarchy with tenant vs personal scope visualization
- [ ] Show usage statistics including count, trends, and expense totals
- [ ] Support tag color customization with predefined palette
- [ ] Implement search and filtering for tag discovery
- [ ] Add bulk tag operations for expense management
- [ ] Responsive design for mobile and desktop use
- [ ] Japanese localization for all tag management interfaces

## Technical Details

### 1. Tag Management Dashboard

**Location**: `frontend/app/pages/tags/index.vue`

```vue
<template>
  <div class="tag-management-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">{{ $t('tags.management.title') }}</h1>
        <p class="page-description">{{ $t('tags.management.description') }}</p>
      </div>
      
      <div class="header-actions">
        <Button @click="openCreateDialog">
          <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
          {{ $t('tags.actions.create') }}
        </Button>
      </div>
    </div>

    <!-- Tag Statistics Summary -->
    <div class="stats-grid">
      <Card>
        <CardHeader>
          <CardTitle>{{ $t('tags.stats.totalTags') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="stat-value">{{ tagStats.total }}</div>
          <div class="stat-breakdown">
            <span class="tenant-tags">{{ tagStats.tenantTags }} {{ $t('tags.scope.tenant') }}</span>
            <span class="personal-tags">{{ tagStats.personalTags }} {{ $t('tags.scope.personal') }}</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{{ $t('tags.stats.mostUsed') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="mostUsedTag" class="most-used-tag">
            <TagBadge :tag="mostUsedTag" :show-count="true" />
            <div class="usage-trend">
              <Icon 
                :name="mostUsedTag.usageTrend > 0 ? 'lucide:trending-up' : 'lucide:trending-down'" 
                class="w-4 h-4"
                :class="mostUsedTag.usageTrend > 0 ? 'text-green-500' : 'text-red-500'"
              />
              <span>{{ formatUsageTrend(mostUsedTag.usageTrend) }}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{{ $t('tags.stats.totalExpenseAmount') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="stat-value">{{ formatCurrency(tagStats.totalAmount) }}</div>
          <div class="stat-subtitle">{{ $t('tags.stats.acrossAllTags') }}</div>
        </CardContent>
      </Card>
    </div>

    <!-- Filters and Search -->
    <Card class="filters-card">
      <CardContent class="filters-content">
        <div class="filter-row">
          <div class="search-input">
            <Icon name="lucide:search" class="search-icon" />
            <Input
              v-model="searchQuery"
              :placeholder="$t('tags.search.placeholder')"
              class="pl-10"
            />
          </div>
          
          <Select v-model="scopeFilter">
            <SelectTrigger class="w-48">
              <SelectValue :placeholder="$t('tags.filters.scope.all')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{{ $t('tags.filters.scope.all') }}</SelectItem>
              <SelectItem value="TENANT">{{ $t('tags.scope.tenant') }}</SelectItem>
              <SelectItem value="PERSONAL">{{ $t('tags.scope.personal') }}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select v-model="sortBy">
            <SelectTrigger class="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">{{ $t('tags.sort.name') }}</SelectItem>
              <SelectItem value="usageCount">{{ $t('tags.sort.usage') }}</SelectItem>
              <SelectItem value="lastUsedAt">{{ $t('tags.sort.lastUsed') }}</SelectItem>
              <SelectItem value="createdAt">{{ $t('tags.sort.created') }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>

    <!-- Tag List -->
    <Card>
      <CardHeader>
        <div class="flex justify-between items-center">
          <CardTitle>{{ $t('tags.list.title') }}</CardTitle>
          <div class="view-controls">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              @click="viewMode = 'grid'"
            >
              <Icon name="lucide:grid-3x3" class="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              @click="viewMode = 'list'"
            >
              <Icon name="lucide:list" class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Grid View -->
        <div v-if="viewMode === 'grid'" class="tags-grid">
          <TagCard
            v-for="tag in filteredTags"
            :key="tag.id"
            :tag="tag"
            :show-stats="true"
            @edit="openEditDialog"
            @delete="confirmDelete"
            @view-expenses="viewTagExpenses"
          />
        </div>
        
        <!-- List View -->
        <div v-else class="tags-list">
          <TagListItem
            v-for="tag in filteredTags"
            :key="tag.id"
            :tag="tag"
            :show-detailed-stats="true"
            @edit="openEditDialog"
            @delete="confirmDelete"
            @view-expenses="viewTagExpenses"
          />
        </div>
        
        <!-- Empty State -->
        <EmptyState
          v-if="filteredTags.length === 0"
          :title="$t('tags.empty.title')"
          :description="$t('tags.empty.description')"
          icon="lucide:tag"
        >
          <Button @click="openCreateDialog">
            {{ $t('tags.actions.createFirst') }}
          </Button>
        </EmptyState>
      </CardContent>
    </Card>

    <!-- Create/Edit Dialog -->
    <TagFormDialog
      v-model:open="dialogOpen"
      :tag="selectedTag"
      :mode="dialogMode"
      @saved="handleTagSaved"
    />

    <!-- Delete Confirmation -->
    <DeleteConfirmationDialog
      v-model:open="deleteDialogOpen"
      :title="$t('tags.delete.title')"
      :description="$t('tags.delete.description', { name: tagToDelete?.name })"
      :warning="tagToDelete?.usageCount > 0 ? $t('tags.delete.usageWarning', { count: tagToDelete.usageCount }) : undefined"
      @confirmed="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type { ITag, ITagWithStats, TagScope } from '~/types/expense/tag'
import { useTagManagement } from '~/composables/useTagManagement'

// Page setup
definePageMeta({
  title: 'tags.management.title',
  requiresAuth: true
})

const { t } = useI18n()

// Composables
const {
  tags,
  tagStats,
  isLoading,
  createTag,
  updateTag,
  deleteTag,
  loadTags,
  loadTagStats
} = useTagManagement()

// State
const searchQuery = ref('')
const scopeFilter = ref<TagScope | ''>('')
const sortBy = ref('usageCount')
const viewMode = ref<'grid' | 'list'>('grid')
const dialogOpen = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const selectedTag = ref<ITag>()
const deleteDialogOpen = ref(false)
const tagToDelete = ref<ITag>()

// Computed
const filteredTags = computed(() => {
  let filtered = tags.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(tag => 
      tag.name.toLowerCase().includes(query)
    )
  }

  // Scope filter
  if (scopeFilter.value) {
    filtered = filtered.filter(tag => tag.scope === scopeFilter.value)
  }

  // Sort
  return filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'usageCount':
        return b.usageCount - a.usageCount
      case 'lastUsedAt':
        return new Date(b.lastUsedAt || 0).getTime() - new Date(a.lastUsedAt || 0).getTime()
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default:
        return 0
    }
  })
})

const mostUsedTag = computed(() => {
  return tags.value.reduce((prev, current) => 
    (current.usageCount > prev.usageCount) ? current : prev
  , tags.value[0])
})

// Methods
const openCreateDialog = () => {
  selectedTag.value = undefined
  dialogMode.value = 'create'
  dialogOpen.value = true
}

const openEditDialog = (tag: ITag) => {
  selectedTag.value = tag
  dialogMode.value = 'edit'
  dialogOpen.value = true
}

const confirmDelete = (tag: ITag) => {
  tagToDelete.value = tag
  deleteDialogOpen.value = true
}

const handleTagSaved = async () => {
  await loadTags()
  await loadTagStats()
  dialogOpen.value = false
}

const handleDelete = async () => {
  if (tagToDelete.value) {
    await deleteTag(tagToDelete.value.id)
    await loadTags()
    await loadTagStats()
  }
  deleteDialogOpen.value = false
}

const viewTagExpenses = (tag: ITag) => {
  navigateTo(`/expenses?tagId=${tag.id}`)
}

const formatUsageTrend = (trend: number): string => {
  const percentage = Math.abs(trend * 100).toFixed(1)
  return `${percentage}%`
}

// Load initial data
onMounted(() => {
  loadTags()
  loadTagStats()
})
</script>
```

### 2. Tag Card Component

**Location**: `frontend/app/components/tags/TagCard.vue`

```vue
<template>
  <Card class="tag-card" :class="{ 'personal-tag': tag.scope === 'PERSONAL' }">
    <CardHeader class="pb-3">
      <div class="flex justify-between items-start">
        <div class="tag-info">
          <TagBadge :tag="tag" size="lg" />
          <div class="tag-scope">
            <Icon 
              :name="tag.scope === 'PERSONAL' ? 'lucide:user' : 'lucide:users'" 
              class="w-3 h-3 mr-1" 
            />
            <span class="text-xs text-muted-foreground">
              {{ $t(`tags.scope.${tag.scope.toLowerCase()}`) }}
            </span>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="sm">
              <Icon name="lucide:more-horizontal" class="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="$emit('edit', tag)">
              <Icon name="lucide:edit" class="w-4 h-4 mr-2" />
              {{ $t('tags.actions.edit') }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="$emit('viewExpenses', tag)">
              <Icon name="lucide:eye" class="w-4 h-4 mr-2" />
              {{ $t('tags.actions.viewExpenses') }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              @click="$emit('delete', tag)"
              class="text-destructive"
            >
              <Icon name="lucide:trash-2" class="w-4 h-4 mr-2" />
              {{ $t('tags.actions.delete') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
    
    <CardContent v-if="showStats" class="pt-0">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">{{ $t('tags.stats.usageCount') }}</div>
          <div class="stat-value">{{ tag.usageCount }}</div>
          <div v-if="tag.usageTrend !== 0" class="stat-trend">
            <Icon 
              :name="tag.usageTrend > 0 ? 'lucide:trending-up' : 'lucide:trending-down'" 
              class="w-3 h-3"
              :class="tag.usageTrend > 0 ? 'text-green-500' : 'text-red-500'"
            />
            <span class="text-xs">{{ formatTrend(tag.usageTrend) }}</span>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">{{ $t('tags.stats.totalAmount') }}</div>
          <div class="stat-value">{{ formatCurrency(tag.totalAmount) }}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">{{ $t('tags.stats.averageAmount') }}</div>
          <div class="stat-value">{{ formatCurrency(tag.averageAmount) }}</div>
        </div>
        
        <div v-if="tag.lastUsedAt" class="stat-item">
          <div class="stat-label">{{ $t('tags.stats.lastUsed') }}</div>
          <div class="stat-value text-sm">{{ formatDate(tag.lastUsedAt) }}</div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { ITagWithStats } from '~/types/expense/tag'

interface Props {
  tag: ITagWithStats
  showStats?: boolean
}

interface Emits {
  (event: 'edit', tag: ITagWithStats): void
  (event: 'delete', tag: ITagWithStats): void
  (event: 'viewExpenses', tag: ITagWithStats): void
}

const props = withDefaults(defineProps<Props>(), {
  showStats: true
})

const emit = defineEmits<Emits>()

const { formatCurrency, formatDate } = useExpenseFormatters()

const formatTrend = (trend: number): string => {
  const percentage = Math.abs(trend * 100).toFixed(1)
  return `${percentage}%`
}
</script>
```

### 3. Tag Assignment Component

**Location**: `frontend/app/components/tags/TagAssignment.vue`

```vue
<template>
  <div class="tag-assignment">
    <!-- Assigned Tags Display -->
    <div class="assigned-tags">
      <div class="section-header">
        <h4>{{ $t('tags.assignment.currentTags') }}</h4>
        <Badge variant="secondary">{{ assignedTags.length }}</Badge>
      </div>
      
      <div v-if="assignedTags.length > 0" class="tag-list">
        <div
          v-for="tag in assignedTags"
          :key="tag.id"
          class="assigned-tag-item"
        >
          <TagBadge :tag="tag" />
          <Button
            variant="ghost"
            size="sm"
            @click="removeTag(tag)"
          >
            <Icon name="lucide:x" class="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div v-else class="empty-tags">
        <p class="text-sm text-muted-foreground">
          {{ $t('tags.assignment.noTags') }}
        </p>
      </div>
    </div>

    <!-- Tag Assignment Interface -->
    <div class="tag-assignment-interface">
      <div class="section-header">
        <h4>{{ $t('tags.assignment.addTags') }}</h4>
      </div>
      
      <!-- Quick Suggestions -->
      <div v-if="suggestedTags.length > 0" class="tag-suggestions">
        <p class="suggestions-label">{{ $t('tags.assignment.suggestions') }}</p>
        <div class="suggestions-list">
          <Button
            v-for="tag in suggestedTags"
            :key="tag.id"
            variant="outline"
            size="sm"
            @click="addTag(tag)"
            :disabled="isTagAssigned(tag.id)"
          >
            <TagBadge :tag="tag" size="sm" />
            <span class="ml-2 text-xs text-muted-foreground">
              ({{ tag.usageCount }})
            </span>
          </Button>
        </div>
      </div>

      <!-- Search and Browse -->
      <div class="tag-search">
        <div class="search-input">
          <Icon name="lucide:search" class="search-icon" />
          <Input
            v-model="searchQuery"
            :placeholder="$t('tags.search.placeholder')"
            class="pl-10"
            @input="searchTags"
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          @click="showCreateDialog = true"
        >
          <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
          {{ $t('tags.actions.createNew') }}
        </Button>
      </div>

      <!-- Search Results -->
      <div v-if="searchResults.length > 0" class="search-results">
        <div class="results-header">
          <h5>{{ $t('tags.search.results') }} ({{ searchResults.length }})</h5>
        </div>
        <div class="results-list">
          <div
            v-for="tag in searchResults"
            :key="tag.id"
            class="search-result-item"
            :class="{ disabled: isTagAssigned(tag.id) }"
          >
            <TagBadge :tag="tag" />
            <div class="tag-meta">
              <span class="usage-count">{{ tag.usageCount }} uses</span>
              <Badge 
                variant={tag.scope === 'PERSONAL' ? 'default' : 'secondary'}
                size="sm"
              >
                {{ $t(`tags.scope.${tag.scope.toLowerCase()}`) }}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              @click="addTag(tag)"
              :disabled="isTagAssigned(tag.id)"
            >
              <Icon name="lucide:plus" class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Create Dialog -->
    <TagFormDialog
      v-model:open="showCreateDialog"
      mode="create"
      :quick-create="true"
      @saved="handleTagCreated"
    />
  </div>
</template>

<script setup lang="ts">
import type { ITag } from '~/types/expense/tag'
import { useTagAssignment } from '~/composables/useTagAssignment'

interface Props {
  assignedTagIds: string[]
  expenseId?: string
}

interface Emits {
  (event: 'update:assignedTagIds', tagIds: string[]): void
  (event: 'tagsChanged', tags: ITag[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

// Composables
const {
  availableTags,
  suggestedTags,
  searchResults,
  searchTags,
  loadSuggestions
} = useTagAssignment()

// Local state
const searchQuery = ref('')
const showCreateDialog = ref(false)

// Computed
const assignedTags = computed(() =>
  availableTags.value.filter(tag => props.assignedTagIds.includes(tag.id))
)

// Methods
const isTagAssigned = (tagId: string): boolean => {
  return props.assignedTagIds.includes(tagId)
}

const addTag = (tag: ITag) => {
  if (!isTagAssigned(tag.id)) {
    const newTagIds = [...props.assignedTagIds, tag.id]
    emit('update:assignedTagIds', newTagIds)
    emit('tagsChanged', availableTags.value.filter(t => newTagIds.includes(t.id)))
  }
}

const removeTag = (tag: ITag) => {
  const newTagIds = props.assignedTagIds.filter(id => id !== tag.id)
  emit('update:assignedTagIds', newTagIds)
  emit('tagsChanged', availableTags.value.filter(t => newTagIds.includes(t.id)))
}

const handleTagCreated = (newTag: ITag) => {
  // Automatically assign the newly created tag
  addTag(newTag)
  showCreateDialog.value = false
}

// Load initial data
onMounted(() => {
  loadSuggestions(props.expenseId)
})
</script>
```

## Technical Guidance

### Integration Points

**Tag API Integration** (use existing backend):
```typescript
// composables/useTagManagement.ts
import type { ITag, ITagWithStats, ICreateTagRequest, IUpdateTagRequest, TagScope } from '~/types/expense/tag'

export function useTagManagement() {
  const tags = ref<ITagWithStats[]>([])
  const tagStats = ref({
    total: 0,
    tenantTags: 0,
    personalTags: 0,
    totalAmount: 0
  })
  const isLoading = ref(false)

  const loadTags = async (filters?: { scope?: TagScope; search?: string }) => {
    isLoading.value = true
    try {
      // Use existing TagController endpoints
      const response = await $fetch('/api/v1/tags', {
        query: filters
      })
      tags.value = response
    } catch (error) {
      console.error('Failed to load tags:', error)
    } finally {
      isLoading.value = false
    }
  }

  const createTag = async (request: ICreateTagRequest) => {
    return await $fetch('/api/v1/tags', {
      method: 'POST',
      body: request
    })
  }

  const updateTag = async (id: string, request: IUpdateTagRequest) => {
    return await $fetch(`/api/v1/tags/${id}`, {
      method: 'PUT',
      body: request
    })
  }

  const deleteTag = async (id: string) => {
    await $fetch(`/api/v1/tags/${id}`, {
      method: 'DELETE'
    })
  }

  return {
    tags: readonly(tags),
    tagStats: readonly(tagStats),
    isLoading: readonly(isLoading),
    loadTags,
    createTag,
    updateTag,
    deleteTag,
    loadTagStats
  }
}
```

**Expense Integration** (update existing expense forms):
```vue
<!-- In ExpenseFormFields.vue, add tag assignment -->
<div class="form-field">
  <FormLabel>{{ $t('expense.form.fields.tags') }}</FormLabel>
  <TagAssignment
    v-model:assigned-tag-ids="form.tagIds"
    :expense-id="expenseId"
    @tags-changed="handleTagsChanged"
  />
</div>
```

## Research Findings

### Existing Codebase Patterns

**Tag Domain Model** (from `Tag.kt`):
- UUID-based identification with tenant isolation
- Support for TENANT and PERSONAL scopes
- Usage tracking with count and last used timestamp
- Color customization with hex validation
- Soft delete capability through AuditInfo

**Tag API Structure** (from `TagController.kt`):
- RESTful endpoints for full CRUD operations
- Suggestions endpoint for frequent tags
- Search and filtering capabilities
- Validation through request DTOs

**Frontend Type System** (from `tag.ts`):
- Comprehensive interfaces matching backend
- Predefined color palette for consistency
- Usage statistics extensions for UI display
- Filter and sort criteria definitions

### UI Component Patterns

**Existing Patterns to Follow**:
- Card-based layouts for data display
- DropdownMenu for action menus
- Button variants and consistent sizing
- Search input with icon placement
- Empty states with call-to-action buttons
- Modal dialogs for forms and confirmations

## Implementation Notes

### Step-by-Step Approach

1. **Create Core Components** (40% of effort):
   - TagCard component with statistics display
   - TagBadge component for consistent tag styling
   - TagFormDialog for create/edit operations
   - TagListItem for list view format

2. **Build Management Dashboard** (30% of effort):
   - Main tags page with filtering and search
   - Statistics dashboard with usage insights
   - Grid and list view modes
   - Bulk operations interface

3. **Implement Assignment Interface** (20% of effort):
   - TagAssignment component for expense forms
   - Search and suggestion functionality
   - Quick tag creation from assignment context

4. **Integration and Polish** (10% of effort):
   - Update existing expense forms
   - Add navigation menu items
   - Implement responsive design
   - Add Japanese localization

### Component Architecture

**Composables Structure**:
- `useTagManagement`: Core CRUD operations
- `useTagAssignment`: Tag assignment logic
- `useTagStats`: Usage statistics calculations
- `useTagFilters`: Search and filtering utilities

**Component Hierarchy**:
```
pages/tags/index.vue
├── components/tags/TagCard.vue
├── components/tags/TagListItem.vue
├── components/tags/TagFormDialog.vue
├── components/tags/TagAssignment.vue
└── components/ui/TagBadge.vue
```

## Subtasks
- [ ] Create TagBadge UI component with color and scope display
- [ ] Implement TagCard component with usage statistics
- [ ] Build TagFormDialog for create/edit operations
- [ ] Create TagAssignment component for expense integration
- [ ] Implement tag management dashboard page
- [ ] Add search and filtering functionality
- [ ] Create usage statistics calculation logic
- [ ] Integrate with existing expense forms and detail views
- [ ] Add bulk tag operations interface
- [ ] Implement responsive design for mobile devices
- [ ] Add Japanese localization for all interfaces
- [ ] Create tag-related navigation menu items

## Testing Requirements
- [ ] Tag CRUD operations work correctly
- [ ] Search and filtering return expected results
- [ ] Tag assignment updates expense records
- [ ] Usage statistics calculate accurately
- [ ] Color palette displays consistently
- [ ] Scope permissions work for tenant vs personal tags
- [ ] Responsive design functions on all screen sizes
- [ ] Japanese text displays properly throughout interface

## Success Metrics
- Tag creation completes within 2 seconds
- Search results appear within 500ms
- Usage statistics update in real-time
- Interface responsive on screens 320px and above
- 100% Japanese localization coverage
- Zero data loss during tag operations
- Consistent color display across browsers

## Notes
- Focus on legal firm workflow patterns
- Consider tag taxonomy for legal categories
- Implement proper tenant isolation for security
- Support keyboard navigation for accessibility
- Consider export capabilities for tag reports
- Plan for future tag hierarchy features