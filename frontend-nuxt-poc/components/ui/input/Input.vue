<template>
  <div class="relative">
    <!-- Prefix slot -->
    <div
      v-if="$slots.prefix"
      class="absolute left-0 top-0 z-10 flex h-10 items-center justify-center px-3 text-muted-foreground"
    >
      <slot name="prefix" />
    </div>

    <input
      :type="type"
      :class="cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-destructive focus-visible:ring-destructive',
        $slots.prefix && 'pl-10',
        $slots.suffix && 'pr-10',
        props.class
      )"
      :value="modelValue"
      :aria-invalid="error ? 'true' : 'false'"
      :aria-describedby="error ? `${inputId}-error` : undefined"
      @input="handleInput"
      v-bind="$attrs"
    />

    <!-- Suffix slot -->
    <div
      v-if="$slots.suffix"
      class="absolute right-0 top-0 z-10 flex h-10 items-center justify-center px-3 text-muted-foreground"
    >
      <slot name="suffix" />
    </div>
  </div>

  <!-- Error message -->
  <p
    v-if="error"
    :id="`${inputId}-error`"
    class="mt-1 text-sm text-destructive"
    role="alert"
  >
    {{ error }}
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '~/lib/utils'

interface InputProps {
  class?: string
  type?: string
  modelValue?: string | number
  error?: string
  id?: string
}

const props = withDefaults(defineProps<InputProps>(), {
  type: 'text'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

// Generate unique ID for accessibility
const inputId = computed(() => props.id || `input-${Math.random().toString(36).substr(2, 9)}`)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = props.type === 'number' ? Number(target.value) : target.value
  emit('update:modelValue', value)
}
</script>