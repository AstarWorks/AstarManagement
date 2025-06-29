<template>
  <div class="template-search">
    <div class="search-input-container">
      <Search class="search-icon" />
      <Input
        v-model="searchQuery"
        type="text"
        placeholder="Search templates by name, description, or tags..."
        class="search-input"
        :aria-describedby="hasResults ? 'search-results-count' : undefined"
      />
      <Button
        v-if="searchQuery"
        size="icon"
        variant="ghost"
        class="clear-search"
        @click="clearSearch"
        aria-label="Clear search"
      >
        <X class="h-4 w-4" />
      </Button>
    </div>
    
    <div v-if="hasResults && searchQuery" id="search-results-count" class="search-results-info">
      {{ filteredCount }} template{{ filteredCount === 1 ? '' : 's' }} found
    </div>
    
    <!-- Quick search suggestions -->
    <div v-if="showSuggestions && !searchQuery" class="search-suggestions">
      <div class="suggestions-label">Popular searches:</div>
      <div class="suggestion-tags">
        <Button
          v-for="suggestion in popularSearches"
          :key="suggestion"
          size="sm"
          variant="outline"
          class="suggestion-tag"
          @click="applySuggestion(suggestion)"
        >
          {{ suggestion }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { Search, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTemplateBrowserStore } from '@/stores/templateBrowser'
import { useDebounceFn } from '@vueuse/core'

interface Props {
  showSuggestions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSuggestions: true
})

const emit = defineEmits<{
  search: [query: string]
}>()

const store = useTemplateBrowserStore()

// Local search query with debouncing
const searchQuery = computed({
  get: () => store.searchQuery,
  set: (value: string) => {
    debouncedSearch(value)
  }
})

// Debounced search to avoid excessive filtering
const debouncedSearch = useDebounceFn((query: string) => {
  store.searchQuery = query
  emit('search', query)
}, 300)

// Computed properties
const filteredCount = computed(() => store.filteredTemplates.length)
const hasResults = computed(() => filteredCount.value > 0)

// Popular search suggestions
const popularSearches = [
  'contract',
  'agreement', 
  'letter',
  'form',
  'invoice',
  'nda',
  'employment'
]

// Methods
const clearSearch = () => {
  searchQuery.value = ''
  store.searchQuery = ''
  emit('search', '')
}

const applySuggestion = (suggestion: string) => {
  searchQuery.value = suggestion
}

// Watch for external changes to search query
watch(() => store.searchQuery, (newQuery) => {
  if (newQuery !== searchQuery.value) {
    searchQuery.value = newQuery
  }
})
</script>

<style scoped>
.template-search {
  @apply space-y-3;
}

.search-input-container {
  @apply relative flex items-center;
}

.search-icon {
  @apply absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none z-10;
}

.search-input {
  @apply pl-10 pr-10 h-10 w-full;
}

.clear-search {
  @apply absolute right-1 h-8 w-8;
}

.search-results-info {
  @apply text-sm text-muted-foreground;
}

.search-suggestions {
  @apply space-y-2;
}

.suggestions-label {
  @apply text-sm font-medium text-foreground;
}

.suggestion-tags {
  @apply flex flex-wrap gap-2;
}

.suggestion-tag {
  @apply h-8 text-xs;
}

/* Focus styles */
.search-input:focus {
  @apply ring-2 ring-primary ring-offset-2;
}

/* Animation for results info */
.search-results-info {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive design */
@media (max-width: 640px) {
  .suggestion-tags {
    @apply gap-1;
  }
  
  .suggestion-tag {
    @apply text-xs px-2;
  }
}
</style>