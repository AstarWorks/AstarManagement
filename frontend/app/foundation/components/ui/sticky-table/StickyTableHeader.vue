<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from '@foundation/lib/utils/cn'

const props = defineProps<{
  class?: HTMLAttributes["class"]
  sticky?: boolean  // デフォルト: true
}>()
</script>

<template>
  <thead
    data-slot="sticky-table-header"
    :class="cn(
      '[&_tr]:border-b',
      props.sticky !== false && 'sticky top-0 z-50 bg-background/95 backdrop-blur-sm',
      props.class
    )"
    :style="props.sticky !== false ? 'position: sticky !important; top: 0 !important; z-index: 50 !important;' : ''"
  >
    <slot />
  </thead>
</template>