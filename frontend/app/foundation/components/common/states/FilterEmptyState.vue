<script setup lang="ts">
import { FilterX, X } from 'lucide-vue-next'
import { Badge } from '~/foundation/components/ui/badge'
import EmptyState from './EmptyState.vue'

interface FilterConfig {
  label: string
  value: string | string[]
  type: 'single' | 'multiple'
}

interface FilterEmptyStateProps {
  activeFilters?: FilterConfig[]
  onClearFilters?: () => void
  onClearFilter?: (filterKey: string) => void
  onModifyFilters?: () => void
  compact?: boolean
}

const props = withDefaults(defineProps<FilterEmptyStateProps>(), {
  activeFilters: () => [],
  compact: false
})

const emit = defineEmits<{
  'clear-filters': []
  'clear-filter': [filterKey: string]
  'modify-filters': []
}>()

const { t } = useI18n()

const handleClearFilters = () => {
  props.onClearFilters?.()
  emit('clear-filters')
}

const handleClearFilter = (filterKey: string) => {
  props.onClearFilter?.(filterKey)
  emit('clear-filter', filterKey)
}

const handleModifyFilters = () => {
  props.onModifyFilters?.()
  emit('modify-filters')
}

const primaryAction = {
  label: t('foundation.actions.system.clearFilters'),
  onClick: handleClearFilters,
  variant: 'outline' as const
}

const secondaryActions = [
  {
    label: t('foundation.table.filtering.modify'),
    onClick: handleModifyFilters,
    variant: 'ghost' as const
  }
]

const getFilterDisplayValue = (filter: FilterConfig): string => {
  if (filter.type === 'multiple' && Array.isArray(filter.value)) {
    return filter.value.join(', ')
  }
  return String(filter.value)
}

const getFilterDisplay = (filter: FilterConfig): string => {
  return `${filter.label}: ${getFilterDisplayValue(filter)}`
}
</script>

<template>
  <EmptyState
    :title="t('foundation.messages.info.noResults')"
    :description="t('foundation.search.tips.filters')"
    :icon="FilterX"
    :primary-action="primaryAction"
    :secondary-actions="secondaryActions"
    :compact="compact"
  >
    <!-- Active filters display -->
    <div v-if="activeFilters.length > 0" class="mt-6 w-full max-w-2xl">
      <h4 class="text-sm font-medium text-foreground mb-3">
        {{ t('foundation.table.filtering.active') }}
      </h4>
      
      <div class="flex flex-wrap gap-2">
        <Badge 
          v-for="filter in activeFilters"
          :key="filter.label"
          variant="secondary"
          class="flex items-center gap-2 pr-1"
        >
          <span class="text-xs font-medium">
            {{ getFilterDisplay(filter) }}
          </span>
          <button
            class="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
            @click="handleClearFilter(filter.label)"
          >
            <X class="h-3 w-3" />
            <span class="sr-only">{{ t('foundation.table.filtering.remove') }} {{ filter.label }}</span>
          </button>
        </Badge>
      </div>
    </div>
    
    <!-- Filter suggestions -->
    <div class="mt-6 p-4 bg-muted/50 rounded-lg text-left max-w-md">
      <h4 class="text-sm font-medium text-foreground mb-2">
        {{ t('foundation.table.filtering.suggestions.title') }}
      </h4>
      <ul class="text-xs text-muted-foreground space-y-1 list-disc list-inside">
        <li>{{ t('foundation.table.filtering.suggestions.broaden') }}</li>
        <li>{{ t('foundation.table.filtering.suggestions.different') }}</li>
        <li>{{ t('foundation.table.filtering.suggestions.dateRange') }}</li>
        <li>{{ t('foundation.table.filtering.suggestions.categories') }}</li>
      </ul>
    </div>
  </EmptyState>
</template>