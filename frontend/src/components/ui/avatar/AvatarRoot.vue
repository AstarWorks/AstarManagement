<template>
  <AvatarRoot
    :class="cn(avatarVariants({ size }), props.class)"
  >
    <slot />
  </AvatarRoot>
</template>

<script setup lang="ts">
import { AvatarRoot } from 'radix-vue'
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

interface AvatarRootProps {
  class?: string
  size?: AvatarVariants['size']
}

const props = withDefaults(defineProps<AvatarRootProps>(), {
  size: 'default'
})
</script>