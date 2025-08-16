<template>
  <div class="flex items-center gap-2">
    <Label class="text-sm whitespace-nowrap">
      {{ $t('expense.pagination.itemsPerPage') }}
    </Label>
    <Select
      :model-value="String(pageSize)"
      @update:model-value="(value) => handlePageSizeChange(String(value))"
    >
      <SelectTrigger class="w-20">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="size in pageSizeOptions"
          :key="size"
          :value="String(size)"
        >
          {{ size }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/foundation/components/ui/select'
import { Label } from '~/foundation/components/ui/label'

interface Props {
  pageSize: number
  pageSizeOptions?: number[]
}

withDefaults(defineProps<Props>(), {
  pageSizeOptions: () => [10, 20, 50, 100]
})

const emit = defineEmits<{
  'update:pageSize': [size: number]
}>()

const handlePageSizeChange = (newSize: string) => {
  const size = Number(newSize)
  if (!isNaN(size) && size > 0) {
    emit('update:pageSize', size)
  }
}
</script>