<template>
  <ToggleGroupItemPrimitive
    :value="props.value"
    v-bind="$attrs"
    :class="cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow',
      props.class
    )"
  >
    <slot />
  </ToggleGroupItemPrimitive>
</template>

<script setup lang="ts">
import { ToggleGroupItem as ToggleGroupItemPrimitive } from 'radix-vue'
import { cn } from '~/lib/utils'

interface Props {
  value: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {})
</script>