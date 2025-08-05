<script setup lang="ts">
import { FilterX } from 'lucide-vue-next'
import { Badge } from '~/components/ui/badge'
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
  clearFilters: []
  clearFilter: [filterKey: string]
  modifyFilters: []
}>()

const { t } = useI18n()

const handleClearFilters = () => {
  props.onClearFilters?.()
  emit('clearFilters')
}

const handleClearFilter = (filterKey: string) => {
  props.onClearFilter?.(filterKey)
  emit('clearFilter', filterKey)
}

const handleModifyFilters = () => {
  props.onModifyFilters?.()
  emit('modifyFilters')
}

const primaryAction = {
  label: t('states.empty.filter.primaryAction'),
  onClick: handleClearFilters,
  variant: 'outline' as const
}

const secondaryActions = [
  {
    label: t('filters.modify'),
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
</script>

<template>
  <EmptyState
    :title="t('states.empty.filter.title')"
    :description="t('states.empty.filter.description')"
    :icon="FilterX"
    :primary-action="primaryAction"
    :secondary-actions="secondaryActions"
    :compact="compact"
  >
    <!-- Active filters display -->
    <div v-if="activeFilters.length > 0" class="mt-6 w-full max-w-2xl">
      <h4 class="text-sm font-medium text-foreground mb-3">
        {{ t('filters.active') }}
      </h4>
      
      <div class="flex flex-wrap gap-2">
        <Badge 
          v-for="filter in activeFilters"
          :key="filter.label"
          variant="secondary"
          class="flex items-center gap-2 pr-1"
        >
          <span class="text-xs">
            <strong>{{ filter.label }}:</strong> {{ getFilterDisplayValue(filter) }}
          </span>
          <button
            class="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
            @click="handleClearFilter(filter.label)"
          >
            <X class="h-3 w-3" />
            <span class="sr-only">{{ t('filters.remove') }} {{ filter.label }}</span>
          </button>
        </Badge>
      </div>
    </div>
    
    <!-- Filter suggestions -->
    <div class="mt-6 p-4 bg-muted/50 rounded-lg text-left max-w-md">
      <h4 class="text-sm font-medium text-foreground mb-2">
        {{ t('filters.suggestions.title') }}
      </h4>
      <ul class="text-xs text-muted-foreground space-y-1">
        <li>• {{ t('filters.suggestions.broaden') }}</li>
        <li>• {{ t('filters.suggestions.different') }}</li>
        <li>• {{ t('filters.suggestions.dateRange') }}</li>
        <li>• {{ t('filters.suggestions.categories') }}</li>
      </ul>
    </div>
  </EmptyState>
</template>