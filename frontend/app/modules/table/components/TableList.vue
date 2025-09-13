<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <TableListHeader 
      :stats="stats"
      :view-mode="viewMode"
      @toggle-view="viewMode = $event"
      @create="openCreateDialog"
      @share="handleShare"
    />
    
    <!-- Search & Filter Bar -->
    <TableListToolbar
      v-model:search="searchQuery"
      v-model:sort-by="sortBy"
      v-model:sort-order="sortOrder"
      @toggle-sort="() => toggleSort(sortBy)"
    />
    
    <!-- Loading State -->
    <TableListSkeleton v-if="isLoading" />
    
    <!-- Error State -->
    <ErrorDisplay 
      v-else-if="isError"
      :error="error ?? new Error('Unknown error')"
      @retry="refresh"
    />
    
    <!-- Empty State -->
    <EmptyState
      v-else-if="tables.length === 0"
      :title="searchQuery ? $t('modules.table.empty.search') : $t('modules.table.empty.title')"
      :description="searchQuery ? $t('modules.table.empty.searchDescription') : $t('modules.table.empty.description')"
      icon="lucide:table"
    >
      <Button v-if="!searchQuery" @click="openCreateDialog">
        <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
        {{ $t('modules.table.actions.createFirst') }}
      </Button>
    </EmptyState>
    
    <!-- Table Grid (Card View) -->
    <TableListGrid
      v-else-if="viewMode === 'card'"
      :tables="(tables as TableResponse[])"
      @navigate="navigateToTable"
      @edit="openEditDialog"
      @duplicate="duplication.duplicateTable"
      @delete="deletion.openDeleteDialog"
    />
    
    <!-- Table List (List View) -->
    <TableListTable
      v-else
      :tables="(tables as TableResponse[])"
      :selected-tables="(selection.selectedTables.value as string[])"
      :is-all-selected="selection.isAllSelected.value"
      @navigate="navigateToTable"
      @edit="openEditDialog"
      @duplicate="duplication.duplicateTable"
      @delete="deletion.openDeleteDialog"
      @toggle-select="selection.toggleSelect"
      @toggle-select-all="selection.toggleSelectAll"
    />
    
    <!-- Batch Actions Bar -->
    <TableBatchActions
      v-if="selection.selectedTables.value.length > 0"
      :selected-count="selection.selectedTables.value.length"
      @clear="selection.clearSelection"
      @delete="handleBatchDelete"
    />
    
    <!-- Create/Edit Dialog -->
    <CreateTableDialog
      v-model:open="dialogOpen"
      :table="editingTable"
      :workspace-id="workspaceId"
      @success="handleCreateSuccess"
    />
    
    <!-- Delete Confirmation -->
    <DeleteTableDialog
      v-model:open="deletion.deleteDialogOpen.value"
      :table="(deletion.deletingTable.value as TableResponse | null)"
      :is-deleting="deletion.isDeleting.value"
      @confirm="deletion.confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { TableResponse } from '../types'

// 子コンポーネント
import TableListHeader from './list/TableListHeader.vue'
import TableListToolbar from './list/TableListToolbar.vue'
import TableListGrid from './list/TableListGrid.vue'
import TableListTable from './list/TableListTable.vue'
import TableListSkeleton from './list/TableListSkeleton.vue'
import TableBatchActions from './list/TableBatchActions.vue'
import DeleteTableDialog from './dialogs/DeleteTableDialog.vue'

// 既存コンポーネント
import CreateTableDialog from './CreateTableDialog.vue'
import ErrorDisplay from "@foundation/components/common/states/ErrorDisplay.vue"
import EmptyState from "@foundation/components/common/states/EmptyState.vue"

// Composables
import { useTableList } from '../composables/useTableList'
import { useTableSelection } from '../composables/table/useTableSelection'
import { useTableDeletion } from '../composables/table/useTableDeletion'
import { useTableDuplication } from '../composables/table/useTableDuplication'

const props = defineProps<{
  workspaceId: string
}>()

const router = useRouter()
const { t } = useI18n()

// Composables
const {
  tables,
  stats,
  isLoading,
  isError,
  error,
  searchQuery,
  sortBy,
  sortOrder,
  viewMode,
  refresh,
  toggleSort
} = useTableList(props.workspaceId)

const selection = useTableSelection(tables as Ref<TableResponse[]>)
const deletion = useTableDeletion(refresh)
const duplication = useTableDuplication(refresh)

// ローカル状態
const dialogOpen = ref(false)
const editingTable = ref<TableResponse | null>(null)

// メソッド
const navigateToTable = (id: string) => {
  router.push(`/tables/${id}`)
}

const openCreateDialog = () => {
  editingTable.value = null
  dialogOpen.value = true
}

const openEditDialog = (table: TableResponse) => {
  editingTable.value = table
  dialogOpen.value = true
}

const handleCreateSuccess = () => {
  dialogOpen.value = false
  editingTable.value = null
  toast.success(t('modules.table.messages.created'))
  refresh()
}

const handleBatchDelete = async () => {
  const result = await deletion.batchDelete(selection.selectedTables.value as string[])
  if (result.successCount > 0) {
    selection.clearSelection()
  }
}

const handleShare = () => {
  // TODO: Implement share functionality
  toast.info(t('foundation.messages.info.processing'))
}
</script>