<template>
  <component
    :is="asChild ? 'slot' : 'button'"
    :class="cn(buttonVariants({ variant, size }), props.class)"
    :disabled="disabled || loading"
    v-bind="asChild ? {} : $attrs"
  >
    <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
    <slot />
  </component>
</template>

<script setup lang="ts">
import type { VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-vue-next'
import { cn } from '~/lib/utils'
import { buttonVariants } from '~/lib/button-variants'

type ButtonVariants = VariantProps<typeof buttonVariants>

interface ButtonProps {
  class?: string
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  disabled?: boolean
  loading?: boolean
  asChild?: boolean
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'default',
  size: 'default',
  disabled: false,
  loading: false,
  asChild: false
})
</script>