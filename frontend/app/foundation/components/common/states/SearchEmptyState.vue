<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import EmptyState from './EmptyState.vue'

interface SearchEmptyStateProps {
  query: string
  suggestions?: string[]
  onClearSearch?: () => void
  onSuggestionClick?: (suggestion: string) => void
  compact?: boolean
}

const props = withDefaults(defineProps<SearchEmptyStateProps>(), {
  suggestions: () => [],
  compact: false
})

const emit = defineEmits<{
  'clear-search': []
  'suggestion-click': [suggestion: string]
  retry: []
}>()

const { t } = useI18n()

const handleClearSearch = () => {
  props.onClearSearch?.()
  emit('clear-search')
}

const handleSuggestionClick = (suggestion: string) => {
  props.onSuggestionClick?.(suggestion)
  emit('suggestion-click', suggestion)
}

const primaryAction = {
  label: t('foundation.actions.system.clearSearch'),
  onClick: handleClearSearch,
  variant: 'outline' as const
}

const truncatedQuery = computed(() => {
  return props.query.length > 50 ? props.query.slice(0, 50) + '...' : props.query
})
</script>

<template>
  <EmptyState
    :title="t('foundation.search.noResults')"
    :description="`「${truncatedQuery}」${t('foundation.search.tips.keywords')}`"
    :icon="Search"
    :primary-action="primaryAction"
    :compact="compact"
  >
    <!-- Search suggestions -->
    <div v-if="suggestions.length > 0" class="mt-6 w-full max-w-md">
      <h4 class="text-sm font-medium text-foreground mb-3">
        {{ t('foundation.search.suggestions') }}
      </h4>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="suggestion in suggestions"
          :key="suggestion"
          class="px-3 py-1 text-sm bg-secondary hover:bg-secondary/80 rounded-full transition-colors"
          @click="handleSuggestionClick(suggestion)"
        >
          {{ suggestion }}
        </button>
      </div>
    </div>
    
    <!-- Search tips -->
    <div class="mt-6 p-4 bg-muted/50 rounded-lg text-left max-w-md">
      <h4 class="text-sm font-medium text-foreground mb-2">
        {{ t('foundation.search.tips.title') }}
      </h4>
      <ul class="text-xs text-muted-foreground space-y-1 list-disc list-inside">
        <li>{{ t('foundation.search.tips.spelling') }}</li>
        <li>{{ t('foundation.search.tips.keywords') }}</li>
        <li>{{ t('foundation.search.tips.filters') }}</li>
      </ul>
    </div>
  </EmptyState>
</template>