<template>
  <TooltipProvider
    :delay-duration="delayDuration"
    :skip-delay-duration="skipDelayDuration"
    :disable-closing-trigger="disableClosingTrigger"
    :disabled="disabled"
    :disable-hover-able-content="disableHoverableContent"
  >
    <slot />
  </TooltipProvider>
</template>

<script setup lang="ts">
import { TooltipProvider } from 'radix-vue'

interface TooltipProviderProps {
  delayDuration?: number
  skipDelayDuration?: number
  disableClosingTrigger?: boolean
  disabled?: boolean
  disableHoverableContent?: boolean
}

const props = withDefaults(defineProps<TooltipProviderProps>(), {
  delayDuration: 700,
  skipDelayDuration: 300,
  disableClosingTrigger: false,
  disabled: false,
  disableHoverableContent: false
})
</script>