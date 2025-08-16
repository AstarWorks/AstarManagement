<template>
  <TableHeader>
    <TableRow>
      <!-- Selection Header -->
      <TableHead class="w-12">
        <Checkbox
          :checked="isAllSelected"
          :indeterminate="isPartiallySelected"
          @update:checked="emit('toggleSelectAll')"
        />
      </TableHead>

      <!-- Dynamic Column Headers -->
      <TableHead
        v-for="column in visibleColumns"
        :key="column.key"
        :class="getSortableHeaderClass(column.key, column.sortable)"
        @click="handleSort(column.key, column.sortable)"
      >
        <div class="flex items-center gap-2 cursor-pointer">
          {{ column.label }}
          <Icon
            v-if="column.sortable && isSortedBy(column.key)"
            :name="getSortIcon(column.key)"
            class="w-4 h-4"
          />
          <Icon
            v-else-if="column.sortable"
            name="lucide:chevrons-up-down"
            class="w-4 h-4 opacity-50"
          />
        </div>
      </TableHead>

      <!-- Actions Header -->
      <TableHead class="w-20">{{ $t('expense.table.actions') }}</TableHead>
    </TableRow>
  </TableHeader>
</template>

<script setup lang="ts">
import type { TableColumn } from '~/foundation/composables/table/useTableColumns'
import {
  TableHead,
  TableHeader,
  TableRow,
} from '~/foundation/components/ui/table'
import { Checkbox } from '~/foundation/components/ui/checkbox'

interface Props {
  /** Visible columns configuration */
  visibleColumns: TableColumn[]
  /** Whether all items are selected */
  isAllSelected: boolean
  /** Whether some (but not all) items are selected */
  isPartiallySelected: boolean
  /** Function to check if column is being sorted */
  isSortedBy: (columnKey: string) => boolean
  /** Function to get sort icon for column */
  getSortIcon: (columnKey: string) => string
  /** Function to get sortable header CSS classes */
  getSortableHeaderClass: (columnKey: string, sortable: boolean) => string
}

interface Emits {
  /** Toggle select all */
  (event: 'toggleSelectAll'): void
  /** Sort column */
  (event: 'sort', columnKey: string): void
}

const _props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * Handle column sort click
 */
const handleSort = (columnKey: string, sortable: boolean) => {
  if (sortable) {
    emit('sort', columnKey)
  }
}
</script>

<style scoped>
/* Styles handled by Tailwind classes and shadcn/ui */
</style>