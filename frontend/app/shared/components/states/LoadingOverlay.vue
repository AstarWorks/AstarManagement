<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@shared/utils/cn'
import LoadingSpinner from './LoadingSpinner.vue'

interface LoadingOverlayProps {
  visible?: boolean
  blur?: boolean
  opacity?: 'light' | 'medium' | 'heavy'
  message?: string
  size?: 'sm' | 'md' | 'lg'
  class?: string
}

const props = withDefaults(defineProps<LoadingOverlayProps>(), {
  visible: true,
  blur: true,
  opacity: 'medium',
  size: 'md'
})

const opacityClasses = {
  light: 'bg-background/50',
  medium: 'bg-background/75',
  heavy: 'bg-background/90'
}

const overlayClasses = computed(() => cn(
  'fixed inset-0 z-50 flex items-center justify-center',
  opacityClasses[props.opacity],
  props.blur && 'backdrop-blur-sm',
  'transition-opacity duration-200',
  props.visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
  props.class
))
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" :class="overlayClasses">
      <div class="flex flex-col items-center gap-4 p-6 rounded-lg bg-card shadow-lg border">
        <LoadingSpinner 
          :size="size" 
          variant="primary"
        />
        <p v-if="message" class="text-sm text-muted-foreground text-center">
          {{ message }}
        </p>
      </div>
    </div>
  </Teleport>
</template>