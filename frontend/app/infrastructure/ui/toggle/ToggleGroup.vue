<template>
  <ToggleGroupRoot v-bind="forwarded" :class="cn('flex items-center justify-center gap-1', props.class)">
    <slot />
  </ToggleGroupRoot>
</template>

<script setup lang="ts">
import type { ToggleGroupRootEmits, ToggleGroupRootProps } from 'reka-ui'
import { ToggleGroupRoot, useForwardPropsEmits } from 'reka-ui'
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '@shared/utils/cn'

interface ToggleGroupProps extends ToggleGroupRootProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<ToggleGroupProps>()
const emits = defineEmits<ToggleGroupRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>