<template>
  <PopoverTrigger
    :as-child="asChild"
    :class="cn(props.class)"
  >
    <slot />
  </PopoverTrigger>
</template>

<script setup lang="ts">
import { PopoverTrigger } from 'radix-vue'
import { cn } from '~/lib/utils'

interface PopoverTriggerProps {
  class?: string
  asChild?: boolean
}

const props = withDefaults(defineProps<PopoverTriggerProps>(), {
  asChild: false
})
</script>