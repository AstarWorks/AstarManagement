<template>
  <div :class="cn('space-y-2', props.class)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'

interface FormItemProps {
  class?: string
}

const props = defineProps<FormItemProps>()
</script>