<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from '@foundation/lib/utils/cn'

const props = defineProps<{
  class?: HTMLAttributes["class"]
  maxHeight?: string  // デフォルト: calc(100vh-24rem)
  stickyHeader?: boolean  // デフォルト: true
}>()
</script>

<template>
  <div 
    data-slot="sticky-table-container" 
    :class="cn(
      'relative w-full overflow-auto border rounded-lg',
      props.class
    )"
    :style="{
      maxHeight: props.maxHeight || 'calc(100vh - 24rem)'
    }"
  >
    <slot />
  </div>
</template>