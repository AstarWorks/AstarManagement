<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="icon">
        <Icon name="lucide:eye" class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="w-64">
      <DropdownMenuLabel>{{ $t('modules.table.record.columns.title') }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem
        v-for="column in availableColumns"
        :key="column.key"
        :checked="visibleColumns.includes(column.key)"
        @update:checked="$emit('toggle-column', column.key)"
      >
        {{ column.displayName }}
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import type { PropertyDefinitionDto } from '../../../types'

// Props
const props = defineProps<{
  availableColumns: Array<PropertyDefinitionDto & { key: string }>
  visibleColumns: string[]
}>()

// Emits
const emit = defineEmits<{
  'toggle-column': [columnKey: string]
}>()
</script>