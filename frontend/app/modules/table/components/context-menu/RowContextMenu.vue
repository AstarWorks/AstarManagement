<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import { toast } from 'vue-sonner'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuShortcut
} from '@foundation/components/ui/context-menu'
import type { RecordResponse } from '../../types'

const props = defineProps<{
  row: Row<RecordResponse>
  pinning?: {
    pinRow: (rowId: string, position: 'top' | 'bottom') => Promise<boolean>
    unpinRow: (rowId: string) => Promise<boolean>
    isPinnedRow: (rowId: string) => 'top' | 'bottom' | false
  }
  onEdit?: (row: Row<RecordResponse>) => void
  onDuplicate?: (row: Row<RecordResponse>) => void
  onDelete?: (row: Row<RecordResponse>) => void
}>()

const { t } = useI18n()

// 行の固定状態を取得
const isPinned = computed(() => props.pinning?.isPinnedRow(props.row.id))

// 行を固定
const handlePinRow = async (position: 'top' | 'bottom') => {
  if (!props.pinning) return
  
  try {
    const success = await props.pinning.pinRow(props.row.id, position)
    if (success) {
      toast.success(t('modules.table.pinning.rowPinned', { position: t(`modules.table.pinning.${position}`) }))
    }
  } catch (error) {
    console.error('Failed to pin row:', error)
    toast.error(t('modules.table.pinning.error'))
  }
}

// 行の固定を解除
const handleUnpinRow = async () => {
  if (!props.pinning) return
  
  try {
    const success = await props.pinning.unpinRow(props.row.id)
    if (success) {
      toast.success(t('modules.table.pinning.rowUnpinned'))
    }
  } catch (error) {
    console.error('Failed to pin row:', error)
    toast.error(t('modules.table.pinning.error'))
  }
}

// 編集
const handleEdit = () => {
  props.onEdit?.(props.row)
}

// 複製
const handleDuplicate = () => {
  props.onDuplicate?.(props.row)
}

// 削除
const handleDelete = () => {
  props.onDelete?.(props.row)
}
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuContent class="w-64">
      <!-- 固定操作 -->
      <template v-if="pinning">
        <ContextMenuSub v-if="!isPinned">
          <ContextMenuSubTrigger>
            <Icon name="lucide:pin" class="mr-2 h-4 w-4" />
            {{ $t('modules.table.pinning.title') }}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem @click="handlePinRow('top')">
              <Icon name="lucide:arrow-up" class="mr-2 h-4 w-4" />
              {{ $t('modules.table.pinning.pinTop') }}
            </ContextMenuItem>
            <ContextMenuItem @click="handlePinRow('bottom')">
              <Icon name="lucide:arrow-down" class="mr-2 h-4 w-4" />
              {{ $t('modules.table.pinning.pinBottom') }}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        <ContextMenuItem v-else @click="handleUnpinRow">
          <Icon name="lucide:pin-off" class="mr-2 h-4 w-4" />
          {{ $t('modules.table.pinning.unpin') }}
        </ContextMenuItem>
        
        <ContextMenuSeparator />
      </template>
      
      <!-- 編集操作 -->
      <ContextMenuItem @click="handleEdit">
        <Icon name="lucide:edit" class="mr-2 h-4 w-4" />
        {{ $t('foundation.actions.basic.edit') }}
        <ContextMenuShortcut>⌘E</ContextMenuShortcut>
      </ContextMenuItem>
      
      <ContextMenuItem @click="handleDuplicate">
        <Icon name="lucide:copy" class="mr-2 h-4 w-4" />
        {{ $t('foundation.actions.data.duplicate') }}
        <ContextMenuShortcut>⌘D</ContextMenuShortcut>
      </ContextMenuItem>
      
      <ContextMenuSeparator />
      
      <!-- 削除（破壊的操作） -->
      <ContextMenuItem class="text-destructive focus:text-destructive" @click="handleDelete">
        <Icon name="lucide:trash" class="mr-2 h-4 w-4" />
        {{ $t('foundation.actions.basic.delete') }}
        <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>