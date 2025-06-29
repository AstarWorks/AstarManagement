<template>
  <div class="template-category-sidebar">
    <!-- Header -->
    <div class="sidebar-header">
      <h3 class="sidebar-title">Filter Templates</h3>
      <Button
        v-if="hasActiveFilters"
        size="sm"
        variant="ghost"
        class="clear-filters"
        @click="clearAllFilters"
      >
        Clear all
      </Button>
    </div>
    
    <!-- Categories -->
    <div class="filter-section">
      <h4 class="filter-section-title">Categories</h4>
      <div class="category-list">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-item"
          :class="{ 'selected': selectedCategories.includes(category.id) }"
        >
          <Checkbox
            :id="`category-${category.id}`"
            :checked="selectedCategories.includes(category.id)"
            @update:checked="toggleCategory(category.id)"
          />
          <label
            :for="`category-${category.id}`"
            class="category-label"
          >
            <component :is="getCategoryIcon(category.icon)" class="category-icon" />
            <span class="category-name">{{ category.name }}</span>
            <Badge variant="secondary" class="category-count">
              {{ category.count }}
            </Badge>
          </label>
        </div>
      </div>
    </div>
    
    <!-- File Types -->
    <div class="filter-section">
      <h4 class="filter-section-title">File Types</h4>
      <div class="filter-options">
        <div
          v-for="fileType in fileTypeOptions"
          :key="fileType.value"
          class="filter-option"
        >
          <Checkbox
            :id="`filetype-${fileType.value}`"
            :checked="selectedFileTypes.includes(fileType.value)"
            @update:checked="toggleFileType(fileType.value)"
          />
          <label
            :for="`filetype-${fileType.value}`"
            class="filter-label"
          >
            <component :is="fileType.icon" class="filter-icon" />
            {{ fileType.label }}
          </label>
        </div>
      </div>
    </div>
    
    <!-- Languages -->
    <div class="filter-section">
      <h4 class="filter-section-title">Languages</h4>
      <div class="filter-options">
        <div
          v-for="language in languageOptions"
          :key="language.value"
          class="filter-option"
        >
          <Checkbox
            :id="`language-${language.value}`"
            :checked="selectedLanguages.includes(language.value)"
            @update:checked="toggleLanguage(language.value)"
          />
          <label
            :for="`language-${language.value}`"
            class="filter-label"
          >
            {{ language.label }}
          </label>
        </div>
      </div>
    </div>
    
    <!-- Quick Filters -->
    <div class="filter-section">
      <h4 class="filter-section-title">Quick Filters</h4>
      <div class="filter-options">
        <div class="filter-option">
          <Checkbox
            id="favorites-only"
            :checked="favoritesOnly"
            @update:checked="store.favoritesOnly = $event"
          />
          <label for="favorites-only" class="filter-label">
            <Star class="filter-icon" :class="{ 'fill-current': favoritesOnly }" />
            Favorites only
          </label>
        </div>
        
        <div class="filter-option">
          <Checkbox
            id="recently-used"
            :checked="recentlyUsedOnly"
            @update:checked="store.recentlyUsedOnly = $event"
          />
          <label for="recently-used" class="filter-label">
            <Clock class="filter-icon" />
            Recently used
          </label>
        </div>
      </div>
    </div>
    
    <!-- Statistics -->
    <div class="filter-section">
      <h4 class="filter-section-title">Statistics</h4>
      <div class="statistics">
        <div class="stat-item">
          <span class="stat-label">Total templates:</span>
          <span class="stat-value">{{ templateStats.total }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Showing:</span>
          <span class="stat-value">{{ templateStats.filtered }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Favorites:</span>
          <span class="stat-value">{{ templateStats.favorites }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  FileText, 
  Form, 
  Mail, 
  Building, 
  Star, 
  Clock,
  FileType,
  FileImage,
  Globe
} from 'lucide-vue-next'
import { Checkbox } from '~/components/ui/checkbox'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { useTemplateBrowserStore } from '~/stores/templateBrowser'
import type { TemplateCategory } from '~/types/template'

interface Props {
  categories: TemplateCategory[]
  showCounts?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCounts: true
})

const store = useTemplateBrowserStore()

// Computed properties
const selectedCategories = computed({
  get: () => store.selectedCategories,
  set: (value: string[]) => store.selectedCategories = value
})

const selectedFileTypes = computed({
  get: () => store.selectedFileTypes,
  set: (value: string[]) => store.selectedFileTypes = value
})

const selectedLanguages = computed({
  get: () => store.selectedLanguages,
  set: (value: string[]) => store.selectedLanguages = value
})

const favoritesOnly = computed(() => store.favoritesOnly)
const recentlyUsedOnly = computed(() => store.recentlyUsedOnly)
const templateStats = computed(() => store.templateStats)

const hasActiveFilters = computed(() => 
  selectedCategories.value.length > 0 ||
  selectedFileTypes.value.length > 0 ||
  selectedLanguages.value.length > 0 ||
  favoritesOnly.value ||
  recentlyUsedOnly.value ||
  store.searchQuery.trim() !== ''
)

// Filter options
const fileTypeOptions = [
  { value: 'docx', label: 'Word Document', icon: FileText },
  { value: 'pdf', label: 'PDF Document', icon: FileImage },
  { value: 'html', label: 'Web Document', icon: Globe }
]

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語 (Japanese)' }
]

