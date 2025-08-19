<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@foundation/lib/utils/cn'
import { type AlertVariants, alertVariants } from './index'

const props = defineProps<{
  class?: HTMLAttributes['class']
  variant?: AlertVariants['variant']
}>()
</script>

<template>
  <div
    data-slot="alert"
    :class="cn(alertVariants({ variant }), props.class)"
    role="alert"
  >
    <slot />
  </div>
</template>
