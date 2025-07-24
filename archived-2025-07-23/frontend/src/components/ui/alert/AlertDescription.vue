<template>
  <div :class="cn('text-sm [&_p]:leading-relaxed', $props.class)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

export interface AlertDescriptionProps {
  class?: any
}

defineProps<AlertDescriptionProps>()
</script>