// Methods
const toggleCategory = (categoryId: string) => {
  const current = selectedCategories.value
  if (current.includes(categoryId)) {
    selectedCategories.value = current.filter(id => id !== categoryId)
  } else {
    selectedCategories.value = [...current, categoryId]
  }
}

const toggleFileType = (fileType: string) => {
  const current = selectedFileTypes.value
  if (current.includes(fileType)) {
    selectedFileTypes.value = current.filter(type => type !== fileType)
  } else {
    selectedFileTypes.value = [...current, fileType]
  }
}

const toggleLanguage = (language: string) => {
  const current = selectedLanguages.value
  if (current.includes(language)) {
    selectedLanguages.value = current.filter(lang => lang !== language)
  } else {
    selectedLanguages.value = [...current, language]
  }
}

const clearAllFilters = () => {
  store.clearFilters()
}

const getCategoryIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    FileText,
    Form,
    Mail,
    Building
  }
  return iconMap[iconName] || FileText
}
</script>

<style scoped>
.template-category-sidebar {
  @apply w-64 bg-card border-r border-border p-4 space-y-6 overflow-y-auto;
  max-height: calc(100vh - 120px);
}

.sidebar-header {
  @apply flex items-center justify-between;
}

.sidebar-title {
  @apply text-lg font-semibold;
}

.clear-filters {
  @apply text-xs;
}

.filter-section {
  @apply space-y-3;
}

.filter-section-title {
  @apply text-sm font-medium text-foreground;
}

.category-list {
  @apply space-y-2;
}

.category-item {
  @apply flex items-center space-x-2 p-2 rounded-md transition-colors;
}

.category-item:hover {
  @apply bg-muted/50;
}

.category-item.selected {
  @apply bg-muted;
}

.category-label {
  @apply flex items-center space-x-2 flex-1 cursor-pointer;
}

.category-icon {
  @apply h-4 w-4 text-muted-foreground;
}

.category-name {
  @apply text-sm flex-1;
}

.category-count {
  @apply text-xs;
}

.filter-options {
  @apply space-y-2;
}

.filter-option {
  @apply flex items-center space-x-2;
}

.filter-label {
  @apply flex items-center space-x-2 text-sm cursor-pointer;
}

.filter-icon {
  @apply h-4 w-4 text-muted-foreground;
}

.statistics {
  @apply space-y-2;
}

.stat-item {
  @apply flex justify-between text-xs;
}

.stat-label {
  @apply text-muted-foreground;
}

.stat-value {
  @apply font-medium;
}

/* Responsive design */
@media (max-width: 768px) {
  .template-category-sidebar {
    @apply w-full border-r-0 border-b;
    max-height: none;
  }
}

/* Scrollbar styling */
.template-category-sidebar::-webkit-scrollbar {
  @apply w-2;
}

.template-category-sidebar::-webkit-scrollbar-track {
  @apply bg-muted/30;
}

.template-category-sidebar::-webkit-scrollbar-thumb {
  @apply bg-muted-foreground/30 rounded-full;
}

.template-category-sidebar::-webkit-scrollbar-thumb:hover {
  @apply bg-muted-foreground/50;
}
</style>