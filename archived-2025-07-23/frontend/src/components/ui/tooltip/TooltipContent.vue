<template>
  <TooltipPortal>
    <TooltipContent
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
        'z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        props.class
      )"
    >
      <slot />
      <TooltipArrow
        v-if="showArrow"
        :class="cn('fill-primary', arrowClass)"
      />
    </TooltipContent>
  </TooltipPortal>
</template>

<script setup lang="ts">
import { TooltipContent, TooltipPortal, TooltipArrow } from 'radix-vue'
import { cn } from '~/lib/utils'

interface TooltipContentProps {
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

const props = withDefaults(defineProps<TooltipContentProps>(), {
  side: 'top',
  sideOffset: 4,
  align: 'center',
  alignOffset: 0,
  avoidCollisions: true,
  collisionPadding: 5,
  arrowPadding: 0,
  sticky: 'partial',
  hideWhenDetached: false,
  showArrow: false
})
</script>