<!--
  Interactive Wrapper Component
  Handles click and keyboard interactions using VueUse for clean implementation
-->
<template>
  <div
    ref="elementRef"
    :class="wrapperClasses"
    :role="role"
    :tabindex="interactive ? tabindex : undefined"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedBy"
    :aria-disabled="!interactive"
    @click="handleClick"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFocus, useMagicKeys, whenever } from '@vueuse/core'

interface Props {
  interactive?: boolean
  ariaLabel?: string
  ariaDescribedBy?: string
  role?: string
  tabindex?: number
  hoverEffect?: boolean
  class?: string
}

interface Emits {
  (e: 'click'): void
}

const props = withDefaults(defineProps<Props>(), {
  interactive: true,
  role: 'button',
  tabindex: 0,
  hoverEffect: true,
  class: ''
})

const emit = defineEmits<Emits>()

// Element reference for VueUse composables
const elementRef = ref<HTMLElement>()

// Focus management with VueUse
const { focused } = useFocus(elementRef)

// Keyboard event handling with VueUse Magic Keys
const keys = useMagicKeys()
const { space, enter } = keys

// Handle keyboard activation
whenever(
  () => focused.value && (space?.value || enter?.value) && props.interactive,
  () => {
    emit('click')
  }
)

// Click handler
const handleClick = () => {
  if (props.interactive) {
    emit('click')
  }
}

// Computed classes
const wrapperClasses = computed(() => [
  'cursor-pointer select-none transition-all duration-200',
  {
    'hover:shadow-md': props.interactive && props.hoverEffect,
    'opacity-50 cursor-not-allowed': !props.interactive
  },
  props.class
])

// Expose element ref for parent components if needed
defineExpose({
  elementRef,
  focused: readonly(focused)
})
</script>