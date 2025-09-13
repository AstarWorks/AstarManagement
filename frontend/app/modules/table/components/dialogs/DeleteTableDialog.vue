<template>
  <Dialog :model-value="open" @update:model-value="$emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ $t('modules.table.delete.title') }}</DialogTitle>
        <DialogDescription>
          {{ $t('modules.table.delete.description', { name: table?.name }) }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button 
          variant="outline" 
          @click="$emit('update:open', false)"
        >
          {{ $t('foundation.actions.basic.cancel') }}
        </Button>
        <Button 
          variant="destructive" 
          :disabled="isDeleting"
          @click="$emit('confirm')"
        >
          <Icon v-if="isDeleting" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
          {{ $t('foundation.actions.basic.delete') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { TableResponse } from '../../types'

withDefaults(defineProps<{
  open: boolean
  table: TableResponse | null
  isDeleting?: boolean
}>(), {
  isDeleting: false
})

defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
}>()
</script>