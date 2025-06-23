<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  value?: number | null
  max?: number
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  value: null,
  max: 100
})

const percentage = computed(() => {
  if (props.value === null || props.value === undefined) return 0
  return Math.min(Math.max((props.value / props.max) * 100, 0), 100)
})
</script>

<template>
  <div
    :class="cn(
      'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
      props.class
    )"
    role="progressbar"
    :aria-valuemin="0"
    :aria-valuemax="max"
    :aria-valuenow="value"
  >
    <div
      class="h-full w-full flex-1 bg-primary transition-all duration-200 ease-in-out"
      :style="{ transform: `translateX(-${100 - percentage}%)` }"
    />
  </div>
</template>