<template>
  <AvatarRoot
    :class="cn(avatarVariants({ size }), props.class)"
  >
    <AvatarImage
      v-if="src"
      :src="src"
      :alt="alt"
      @loading-status-change="handleStatusChange"
    />
    <AvatarFallback
      v-if="showFallback"
      :class="cn(
        'flex h-full w-full items-center justify-center bg-muted',
        fallbackClass
      )"
    >
      <slot name="fallback">
        {{ fallbackText }}
      </slot>
    </AvatarFallback>
  </AvatarRoot>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { AvatarRoot, AvatarImage, AvatarFallback } from 'radix-vue'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-xs',
        default: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-14 w-14 text-lg',
        '2xl': 'h-16 w-16 text-xl'
      }
    },
    defaultVariants: {
      size: 'default'
    }
  }
)

type AvatarVariants = VariantProps<typeof avatarVariants>

interface AvatarProps {
  class?: string
  src?: string
  alt?: string
  fallback?: string
  fallbackClass?: string
  size?: AvatarVariants['size']
}

const props = withDefaults(defineProps<AvatarProps>(), {
  size: 'default'
})

const emit = defineEmits<{
  loadingStatusChange: [status: 'idle' | 'loading' | 'loaded' | 'error']
}>()

const isLoading = ref(true)
const hasError = ref(false)

const showFallback = computed(() => !props.src || hasError.value || isLoading.value)

const fallbackText = computed(() => {
  if (props.fallback) return props.fallback
  if (props.alt) {
    // Extract initials from alt text
    const words = props.alt.trim().split(/\s+/)
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase()
    }
    return words
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('')
  }
  return '?'
})

const handleStatusChange = (status: 'idle' | 'loading' | 'loaded' | 'error') => {
  isLoading.value = status === 'loading' || status === 'idle'
  hasError.value = status === 'error'
  emit('loadingStatusChange', status)
}
</script>