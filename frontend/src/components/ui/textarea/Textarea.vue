<template>
  <div>
    <textarea
      ref="textareaRef"
      :class="cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-destructive focus-visible:ring-destructive',
        props.class
      )"
      :value="modelValue"
      :rows="computedRows"
      :aria-invalid="error ? 'true' : 'false'"
      :aria-describedby="error ? `${textareaId}-error` : undefined"
      @input="handleInput"
      v-bind="$attrs"
    />

    <!-- Character count -->
    <div
      v-if="showCharacterCount"
      class="mt-1 flex justify-between text-xs text-muted-foreground"
    >
      <span v-if="error" class="text-destructive">{{ error }}</span>
      <span v-else></span>
      <span v-if="maxLength">
        {{ characterCount }} / {{ maxLength }}
      </span>
      <span v-else>
        {{ characterCount }} characters
      </span>
    </div>

    <!-- Error message (when not showing character count) -->
    <p
      v-else-if="error"
      :id="`${textareaId}-error`"
      class="mt-1 text-sm text-destructive"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue'
import { cn } from '~/lib/utils'

interface TextareaProps {
  class?: string
  modelValue?: string
  error?: string
  id?: string
  autoResize?: boolean
  minRows?: number
  maxRows?: number
  showCharacterCount?: boolean
  maxLength?: number
}

const props = withDefaults(defineProps<TextareaProps>(), {
  modelValue: '',
  autoResize: false,
  minRows: 3,
  maxRows: 10,
  showCharacterCount: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement>()

// Generate unique ID for accessibility
const textareaId = computed(() => props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`)

const characterCount = computed(() => props.modelValue?.length || 0)

const computedRows = computed(() => {
  if (!props.autoResize) return props.minRows
  
  const lineCount = (props.modelValue || '').split('\n').length
  const calculatedRows = Math.max(lineCount, props.minRows || 3)
  
  return props.maxRows ? Math.min(calculatedRows, props.maxRows) : calculatedRows
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  const value = target.value
  
  // Enforce max length if specified
  if (props.maxLength && value.length > props.maxLength) {
    return
  }
  
  emit('update:modelValue', value)
  
  if (props.autoResize) {
    nextTick(() => {
      autoResize()
    })
  }
}

const autoResize = () => {
  if (!textareaRef.value || !props.autoResize) return
  
  const textarea = textareaRef.value
  textarea.style.height = 'auto'
  
  const minHeight = (props.minRows || 3) * 24 // Approximate line height
  const maxHeight = props.maxRows ? props.maxRows * 24 : Infinity
  
  const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight))
  textarea.style.height = `${newHeight}px`
}

// Watch for value changes to trigger auto-resize
watch(() => props.modelValue, () => {
  if (props.autoResize) {
    nextTick(() => {
      autoResize()
    })
  }
})
</script>