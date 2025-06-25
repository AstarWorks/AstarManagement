<template>
  <DialogDescription
    :class="cn('text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </DialogDescription>
</template>

<script setup lang="ts">
import { DialogDescription } from 'radix-vue'
import { cn } from '~/lib/utils'

interface DialogDescriptionProps {
  class?: string
}

const props = defineProps<DialogDescriptionProps>()
</script>