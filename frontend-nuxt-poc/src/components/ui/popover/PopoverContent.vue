<template>
  <PopoverPortal>
    <PopoverContent
      :side="side"
      :side-offset="sideOffset"
      :align="align"
      :align-offset="alignOffset"
      :avoid-collisions="avoidCollisions"
      :collision-boundary="collisionBoundary"
      :collision-padding="collisionPadding"
      :arrow-padding="arrowPadding"
      :sticky="sticky"
      :hide-when-detached="hideWhenDetached"
      :class="cn(
        'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        props.class
      )"
    >
      <slot />
      <PopoverArrow
        v-if="showArrow"
        :class="cn('fill-popover', arrowClass)"
      />
    </PopoverContent>
  </PopoverPortal>
</template>

<script setup lang="ts">
import { PopoverContent, PopoverPortal, PopoverArrow } from 'radix-vue'
import { cn } from '~/lib/utils'

interface PopoverContentProps {
  class?: string
  arrowClass?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  align?: 'start' | 'center' | 'end'
  alignOffset?: number
  avoidCollisions?: boolean
  collisionBoundary?: Element | null | Array<Element | null>
  collisionPadding?: number | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  arrowPadding?: number
  sticky?: 'partial' | 'always'
  hideWhenDetached?: boolean
  showArrow?: boolean
}

const props = withDefaults(defineProps<PopoverContentProps>(), {
  side: 'bottom',
  sideOffset: 4,
  align: 'center',
  alignOffset: 0,
  avoidCollisions: true,
  collisionPadding: 10,
  arrowPadding: 0,
  sticky: 'partial',
  hideWhenDetached: false,
  showArrow: false
})
</script>