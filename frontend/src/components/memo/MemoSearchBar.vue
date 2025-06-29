<template>
  <div class="memo-search-bar">
    <!-- Search Input with Suggestions -->
    <div class="search-container" ref="searchContainer">
      <div class="search-input-wrapper">
        <Search class="search-icon" />
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          :placeholder="searchPlaceholder"
          class="search-input"
          @focus="handleSearchFocus"
          @blur="handleSearchBlur"
          @keydown="handleKeydown"
        />
        
        <!-- Search Mode Toggle -->
        <Button
          variant="ghost"
          size="sm"
          class="search-mode-toggle"
          @click="toggleSearchMode"
        >
          <Settings class="size-4" />
        </Button>
        
        <!-- Clear Search -->
        <Button
          v-if="searchQuery"
          variant="ghost"
          size="sm"
          class="clear-search"
          @click="clearSearch"
        >
          <X class="size-4" />
        </Button>
      </div>
      
      <!-- Search Suggestions Dropdown -->
      <div
        v-if="showSuggestions && suggestions.length > 0"
        class="suggestions-dropdown"
      >
        <div class="suggestions-header">
          <span class="suggestions-title">Suggestions</span>
          <Button
            variant="ghost"
            size="sm"
            @click="showSuggestions = false"
          >
            <X class="size-3" />
          </Button>
        </div>
        
        <div class="suggestions-list">
          <button
            v-for="(suggestion, index) in suggestions"
            :key="suggestion.id"
            class="suggestion-item"
            :class="{ 'suggestion-item--active': activeIndex === index }"
            @click="selectSuggestion(suggestion)"
            @mouseenter="activeIndex = index"
          >
            <component :is="getSuggestionIcon(suggestion.type)" class="suggestion-icon" />
            <div class="suggestion-content">
              <span class="suggestion-value" v-html="highlightSuggestion(suggestion)" />
              <span class="suggestion-type">{{ suggestion.type }}</span>
            </div>
            <Badge variant="secondary" class="suggestion-count">
              {{ suggestion.count }}
            </Badge>
          </button>
        </div>
      </div>
      
      <!-- Advanced Search Help -->
      <div
        v-if="searchMode === 'advanced' && showHelp"
        class="search-help"
      >
        <div class="help-header">
          <span class="help-title">Advanced Search Syntax</span>
          <Button
            variant="ghost"
            size="sm"
            @click="showHelp = false"
          >
            <X class="size-3" />
          </Button>
        </div>
        
        <div class="help-content">
          <div class="help-examples">
            <div
              v-for="field in searchFields.slice(0, 4)"
              :key="field.field"
              class="help-example"
              @click="insertSearchField(field)"
            >
              <code class="help-syntax">{{ field.example }}</code>
              <span class="help-description">{{ field.description }}</span>
            </div>
          </div>
          
          <div class="help-footer">
            <span class="help-note">Click any example to insert it</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Quick Filters -->
    <div v-if="searchMode === 'simple'" class="quick-filters">
      <Button
        v-for="filter in quickFilters"
        :key="filter.field"
        variant="outline"
        size="sm"
        class="quick-filter"
        @click="applyQuickFilter(filter)"
      >
        <component :is="filter.icon" class="size-3 mr-1" />
        {{ filter.label }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import {
  Search,
  Settings,
  X,
  User,
  Tag,
  FileText,
  Calendar,
  Hash,
  Mail,
  Archive
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { useMemoSearch } from '~/composables/useMemoSearch'
import type { MemoSearchSuggestion } from '~/types/memo'

interface QuickFilter {
  field: string
  value: string
  label: string
  icon: any
}

const emit = defineEmits<{
  search: [query: string]
  filtersChange: [filters: Record<string, any>]
}>()

// Search composable
const {
  searchQuery,
  searchMode,
  suggestions,
  showSuggestions,
  isSearching,
  searchFields,
  parsedFilters,
  selectSuggestion,
  clearSearch,
  toggleSearchMode,
  insertSearchField
} = useMemoSearch()

// Component state
const searchContainer = ref<HTMLElement>()
const searchInput = ref<HTMLInputElement>()
const activeIndex = ref(-1)
const showHelp = ref(false)

// Quick filters for simple mode
const quickFilters: QuickFilter[] = [
  { field: 'status', value: 'draft', label: 'Drafts', icon: FileText },
  { field: 'status', value: 'sent', label: 'Sent', icon: Mail },
  { field: 'priority', value: 'high', label: 'High Priority', icon: Archive },
  { field: 'hasAttachments', value: 'true', label: 'With Attachments', icon: Hash }
]

// Computed properties
const searchPlaceholder = computed(() => {
  if (searchMode.value === 'advanced') {
    return 'Search memos... (e.g., recipient:client@example.com status:sent)'
  }
  return 'Search memos by subject, content, or recipient...'
})

// Methods
const getSuggestionIcon = (type: string) => {
  const icons: Record<string, any> = {
    recipient: User,
    tag: Tag,
    case: Hash,
    subject: FileText
  }
  return icons[type] || FileText
}

const highlightSuggestion = (suggestion: MemoSearchSuggestion) => {
  if (!suggestion.highlight) return suggestion.value
  
  const regex = new RegExp(`(${suggestion.highlight})`, 'gi')
  return suggestion.value.replace(regex, '<mark>$1</mark>')
}

const handleSearchFocus = () => {
  if (searchMode.value === 'advanced') {
    showHelp.value = true
  }
}

const handleSearchBlur = () => {
  // Delay hiding to allow clicks on suggestions
  setTimeout(() => {
    showSuggestions.value = false
    showHelp.value = false
  }, 200)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!showSuggestions.value || suggestions.value.length === 0) return
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      activeIndex.value = Math.min(activeIndex.value + 1, suggestions.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      activeIndex.value = Math.max(activeIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (activeIndex.value >= 0 && activeIndex.value < suggestions.value.length) {
        selectSuggestion(suggestions.value[activeIndex.value])
      } else {
        handleSearch()
      }
      break
    case 'Escape':
      showSuggestions.value = false
      showHelp.value = false
      break
  }
}

const applyQuickFilter = (filter: QuickFilter) => {
  if (filter.field === 'hasAttachments') {
    searchQuery.value = `${searchQuery.value} ${filter.field}:${filter.value}`.trim()
  } else {
    searchQuery.value = `${searchQuery.value} ${filter.field}:${filter.value}`.trim()
  }
  handleSearch()
}

const handleSearch = () => {
  const filters = parsedFilters.value
  emit('search', searchQuery.value)
  emit('filtersChange', filters)
}

// Watch for search query changes with manual debounce
let searchTimeout: NodeJS.Timeout | null = null
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    handleSearch()
  }, 300)
})

