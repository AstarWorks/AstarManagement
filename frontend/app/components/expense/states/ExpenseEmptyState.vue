<script setup lang="ts">
import { Receipt } from 'lucide-vue-next'
import EmptyState from '~/components/common/states/EmptyState.vue'

interface ExpenseEmptyStateProps {
  type?: 'all' | 'search' | 'filter'
  searchQuery?: string
  activeFilters?: string[]
  compact?: boolean
}

const props = withDefaults(defineProps<ExpenseEmptyStateProps>(), {
  type: 'all',
  compact: false
})

const emit = defineEmits<{
  createExpense: []
  clearSearch: []
  clearFilters: []
  importData: []
}>()

const { t } = useI18n()

const config = computed(() => {
  switch (props.type) {
    case 'search':
      return {
        title: t('states.empty.search.title'),
        description: props.searchQuery 
          ? t('states.empty.search.description') + ` (${props.searchQuery})`
          : t('states.empty.search.description'),
        icon: '🔍',
        primaryAction: {
          label: t('states.empty.search.primaryAction'),
          onClick: () => emit('clearSearch')
        }
      }
    
    case 'filter':
      return {
        title: t('states.empty.filter.title'),
        description: t('states.empty.filter.description'),
        icon: '🗂️',
        primaryAction: {
          label: t('states.empty.filter.primaryAction'),
          onClick: () => emit('clearFilters')
        }
      }
    
    default: // 'all'
      return {
        title: t('states.empty.expenses.title'),
        description: t('states.empty.expenses.description'),
        icon: Receipt,
        primaryAction: {
          label: t('states.empty.expenses.primaryAction'),
          onClick: () => emit('createExpense')
        },
        secondaryActions: [
          {
            label: t('states.empty.expenses.secondaryAction'),
            onClick: () => emit('importData'),
            variant: 'outline' as const
          }
        ]
      }
  }
})
</script>

<template>
  <EmptyState 
    :title="config.title"
    :description="config.description"
    :icon="config.icon"
    :primary-action="config.primaryAction"
    :secondary-actions="config.secondaryActions"
    :compact="compact"
  >
    <!-- Custom content for the default empty state -->
    <div v-if="type === 'all'" class="mt-6 p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/25">
      <div class="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Receipt class="h-4 w-4" />
        <span>{{ t('expense.emptyHint') }}</span>
      </div>
    </div>
    
    <!-- Show active filters info -->
    <div v-if="type === 'filter' && activeFilters?.length" class="mt-4">
      <div class="text-sm text-muted-foreground">
        {{ t('common.activeFilters') }}: {{ activeFilters.join(', ') }}
      </div>
    </div>
  </EmptyState>
</template>