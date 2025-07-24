<template>
  <DialogClose
    :as-child="asChild"
    :class="cn(props.class)"
  >
    <slot />
  </DialogClose>
</template>

<script setup lang="ts">
import { DialogClose } from 'radix-vue'
import { cn } from '~/lib/utils'

interface DialogCloseProps {
  class?: string
  asChild?: boolean
}

const props = withDefaults(defineProps<DialogCloseProps>(), {
  asChild: false
})
</script>