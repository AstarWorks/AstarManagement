<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-describedby="error ? `${switchId}-error` : undefined"
    :disabled="disabled || loading"
    :class="cn(
      switchVariants({ size }),
      'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
      modelValue ? 'bg-primary' : 'bg-input',
      error && 'ring-1 ring-destructive',
      props.class
    )"
    @click="toggle"
    @keydown.space.prevent="toggle"
    @keydown.enter.prevent="toggle"
  >
    <span
      :class="cn(
        thumbVariants({ size }),
        'pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform',
        modelValue ? translateChecked : 'translate-x-0',
        loading && 'opacity-50'
      )"
    >
      <Loader2
        v-if="loading"
        :class="cn(iconSizes[size ?? 'default'], 'animate-spin')"
      />
    </span>
  </button>

  <!-- Error message -->
  <p
    v-if="error"
    :id="`${switchId}-error`"
    class="mt-1 text-sm text-destructive"
    role="alert"
  >
    {{ error }}
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-vue-next'
import { cn } from '~/lib/utils'

const switchVariants = cva('', {
  variants: {
    size: {
      sm: 'h-4 w-7',
      default: 'h-6 w-11',
      lg: 'h-7 w-12'
    }
  },
  defaultVariants: {
    size: 'default'
  }
})

const thumbVariants = cva('', {
  variants: {
    size: {
      sm: 'h-3 w-3',
      default: 'h-5 w-5',
      lg: 'h-6 w-6'
    }
  },
  defaultVariants: {
    size: 'default'
  }
})

const iconSizes = {
  sm: 'h-2 w-2',
  default: 'h-3 w-3',
  lg: 'h-4 w-4'
}

const translateValues = {
  sm: 'translate-x-3',
  default: 'translate-x-5',
  lg: 'translate-x-5'
}

type SwitchVariants = VariantProps<typeof switchVariants>

interface SwitchProps {
  class?: string
  modelValue?: boolean
  disabled?: boolean
  loading?: boolean
  error?: string
  id?: string
  size?: SwitchVariants['size']
}

const props = withDefaults(defineProps<SwitchProps>(), {
  modelValue: false,
  disabled: false,
  loading: false,
  size: 'default'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// Generate unique ID for accessibility
const switchId = computed(() => props.id || `switch-${Math.random().toString(36).substr(2, 9)}`)

const translateChecked = computed(() => translateValues[props.size ?? 'default'])

const toggle = () => {
  if (props.disabled || props.loading) return
  emit('update:modelValue', !props.modelValue)
}
</script>