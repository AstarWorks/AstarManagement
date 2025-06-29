<template>
  <DialogPortal>
    <DialogOverlay />
    <DialogContent
      :class="cn(sheetVariants({ side, size }), props.class)"
      ref="contentRef"
    >
      <slot />
      <DialogClose
        class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
      >
        <X class="h-4 w-4" />
        <span class="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { DialogContent, DialogClose, DialogPortal } from 'radix-vue'
import { X } from 'lucide-vue-next'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { useSwipe } from '@vueuse/core'
import { cn } from '~/lib/utils'
import DialogOverlay from '../dialog/DialogOverlay.vue'

const sheetVariants = cva(
  'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom: 'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        right: 'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
        xl: '',
        full: '',
      },
    },
    compoundVariants: [
      {
        side: ['top', 'bottom'],
        size: 'sm',
        class: 'h-1/3',
      },
      {
        side: ['top', 'bottom'],
        size: 'md',
        class: 'h-1/2',
      },
      {
        side: ['top', 'bottom'],
        size: 'lg',
        class: 'h-2/3',
      },
      {
        side: ['top', 'bottom'],
        size: 'xl',
        class: 'h-5/6',
      },
      {
        side: ['top', 'bottom'],
        size: 'full',
        class: 'h-full',
      },
      {
        side: ['left', 'right'],
        size: 'sm',
        class: 'w-80',
      },
      {
        side: ['left', 'right'],
        size: 'md',
        class: 'w-96',
      },
      {
        side: ['left', 'right'],
        size: 'lg',
        class: 'w-[400px]',
      },
      {
        side: ['left', 'right'],
        size: 'xl',
        class: 'w-[500px]',
      },
      {
        side: ['left', 'right'],
        size: 'full',
        class: 'w-full',
      },
    ],
    defaultVariants: {
      side: 'right',
      size: 'md',
    },
  }
)

type SheetVariants = VariantProps<typeof sheetVariants>

interface SheetContentProps {
  class?: string
  side?: SheetVariants['side']
  size?: SheetVariants['size']
}

const props = withDefaults(defineProps<SheetContentProps>(), {
  side: 'right',
  size: 'md'
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const contentRef = ref<HTMLElement>()

// Swipe to dismiss functionality
onMounted(() => {
  if (contentRef.value) {
    const { direction, lengthX, lengthY } = useSwipe(contentRef.value, {
      threshold: 50,
      onSwipeEnd(e, direction) {
        const shouldDismiss = () => {
          switch (props.side) {
            case 'left':
              return direction === 'left' && lengthX.value > 100
            case 'right':
              return direction === 'right' && lengthX.value > 100
            case 'top':
              return direction === 'up' && lengthY.value > 100
            case 'bottom':
              return direction === 'down' && lengthY.value > 100
            default:
              return false
          }
        }

        if (shouldDismiss()) {
          emit('update:open', false)
        }
      }
    })
  }
})
</script>