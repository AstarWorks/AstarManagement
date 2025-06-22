<template>
  <div :class="cn('space-y-2', props.class)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import { cn } from '~/lib/utils'

interface FormFieldProps {
  class?: string
  name: string
  error?: string
  required?: boolean
}

const props = defineProps<FormFieldProps>()

// Provide field context to child components
provide('formField', {
  name: props.name,
  error: props.error,
  required: props.required
})
</script>