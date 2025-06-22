<template>
  <div v-if="shouldShow" :class="cn('transition-all duration-200', wrapperClass)">
    <slot
      :field="field"
      :is-visible="shouldShow"
      :is-required="computedRequired"
      :is-disabled="computedDisabled"
      :is-readonly="computedReadonly"
      :current-schema="currentValidationSchema"
      :condition-state="conditionState"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, inject, type InjectionKey } from 'vue'
import { useConditionalField, createConditions, type ConditionFunction, type ConditionalRule } from '~/composables/form/useConditionalField'
import { cn } from '~/lib/utils'
import type { z } from 'zod'

/**
 * Form context injection key
 */
const FormContextKey: InjectionKey<any> = Symbol('FormContext')

/**
 * ConditionalField component props
 */
export interface ConditionalFieldProps {
  /** Field name for validation */
  name: string
  /** Show/hide condition function */
  showWhen?: ConditionFunction
  /** Hide condition function (opposite of showWhen) */
  hideWhen?: ConditionFunction
  /** Required condition function */
  requiredWhen?: ConditionFunction
  /** Disabled condition function */
  disabledWhen?: ConditionFunction
  /** Readonly condition function */
  readonlyWhen?: ConditionFunction
  /** Custom validation schema when condition is met */
  schemaWhen?: { condition: ConditionFunction; schema: z.ZodSchema }[]
  /** Default visibility */
  defaultVisible?: boolean
  /** Default required state */
  defaultRequired?: boolean
  /** Default disabled state */
  defaultDisabled?: boolean
  /** Default readonly state */
  defaultReadonly?: boolean
  /** Whether to clear value when hidden */
  clearOnHide?: boolean
  /** Default value when condition becomes true */
  defaultValue?: any
  /** Animation classes for show/hide */
  wrapperClass?: string
  /** Complex conditional rules */
  rules?: ConditionalRule[]
}

const props = withDefaults(defineProps<ConditionalFieldProps>(), {
  defaultVisible: true,
  defaultRequired: false,
  defaultDisabled: false,
  defaultReadonly: false,
  clearOnHide: true
})

// Inject form context to get form values
const formContext = inject(FormContextKey, null)

// Create form values getter
const getFormValues = () => {
  if (formContext && formContext.values) {
    return formContext.values.value || formContext.values
  }
  return {}
}

// Build conditional rules from props
const buildRules = (): ConditionalRule[] => {
  const rules: ConditionalRule[] = []

  // Show/hide rules
  if (props.showWhen) {
    rules.push({
      condition: props.showWhen,
      visible: true,
      clearOnHide: props.clearOnHide,
      defaultValue: props.defaultValue
    })
  }

  if (props.hideWhen) {
    rules.push({
      condition: props.hideWhen,
      visible: false,
      clearOnHide: props.clearOnHide
    })
  }

  // Required rules
  if (props.requiredWhen) {
    rules.push({
      condition: props.requiredWhen,
      required: true
    })
  }

  // Disabled rules
  if (props.disabledWhen) {
    rules.push({
      condition: props.disabledWhen,
      disabled: true
    })
  }

  // Readonly rules
  if (props.readonlyWhen) {
    rules.push({
      condition: props.readonlyWhen,
      readonly: true
    })
  }

  // Schema rules
  if (props.schemaWhen) {
    props.schemaWhen.forEach(({ condition, schema }) => {
      rules.push({
        condition,
        schema
      })
    })
  }

  // Add custom rules from props
  if (props.rules) {
    rules.push(...props.rules)
  }

  return rules
}

// Initialize conditional field
const conditionalField = useConditionalField(props.name, {
  formValues: getFormValues,
  rules: buildRules()
})

// Computed properties with defaults
const shouldShow = computed(() => {
  // If no show/hide conditions, use default
  if (!props.showWhen && !props.hideWhen && !props.rules?.some(r => r.visible !== undefined)) {
    return props.defaultVisible
  }
  return conditionalField.isVisible.value
})

const computedRequired = computed(() => {
  // If no required conditions, use default
  if (!props.requiredWhen && !props.rules?.some(r => r.required !== undefined)) {
    return props.defaultRequired
  }
  return conditionalField.isRequired.value
})

const computedDisabled = computed(() => {
  // If no disabled conditions, use default
  if (!props.disabledWhen && !props.rules?.some(r => r.disabled !== undefined)) {
    return props.defaultDisabled
  }
  return conditionalField.isDisabled.value
})

const computedReadonly = computed(() => {
  // If no readonly conditions, use default
  if (!props.readonlyWhen && !props.rules?.some(r => r.readonly !== undefined)) {
    return props.defaultReadonly
  }
  return conditionalField.isReadonly.value
})

// Get current validation schema
const currentValidationSchema = computed(() => conditionalField.currentSchema.value)

// Condition state for debugging
const conditionState = computed(() => ({
  visible: shouldShow.value,
  required: computedRequired.value,
  disabled: computedDisabled.value,
  readonly: computedReadonly.value,
  activeRules: conditionalField.activeRules.value.length,
  formValues: getFormValues()
}))

// Watch for form context changes and re-evaluate
watch(
  () => formContext?.values,
  () => {
    conditionalField.evaluate()
  },
  { deep: true }
)

// Expose conditional field utilities
defineExpose({
  field: conditionalField.field,
  shouldShow: readonly(shouldShow),
  isRequired: readonly(computedRequired),
  isDisabled: readonly(computedDisabled),
  isReadonly: readonly(computedReadonly),
  currentSchema: readonly(currentValidationSchema),
  conditionState: readonly(conditionState),
  evaluate: conditionalField.evaluate,
  activeRules: conditionalField.activeRules
})
</script>