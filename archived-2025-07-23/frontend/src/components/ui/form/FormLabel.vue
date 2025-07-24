<template>
  <Label
    :for="htmlFor"
    :class="cn(error && 'text-destructive', props.class)"
  >
    <slot />
    <span v-if="required" class="ml-1 text-destructive">*</span>
  </Label>
</template>

<script setup lang="ts">
import { inject, computed } from 'vue'
import { Label } from '~/components/ui/label'
import { cn } from '~/lib/utils'

interface FormLabelProps {
  class?: string
  for?: string
}

const props = defineProps<FormLabelProps>()

// Get field context from parent FormField
const fieldContext = inject<{
  name: string
  error?: string
  required?: boolean
} | null>('formField', null)

const error = computed(() => fieldContext?.error)
const required = computed(() => fieldContext?.required ?? false)
const htmlFor = computed(() => props.for || fieldContext?.name)
</script>