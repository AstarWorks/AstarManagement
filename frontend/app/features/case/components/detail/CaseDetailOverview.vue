<template>
  <div class="space-y-6">
    <!-- Basic Information and Progress Grid -->
    <div class="grid grid-cols-2 gap-6">
      <CaseBasicInfo :case-data="caseData" />
      <CaseProgressInfo 
        :case-data="caseData"
        @status-change-clicked="$emit('statusChangeClicked', $event)"
        @edit-clicked="$emit('editClicked', $event)"
      />
    </div>

    <!-- Case Description -->
    <CaseDescription :case-data="caseData" />
  </div>
</template>

<script setup lang="ts">
import type {  ICase  } from '@case/types/case'

interface Props {
  caseData: ICase
}

interface Emits {
  (e: 'statusChangeClicked' | 'editClicked', caseId: string): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
@media (max-width: 768px) {
  .grid-cols-2 {
    grid-template-columns: 1fr;
  }
}
</style>