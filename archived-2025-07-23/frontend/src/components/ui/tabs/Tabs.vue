<template>
  <TabsRoot v-bind="forwarded" :class="cn('w-full', props.class)">
    <slot />
  </TabsRoot>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'
import { TabsRoot, useForwardPropsEmits } from 'radix-vue'

export interface TabsProps {
  value?: string
  defaultValue?: string
  orientation?: 'horizontal' | 'vertical'
  dir?: 'ltr' | 'rtl'
  activationMode?: 'automatic' | 'manual'
  class?: string
}

export interface TabsEmits {
  'update:value': [value: string]
}

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<TabsProps>(), {
  orientation: 'horizontal',
  activationMode: 'automatic',
})

const emits = defineEmits<TabsEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>