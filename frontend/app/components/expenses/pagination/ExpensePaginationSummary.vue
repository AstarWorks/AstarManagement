<template>
  <div class="summary-bar flex justify-center items-center p-2 bg-muted/50 text-xs text-muted-foreground border-t">
    <div class="flex items-center gap-4">
      <span>{{ $t('expense.pagination.totalItems', { count: totalItems }) }}</span>
      <Separator orientation="vertical" class="h-4" />
      <span>{{ $t('expense.pagination.totalPages', { count: totalPages }) }}</span>
      <Separator orientation="vertical" class="h-4" />
      <span>{{ $t('expense.pagination.currentPage', { current: currentPage, total: totalPages }) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Separator } from '~/components/ui/separator'

interface Props {
  currentPage: number
  totalPages: number
  totalItems: number
}

defineProps<Props>()
</script>