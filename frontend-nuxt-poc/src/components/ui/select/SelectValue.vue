<template>
  <SelectValue
    :placeholder="placeholder"
    :as-child="asChild"
    :class="cn(props.class)"
  >
    <slot />
  </SelectValue>
</template>

<script setup lang="ts">
import { SelectValue } from 'radix-vue'
import { cn } from '~/lib/utils'

interface SelectValueProps {
  class?: string
  placeholder?: string
  asChild?: boolean
}

const props = withDefaults(defineProps<SelectValueProps>(), {
  asChild: false
})
</script>