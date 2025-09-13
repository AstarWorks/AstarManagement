<!-- 
  Refactored RecordList.vue
  Now delegates to the new RecordListContainer for better maintainability
-->
<template>
  <RecordListContainer
    :table-id="tableId"
    :properties="properties"
    :enable-pinning="enablePinning"
    :initial-pinning="initialPinning"
    @update:record-count="$emit('update:recordCount', $event)"
  />
</template>

<script setup lang="ts">
import RecordListContainer from './list/RecordListContainer.vue'
import type { PropertyDefinitionDto } from '../../types'

// Props
const props = defineProps<{
  tableId: string
  properties: Record<string, PropertyDefinitionDto>
  // Optional: pinning configuration
  enablePinning?: boolean
  initialPinning?: {
    columns?: { left?: string[], right?: string[] }
    rows?: { top?: string[], bottom?: string[] }
  }
}>()

// Emits
const emit = defineEmits<{
  'update:recordCount': [count: number]
}>()
</script>