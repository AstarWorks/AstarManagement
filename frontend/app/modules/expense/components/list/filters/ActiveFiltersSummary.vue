<template>
  <div v-if="activeFilters.length > 0" class="active-filters mt-4 pt-4 border-t">
    <Label class="text-sm font-medium mb-2 block">
      {{ $t('expense.filters.activeFilters') }}
    </Label>
    <div class="flex flex-wrap gap-2">
      <Badge
        v-for="filter in activeFilters"
        :key="filter.key"
        variant="secondary"
        class="flex items-center gap-1"
      >
        {{ filter.label }}
        <Button
          variant="ghost"
          size="sm"
          class="h-auto p-0 ml-1"
          @click="emit('clearFilter', filter.key)"
        >
          <Icon name="lucide:x" class="w-3 h-3" />
        </Button>
      </Badge>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Badge } from '~/foundation/components/ui/badge'
import { Button } from '~/foundation/components/ui/button'
import { Label } from '~/foundation/components/ui/label'

interface FilterSummaryItem {
  key: string
  label: string
}

interface Props {
  /** Array of active filter summary items */
  activeFilters: FilterSummaryItem[]
}

interface Emits {
  /** Emitted when a filter should be cleared */
  (event: 'clearFilter', filterKey: string): void
}

const _props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<style scoped>
.active-filters {
  /* Styles handled by Tailwind classes */
}
</style>