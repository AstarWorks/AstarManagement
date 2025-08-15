<template>
  <div class="flex items-center gap-2 min-w-20 md:min-w-16">
    <div class="flex-1 bg-muted rounded-full overflow-hidden" :class="progressBarSizeClass">
      <div
        class="h-full min-w-1 transition-all duration-300 ease-out rounded-full"
        :style="{ width: `${progressPercentage}%` }"
        :class="progressFillClass"
      />
    </div>
    <span class="text-muted-foreground font-medium" :class="textSizeClass">
      {{ progressText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CaseStatus } from '@case/types/case'

interface Props {
  status: CaseStatus
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showPercentage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  showPercentage: true
})

// i18n
const { t } = useI18n()

// Status progression mapping
const statusConfig = computed(() => {
  const configs: Record<CaseStatus, { order: number; label: string; color: string }> = {
    new: { order: 1, label: t('matter.status.new'), color: 'bg-blue-500' },
    accepted: { order: 2, label: t('matter.status.accepted'), color: 'bg-green-500' },
    investigation: { order: 3, label: t('matter.status.investigation'), color: 'bg-yellow-500' },
    preparation: { order: 4, label: t('matter.status.preparation'), color: 'bg-purple-500' },
    negotiation: { order: 5, label: t('matter.status.negotiation'), color: 'bg-orange-500' },
    trial: { order: 6, label: t('matter.status.trial'), color: 'bg-red-500' },
    completed: { order: 7, label: t('matter.status.completed'), color: 'bg-gray-500' }
  }
  
  return configs[props.status as keyof typeof configs] || configs.new
})

const totalSteps = 7 // Total number of status steps

const progressPercentage = computed(() => {
  const currentStep = statusConfig.value?.order || 1
  return Math.round((currentStep / totalSteps) * 100)
})

const progressText = computed(() => {
  if (props.showPercentage) {
    return `${progressPercentage.value}%`
  }
  return statusConfig.value?.label || ''
})

const progressFillClass = computed(() => {
  return statusConfig.value?.color || 'bg-gray-500'
})

const progressBarSizeClass = computed(() => {
  const sizes = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5'
  }
  
  return sizes[props.size]
})

const textSizeClass = computed(() => {
  const sizes = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }
  
  return sizes[props.size]
})
</script>

