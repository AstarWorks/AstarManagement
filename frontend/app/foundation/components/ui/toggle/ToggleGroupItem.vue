<template>
  <ToggleGroupItem v-bind="forwarded" :class="cn(toggleVariants({ variant, size }), props.class)">
    <slot />
  </ToggleGroupItem>
</template>

<script setup lang="ts">
import type { ToggleGroupItemProps } from 'reka-ui'
import { ToggleGroupItem, useForwardPropsEmits } from 'reka-ui'
import { type HTMLAttributes, computed } from 'vue'
import { toggleVariants, type ToggleVariants } from './index'
import { cn } from '@foundation/lib/utils/cn'

interface ToggleGroupItemPropsExtended extends ToggleGroupItemProps, ToggleVariants {
  class?: HTMLAttributes['class']
}

const props = defineProps<ToggleGroupItemPropsExtended>()
const emits = defineEmits<{
  click: [event: MouseEvent]
}>()

const delegatedProps = computed(() => {
  const { class: _, variant, size, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>