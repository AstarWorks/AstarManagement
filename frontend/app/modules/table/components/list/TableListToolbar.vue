<template>
  <div class="flex flex-col gap-4 sm:flex-row">
    <!-- Search Input -->
    <div class="relative flex-1">
      <Icon 
        name="lucide:search" 
        class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" 
      />
      <Input
        :model-value="search"
        :placeholder="$t('modules.table.search.placeholder')"
        class="pl-10"
        @update:model-value="(value: string | number) => $emit('update:search', String(value))"
      />
    </div>
    
    <!-- Sort Options -->
    <Select 
      :model-value="sortBy" 
      @update:model-value="(value) => value && $emit('update:sort-by', value as SortBy)"
    >
      <SelectTrigger class="w-[180px]">
        <SelectValue :placeholder="$t('modules.table.sort.label')" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="name">
          {{ $t('modules.table.sort.name') }}
        </SelectItem>
        <SelectItem value="updatedAt">
          {{ $t('modules.table.sort.updated') }}
        </SelectItem>
        <SelectItem value="createdAt">
          {{ $t('modules.table.sort.created') }}
        </SelectItem>
      </SelectContent>
    </Select>
    
    <!-- Sort Order Toggle -->
    <Button
      variant="ghost"
      size="icon"
      :aria-label="sortOrder === 'asc' ? $t('modules.table.sort.ascending') : $t('modules.table.sort.descending')"
      @click="$emit('toggle-sort')"
    >
      <Icon 
        :name="sortOrder === 'asc' ? 'lucide:arrow-up' : 'lucide:arrow-down'"
        class="h-4 w-4"
      />
    </Button>
  </div>
</template>

<script setup lang="ts">
export type SortBy = 'name' | 'createdAt' | 'updatedAt'
export type SortOrder = 'asc' | 'desc'

defineProps<{
  search: string
  sortBy: SortBy
  sortOrder: SortOrder
}>()

defineEmits<{
  'update:search': [value: string]
  'update:sort-by': [value: SortBy]
  'update:sort-order': [value: SortOrder]
  'toggle-sort': []
}>()
</script>