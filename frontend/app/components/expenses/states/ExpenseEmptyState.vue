<template>
  <div class="expense-empty-state flex flex-col items-center justify-center h-full text-center p-8 bg-muted/20">
    <Icon name="lucide:receipt" class="w-16 h-16 text-muted-foreground mb-4" />
    <h3 class="text-lg font-medium mb-2">{{ $t('expense.list.empty.title') }}</h3>
    <p class="text-muted-foreground mb-4 max-w-md">
      {{ $t('expense.list.empty.description') }}
    </p>
    
    <!-- Primary action -->
    <div class="flex flex-col sm:flex-row gap-3">
      <Button class="flex items-center gap-2" @click="$emit('create')">
        <Icon name="lucide:plus" class="w-4 h-4" />
        {{ $t('expense.actions.create') }}
      </Button>
      
      <!-- Secondary actions -->
      <div class="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          class="flex items-center gap-2"
          @click="$emit('import')"
        >
          <Icon name="lucide:upload" class="w-4 h-4" />
          {{ $t('expense.actions.import') }}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          class="flex items-center gap-2"
          @click="$emit('help')"
        >
          <Icon name="lucide:help-circle" class="w-4 h-4" />
          {{ $t('common.help') }}
        </Button>
      </div>
    </div>

    <!-- Quick tips -->
    <div class="mt-6 text-sm text-muted-foreground max-w-lg">
      <p class="mb-2">{{ $t('expense.list.empty.tips.title') }}</p>
      <ul class="text-left space-y-1">
        <li class="flex items-start gap-2">
          <Icon name="lucide:circle-dot" class="w-3 h-3 mt-1 flex-shrink-0" />
          {{ $t('expense.list.empty.tips.tip1') }}
        </li>
        <li class="flex items-start gap-2">
          <Icon name="lucide:circle-dot" class="w-3 h-3 mt-1 flex-shrink-0" />
          {{ $t('expense.list.empty.tips.tip2') }}
        </li>
        <li class="flex items-start gap-2">
          <Icon name="lucide:circle-dot" class="w-3 h-3 mt-1 flex-shrink-0" />
          {{ $t('expense.list.empty.tips.tip3') }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button'

defineEmits<{
  'create': []
  'import': []
  'help': []
}>()
</script>

<style scoped>
.expense-empty-state {
  min-height: 400px;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .expense-empty-state {
    padding: 1.5rem;
  }
  
  .expense-empty-state h3 {
    font-size: 1rem;
  }
  
  .expense-empty-state p {
    font-size: 0.875rem;
  }
}
</style>