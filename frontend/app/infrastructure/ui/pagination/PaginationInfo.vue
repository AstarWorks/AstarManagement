<template>
  <div class="text-sm text-muted-foreground">
    <template v-if="isEmpty">
      {{ $t('expense.pagination.noResults') }}
    </template>
    <template v-else>
      {{ $t('expense.pagination.summary', { start, end, total }) }}
    </template>
  </div>
</template>

<script setup lang="ts">
interface Props {
  start: number
  end: number
  total: number
  isEmpty?: boolean
}

withDefaults(defineProps<Props>(), {
  isEmpty: false
})
</script>