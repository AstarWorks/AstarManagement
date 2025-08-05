<template>
  <div class="flex items-center gap-1">
    <!-- First page -->
    <Button
      v-if="showFirstLast"
      variant="outline"
      size="sm"
      :disabled="isFirstPage"
      @click="$emit('first')"
    >
      <Icon name="lucide:chevrons-left" class="w-4 h-4" />
    </Button>

    <!-- Previous page -->
    <Button
      variant="outline"
      size="sm"
      :disabled="isFirstPage"
      @click="$emit('prev')"
    >
      <Icon name="lucide:chevron-left" class="w-4 h-4" />
      <span v-if="showLabels" class="ml-1">{{ $t('expense.pagination.previous') }}</span>
    </Button>

    <!-- Page numbers -->
    <div class="flex items-center gap-1">
      <template v-for="page in visiblePageNumbers" :key="page">
        <Button
          v-if="typeof page === 'number'"
          :variant="page === currentPage ? 'default' : 'outline'"
          size="sm"
          class="min-w-[2.5rem]"
          @click="$emit('goToPage', page)"
        >
          {{ page }}
        </Button>
        <span v-else class="px-2 text-muted-foreground">{{ page }}</span>
      </template>
    </div>

    <!-- Next page -->
    <Button
      variant="outline"
      size="sm"
      :disabled="isLastPage"
      @click="$emit('next')"
    >
      <span v-if="showLabels" class="mr-1">{{ $t('expense.pagination.next') }}</span>
      <Icon name="lucide:chevron-right" class="w-4 h-4" />
    </Button>

    <!-- Last page -->
    <Button
      v-if="showFirstLast"
      variant="outline"
      size="sm"
      :disabled="isLastPage"
      @click="$emit('last')"
    >
      <Icon name="lucide:chevrons-right" class="w-4 h-4" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button'

interface Props {
  currentPage: number
  visiblePageNumbers: (number | string)[]
  isFirstPage: boolean
  isLastPage: boolean
  showFirstLast?: boolean
  showLabels?: boolean
}

withDefaults(defineProps<Props>(), {
  showFirstLast: true,
  showLabels: true
})

defineEmits<{
  first: []
  prev: []
  next: []
  last: []
  goToPage: [page: number]
}>()
</script>