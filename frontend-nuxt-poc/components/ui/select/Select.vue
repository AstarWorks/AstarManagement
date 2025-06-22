<template>
  <SelectRoot v-model="internalValue" :disabled="disabled">
    <SelectTrigger
      :class="cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-destructive focus:ring-destructive',
        props.class
      )"
      :aria-invalid="error ? 'true' : 'false'"
      :aria-describedby="error ? `${selectId}-error` : undefined"
    >
      <SelectValue :placeholder="placeholder" />
      <SelectIcon as-child>
        <ChevronDown class="h-4 w-4 opacity-50" />
      </SelectIcon>
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        class="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        :side-offset="4"
        position="popper"
      >
        <SelectScrollUpButton
          class="flex cursor-default items-center justify-center py-1"
        >
          <ChevronUp class="h-4 w-4" />
        </SelectScrollUpButton>

        <SelectViewport class="p-1">
          <slot />
        </SelectViewport>

        <SelectScrollDownButton
          class="flex cursor-default items-center justify-center py-1"
        >
          <ChevronDown class="h-4 w-4" />
        </SelectScrollDownButton>
      </SelectContent>
    </SelectPortal>

    <!-- Error message -->
    <p
      v-if="error"
      :id="`${selectId}-error`"
      class="mt-1 text-sm text-destructive"
      role="alert"
    >
      {{ error }}
    </p>
  </SelectRoot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectPortal,
  SelectRoot,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'radix-vue'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import { cn } from '~/lib/utils'

interface SelectProps {
  class?: string
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  id?: string
}

const props = withDefaults(defineProps<SelectProps>(), {
  placeholder: 'Select an option...'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Generate unique ID for accessibility
const selectId = computed(() => props.id || `select-${Math.random().toString(36).substr(2, 9)}`)

const internalValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})
</script>