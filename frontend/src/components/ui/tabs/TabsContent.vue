<template>
  <TabsContentPrimitive
    v-bind="$attrs"
    :class="cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      props.class
    )"
  >
    <slot />
  </TabsContentPrimitive>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'
import { TabsContent as TabsContentPrimitive } from 'radix-vue'

interface Props {
  value: string
  class?: string
}

const props = defineProps<Props>()
</script>