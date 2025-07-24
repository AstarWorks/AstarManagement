<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDebounce } from '@vueuse/core'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import type { FilterConfig } from './FilterConfig'

interface Props {
  config: FilterConfig
  modelValue?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'clear': []
}>()

const inputValue = ref(props.modelValue)
const debouncedValue = useDebounce(inputValue, 300)

// Update internal value when prop changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== inputValue.value) {
    inputValue.value = newValue
  }
})

// Emit debounced value changes
watch(debouncedValue, (newValue) => {
  if (newValue !== props.modelValue) {
    emit('update:modelValue', newValue)
  }
})

const hasValue = computed(() => inputValue.value.length > 0)

const clearFilter = () => {
  inputValue.value = ''
  emit('clear')
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    clearFilter()
  }
}
</script>

<template>
  <div class="text-filter">
    <div class="relative">
      <Input
        v-model="inputValue"
        type="text"
        :placeholder="config.placeholder || `Filter by ${config.label.toLowerCase()}...`"
        :disabled="disabled"
        class="pr-8"
        @keydown="handleKeydown"
      />
      
      <!-- Clear button -->
      <Button
        v-if="hasValue && config.clearable"
        variant="ghost"
        size="sm"
        class="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
        @click="clearFilter"
      >
        <Icon name="lucide:x" class="h-3 w-3" />
        <span class="sr-only">Clear filter</span>
      </Button>
    </div>
  </div>
</template>

<style scoped>
.text-filter {
  @apply w-full min-w-[200px];
}
</style>