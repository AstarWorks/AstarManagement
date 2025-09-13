<template>
  <div v-if="activeFilterCount > 0" class="flex items-center gap-2 flex-wrap py-2 mb-2">
    <span class="text-xs text-muted-foreground">{{ $t('foundation.table.filtering.activeFilters') }}:</span>
    
    <div 
      v-for="(value, key) in filters" 
      :key="key" 
      class="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1.5 text-xs"
    >
      <span class="font-medium text-blue-900">{{ getColumnDisplayName(key) }}:</span>
      <span class="text-blue-700">{{ formatFilterValue(key, value) }}</span>
      <button
        class="ml-1 rounded-full hover:bg-blue-100 p-0.5 transition-colors"
        @click="$emit('remove-filter', key)"
      >
        <Icon name="lucide:x" class="h-3 w-3 text-blue-600" />
      </button>
    </div>
    
    <Button
      variant="ghost"
      size="sm"
      class="h-7 px-2 text-xs hover:bg-red-50 hover:text-red-600"
      @click="$emit('clear-filters')"
    >
      {{ $t('foundation.actions.system.clearFilters') }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import type { PropertyDefinitionDto } from '../../../types'

// Props
const props = defineProps<{
  filters: Record<string, unknown>
  activeFilterCount: number
  getColumnDisplayName: (key: string) => string
  formatFilterValue: (key: string, value: unknown) => string
}>()

// Emits
const emit = defineEmits<{
  'remove-filter': [key: string]
  'clear-filters': []
}>()
</script>