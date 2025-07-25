<template>
  <div class="case-progress-indicator flex items-center gap-2">
    <div class="progress-bar flex-1 bg-muted rounded-full overflow-hidden" :class="progressBarSizeClass">
      <div
        class="progress-fill bg-primary transition-all duration-300 ease-out rounded-full"
        :style="{ width: `${progressPercentage}%` }"
        :class="progressFillClass"
      />
    </div>
    <span class="progress-text text-muted-foreground font-medium" :class="textSizeClass">
      {{ progressText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CaseStatus } from '~/types/case'

interface Props {
  status: CaseStatus
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showPercentage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  showPercentage: true
})

// Status progression mapping
const statusConfig = computed(() => {
  const configs: Record<CaseStatus, { order: number; label: string; color: string }> = {
    new: { order: 1, label: '新規', color: 'bg-blue-500' },
    accepted: { order: 2, label: '受任', color: 'bg-green-500' },
    investigation: { order: 3, label: '調査', color: 'bg-yellow-500' },
    preparation: { order: 4, label: '準備', color: 'bg-purple-500' },
    negotiation: { order: 5, label: '交渉', color: 'bg-orange-500' },
    trial: { order: 6, label: '裁判', color: 'bg-red-500' },
    completed: { order: 7, label: '完了', color: 'bg-gray-500' }
  }
  
  return configs[props.status] || configs.new
})

const totalSteps = 7 // Total number of status steps

const progressPercentage = computed(() => {
  const currentStep = statusConfig.value.order
  return Math.round((currentStep / totalSteps) * 100)
})

const progressText = computed(() => {
  if (props.showPercentage) {
    return `${progressPercentage.value}%`
  }
  return statusConfig.value.label
})

const progressFillClass = computed(() => {
  return statusConfig.value.color
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

<style scoped>
.progress-fill {
  height: 100%;
  min-width: 4px; /* Ensure some visual feedback even at 0% */
}

.case-progress-indicator {
  min-width: 80px;
}

@media (max-width: 768px) {
  .case-progress-indicator {
    min-width: 60px;
  }
}
</style>