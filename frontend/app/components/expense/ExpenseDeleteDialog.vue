<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ $t('expense.delete.title') }}</DialogTitle>
        <DialogDescription>
          {{ $t('expense.delete.message', { title: expense?.description || '' }) }}
        </DialogDescription>
      </DialogHeader>
      
      <div class="flex flex-col gap-3">
        <div class="bg-destructive/10 border border-destructive/20 rounded-md p-3">
          <div class="flex items-center gap-2">
            <Icon name="lucide:alert-triangle" class="text-destructive size-4" />
            <span class="text-sm text-destructive font-medium">
              {{ $t('expense.delete.warning') }}
            </span>
          </div>
        </div>
      </div>
      
      <DialogFooter class="gap-2">
        <Button variant="outline" @click="handleCancel">
          {{ $t('common.cancel') }}
        </Button>
        <Button 
          variant="destructive" 
          :loading="isDeleting"
          @click="handleConfirm"
        >
          {{ $t('expense.delete.confirm') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { IExpense } from '~/types/expense'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'

interface ExpenseDeleteDialogProps {
  open?: boolean
  expense?: IExpense
  isDeleting?: boolean
}

interface ExpenseDeleteDialogEmits {
  (e: 'update:open', value: boolean): void
  (e: 'confirm' | 'cancel'): void
}

const props = withDefaults(defineProps<ExpenseDeleteDialogProps>(), {
  open: false,
  isDeleting: false
})

const emits = defineEmits<ExpenseDeleteDialogEmits>()

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emits('update:open', value)
})

const handleConfirm = () => {
  emits('confirm')
}

const handleCancel = () => {
  emits('cancel')
  isOpen.value = false
}
</script>