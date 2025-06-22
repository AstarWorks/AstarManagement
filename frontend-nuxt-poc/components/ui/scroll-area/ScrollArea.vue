<template>
  <ScrollAreaRoot
    :class="cn('relative overflow-hidden', props.class)"
    :as-child="asChild"
    :type="type"
    :dir="dir"
    :scrollHideDelay="scrollHideDelay"
  >
    <ScrollAreaViewport class="h-full w-full rounded-[inherit]">
      <slot />
    </ScrollAreaViewport>
    <ScrollBar orientation="vertical" />
    <ScrollBar orientation="horizontal" />
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>

<script setup lang="ts">
import {
  ScrollAreaRoot,
  ScrollAreaViewport,
  ScrollAreaCorner
} from 'radix-vue'
import ScrollBar from './ScrollBar.vue'
import { cn } from '~/lib/utils'

interface ScrollAreaProps {
  class?: string
  asChild?: boolean
  type?: 'auto' | 'always' | 'scroll' | 'hover'
  dir?: 'ltr' | 'rtl'
  scrollHideDelay?: number
}

const props = withDefaults(defineProps<ScrollAreaProps>(), {
  asChild: false,
  type: 'hover',
  scrollHideDelay: 600
})
</script>