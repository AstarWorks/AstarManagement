<template>
  <FormFieldWrapper
    :name="name"
    :label="label"
    :description="description"
    :help-text="helpText"
    :warning="warning"
    :required="required"
    :class="fieldClass"
  >
    <template #default="{ field, fieldId, hasError, errorMessage, isRequired, describedBy }">
      <div class="relative">
        <!-- Main Textarea -->
        <Textarea
          :id="fieldId"
          :name="field.name"
          :value="field.value"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :rows="rows"
          :maxlength="maxlength"
          :minlength="minlength"
          :class="cn(
            textareaClasses,
            hasError && 'border-destructive focus-visible:ring-destructive',
            autoResize && 'resize-none',
            props.class
          )"
          :style="textareaStyle"
          :aria-describedby="describedByIds"
          :aria-required="isRequired"
          :aria-invalid="hasError"
          @input="handleInput"
          @blur="field.handleBlur"
          @focus="$emit('focus', $event)"
          @keydown="handleKeydown"
        />

        <!-- Character Count -->
        <div
          v-if="showCharacterCount && maxlength"
          class="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-1 rounded"
        >
          <span :class="{ 'text-destructive': characterCount > maxlength }">
            {{ characterCount }}
          </span>
          <span>/{{ maxlength }}</span>
        </div>
      </div>

      <!-- Character Count (External) -->
      <div
        v-if="showCharacterCount && maxlength && characterCountPosition === 'external'"
        class="flex justify-between items-center mt-1 text-xs text-muted-foreground"
      >
        <span v-if="helpText">{{ helpText }}</span>
        <span :class="{ 'text-destructive': isOverLimit }">
          {{ characterCount }}/{{ maxlength }}
          <span v-if="isOverLimit" class="ml-1">
            ({{ characterCount - maxlength }} over limit)
          </span>
        </span>
      </div>
    </template>
  </FormFieldWrapper>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, type HTMLAttributes } from 'vue'
import { useField } from '~/composables/form/useField'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/lib/utils'

/**
 * FormTextarea component props
 */
export interface FormTextareaProps extends /* @vue-ignore */ HTMLAttributes {
  /** Field name for validation */
  name: string
  /** Field label */
  label?: string
  /** Field description/hint */
  description?: string
  /** Help text */
  helpText?: string
  /** Warning message (non-blocking) */
  warning?: string
  /** Placeholder text */
  placeholder?: string
  /** Whether field is required */
  required?: boolean
  /** Whether field is disabled */
  disabled?: boolean
  /** Whether field is readonly */
  readonly?: boolean
  /** Number of visible rows */
  rows?: number
  /** Maximum length */
  maxlength?: number
  /** Minimum length */
  minlength?: number
  /** Whether to show character count */
  showCharacterCount?: boolean
  /** Where to position character count */
  characterCountPosition?: 'internal' | 'external'
  /** Whether textarea should auto-resize */
  autoResize?: boolean
  /** Maximum height for auto-resize (in pixels) */
  maxHeight?: number
  /** Minimum height for auto-resize (in pixels) */
  minHeight?: number
  /** Custom CSS classes for the field wrapper */
  fieldClass?: string
  /** Custom CSS classes for the textarea */
  class?: string
}

const props = withDefaults(defineProps<FormTextareaProps>(), {
  rows: 3,
  showCharacterCount: false,
  characterCountPosition: 'internal',
  autoResize: false,
  maxHeight: 300,
  minHeight: 80
})

const emit = defineEmits<{
  focus: [event: FocusEvent]
  keydown: [event: KeyboardEvent]
}>()

// Field management
const field = useField(props.name)
const textareaRef = ref<HTMLTextAreaElement>()

// Character counting
const characterCount = computed(() => {
  return field.value.value?.length || 0
})

const isOverLimit = computed(() => {
  return props.maxlength ? characterCount.value > props.maxlength : false
})

// Auto-resize functionality
const textareaStyle = computed(() => {
  if (!props.autoResize) return {}
  
  return {
    minHeight: `${props.minHeight}px`,
    maxHeight: `${props.maxHeight}px`,
    overflow: 'hidden'
  }
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  const value = target.value

  // Update field value
  field.handleChange(value)

  // Auto-resize if enabled
  if (props.autoResize) {
    nextTick(() => {
      resizeTextarea(target)
    })
  }
}

const resizeTextarea = (textarea: HTMLTextAreaElement) => {
  // Reset height to auto to get the correct scrollHeight
  textarea.style.height = 'auto'
  
  // Calculate new height
  const newHeight = Math.min(
    Math.max(textarea.scrollHeight, props.minHeight),
    props.maxHeight
  )
  
  // Set the new height
  textarea.style.height = `${newHeight}px`
  
  // Show scrollbar if content exceeds max height
  textarea.style.overflowY = textarea.scrollHeight > props.maxHeight ? 'auto' : 'hidden'
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
  
  // Handle common textarea shortcuts
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'Enter':
        // Ctrl+Enter could trigger form submission
        event.stopPropagation()
        break
      case 'a':
        // Ctrl+A select all - let it proceed normally
        break
    }
  }
}

// Accessibility
const describedByIds = computed(() => {
  const ids = []
  
  if (props.description) {
    ids.push(`${field.name}-description`)
  }
  
  if (!!field.hasError) {
    ids.push(`${field.name}-error`)
  }
  
  if (props.helpText && !field.hasError) {
    ids.push(`${field.name}-help`)
  }
  
  return ids.join(' ')
})

// Styling
const textareaClasses = computed(() => {
  const classes = ['w-full']
  
  if (isOverLimit.value) {
    classes.push('border-destructive')
  }
  
  return classes.join(' ')
})

// Expose field and methods for template refs
defineExpose({
  field,
  focus: () => {
    textareaRef.value?.focus()
  },
  blur: () => {
    textareaRef.value?.blur()
  },
  select: () => {
    textareaRef.value?.select()
  },
  setSelectionRange: (start: number, end: number) => {
    textareaRef.value?.setSelectionRange(start, end)
  }
})
</script>