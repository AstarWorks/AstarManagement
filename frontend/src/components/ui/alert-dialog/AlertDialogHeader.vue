<template>
  <div
    :class="cn(
      'flex flex-col space-y-2 text-center sm:text-left',
      props.class
    )"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'

interface AlertDialogHeaderProps {
  class?: string
}

const props = defineProps<AlertDialogHeaderProps>()
</script>