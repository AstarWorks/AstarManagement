<template>
  <label
    :for="props.for"
    :class="cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      error && 'text-destructive',
      props.class
    )"
  >
    <slot />
    <span v-if="required" class="ml-1 text-destructive" aria-label="required">*</span>
  </label>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'

interface LabelProps {
  class?: string
  for?: string
  required?: boolean
  error?: boolean
}

const props = withDefaults(defineProps<LabelProps>(), {
  required: false,
  error: false
})
</script>