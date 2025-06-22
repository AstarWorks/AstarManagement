<template>
  <DialogTrigger
    :as-child="asChild"
    :class="cn(props.class)"
  >
    <slot />
  </DialogTrigger>
</template>

<script setup lang="ts">
import { DialogTrigger } from 'radix-vue'
import { cn } from '~/lib/utils'

interface DialogTriggerProps {
  class?: string
  asChild?: boolean
}

const props = withDefaults(defineProps<DialogTriggerProps>(), {
  asChild: false
})
</script>