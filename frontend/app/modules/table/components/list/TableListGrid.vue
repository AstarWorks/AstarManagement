<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <TableCard
      v-for="table in tables"
      :key="table.id"
      :table="table"
      @click="$emit('navigate', table.id || '')"
      @edit="$emit('edit', table)"
      @duplicate="$emit('duplicate', table)"
      @delete="$emit('delete', table)"
    />
  </div>
</template>

<script setup lang="ts">
import type { TableResponse } from '../../types'
import TableCard from '../TableCard.vue'

defineProps<{
  tables: TableResponse[]
}>()

defineEmits<{
  navigate: [id: string]
  edit: [table: TableResponse]
  duplicate: [table: TableResponse]
  delete: [table: TableResponse]
}>()
</script>