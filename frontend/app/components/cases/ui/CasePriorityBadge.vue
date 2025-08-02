<template>
  <span
    class="inline-flex items-center gap-1 font-medium rounded-full border whitespace-nowrap"
    style="font-feature-settings: 'tnum';"
    :class="[sizeClasses, priorityClasses]"
  >
    <Icon :name="priorityIcon" :class="iconSizeClass" />
    <span v-if="showLabel">{{ priorityLabel }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CasePriority } from '~/types/case'

interface Props {
  priority: CasePriority
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  showLabel: true
})

// Computed properties
const priorityConfig = computed(() => {
  const configs = {
    high: {
      label: '緊急',
      icon: 'lucide:alert-triangle',
      classes: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
    },
    medium: {
      label: '通常',
      icon: 'lucide:circle',
      classes: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
    },
    low: {
      label: '低',
      icon: 'lucide:chevron-down',
      classes: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
    }
  }
  
  return configs[props.priority] || configs.medium
})

const priorityLabel = computed(() => priorityConfig.value.label)
const priorityIcon = computed(() => priorityConfig.value.icon)
const priorityClasses = computed(() => priorityConfig.value.classes)

const sizeClasses = computed(() => {
  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  }
  
  return sizes[props.size]
})

const iconSizeClass = computed(() => {
  const sizes = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  }
  
  return sizes[props.size]
})
</script>

