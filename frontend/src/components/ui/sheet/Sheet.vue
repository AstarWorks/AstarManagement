<template>
  <DialogRoot :open="open" @update:open="$emit('update:open', $event)">
    <slot />
  </DialogRoot>
</template>

<script setup lang="ts">
import { DialogRoot } from 'radix-vue'

interface SheetProps {
  open?: boolean
}

const props = defineProps<SheetProps>()
const emit = defineEmits<{
  'update:open': [value: boolean]
}>()
</script>