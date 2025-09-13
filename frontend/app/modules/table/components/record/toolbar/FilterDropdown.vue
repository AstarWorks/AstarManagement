<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="icon" class="relative">
        <Icon name="lucide:filter" class="h-4 w-4" />
        <span 
          v-if="activeFilterCount > 0" 
          class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground"
        >
          {{ activeFilterCount }}
        </span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="w-80">
      <DropdownMenuLabel>{{ $t('modules.table.record.filters.title') }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <div class="space-y-2 p-2">
        <div v-for="column in filterableColumns" :key="column.key" class="space-y-1">
          <Label :for="`filter-${column.key}`" class="text-xs">
            {{ column.displayName }}
          </Label>
          <FilterInput
            :id="`filter-${column.key}`"
            :property="column"
            :model-value="filters[column.key]"
            @update:model-value="$emit('filter', column.key, $event)"
          />
        </div>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem @click="$emit('clear-filters')">
        <Icon name="lucide:x" class="mr-2 h-4 w-4" />
        {{ $t('modules.table.record.filters.clear') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import FilterInput from '../FilterInput.vue'
import type { PropertyDefinitionDto } from '../../../types'

// Props
const props = defineProps<{
  filterableColumns: Array<PropertyDefinitionDto & { key: string }>
  filters: Record<string, unknown>
  activeFilterCount: number
}>()

// Emits
const emit = defineEmits<{
  filter: [columnKey: string, value: unknown]
  'clear-filters': []
}>()
</script>