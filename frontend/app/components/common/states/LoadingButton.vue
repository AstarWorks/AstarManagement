<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '~/components/ui/button'
import LoadingSpinner from './LoadingSpinner.vue'

interface LoadingButtonProps {
  loading?: boolean
  disabled?: boolean
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'  
  loadingText?: string
  class?: string
}

const props = withDefaults(defineProps<LoadingButtonProps>(), {
  loading: false,
  disabled: false,
  variant: 'default',
  size: 'default'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const isDisabled = computed(() => props.disabled || props.loading)

const spinnerSize = computed(() => {
  switch (props.size) {
    case 'sm': return 'sm'
    case 'lg': return 'md'
    case 'icon': return 'sm'
    default: return 'sm'
  }
})

const handleClick = (event: MouseEvent) => {
  if (!isDisabled.value) {
    emit('click', event)
  }
}
</script>

<template>
  <Button
    :variant="variant"
    :size="size"
    :disabled="isDisabled"
    :class="props.class"
    @click="handleClick"
  >
    <div class="flex items-center gap-2">
      <LoadingSpinner 
        v-if="loading"
        :size="spinnerSize"
        variant="secondary"
        inline
      />
      <span v-if="loading && loadingText">
        {{ loadingText }}
      </span>
      <span v-else>
        <slot />
      </span>
    </div>
  </Button>
</template>