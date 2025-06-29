<template>
  <div class="memo-empty-state">
    <div class="empty-content">
      <div class="icon-wrapper">
        <component :is="icon" class="size-12 text-muted-foreground" />
      </div>
      
      <div class="text-content">
        <h3 class="title">{{ title }}</h3>
        <p class="description">{{ description }}</p>
      </div>
      
      <div v-if="showAction && actionLabel" class="action-wrapper">
        <Button 
          @click="$emit('action')" 
          :variant="actionVariant"
          :size="actionSize"
        >
          <Plus v-if="actionIcon === 'plus'" class="size-4 mr-2" />
          <RefreshCw v-if="actionIcon === 'refresh'" class="size-4 mr-2" />
          {{ actionLabel }}
        </Button>
      </div>
      
      <div v-if="showClearFilters" class="secondary-action">
        <Button 
          variant="ghost" 
          size="sm"
          @click="$emit('clear-filters')"
        >
          Clear all filters
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  Inbox, 
  Search, 
  MessageSquare, 
  Plus, 
  RefreshCw,
  Filter
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'

type EmptyStateType = 'no-memos' | 'no-results' | 'filter-empty' | 'error'
type ActionIcon = 'plus' | 'refresh' | 'none'

interface Props {
  type?: EmptyStateType
  title?: string
  description?: string
  showAction?: boolean
  actionLabel?: string
  actionIcon?: ActionIcon
  actionVariant?: 'default' | 'secondary' | 'outline' | 'ghost'
  actionSize?: 'default' | 'sm' | 'lg' | 'icon'
  showClearFilters?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'no-memos',
  showAction: true,
  actionIcon: 'plus',
  actionVariant: 'default',
  actionSize: 'default',
  showClearFilters: false
})

defineEmits<{
  action: []
  'clear-filters': []
}>()

// Computed properties for dynamic content
const icon = computed(() => {
  const iconMap = {
    'no-memos': MessageSquare,
    'no-results': Search,
    'filter-empty': Filter,
    'error': Inbox
  }
  return iconMap[props.type]
})

const title = computed(() => {
  if (props.title) return props.title
  
  const titleMap = {
    'no-memos': 'No memos yet',
    'no-results': 'No memos found',
    'filter-empty': 'No matching memos',
    'error': 'Unable to load memos'
  }
  return titleMap[props.type]
})

const description = computed(() => {
  if (props.description) return props.description
  
  const descriptionMap = {
    'no-memos': 'Create your first memo to start communicating with clients and external parties.',
    'no-results': 'Try adjusting your search terms or filters to find what you\'re looking for.',
    'filter-empty': 'No memos match your current filter criteria. Try adjusting your filters.',
    'error': 'There was a problem loading your memos. Please try again.'
  }
  return descriptionMap[props.type]
})

const actionLabel = computed(() => {
  if (props.actionLabel) return props.actionLabel
  
  const labelMap = {
    'no-memos': 'Create first memo',
    'no-results': 'Clear search',
    'filter-empty': 'Reset filters',
    'error': 'Try again'
  }
  return labelMap[props.type]
})
</script>

<style scoped>
.memo-empty-state {
  @apply flex items-center justify-center min-h-[400px] p-8;
}

.empty-content {
  @apply text-center max-w-md mx-auto space-y-6;
}

.icon-wrapper {
  @apply flex justify-center;
}

.text-content {
  @apply space-y-2;
}

.title {
  @apply text-lg font-semibold text-foreground;
}

.description {
  @apply text-sm text-muted-foreground;
}

.action-wrapper {
  @apply pt-2;
}

.secondary-action {
  @apply pt-2;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .memo-empty-state {
    @apply min-h-[300px] p-6;
  }
  
  .text-content {
    @apply space-y-1;
  }
  
  .title {
    @apply text-base;
  }
}
</style>