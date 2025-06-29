<script setup lang="ts">
import { provide } from 'vue'
import type { TabsRootEmits, TabsRootProps } from 'radix-vue'
import { TabsRoot } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = defineProps<TabsRootProps & { class?: string }>()

const emits = defineEmits<TabsRootEmits>()

provide('tabsDefaultValue', props.defaultValue)
</script>

<template>
  <TabsRoot
    v-bind="props"
    :class="cn('', props.class)"
    @update:model-value="emits('update:modelValue', $event)"
  >
    <slot />
  </TabsRoot>
</template>