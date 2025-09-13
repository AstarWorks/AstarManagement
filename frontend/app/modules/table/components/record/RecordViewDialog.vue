<!--
  DEPRECATED: This component is deprecated in favor of RecordEditDialog with mode='view'
  RecordEditDialog now supports both edit and view modes through the 'mode' prop
  This file is kept for backward compatibility but should not be used in new code
-->
<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ $t('modules.table.record.view.title') }}</DialogTitle>
      </DialogHeader>
      
      <div class="space-y-4 py-4">
        <p class="text-muted-foreground">
          {{ $t('modules.table.detail.comingSoon') }}
        </p>
      </div>
      
      <DialogFooter>
        <Button @click="isOpen = false">
          {{ $t('foundation.actions.basic.close') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { RecordResponse, PropertyDefinitionDto } from '../../types'

const props = defineProps<{
  open: boolean
  record: RecordResponse | null
  properties: Record<string, PropertyDefinitionDto>
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})
</script>