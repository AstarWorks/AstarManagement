<template>
  <div
    :class="cn(
      'animate-pulse rounded-md bg-muted',
      shapeClasses,
      props.class
    )"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '~/lib/utils'

interface SkeletonProps {
  class?: string
  shape?: 'default' | 'circle' | 'text'
  width?: string | number
  height?: string | number
}

const props = withDefaults(defineProps<SkeletonProps>(), {
  shape: 'default'
})

const shapeClasses = computed(() => {
  const baseClasses: Record<string, string> = {
    default: '',
    circle: 'rounded-full',
    text: 'h-4 w-full'
  }
  
  const classes = [baseClasses[props.shape]]
  
  // Apply custom dimensions if provided
  if (props.width) {
    const widthValue = typeof props.width === 'number' ? `${props.width}px` : props.width
    classes.push(`w-[${widthValue}]`)
  }
  
  if (props.height) {
    const heightValue = typeof props.height === 'number' ? `${props.height}px` : props.height
    classes.push(`h-[${heightValue}]`)
  }
  
  // Default dimensions for shapes
  if (!props.width && !props.height) {
    if (props.shape === 'circle') {
      classes.push('h-12 w-12')
    } else if (props.shape === 'default') {
      classes.push('h-4 w-full')
    }
  }
  
  return classes.join(' ')
})
</script>