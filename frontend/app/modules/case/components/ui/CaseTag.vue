<template>
  <span
    class="inline-flex items-center font-medium rounded-md bg-secondary text-secondary-foreground border border-border whitespace-nowrap max-w-30 md:max-w-20 overflow-hidden text-ellipsis"
    :class="sizeClasses"
  >
    {{ tag }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  tag: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  color: 'default'
})

// Computed properties
const sizeClasses = computed(() => {
  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  }
  
  return sizes[props.size]
})

// Color classes not currently used but available for future enhancement
// const colorClasses = computed(() => {
//   const colors = {
//     default: 'bg-secondary text-secondary-foreground border-border',
//     primary: 'bg-primary/10 text-primary border-primary/20',
//     success: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
//     warning: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
//     danger: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
//   }
//   
//   return colors[props.color]
// })
</script>

