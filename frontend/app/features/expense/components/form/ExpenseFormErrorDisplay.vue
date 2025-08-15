<template>
  <div v-if="hasAnyError" class="expense-form-errors space-y-4">
    <!-- Unsaved Changes Warning -->
    <Alert 
      v-if="showUnsavedChanges && hasUnsavedChanges" 
      variant="default"
      role="alert"
      :aria-label="t('expense.confirmations.unsavedChanges')"
    >
      <Icon name="lucide:alert-triangle" class="h-4 w-4" aria-hidden="true" />
      <AlertDescription>
        {{ t('expense.confirmations.unsavedChanges') }}
      </AlertDescription>
    </Alert>

    <!-- Draft Error Display -->
    <Alert 
      v-if="draftError" 
      variant="destructive"
      role="alert"
      :aria-label="t('expense.errors.draftSaveFailed')"
    >
      <Icon name="lucide:alert-circle" class="h-4 w-4" aria-hidden="true" />
      <AlertDescription>
        <span>{{ t('expense.errors.draftSaveFailed') }}</span>
        <span v-if="draftError" class="block mt-1 text-sm">{{ draftError }}</span>
      </AlertDescription>
    </Alert>

    <!-- Main Error Display with Recovery Actions -->
    <Alert 
      v-if="currentError" 
      :variant="errorVariant"
      role="alert"
      :aria-live="errorAriaLive"
      :aria-label="currentError.message"
    >
      <Icon 
        :name="errorIcon" 
        class="h-4 w-4" 
        aria-hidden="true"
      />
      <AlertDescription class="flex flex-col gap-3">
        <!-- Error message -->
        <div>
          <span class="font-medium">{{ currentError.message }}</span>
          <span v-if="currentError.field" class="block mt-1 text-sm opacity-90">
            {{ t('expense.errors.field', { field: currentError.field }) }}
          </span>
        </div>
        
        <!-- Recovery Actions -->
        <div v-if="recoveryActions && recoveryActions.length > 0" class="flex flex-wrap gap-2">
          <Button
            v-for="action in recoveryActions"
            :key="action.label"
            :variant="action.variant || 'secondary'"
            size="sm"
            :disabled="isRecovering"
            :aria-label="action.label"
            @click="handleRecoveryAction(action)"
          >
            <Icon
              v-if="isRecovering && action.variant === 'default'" 
              name="lucide:loader-2" 
              class="w-3 h-3 mr-1 animate-spin" 
              aria-hidden="true"
            />
            {{ action.label }}
          </Button>
        </div>

        <!-- Error details (for development) -->
        <details v-if="showErrorDetails && currentError.details" class="mt-2">
          <summary class="text-xs cursor-pointer opacity-70 hover:opacity-100">
            {{ t('common.showDetails') }}
          </summary>
          <pre class="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">{{ 
            JSON.stringify(currentError.details, null, 2) 
          }}</pre>
        </details>
      </AlertDescription>
    </Alert>

    <!-- Validation Summary (multiple field errors) -->
    <Alert 
      v-if="validationErrors && Object.keys(validationErrors).length > 1" 
      variant="default"
      role="alert"
      aria-label="t('expense.errors.validationSummary')"
    >
      <Icon name="lucide:info" class="h-4 w-4" aria-hidden="true" />
      <AlertDescription>
        <span class="font-medium block mb-2">{{ t('expense.errors.validationSummary') }}</span>
        <ul class="list-disc list-inside space-y-1 text-sm">
          <li v-for="(error, field) in validationErrors" :key="field">
            <span class="font-medium">{{ field }}:</span> {{ error }}
          </li>
        </ul>
      </AlertDescription>
    </Alert>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Alert, AlertDescription } from '@ui/alert'
import { Button } from '@ui/button/index'
import type { IFormError, IErrorRecoveryAction } from '@expense/composables/form/useExpenseFormErrorHandling'

interface Props {
  currentError?: IFormError | null
  draftError?: string | null
  validationErrors?: Record<string, string>
  recoveryActions?: IErrorRecoveryAction[]
  isRecovering?: boolean
  hasUnsavedChanges?: boolean
  showUnsavedChanges?: boolean
  showErrorDetails?: boolean
}

interface Emits {
  (e: 'recoveryAction', action: IErrorRecoveryAction): void
}

const props = withDefaults(defineProps<Props>(), {
  currentError: null,
  draftError: null,
  validationErrors: () => ({}),
  recoveryActions: () => [],
  isRecovering: false,
  hasUnsavedChanges: false,
  showUnsavedChanges: true,
  showErrorDetails: false // Only show in development
})

const emit = defineEmits<Emits>()

// Composables
const { t } = useI18n()

// Computed properties
const hasAnyError = computed(() => {
  return Boolean(props.currentError || 
    props.draftError || 
    (props.hasUnsavedChanges && props.showUnsavedChanges) ||
    (props.validationErrors && Object.keys(props.validationErrors).length > 0))
})

const errorVariant = computed(() => {
  if (!props.currentError) return 'default'
  
  switch (props.currentError.type) {
    case 'validation':
      return 'default'
    case 'network':
    case 'storage':
    case 'permission':
      return 'destructive'
    default:
      return 'destructive'
  }
})

const errorIcon = computed(() => {
  if (!props.currentError) return 'lucide:alert-circle'
  
  switch (props.currentError.type) {
    case 'validation':
      return 'lucide:alert-triangle'
    case 'network':
      return 'lucide:wifi-off'
    case 'storage':
      return 'lucide:database'
    case 'permission':
      return 'lucide:lock'
    default:
      return 'lucide:alert-circle'
  }
})

const errorAriaLive = computed(() => {
  if (!props.currentError) return 'polite'
  
  // Use assertive for critical errors
  return props.currentError.type === 'permission' || props.currentError.type === 'network' 
    ? 'assertive' 
    : 'polite'
})

// Handlers
const handleRecoveryAction = (action: IErrorRecoveryAction): void => {
  emit('recoveryAction', action)
  action.action()
}

// Expose for parent component
defineExpose({
  hasAnyError
})
</script>