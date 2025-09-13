<template>
  <div class="w-full" :style="columnSizeVars">
    <StickyTable>
      <Table>
        <StickyTableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <ColumnContextMenu
              v-for="header in headerGroup.headers"
              :key="header.id"
              :column="header.column"
              :pinning="pinning || undefined"
            >
              <TableHead
                class="bg-gray-100/95 backdrop-blur-sm border-b-2 border-gray-500 text-gray-700 font-semibold uppercase text-xs relative"
                :class="[
                  header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                  header.column.getIsPinned() ? 'shadow-md' : '',
                  ...(pinningStyles ? pinningStyles.getColumnClasses(header.column as Column<unknown>) : [])
                ]"
                :style="{
                  ...(pinningStyles ? pinningStyles.getHeaderStyles(header.column as Column<unknown>) : {}),
                  backgroundColor: header.column.getIsPinned() ? 'rgb(243 244 246 / 0.95)' : undefined,
                  backdropFilter: header.column.getIsPinned() ? 'blur(4px)' : undefined,
                  width: canResizeColumn?.(header.column) || header.column.id === 'select' || header.column.id === 'actions' ? `var(--col-${header.column.id}-size)` : undefined
                }"
                @click="header.column.getToggleSortingHandler()?.($event)"
              >
                <div class="flex items-center justify-between">
                  <FlexRender
                    v-if="!header.isPlaceholder"
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                  <div class="flex items-center gap-1">
                    <Icon
                      v-if="header.column.getIsSorted()"
                      :name="header.column.getIsSorted() === 'desc' ? 'lucide:arrow-down' : 'lucide:arrow-up'"
                      class="h-4 w-4"
                    />
                    <Icon
                      v-if="header.column.getIsPinned()"
                      name="lucide:pin"
                      class="h-3 w-3 text-primary drop-shadow-sm"
                      :class="header.column.getIsPinned() === 'left' ? 'rotate-45' : header.column.getIsPinned() === 'right' ? '-rotate-45' : ''"
                    />
                  </div>
                </div>
                
                <!-- Column Resize Handle -->
                <div 
                  v-if="canResizeColumn?.(header.column)"
                  class="absolute right-0 top-0 h-full w-2 cursor-col-resize transition-all duration-200"
                  :class="[
                    isResizingColumn ? 'bg-primary opacity-100' : 'bg-border opacity-60 hover:bg-primary hover:opacity-100'
                  ]"
                  @mousedown="header.getResizeHandler()?.($event)"
                  @touchstart="header.getResizeHandler()?.($event)"
                />
              </TableHead>
            </ColumnContextMenu>
          </TableRow>
        </StickyTableHeader>

        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <RowContextMenu
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :row="row"
              :pinning="pinning || undefined"
              :on-edit="(r) => $emit('edit-record', r.original)"
              :on-duplicate="(r) => $emit('duplicate-record', r.original)"
              :on-delete="(r) => $emit('delete-record', r.original)"
            >
              <TableRow
                :data-state="row.getIsSelected() && 'selected'"
                class="border-b border-gray-500"
                :class="[
                  row.getIsSelected() ? 'bg-muted/50' : '',
                  pinning?.isPinnedRow(row.id) === 'top' ? 'pinned-row pinned-top border-b-2 border-primary/20' : '',
                  pinning?.isPinnedRow(row.id) === 'bottom' ? 'pinned-row pinned-bottom border-t-2 border-primary/20' : ''
                ]"
                :style="pinning && pinningStyles ? pinningStyles.getRowStyles(row as Row<unknown>, pinnedRowIndices.get(row.id) || 0) : {}"
              >
                <TableCell
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  :class="[
                    cell.column.id === 'select' ? 'p-0' : cell.column.id === 'actions' ? 'px-1 py-0' : getCellClass(cell.column.id),
                    cell.column.getIsPinned() ? 'shadow-sm backdrop-blur-sm' : '',
                    ...(pinningStyles ? pinningStyles.getCellClasses(cell.column as Column<unknown>, row as Row<unknown>) : [])
                  ]"
                  :style="{
                    ...(pinningStyles ? pinningStyles.getIntersectionStyles(cell.column as Column<unknown>, row as Row<unknown>) : {}),
                    backgroundColor: cell.column.getIsPinned() ? 'var(--background)' : undefined,
                    backdropFilter: cell.column.getIsPinned() ? 'blur(2px)' : undefined,
                    width: canResizeColumn?.(cell.column) || cell.column.id === 'select' || cell.column.id === 'actions' ? `var(--col-${cell.column.id}-size)` : undefined
                  }"
                >
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </TableCell>
              </TableRow>
            </RowContextMenu>
          </template>
          <TableRow v-else>
            <TableCell
              :colspan="columns.length"
              class="h-24 text-center"
            >
              {{ $t('foundation.messages.info.noResults') }}
            </TableCell>
          </TableRow>
        </TableBody>

        <!-- Aggregation Footer -->
        <TableFooter v-if="hasAggregation && table.getRowModel().rows?.length">
          <TableRow>
            <TableCell
              v-for="header in table.getFooterGroups()[0]?.headers"
              :key="header.id"
              :class="[
                header.column.id !== 'select' && header.column.id !== 'actions' && getCellClass(header.column.id)
              ]"
              :style="{
                width: canResizeColumn?.(header.column) || header.column.id === 'select' || header.column.id === 'actions' ? `var(--col-${header.column.id}-size)` : undefined
              }"
            >
              <FlexRender
                v-if="!header.isPlaceholder && header.column.columnDef.footer"
                :render="header.column.columnDef.footer"
                :props="header.getContext()"
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </StickyTable>
  </div>
</template>

<script setup lang="ts">
import { 
  type ColumnDef,
  type Column,
  type Row,
  FlexRender
} from '@tanstack/vue-table'

// Sticky Table components
import { StickyTable, StickyTableHeader } from '@foundation/components/ui/sticky-table'
// Standard Table components
import { 
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter
} from '@foundation/components/ui/table'
// Context Menu components
import RowContextMenu from '../../context-menu/RowContextMenu.vue'
import ColumnContextMenu from '../../context-menu/ColumnContextMenu.vue'

import type { RecordResponse } from '../../../types'

// Props
const props = defineProps<{
  table: any // TanStack Table instance
  columns: ColumnDef<RecordResponse>[]
  hasAggregation: boolean
  getCellClass: (columnId: string) => string
  pinning?: any
  pinningStyles?: any
  pinnedRowIndices: Map<string, number>
  canResizeColumn?: (column: Column<unknown>) => boolean
  columnSizeVars?: Record<string, string>
  isResizingColumn?: boolean
}>()

// Emits
const emit = defineEmits<{
  'edit-record': [record: RecordResponse]
  'duplicate-record': [record: RecordResponse]
  'delete-record': [record: RecordResponse]
  'view-record': [record: RecordResponse]
}>()

// Component initialization
onMounted(() => {
  // Table ready for pinning functionality
})
</script>