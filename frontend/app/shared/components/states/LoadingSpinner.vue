<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@shared/utils/cn'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'muted'
  label?: string
  inline?: boolean
  class?: string
}

const props = withDefaults(defineProps<LoadingSpinnerProps>(), {
  size: 'md',
  variant: 'primary',
  inline: false
})

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
}

const variantClasses = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  muted: 'text-muted-foreground'
}

const containerClasses = computed(() => cn(
  'flex items-center gap-2',
  props.inline ? 'inline-flex' : 'flex',
  props.class
))

const spinnerClasses = computed(() => cn(
  'animate-spin',
  sizeClasses[props.size],
  variantClasses[props.variant]
))
</script>

<template>
  <div :class="containerClasses">
    <svg 
      :class="spinnerClasses"
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        class="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        stroke-width="4"
      />
      <path 
        class="opacity-75" 
        fill="currentColor" 
        d="m4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <span v-if="label" class="text-sm text-muted-foreground">
      {{ label }}
    </span>
  </div>
</template>