// Handle click outside
const handleClickOutside = (event: MouseEvent) => {
  if (searchContainer.value && !searchContainer.value.contains(event.target as Node)) {
    showSuggestions.value = false
    showHelp.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Focus search input when component mounts
onMounted(() => {
  nextTick(() => {
    searchInput.value?.focus()
  })
})
</script>

<style scoped>
.memo-search-bar {
  @apply space-y-4;
}

.search-container {
  @apply relative;
}

.search-input-wrapper {
  @apply relative flex items-center;
}

.search-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground;
}

.search-input {
  @apply w-full pl-9 pr-20 py-3 text-sm border border-input rounded-lg;
  @apply bg-background text-foreground placeholder:text-muted-foreground;
  @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
  @apply transition-all duration-200;
}

.search-mode-toggle {
  @apply absolute right-10 top-1/2 transform -translate-y-1/2;
}

.clear-search {
  @apply absolute right-2 top-1/2 transform -translate-y-1/2;
}

.suggestions-dropdown,
.search-help {
  @apply absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-50;
  @apply max-h-80 overflow-hidden;
}

.suggestions-header,
.help-header {
  @apply flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50;
}

.suggestions-title,
.help-title {
  @apply text-sm font-medium text-foreground;
}

.suggestions-list {
  @apply max-h-64 overflow-y-auto;
}

.suggestion-item {
  @apply w-full flex items-center gap-3 px-3 py-2 text-left;
  @apply hover:bg-muted/50 transition-colors;
  @apply border-none bg-transparent cursor-pointer;
}

.suggestion-item--active {
  @apply bg-muted/50;
}

.suggestion-icon {
  @apply size-4 text-muted-foreground flex-shrink-0;
}

.suggestion-content {
  @apply flex-1 min-w-0;
}

.suggestion-value {
  @apply block text-sm font-medium text-foreground truncate;
}

.suggestion-value :deep(mark) {
  @apply bg-yellow-200 text-yellow-900 px-0 py-0 rounded-none;
}

.suggestion-type {
  @apply block text-xs text-muted-foreground capitalize;
}

.suggestion-count {
  @apply text-xs;
}

.help-content {
  @apply p-4;
}

.help-examples {
  @apply space-y-3;
}

.help-example {
  @apply p-2 rounded-md border border-border cursor-pointer;
  @apply hover:bg-muted/50 transition-colors;
}

.help-syntax {
  @apply block text-sm font-mono text-primary bg-muted px-2 py-1 rounded mb-1;
}

.help-description {
  @apply text-xs text-muted-foreground;
}

.help-footer {
  @apply mt-3 pt-3 border-t border-border;
}

.help-note {
  @apply text-xs text-muted-foreground italic;
}

.quick-filters {
  @apply flex flex-wrap gap-2;
}

.quick-filter {
  @apply text-xs;
}
</style>