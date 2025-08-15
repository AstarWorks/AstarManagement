<template>
  <div class="step-progress mb-8" role="navigation" :aria-label="t('expense.form.stepProgress')">
    <!-- Step indicators with connecting lines -->
    <div class="flex items-center justify-between">
      <div 
        v-for="(step, index) in steps" 
        :key="step.id"
        class="flex items-center"
        :class="{ 'flex-1': index < steps.length - 1 }"
      >
        <!-- Step circle indicator -->
        <button
          type="button"
          :disabled="!canNavigateToStep(index)"
          :aria-label="t('expense.form.goToStep', { step: step.label })"
          :aria-current="currentStep === index ? 'step' : undefined"
          class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          :class="getStepClass(index)"
          @click="handleStepClick(index)"
        >
          <Icon 
            v-if="isStepCompleted(index)" 
            name="lucide:check" 
            class="w-5 h-5"
            aria-hidden="true"
          />
          <span v-else :aria-hidden="currentStep !== index">{{ index + 1 }}</span>
        </button>
        
        <!-- Connecting line between steps -->
        <div 
          v-if="index < steps.length - 1" 
          class="flex-1 h-0.5 mx-4 transition-colors duration-200"
          :class="isStepCompleted(index) ? 'bg-primary' : 'bg-muted'"
          aria-hidden="true"
        />
      </div>
    </div>
    
    <!-- Step labels -->
    <div class="flex justify-between mt-2">
      <div 
        v-for="(step, index) in steps" 
        :key="`label-${step.id}`"
        class="text-center flex-1"
      >
        <p 
          class="text-sm transition-colors duration-200"
          :class="currentStep >= index ? 'text-foreground font-medium' : 'text-muted-foreground'"
        >
          {{ t(step.label) }}
        </p>
      </div>
    </div>
    
    <!-- Screen reader only: Current step announcement -->
    <div
class="sr-only"
role="status"
aria-live="polite"
aria-atomic="true">
      {{ t('expense.form.currentStep', { current: currentStep + 1, total: steps.length }) }}
    </div>
  </div>
</template>

<script setup lang="ts">

export interface IStep {
  id: string
  label: string
}

interface Props {
  steps: readonly IStep[]
  currentStep: number
  completedSteps?: readonly number[]
  allowStepNavigation?: boolean
}

interface Emits {
  (e: 'stepClick', index: number): void
}

const props = withDefaults(defineProps<Props>(), {
  completedSteps: () => [],
  allowStepNavigation: false
})

const emit = defineEmits<Emits>()

// Composables
const { t } = useI18n()

// Check if a step is completed
const isStepCompleted = (index: number): boolean => {
  return props.completedSteps.includes(index) || props.currentStep > index
}

// Check if user can navigate to a specific step
const canNavigateToStep = (index: number): boolean => {
  if (!props.allowStepNavigation) return false
  
  // Can always go back to previous steps
  if (index < props.currentStep) return true
  
  // Can only go forward if all previous steps are completed
  if (index > props.currentStep) {
    for (let i = 0; i < index; i++) {
      if (!isStepCompleted(i)) return false
    }
  }
  
  return true
}

// Get styling classes for a step
const getStepClass = (index: number): string => {
  const isCompleted = isStepCompleted(index)
  const isCurrent = props.currentStep === index
  
  const baseClasses = 'transition-all duration-200'
  
  if (isCompleted && !isCurrent) {
    return `${baseClasses} bg-primary border-primary text-primary-foreground`
  } else if (isCurrent) {
    return `${baseClasses} bg-background border-primary text-primary ring-2 ring-primary/20`
  } else {
    return `${baseClasses} bg-background border-muted text-muted-foreground`
  }
}

// Handle step click for navigation
const handleStepClick = (index: number): void => {
  if (canNavigateToStep(index)) {
    emit('stepClick', index)
  }
}

// Expose methods for parent component
defineExpose({
  isStepCompleted,
  canNavigateToStep
})
</script>

<style scoped>
/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Focus styles for keyboard navigation */
button:focus-visible {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

/* Disabled state for non-navigable steps */
button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Hover effect for navigable steps */
button:not(:disabled):hover {
  transform: scale(1.1);
}
</style>