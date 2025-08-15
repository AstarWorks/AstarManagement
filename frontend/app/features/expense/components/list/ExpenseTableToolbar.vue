<template>
  <div class="expense-table-toolbar flex justify-between items-center mb-4">
    <!-- Bulk Actions -->
    <div class="table-actions flex items-center gap-2">
      <Button 
        v-if="selectedCount > 0"
        variant="outline" 
        size="sm"
        @click="emit('bulkEdit')"
      >
        <Icon name="lucide:edit" class="w-4 h-4 mr-2" />
        {{ $t('expense.actions.bulkEdit') }} ({{ selectedCount }})
      </Button>
      
      <Button 
        v-if="selectedCount > 0"
        variant="destructive" 
        size="sm"
        @click="emit('bulkDelete')"
      >
        <Icon name="lucide:trash" class="w-4 h-4 mr-2" />
        {{ $t('expense.actions.bulkDelete') }} ({{ selectedCount }})
      </Button>

      <!-- Column Visibility Toggle -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm">
            <Icon name="lucide:columns" class="w-4 h-4 mr-2" />
            {{ $t('expense.table.columns') }}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem
            v-for="column in columns"
            :key="column.key"
            :checked="column.visible"
            @update:checked="emit('toggleColumn', column.key)"
          >
            {{ column.label }}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    
    <!-- Table Meta Info -->
    <div class="table-meta text-sm text-muted-foreground">
      {{ paginationInfo }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@shared/composables/table/useTableColumns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@ui/dropdown-menu'
import { Button } from '@ui/button/index'

interface Props {
  /** Number of selected items */
  selectedCount: number
  /** Column configuration for visibility toggle */
  columns: TableColumn[]
  /** Pagination information string */
  paginationInfo: string
}

interface Emits {
  /** Bulk edit and delete actions */
  (event: 'bulkEdit' | 'bulkDelete'): void
  /** Column visibility toggle */
  (event: 'toggleColumn', columnKey: string): void
}

const _props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<style scoped>
.expense-table-toolbar {
  /* Styles handled by Tailwind classes */
}
</style>