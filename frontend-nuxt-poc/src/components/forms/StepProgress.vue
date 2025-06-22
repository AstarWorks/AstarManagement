<template>
  <div :class="containerClasses">
    <!-- Progress Bar (Compact/Minimal variants) -->
    <div v-if="variant !== 'default'" class="w-full bg-muted rounded-full h-2 mb-4">
      <div
        class="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
        :style="{ width: `${progressPercentage}%` }"
      />
    </div>

    <!-- Step Navigation -->
    <div :class="stepsContainerClasses">
      <div
        v-for="(step, index) in steps"
        :key="step.id"
        :class="stepClasses(index)"
        @click="handleStepClick(index)"
      >
        <!-- Step Connector Line (Before) -->
        <div
          v-if="index > 0 && variant === 'default'"
          :class="connectorClasses(index - 1)"
        />

        <!-- Step Circle -->
        <div :class="stepCircleClasses(index)">
          <!-- Completed Check -->
          <Check v-if="isStepCompleted(index)" class="h-4 w-4 text-white" />
          <!-- Current Step -->
          <div
            v-else-if="isCurrentStep(index)"
            class="w-2 h-2 bg-white rounded-full"
          />
          <!-- Future Step Number -->
          <span v-else class="text-xs font-medium">
            {{ index + 1 }}
          </span>
        </div>

        <!-- Step Label -->
        <div v-if="variant === 'default'" class="mt-2 text-center">
          <div :class="stepLabelClasses(index)">
            {{ step.title || `Step ${index + 1}` }}
          </div>
          <div
            v-if="step.description && showDescriptions"
            class="text-xs text-muted-foreground mt-1 max-w-[120px]"
          >
            {{ step.description }}
          </div>
        </div>

        <!-- Connector Line (After) -->
        <div
          v-if="index < steps.length - 1 && variant === 'default'"
          :class="connectorClasses(index)"
        />
      </div>
    </div>

    <!-- Current Step Info (Compact/Minimal) -->
    <div v-if="variant !== 'default'" class="text-center mt-2">
      <div class="font-medium text-foreground">
        {{ currentStepConfig?.title || `Step ${currentStep + 1}` }}
      </div>
      <div v-if="currentStepConfig?.description" class="text-sm text-muted-foreground">
        {{ currentStepConfig.description }}
      </div>
      <div class="text-xs text-muted-foreground mt-1">
        {{ currentStep + 1 }} of {{ steps.length }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'
import { cn } from '~/lib/utils'
import type { StepConfig } from './MultiStepForm.vue'

/**
 * StepProgress component props
 */
export interface StepProgressProps {
  /** Array of step configurations */
  steps: StepConfig[]
  /** Current active step index */
  currentStep: number
  /** Set of completed step indices */
  completedSteps: Set<number>
  /** Progress indicator variant */
  variant?: 'default' | 'compact' | 'minimal'
  /** Whether to show step descriptions */
  showDescriptions?: boolean
  /** Whether steps are clickable */
  clickable?: boolean
  /** Custom step colors */
  colors?: {
    completed?: string
    current?: string
    future?: string
  }
}

const props = withDefaults(defineProps<StepProgressProps>(), {
  variant: 'default',
  showDescriptions: true,
  clickable: true,
  colors: () => ({
    completed: 'bg-primary',
    current: 'bg-primary',
    future: 'bg-muted'
  })
})

const emit = defineEmits<{
  stepClick: [stepIndex: number]
}>()

// Computed properties
const progressPercentage = computed(() => {
  if (props.steps.length <= 1) return 100
  return (props.currentStep / (props.steps.length - 1)) * 100
})

const currentStepConfig = computed(() => props.steps[props.currentStep])

// Step state checks
const isStepCompleted = (index: number): boolean => {
  return props.completedSteps.has(index)
}

const isCurrentStep = (index: number): boolean => {
  return index === props.currentStep
}

const isStepClickable = (index: number): boolean => {
  if (!props.clickable) return false
  // Allow clicking on completed steps and current step
  return isStepCompleted(index) || isCurrentStep(index) || index < props.currentStep
}

// Styling classes
const containerClasses = computed(() => {
  return cn(
    'w-full',
    props.variant === 'default' && 'py-4'
  )
})

const stepsContainerClasses = computed(() => {
  const baseClasses = 'flex items-center'
  
  switch (props.variant) {
    case 'default':
      return cn(baseClasses, 'justify-between relative')
    case 'compact':
    case 'minimal':
      return cn(baseClasses, 'justify-center gap-2')
    default:
      return baseClasses
  }
})

const stepClasses = (index: number) => {
  const baseClasses = 'relative flex flex-col items-center'
  
  return cn(
    baseClasses,
    props.variant === 'default' && 'flex-1 max-w-[150px]',
    isStepClickable(index) && 'cursor-pointer hover:opacity-80 transition-opacity',
    !isStepClickable(index) && 'cursor-not-allowed'
  )
}

const stepCircleClasses = (index: number) => {
  const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-white font-medium transition-all duration-200 z-10 relative'
  
  let colorClasses = ''
  if (isStepCompleted(index)) {
    colorClasses = props.colors.completed || 'bg-primary'
  } else if (isCurrentStep(index)) {
    colorClasses = props.colors.current || 'bg-primary'
  } else {
    colorClasses = props.colors.future || 'bg-muted text-muted-foreground'
  }
  
  return cn(
    baseClasses,
    colorClasses,
    props.variant !== 'default' && 'w-6 h-6'
  )
}

const stepLabelClasses = (index: number) => {
  const baseClasses = 'text-sm font-medium'
  
  let colorClasses = ''
  if (isStepCompleted(index)) {
    colorClasses = 'text-primary'
  } else if (isCurrentStep(index)) {
    colorClasses = 'text-foreground'
  } else {
    colorClasses = 'text-muted-foreground'
  }
  
  return cn(baseClasses, colorClasses)
}

const connectorClasses = (index: number) => {
  const baseClasses = 'absolute top-4 h-0.5 transition-all duration-200'
  
  // Determine connector position and color
  const isCompleted = isStepCompleted(index)
  const colorClasses = isCompleted ? 'bg-primary' : 'bg-muted'
  
  return cn(
    baseClasses,
    colorClasses,
    'left-full w-full -translate-y-1/2'
  )
}

// Event handlers
const handleStepClick = (index: number) => {
  if (isStepClickable(index)) {
    emit('stepClick', index)
  }
}

// Expose step utilities
defineExpose({
  isStepCompleted,
  isCurrentStep,
  isStepClickable,
  progressPercentage: readonly(progressPercentage)
})
</script>