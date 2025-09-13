<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button 
        variant="ghost" 
        size="icon"
        :aria-label="$t('modules.table.actions.menu')"
      >
        <Icon name="lucide:more-vertical" class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="$emit('edit')">
        <Icon name="lucide:edit" class="mr-2 h-4 w-4" />
        {{ $t('foundation.actions.basic.edit') }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="$emit('duplicate')">
        <Icon name="lucide:copy" class="mr-2 h-4 w-4" />
        {{ $t('foundation.actions.data.duplicate') }}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem 
        class="text-destructive focus:text-destructive"
        @click="$emit('delete')"
      >
        <Icon name="lucide:trash" class="mr-2 h-4 w-4" />
        {{ $t('foundation.actions.basic.delete') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import type { TableResponse } from '../../types'

defineProps<{
  table: TableResponse
}>()

defineEmits<{
  edit: []
  duplicate: []
  delete: []
}>()
</script>