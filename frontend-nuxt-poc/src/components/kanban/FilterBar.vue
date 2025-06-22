<template>
  <div class="flex flex-col sm:flex-row gap-3 p-4 bg-white border-b">
    <!-- Search Input -->
    <div class="flex-1 max-w-md">
      <Input
        v-model="searchQuery"
        type="search"
        placeholder="Search matters..."
        class="w-full"
      />
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-2">
      <!-- Status Filter -->
      <Select v-model="statusFilter" class="w-40">
        <option value="">All Statuses</option>
        <option value="new">New</option>
        <option value="in_progress">In Progress</option>
        <option value="review">Review</option>
        <option value="waiting">Waiting</option>
        <option value="completed">Completed</option>
      </Select>

      <!-- Priority Filter -->
      <Select v-model="priorityFilter" class="w-40">
        <option value="">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </Select>

      <!-- Clear Filters Button -->
      <Button
        v-if="hasActiveFilters"
        variant="outline"
        size="sm"
        @click="clearFilters"
      >
        Clear Filters
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDebounce } from '@vueuse/core'
import type { FilterState, MatterStatus, Priority } from '~/types/matter'

interface Props {
  modelValue: FilterState
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: FilterState]
}>()

// Local state for form inputs
const searchQuery = ref(props.modelValue.searchQuery)
const statusFilter = ref<MatterStatus | ''>('')
const priorityFilter = ref<Priority | ''>('')

// Debounce search query
const debouncedSearchQuery = useDebounce(searchQuery, 300)

// Watch for changes and emit updates
watch(
  [debouncedSearchQuery, statusFilter, priorityFilter],
  () => {
    const newFilters: FilterState = {
      ...props.modelValue,
      searchQuery: debouncedSearchQuery.value,
      selectedStatuses: statusFilter.value ? [statusFilter.value] : [],
      selectedPriorities: priorityFilter.value ? [priorityFilter.value] : []
    }
    emit('update:modelValue', newFilters)
  }
)

// Computed properties
const hasActiveFilters = computed(() => {
  return (
    searchQuery.value ||
    statusFilter.value ||
    priorityFilter.value
  )
})

// Methods
const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  priorityFilter.value = ''
}
</script>