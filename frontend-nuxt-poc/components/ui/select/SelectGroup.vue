<template>
  <SelectGroup>
    <SelectLabel
      v-if="label"
      class="py-1.5 pl-8 pr-2 text-sm font-semibold"
    >
      {{ label }}
    </SelectLabel>
    <slot />
  </SelectGroup>
</template>

<script setup lang="ts">
import { SelectGroup, SelectLabel } from 'radix-vue'

interface SelectGroupProps {
  label?: string
}

const props = defineProps<SelectGroupProps>()
</script>