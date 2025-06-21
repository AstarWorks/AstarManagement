<template>
  <div :class="cn('rounded-lg border shadow-sm', props.class)" style="background-color: hsl(var(--card)); color: hsl(var(--card-foreground));">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'

interface CardProps {
  class?: string
}

const props = defineProps<CardProps>()
</script>