<template>
  <DialogRoot v-model:open="internalOpen">
    <slot />
  </DialogRoot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DialogRoot } from 'radix-vue'

interface DialogProps {
  open?: boolean
  defaultOpen?: boolean
}

const props = defineProps<DialogProps>()
const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const internalOpen = computed({
  get: () => props.open ?? false,
  set: (value: boolean) => emit('update:open', value)
})
</script>