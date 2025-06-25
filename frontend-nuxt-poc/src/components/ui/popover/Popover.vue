<template>
  <PopoverRoot :open="open" @update:open="$emit('update:open', $event)">
    <slot />
  </PopoverRoot>
</template>

<script setup lang="ts">
import { PopoverRoot } from 'radix-vue'

interface PopoverProps {
  open?: boolean
  defaultOpen?: boolean
}

const props = defineProps<PopoverProps>()
const emit = defineEmits<{
  'update:open': [value: boolean]
}>()
</script>