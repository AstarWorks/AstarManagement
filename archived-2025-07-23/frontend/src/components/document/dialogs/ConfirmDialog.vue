<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {{ options?.title || 'Confirm Action' }}
        </DialogTitle>
        <DialogDescription>
          {{ options?.description || 'Are you sure you want to proceed?' }}
        </DialogDescription>
      </DialogHeader>
      
      <DialogFooter class="flex justify-end gap-2">
        <Button
          variant="outline"
          @click="handleCancel"
        >
          {{ options?.cancelText || 'Cancel' }}
        </Button>
        <Button
          :variant="options?.variant || 'default'"
          @click="handleConfirm"
        >
          {{ options?.confirmText || 'Confirm' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'

interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

interface Props {
  open: boolean
  options: ConfirmOptions | null
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const handleConfirm = () => {
  emit('confirm')
  isOpen.value = false
}

const handleCancel = () => {
  emit('cancel')
  isOpen.value = false
}
</script>