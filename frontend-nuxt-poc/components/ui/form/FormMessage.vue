<template>
  <p
    v-if="message"
    :id="messageId"
    :class="cn(
      'text-sm font-medium',
      error ? 'text-destructive' : 'text-muted-foreground',
      props.class
    )"
    role="alert"
  >
    {{ message }}
  </p>
</template>

<script setup lang="ts">
import { inject, computed } from 'vue'
import { cn } from '~/lib/utils'

interface FormMessageProps {
  class?: string
  message?: string
}

const props = defineProps<FormMessageProps>()

// Get field context from parent FormField
const fieldContext = inject<{
  name: string
  error?: string
  required?: boolean
} | null>('formField', null)

const error = computed(() => fieldContext?.error)
const message = computed(() => props.message || error.value)
const messageId = computed(() => fieldContext?.name ? `${fieldContext.name}-error` : undefined)
</script>