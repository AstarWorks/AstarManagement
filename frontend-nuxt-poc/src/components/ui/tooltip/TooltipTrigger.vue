<template>
  <TooltipTrigger
    :as-child="asChild"
    :class="cn(props.class)"
  >
    <slot />
  </TooltipTrigger>
</template>

<script setup lang="ts">
import { TooltipTrigger } from 'radix-vue'
import { cn } from '~/lib/utils'

interface TooltipTriggerProps {
  class?: string
  asChild?: boolean
}

const props = withDefaults(defineProps<TooltipTriggerProps>(), {
  asChild: false
})
</script>