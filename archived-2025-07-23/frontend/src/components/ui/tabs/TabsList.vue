<template>
  <TabsListPrimitive
    v-bind="$attrs"
    :class="cn(
      'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
      props.class
    )"
  >
    <slot />
  </TabsListPrimitive>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'
import { TabsList as TabsListPrimitive } from 'radix-vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>