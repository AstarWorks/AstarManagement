<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from '@foundation/lib/utils/cn'

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <tr
    data-slot="table-row"
    :class="cn('border-b hover:bg-muted/50 data-[state=selected]:bg-muted transition-colors', props.class)"
  >
    <slot />
  </tr>
</template>
