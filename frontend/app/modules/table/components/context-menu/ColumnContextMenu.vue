<script setup lang="ts">
import type { Column } from '@tanstack/vue-table'
import { toast } from 'vue-sonner'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger
} from '@foundation/components/ui/context-menu'
import type { RecordResponse } from '../../types'

const props = defineProps<{
  column: Column<RecordResponse>
  pinning?: {
    pinColumn: (columnId: string, position: 'left' | 'right') => Promise<boolean>
    unpinColumn: (columnId: string) => Promise<boolean>
    isPinnedColumn: (columnId: string) => 'left' | 'right' | false
  }
  onHideColumn?: (columnId: string) => void
}>()

const { t } = useI18n()

// カラムの固定状態を取得
const isPinned = computed(() => props.column.getIsPinned())

// カラムを固定
const handlePinColumn = async (position: 'left' | 'right') => {
  if (!props.pinning) return
  
  try {
    const success = await props.pinning.pinColumn(props.column.id, position)
    
    if (success) {
      toast.success(t('modules.table.pinning.columnPinned', { 
        column: props.column.columnDef.header || props.column.id,
        position: t(`modules.table.pinning.${position}`) 
      }))
    }
  } catch (error) {
    console.error('Failed to pin column:', error)
    toast.error(t('modules.table.pinning.error'))
  }
}

// カラムの固定を解除
const handleUnpinColumn = async () => {
  if (!props.pinning) return
  
  try {
    const success = await props.pinning.unpinColumn(props.column.id)
    if (success) {
      toast.success(t('modules.table.pinning.columnUnpinned', {
        column: props.column.columnDef.header || props.column.id
      }))
    }
  } catch (error) {
    console.error('Failed to pin column:', error)
    toast.error(t('modules.table.pinning.error'))
  }
}

// ソート
const handleSort = (direction: 'asc' | 'desc' | false) => {
  if (!props.column.getCanSort()) return
  
  if (direction === false) {
    props.column.clearSorting()
  } else {
    props.column.toggleSorting(direction === 'desc')
  }
}

// カラムを非表示
const handleHideColumn = () => {
  props.column.toggleVisibility(false)
  props.onHideColumn?.(props.column.id)
  toast.success(t('modules.table.record.columns.hidden', {
    column: props.column.columnDef.header || props.column.id
  }))
}

// カラム幅を自動調整
const handleAutoSize = () => {
  // TODO: 実装予定
  toast.info(t('foundation.messages.info.comingSoon'))
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
            <Icon name="lucide:pin" class="mr-2 h-4 w-4 text-primary" />
            <span class="font-medium">{{ $t('modules.table.pinning.title') }}</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem @click="handlePinColumn('left')">
              <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
              {{ $t('modules.table.pinning.pinLeft') }}
            </ContextMenuItem>
            <ContextMenuItem @click="handlePinColumn('right')">
              <Icon name="lucide:arrow-right" class="mr-2 h-4 w-4" />
              {{ $t('modules.table.pinning.pinRight') }}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        <ContextMenuItem v-else @click="handleUnpinColumn">
          <Icon name="lucide:pin-off" class="mr-2 h-4 w-4 text-orange-500" />
          <span class="font-medium">{{ $t('modules.table.pinning.unpin') }}</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
      </template>
      
      <!-- ソート -->
      <template v-if="column.getCanSort()">
        <ContextMenuItem @click="handleSort('asc')">
          <Icon name="lucide:arrow-up" class="mr-2 h-4 w-4" />
          {{ $t('modules.table.sort.asc') }}
        </ContextMenuItem>
        
        <ContextMenuItem @click="handleSort('desc')">
          <Icon name="lucide:arrow-down" class="mr-2 h-4 w-4" />
          {{ $t('modules.table.sort.desc') }}
        </ContextMenuItem>
        
        <ContextMenuItem 
          v-if="column.getIsSorted()"
          @click="handleSort(false)"
        >
          <Icon name="lucide:arrow-up-down" class="mr-2 h-4 w-4" />
          {{ $t('modules.table.sort.clear') }}
        </ContextMenuItem>
        
        <ContextMenuSeparator />
      </template>
      
      <!-- 表示制御 -->
      <ContextMenuItem 
        v-if="column.getCanHide()"
        @click="handleHideColumn"
      >
        <Icon name="lucide:eye-off" class="mr-2 h-4 w-4" />
        {{ $t('modules.table.record.columns.hide') }}
      </ContextMenuItem>
      
      <ContextMenuItem @click="handleAutoSize">
        <Icon name="lucide:maximize-2" class="mr-2 h-4 w-4" />
        {{ $t('modules.table.record.columns.autoSize') }}
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>