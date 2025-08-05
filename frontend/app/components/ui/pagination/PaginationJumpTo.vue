<template>
  <div class="flex items-center gap-2">
    <Label class="text-sm whitespace-nowrap">
      {{ $t('expense.pagination.goToPage') }}
    </Label>
    <Input
      v-model="localValue"
      type="number"
      :min="1"
      :max="maxPage"
      class="w-16 text-center"
      @keydown.enter="handleJump"
      @blur="handleJump"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

interface Props {
  modelValue: number
  maxPage: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'jump': []
}>()

const localValue = ref(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue
})

const handleJump = () => {
  const targetPage = Number(localValue.value)
  
  if (targetPage >= 1 && targetPage <= props.maxPage) {
    emit('update:modelValue', targetPage)
    emit('jump')
  } else {
    // Reset to current page on invalid input
    localValue.value = props.modelValue
  }
}
</script>