<template>
  <AlertDialogTitle
    :class="cn('text-lg font-semibold', props.class)"
  >
    <slot />
  </AlertDialogTitle>
</template>

<script setup lang="ts">
import { AlertDialogTitle } from 'radix-vue'
import { cn } from '~/lib/utils'

interface AlertDialogTitleProps {
  class?: string
}

const props = defineProps<AlertDialogTitleProps>()
</script>