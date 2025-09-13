<template>
  <div class="relative flex-1 max-w-xl">
    <Icon name="lucide:search" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    <Input
      :model-value="modelValue"
      type="search"
      :placeholder="$t('foundation.actions.basic.search')"
      class="pl-9 h-10 bg-white border-gray-300 focus:border-primary focus:ring-primary"
      @update:model-value="$emit('update:modelValue', String($event))"
    />
  </div>
</template>

<script setup lang="ts">
// Props
const props = defineProps<{
  modelValue: string
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>