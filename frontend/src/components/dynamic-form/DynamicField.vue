<!--
  Dynamic Field Component
  Renders a single form field based on template variable type
-->
<template>
  <div class="dynamic-field" :class="fieldClasses">
    <component
      :is="fieldComponent"
      v-bind="fieldProps"
      :model-value="modelValue"
      @update:model-value="handleUpdate"
      @blur="handleBlur"
      @focus="handleFocus"
      @change="handleChange"
    />
    
    <!-- Error display -->
    <div v-if="hasErrors" class="field-errors">
      <p 
        v-for="(error, index) in errors" 
        :key="index"
        class="error-message"
        role="alert"
      >
        {{ error }}
      </p>
    </div>
    
    <!-- Help text -->
    <p v-if="variable.metadata?.helpText" class="field-help">
      {{ variable.metadata.helpText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DynamicFieldProps, DynamicFieldEmits } from './types'
import { useFieldMapping } from '~/composables/form/useFieldMapping'

const props = withDefaults(defineProps<DynamicFieldProps>(), {
  errors: () => [],
  disabled: false,
  readonly: false,
  size: 'md'
})

const emit = defineEmits<DynamicFieldEmits>()

// Get component and props from field mapping
const { fieldComponent, fieldProps } = useFieldMapping(props.variable, {
  disabled: props.disabled,
  readonly: props.readonly,
  size: props.size
})

// Computed properties
const hasErrors = computed(() => 
  props.errors && props.errors.length > 0
)

const fieldClasses = computed(() => [
  'dynamic-field',
  `dynamic-field--${props.variable.type.base}`,
  {
    'dynamic-field--error': hasErrors.value,
    'dynamic-field--disabled': props.disabled,
    'dynamic-field--readonly': props.readonly,
    [`dynamic-field--${props.size}`]: props.size !== 'md'
  }
])

// Event handlers
const handleUpdate = (value: any) => {
  emit('update:modelValue', value)
  emit('change', value)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleChange = (value: any) => {
  emit('change', value)
}
</script>

<style scoped>
.dynamic-field {
  @apply mb-4;
}

.dynamic-field--error {
  @apply border-red-500;
}

.dynamic-field--disabled {
  @apply opacity-60 pointer-events-none;
}

.dynamic-field--readonly {
  @apply bg-gray-50 dark:bg-gray-800;
}

.dynamic-field--sm {
  @apply text-sm;
}

.dynamic-field--lg {
  @apply text-lg;
}

.field-errors {
  @apply mt-1 space-y-1;
}

.error-message {
  @apply text-sm text-red-600 dark:text-red-400 font-medium;
}

.field-help {
  @apply mt-1 text-sm text-gray-600 dark:text-gray-400;
}
</style>