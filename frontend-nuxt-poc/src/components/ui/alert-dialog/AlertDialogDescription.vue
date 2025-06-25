<template>
  <AlertDialogDescription
    :class="cn('text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </AlertDialogDescription>
</template>

<script setup lang="ts">
import { AlertDialogDescription } from 'radix-vue'
import { cn } from '~/lib/utils'

interface AlertDialogDescriptionProps {
  class?: string
}

const props = defineProps<AlertDialogDescriptionProps>()
</script>