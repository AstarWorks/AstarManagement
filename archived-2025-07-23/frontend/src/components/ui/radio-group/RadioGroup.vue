<script setup lang="ts">
import { computed, provide } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  modelValue?: string
  name?: string
  disabled?: boolean
  required?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  name: () => `radio-group-${Math.random().toString(36).substr(2, 9)}`,
  disabled: false,
  required: false,
  class: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const updateValue = (value: string) => {
  emit('update:modelValue', value)
}

provide('radioGroup', {
  modelValue: computed(() => props.modelValue),
  name: computed(() => props.name),
  disabled: computed(() => props.disabled),
  updateValue
})
</script>

<template>
  <div
    role="radiogroup"
    :aria-required="required"
    :aria-disabled="disabled"
    :class="cn('grid gap-2', props.class)"
  >
    <slot />
  </div>
</template>