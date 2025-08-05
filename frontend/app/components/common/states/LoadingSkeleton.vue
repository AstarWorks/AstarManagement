<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '~/lib/utils'

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | false
  count?: number
  class?: string
}

const props = withDefaults(defineProps<SkeletonProps>(), {
  variant: 'rectangular',
  animation: 'pulse',
  count: 1
})

const variantClasses = {
  text: 'rounded-sm h-4',
  circular: 'rounded-full',
  rectangular: 'rounded-none',
  rounded: 'rounded-md'
}

const animationClasses = {
  pulse: 'animate-pulse',
  wave: 'animate-pulse', // Can be enhanced with custom wave animation later
  false: ''
}

const skeletonClasses = computed(() => cn(
  'bg-primary/10',
  variantClasses[props.variant],
  props.animation !== false ? animationClasses[props.animation as keyof typeof animationClasses] : '',
  props.class
))

const skeletonStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height
}))
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="i in count"
      :key="i"
      data-slot="skeleton"
      :class="skeletonClasses"
      :style="skeletonStyle"
    />
  </div>
</template>