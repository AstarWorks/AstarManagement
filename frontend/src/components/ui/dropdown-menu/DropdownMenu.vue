<script setup lang="ts">
import { DropdownMenuRoot, type DropdownMenuRootProps } from 'radix-vue'

interface Props extends DropdownMenuRootProps {}

const props = defineProps<Props>()
</script>

<template>
  <DropdownMenuRoot v-bind="props">
    <slot />
  </DropdownMenuRoot>
</template>