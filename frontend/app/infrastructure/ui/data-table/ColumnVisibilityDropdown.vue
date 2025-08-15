<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { computed } from 'vue'
import { Button } from '@ui/button/index'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@ui/dropdown-menu'
import { Settings2 } from 'lucide-vue-next'

interface Props {
  table: Table<TData>
}

const props = defineProps<Props>()

// Get all columns that can be hidden
const columns = computed(() => {
  return props.table
    .getAllColumns()
    .filter(column => column.getCanHide())
})

const { t } = useI18n()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="sm" class="ml-auto">
        <Settings2 class="mr-2 h-4 w-4" />
        {{ t('common.columns') }}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-48">
      <DropdownMenuLabel>{{ t('common.toggleColumns') }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem
        v-for="column in columns"
        :key="column.id"
        :checked="column.getIsVisible()"
        @update:checked="(value: boolean) => column.toggleVisibility(value)"
      >
        {{ (column.columnDef.meta as { label?: string })?.label || column.id }}
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>