<template>
  <div
    :class="cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      props.class
    )"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'

interface AlertDialogFooterProps {
  class?: string
}

const props = defineProps<AlertDialogFooterProps>()
</script>