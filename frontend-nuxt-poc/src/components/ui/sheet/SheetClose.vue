<template>
  <SheetClose
    :as-child="asChild"
    :class="cn(props.class)"
  >
    <slot />
  </SheetClose>
</template>

<script setup lang="ts">
import { DialogClose as SheetClose } from 'radix-vue'
import { cn } from '~/lib/utils'

interface SheetCloseProps {
  class?: string
  asChild?: boolean
}

const props = withDefaults(defineProps<SheetCloseProps>(), {
  asChild: false
})
</script>