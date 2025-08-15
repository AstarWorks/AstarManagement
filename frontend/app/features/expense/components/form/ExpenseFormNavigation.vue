<template>
  <div class="expense-form-navigation flex justify-between items-center">
    <!-- Previous Button -->
    <Button 
      type="button"
      variant="outline"
      :disabled="isFirstStep || isSubmitting"
      :aria-label="t('expense.form.navigation.previousStep')"
      @click="$emit('previous')"
    >
      <Icon name="lucide:arrow-left" class="w-4 h-4 mr-2" aria-hidden="true" />
      {{ t('common.previous') }}
    </Button>
    
    <!-- Action Buttons Group -->
    <div class="flex gap-2">
      <!-- Reset Button (only for new forms) -->
      <Button 
        v-if="showReset"
        type="button"
        variant="ghost"
        :disabled="isSubmitting"
        :aria-label="t('expense.form.navigation.resetForm')"
        @click="handleReset"
      >
        <Icon name="lucide:rotate-ccw" class="w-4 h-4 mr-2" aria-hidden="true" />
        {{ t('expense.actions.reset') }}
      </Button>
      
      <!-- Save Draft Button (only for new forms) -->
      <Button
        v-if="showSaveDraft"
        type="button"
        variant="outline"
        :disabled="isSubmitting || !canSaveDraft"
        :aria-label="t('expense.form.navigation.saveDraft')"
        @click="$emit('saveDraft')"
      >
        <Icon 
          :name="isSavingDraft ? 'lucide:loader-2' : 'lucide:save'" 
          class="w-4 h-4 mr-2"
          :class="{ 'animate-spin': isSavingDraft }"
          aria-hidden="true"
        />
        {{ t('expense.actions.saveDraft') }}
      </Button>
      
      <!-- Next/Submit Button -->
      <Button 
        :type="isLastStep ? 'submit' : 'button'"
        :disabled="!canProceed || isSubmitting"
        :aria-label="buttonAriaLabel"
        @click="handleNextOrSubmit"
      >
        <Icon 
          v-if="isSubmitting" 
          name="lucide:loader-2" 
          class="w-4 h-4 mr-2 animate-spin"
          aria-hidden="true"
        />
        <Icon 
          v-else-if="!isLastStep" 
          name="lucide:arrow-right" 
          class="w-4 h-4 mr-2"
          aria-hidden="true"
        />
        <Icon 
          v-else-if="isEdit" 
          name="lucide:check" 
          class="w-4 h-4 mr-2"
          aria-hidden="true"
        />
        <Icon 
          v-else 
          name="lucide:save" 
          class="w-4 h-4 mr-2"
          aria-hidden="true"
        />
        {{ buttonLabel }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@ui/button/index'

interface Props {
  isFirstStep: boolean
  isLastStep: boolean
  canProceed: boolean
  isSubmitting: boolean
  isEdit?: boolean
  showReset?: boolean
  showSaveDraft?: boolean
  canSaveDraft?: boolean
  isSavingDraft?: boolean
}

interface Emits {
  (e: 'previous' | 'next' | 'submit' | 'reset' | 'saveDraft'): void
}

const props = withDefaults(defineProps<Props>(), {
  isEdit: false,
  showReset: false,
  showSaveDraft: false,
  canSaveDraft: true,
  isSavingDraft: false
})

const emit = defineEmits<Emits>()

// Composables
const { t } = useI18n()

// Computed properties
const buttonLabel = computed(() => {
  if (props.isSubmitting) {
    return t('common.processing')
  }
  
  if (props.isLastStep) {
    return props.isEdit 
      ? t('expense.actions.update') 
      : t('expense.actions.save')
  }
  
  return t('common.next')
})

const buttonAriaLabel = computed(() => {
  if (props.isLastStep) {
    return props.isEdit 
      ? t('expense.form.navigation.updateExpense')
      : t('expense.form.navigation.saveExpense')
  }
  
  return t('expense.form.navigation.nextStep')
})

// Handlers
const handleNextOrSubmit = (): void => {
  if (props.isLastStep) {
    // Form submission is handled by the form element
    // This is only for the button type="button" case
    if (!props.isSubmitting) {
      emit('submit')
    }
  } else {
    emit('next')
  }
}

const handleReset = (): void => {
  if (confirm(t('expense.confirmations.resetForm'))) {
    emit('reset')
  }
}

// Expose for parent component
defineExpose({
  handleNextOrSubmit,
  handleReset
})
</script>