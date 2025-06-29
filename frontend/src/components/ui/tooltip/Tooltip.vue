<template>
  <TooltipRoot
    :open="open"
    :default-open="defaultOpen"
    :delay-duration="delayDuration"
    :disabled="disabled"
    @update:open="$emit('update:open', $event)"
  >
    <slot />
  </TooltipRoot>
</template>

<script setup lang="ts">
import { TooltipRoot } from 'radix-vue'

interface TooltipProps {
  open?: boolean
  defaultOpen?: boolean
  delayDuration?: number
  disabled?: boolean
}

const props = defineProps<TooltipProps>()
const emit = defineEmits<{
  'update:open': [value: boolean]
}>()
</script>