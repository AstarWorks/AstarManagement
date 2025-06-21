<template>
  <input
    :type="type"
    :class="cn(
      'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      props.class
    )"
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'

interface InputProps {
  class?: string
  type?: string
  modelValue?: string | number
}

const props = withDefaults(defineProps<InputProps>(), {
  type: 'text'
})

defineEmits<{
  'update:modelValue': [value: string | number]
}>()
</script>