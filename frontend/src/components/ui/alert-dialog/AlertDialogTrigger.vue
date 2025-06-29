<template>
  <AlertDialogTrigger
    :as-child="asChild"
    :class="cn(props.class)"
  >
    <slot />
  </AlertDialogTrigger>
</template>

<script setup lang="ts">
import { AlertDialogTrigger } from 'radix-vue'
import { cn } from '~/lib/utils'

interface AlertDialogTriggerProps {
  class?: string
  asChild?: boolean
}

const props = withDefaults(defineProps<AlertDialogTriggerProps>(), {
  asChild: false
})
</script>