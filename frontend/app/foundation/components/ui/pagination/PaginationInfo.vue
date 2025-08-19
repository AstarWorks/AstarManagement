<template>
  <div class="text-sm text-muted-foreground">
    <template v-if="isEmpty">
      {{ $t('foundation.table.states.empty.title') }}
    </template>
    <template v-else>
      {{ $t('foundation.table.pagination.summary', { start, end, total }) }}
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