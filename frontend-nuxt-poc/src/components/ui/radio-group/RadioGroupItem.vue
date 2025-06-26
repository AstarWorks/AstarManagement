<script setup lang="ts">
import { computed, inject } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  value: string
  disabled?: boolean
  id?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  id: undefined,
  class: ''
})

const radioGroup = inject<{
  modelValue: { value: string | undefined }
  name: { value: string }
  disabled: { value: boolean }
  updateValue: (value: string) => void
} | null>('radioGroup', null)

const isChecked = computed(() => 
  radioGroup?.modelValue?.value === props.value
)

const isDisabled = computed(() => 
  props.disabled || radioGroup?.disabled?.value || false
)

const handleChange = () => {
  if (!isDisabled.value) {
    radioGroup?.updateValue(props.value)
  }
}
</script>

<template>
  <button
    type="button"
    role="radio"
    :id="id"
    :aria-checked="isChecked"
    :disabled="isDisabled"
    :data-state="isChecked ? 'checked' : 'unchecked'"
    :data-disabled="isDisabled ? '' : undefined"
    :value="value"
    @click="handleChange"
    :class="cn(
      'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      props.class
    )"
  >
    <span
      v-if="isChecked"
      class="flex items-center justify-center"
    >
      <svg
        class="h-2.5 w-2.5 fill-current"
        viewBox="0 0 8 8"
      >
        <circle cx="4" cy="4" r="3" />
      </svg>
    </span>
  </button>
</template>