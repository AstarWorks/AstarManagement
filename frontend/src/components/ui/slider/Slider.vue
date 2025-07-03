<script setup lang="ts">
import { computed } from 'vue'
import {
  SliderRange,
  SliderRoot,
  SliderThumb,
  SliderTrack,
  type SliderRootEmits,
  type SliderRootProps,
} from 'radix-vue'

import { cn } from '~/lib/utils'

const props = withDefaults(
  defineProps<SliderRootProps & { class?: string }>(),
  {
    step: 1,
    min: 0,
    max: 100,
  }
)

const emits = defineEmits<SliderRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <SliderRoot
    v-bind="delegatedProps"
    :class="
      cn(
        'relative flex w-full touch-none select-none items-center',
        props.class
      )
    "
    @update:model-value="emits('update:modelValue', $event)"
  >
    <SliderTrack
      class="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20"
    >
      <SliderRange class="absolute h-full bg-primary" />
    </SliderTrack>
    <SliderThumb
      v-for="(_, key) in modelValue"
      :key="key"
      class="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
    />
  </SliderRoot>
</template>