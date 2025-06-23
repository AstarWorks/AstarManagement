<template>
  <div class="flex flex-col sm:flex-row gap-3 p-4 bg-card border-b border-border">
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
      <Select v-model="statusFilter">
        <SelectTrigger class="w-40">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Statuses</SelectItem>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="review">Review</SelectItem>
          <SelectItem value="waiting">Waiting</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>

      <!-- Priority Filter -->
      <Select v-model="priorityFilter">
        <SelectTrigger class="w-40">
          <SelectValue placeholder="All Priorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Priorities</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
        </SelectContent>
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
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
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