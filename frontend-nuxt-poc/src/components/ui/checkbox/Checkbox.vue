<template>
  <div class="flex items-center space-x-2">
    <button
      type="button"
      role="checkbox"
      :aria-checked="isChecked"
      :aria-describedby="error ? `${checkboxId}-error` : undefined"
      :disabled="disabled"
      :class="cn(
        'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        isChecked && 'bg-primary text-primary-foreground',
        isIndeterminate && 'bg-primary text-primary-foreground',
        error && 'border-destructive',
        props.class
      )"
      @click="toggle"
      @keydown.space.prevent="toggle"
    >
      <Check
        v-if="isChecked && !isIndeterminate"
        class="h-4 w-4"
      />
      <Minus
        v-else-if="isIndeterminate"
        class="h-4 w-4"
      />
      <component
        v-else-if="customIcon && isChecked"
        :is="customIcon"
        class="h-4 w-4"
      />
    </button>

    <label
      v-if="$slots.default"
      :for="checkboxId"
      class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
      @click="toggle"
    >
      <slot />
    </label>
  </div>

  <!-- Error message -->
  <p
    v-if="error"
    :id="`${checkboxId}-error`"
    class="mt-1 text-sm text-destructive"
    role="alert"
  >
    {{ error }}
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check, Minus } from 'lucide-vue-next'
import type { Component } from 'vue'
import { cn } from '~/lib/utils'

interface CheckboxProps {
  class?: string
  modelValue?: boolean
  indeterminate?: boolean
  disabled?: boolean
  error?: string
  id?: string
  customIcon?: Component
}

const props = withDefaults(defineProps<CheckboxProps>(), {
  modelValue: false,
  indeterminate: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// Generate unique ID for accessibility
const checkboxId = computed(() => props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`)

const isChecked = computed(() => props.modelValue)
const isIndeterminate = computed(() => props.indeterminate)

const toggle = () => {
  if (props.disabled) return
  
  if (props.indeterminate) {
    // If indeterminate, first click should make it checked
    emit('update:modelValue', true)
  } else {
    // Normal toggle behavior
    emit('update:modelValue', !props.modelValue)
  }
}
</script>