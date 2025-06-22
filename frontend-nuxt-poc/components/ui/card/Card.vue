<template>
  <div 
    :class="cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      interactive && 'transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
      props.class
    )"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'

interface CardProps {
  class?: string
  interactive?: boolean
}

const props = withDefaults(defineProps<CardProps>(), {
  interactive: false
})
</script>