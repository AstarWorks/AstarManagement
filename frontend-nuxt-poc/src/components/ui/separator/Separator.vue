<template>
  <SeparatorRoot
    :class="cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      props.class
    )"
    :orientation="orientation"
    :decorative="decorative"
    :as-child="asChild"
  >
    <slot />
  </SeparatorRoot>
</template>

<script setup lang="ts">
import { Separator as SeparatorRoot } from 'radix-vue'
import { cn } from '~/lib/utils'

interface SeparatorProps {
  class?: string
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
  asChild?: boolean
}

const props = withDefaults(defineProps<SeparatorProps>(), {
  orientation: 'horizontal',
  decorative: true,
  asChild: false
})
</script>