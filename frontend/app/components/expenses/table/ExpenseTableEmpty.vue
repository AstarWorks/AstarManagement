<template>
  <div class="expense-table-empty text-center py-12">
    <Icon 
      :name="config.icon" 
      class="w-12 h-12 text-muted-foreground mx-auto mb-4" 
    />
    <h3 class="text-lg font-medium mb-2">
      {{ $t(config.title) }}
    </h3>
    <p class="text-muted-foreground mb-4">
      {{ $t(config.description) }}
    </p>
    <Button @click="emit('create')">
      <Icon :name="config.actionIcon" class="w-4 h-4 mr-2" />
      {{ $t(config.actionLabel) }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { EMPTY_STATE_CONFIG } from '~/config/expenseTableConfig'

interface Emits {
  /** Emitted when create button is clicked */
  (event: 'create'): void
}

const emit = defineEmits<Emits>()

// Use centralized empty state configuration
const config = EMPTY_STATE_CONFIG
</script>

<style scoped>
.expense-table-empty {
  /* Styles handled by Tailwind classes */
}
</style>