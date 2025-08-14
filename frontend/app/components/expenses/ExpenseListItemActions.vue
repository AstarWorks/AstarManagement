<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button 
        variant="ghost" 
        size="sm" 
        class="opacity-0 group-hover:opacity-100 transition-opacity"
        @click.stop
      >
        <Icon name="lucide:more-horizontal" class="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="$emit('view')">
        <Icon name="lucide:eye" class="w-4 h-4 mr-2" />
        {{ $t('expense.actions.view') }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="$emit('edit')">
        <Icon name="lucide:edit" class="w-4 h-4 mr-2" />
        {{ $t('expense.actions.edit') }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="$emit('duplicate')">
        <Icon name="lucide:copy" class="w-4 h-4 mr-2" />
        {{ $t('expense.actions.duplicate') }}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem 
        class="text-destructive"
        @click="$emit('delete')"
      >
        <Icon name="lucide:trash" class="w-4 h-4 mr-2" />
        {{ $t('expense.actions.delete') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '~/components/ui/dropdown-menu'
import { Button } from '~/components/ui/button'

defineEmits<{
  'view': []
  'edit': []
  'duplicate': []
  'delete': []
}>()
</script>