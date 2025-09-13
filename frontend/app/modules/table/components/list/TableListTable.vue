<template>
  <div class="rounded-lg border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead class="w-12">
            <Checkbox 
              :checked="isAllSelected"
              :aria-label="$t('modules.table.actions.selectAll')"
              @update:checked="$emit('toggle-select-all', $event)"
            />
          </TableHead>
          <TableHead>{{ $t('modules.table.fields.name') }}</TableHead>
          <TableHead>{{ $t('modules.table.fields.properties') }}</TableHead>
          <TableHead>{{ $t('modules.table.fields.records') }}</TableHead>
          <TableHead>{{ $t('modules.table.fields.updated') }}</TableHead>
          <TableHead class="w-12">
            <span class="sr-only">{{ $t('modules.table.fields.actions') }}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="table in tables"
          :key="table.id"
          class="cursor-pointer hover:bg-muted/50"
          @click="$emit('navigate', table.id || '')"
        >
          <TableCell @click.stop>
            <Checkbox
              :checked="selectedTables.includes(table.id || '')"
              :aria-label="$t('modules.table.actions.selectItem', { name: table.name })"
              @update:checked="(checked: boolean) => $emit('toggle-select', table.id || '', checked)"
            />
          </TableCell>
          <TableCell class="font-medium">
            {{ table.name }}
            <span v-if="table.description" class="block text-sm text-muted-foreground">
              {{ table.description }}
            </span>
          </TableCell>
          <TableCell>
            {{ helpers.getPropertyCount(table) }}
          </TableCell>
          <TableCell>
            {{ helpers.getRecordCount(table) }}
          </TableCell>
          <TableCell>
            {{ helpers.formatRelativeTime(table.updatedAt || '') }}
          </TableCell>
          <TableCell @click.stop>
            <TableRowActions 
              :table="table"
              @edit="$emit('edit', table)"
              @duplicate="$emit('duplicate', table)"
              @delete="$emit('delete', table)"
            />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>

<script setup lang="ts">
import type { TableResponse } from '../../types'
import { useTableHelpers } from '../../composables/table/useTableHelpers'
import TableRowActions from './TableRowActions.vue'

const helpers = useTableHelpers()

defineProps<{
  tables: TableResponse[]
  selectedTables: string[]
  isAllSelected: boolean
}>()

defineEmits<{
  navigate: [id: string]
  edit: [table: TableResponse]
  duplicate: [table: TableResponse]
  delete: [table: TableResponse]
  'toggle-select': [id: string, checked: boolean]
  'toggle-select-all': [checked: boolean]
}>()
</script>