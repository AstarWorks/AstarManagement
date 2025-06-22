<template>
  <div :class="cn('relative', props.class)">
    <slot :error="error" :id="fieldId" />
  </div>
</template>

<script setup lang="ts">
import { inject, computed } from 'vue'
import { cn } from '~/lib/utils'

interface FormControlProps {
  class?: string
}

const props = defineProps<FormControlProps>()

// Get field context from parent FormField
const fieldContext = inject<{
  name: string
  error?: string
  required?: boolean
} | null>('formField', null)

const error = computed(() => fieldContext?.error)
const fieldId = computed(() => fieldContext?.name)
</script>