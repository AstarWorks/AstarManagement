<template>
  <Select :model-value="modelValue" @update:model-value="(value) => $emit('update:modelValue', value as string | null)">
    <SelectTrigger>
      <SelectValue :placeholder="placeholder" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem 
        v-for="option in options" 
        :key="option.value" 
        :value="option.value"
      >
        {{ option.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
interface FilterOption {
  value: string
  label: string
}

interface Props {
  modelValue: string | undefined
  placeholder: string
  options: FilterOption[]
}

interface Emits {
  (e: 'update:modelValue', value: string | null): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>