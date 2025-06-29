<template>
  <SelectTrigger
    :class="cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      props.class
    )"
    :disabled="disabled"
    :as-child="asChild"
  >
    <slot>
      <span>
        <slot name="placeholder" />
      </span>
      <SelectIcon as-child>
        <ChevronDown class="h-4 w-4 opacity-50" />
      </SelectIcon>
    </slot>
  </SelectTrigger>
</template>

<script setup lang="ts">
import { SelectTrigger, SelectIcon } from 'radix-vue'
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '~/lib/utils'

interface SelectTriggerProps {
  class?: string
  disabled?: boolean
  asChild?: boolean
}

const props = withDefaults(defineProps<SelectTriggerProps>(), {
  disabled: false,
  asChild: false
})
</script>