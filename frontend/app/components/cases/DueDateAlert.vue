<template>
  <span
    v-if="alertConfig !== null"
    class="due-date-alert inline-flex items-center gap-1 font-medium rounded-full border animate-pulse"
    :class="[sizeClasses, alertClasses]"
    :title="alertMessage"
  >
    <Icon :name="alertIcon" :class="iconSizeClass" />
    <span v-if="showLabel">{{ alertLabel }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { parseISO, differenceInDays } from 'date-fns'

interface Props {
  dueDate: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  showLabel: false
})

// Computed properties
const daysUntilDue = computed(() => {
  if (!props.dueDate) return null
  return differenceInDays(parseISO(props.dueDate), new Date())
})

const alertConfig = computed(() => {
  const days = daysUntilDue.value
  
  if (days === null) return null
  
  if (days < 0) {
    return {
      type: 'overdue',
      label: '期限切れ',
      icon: 'lucide:alert-circle',
      classes: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
      message: `${Math.abs(days)}日遅れています`
    }
  } else if (days === 0) {
    return {
      type: 'today',
      label: '本日',
      icon: 'lucide:clock',
      classes: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700',
      message: '本日が期限です'
    }
  } else if (days <= 3) {
    return {
      type: 'urgent',
      label: '緊急',
      icon: 'lucide:alert-triangle',
      classes: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
      message: `${days}日後が期限です`
    }
  } else if (days <= 7) {
    return {
      type: 'warning',
      label: '注意',
      icon: 'lucide:alert-circle',
      classes: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
      message: `${days}日後が期限です`
    }
  }
  
  return null
})

const alertLabel = computed(() => alertConfig.value?.label || '')
const alertIcon = computed(() => alertConfig.value?.icon || 'lucide:clock')
const alertClasses = computed(() => alertConfig.value?.classes || '')
const alertMessage = computed(() => alertConfig.value?.message || '')

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

// Only show the component if there's an alert condition
// const isVisible = computed(() => alertConfig.value !== null)
</script>

<style scoped>
.due-date-alert {
  white-space: nowrap;
  font-feature-settings: 'tnum';
}

.due-date-alert.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>