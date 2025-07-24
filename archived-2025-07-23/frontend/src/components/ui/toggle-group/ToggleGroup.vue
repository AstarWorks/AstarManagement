<template>
  <ToggleGroupPrimitive
    v-bind="$attrs"
    :class="cn('inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground', props.class)"
  >
    <slot />
  </ToggleGroupPrimitive>
</template>

<script setup lang="ts">
import { ToggleGroupRoot as ToggleGroupPrimitive } from 'radix-vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: string
}

const props = withDefaults(defineProps<Props>(), {})
</script>