<template>
  <div class="timeline-empty">
    <div class="empty-content">
      <div class="empty-icon-container">
        <MessageSquare class="empty-icon" />
      </div>
      
      <h3 class="empty-title">
        {{ hasFilters ? 'No communications found' : 'No communications yet' }}
      </h3>
      
      <p class="empty-description">
        {{ hasFilters 
          ? 'Try adjusting your filters or search terms to find what you\'re looking for.' 
          : 'Communications with clients, notes, calls, and emails will appear here.'
        }}
      </p>
      
      <div class="empty-actions">
        <Button v-if="hasFilters" @click="$emit('clear-filters')">
          <Filter class="size-4 mr-2" />
          Clear Filters
        </Button>
        <Button v-else variant="outline" @click="createCommunication">
          <Plus class="size-4 mr-2" />
          Create Communication
        </Button>
      </div>
      
      <!-- Quick suggestions when no filters -->
      <div v-if="!hasFilters" class="empty-suggestions">
        <p class="suggestions-title">Get started by:</p>
        <div class="suggestions-list">
          <button 
            v-for="suggestion in suggestions"
            :key="suggestion.id"
            class="suggestion-item"
            @click="suggestion.action"
          >
            <component :is="suggestion.icon" class="suggestion-icon" />
            <span class="suggestion-text">{{ suggestion.text }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  MessageSquare,
  Filter,
  Plus,
  Mail,
  Phone,
  StickyNote,
  Users
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'

interface Props {
  hasFilters?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hasFilters: false
})

const emit = defineEmits<{
  'clear-filters': []
}>()

const suggestions = [
  {
    id: 'memo',
    text: 'Write a client memo',
    icon: MessageSquare,
    action: () => navigateTo('/communications/memos?create=true')
  },
  {
    id: 'email',
    text: 'Compose an email',
    icon: Mail,
    action: () => navigateTo('/communications/emails?compose=true')
  },
  {
    id: 'call',
    text: 'Log a phone call',
    icon: Phone,
    action: () => navigateTo('/communications/calls?create=true')
  },
  {
    id: 'note',
    text: 'Add an internal note',
    icon: StickyNote,
    action: () => navigateTo('/communications/notes?create=true')
  },
  {
    id: 'meeting',
    text: 'Schedule a meeting',
    icon: Users,
    action: () => navigateTo('/communications?type=meeting')
  }
]

const createCommunication = () => {
  // Default to memo creation
  navigateTo('/communications/memos?create=true')
}
</script>

<style scoped>
.timeline-empty {
  @apply flex items-center justify-center min-h-[400px] p-8;
}

.empty-content {
  @apply text-center max-w-md;
}

.empty-icon-container {
  @apply mb-6;
}

.empty-icon {
  @apply size-16 text-muted-foreground mx-auto;
}

.empty-title {
  @apply text-xl font-semibold text-foreground mb-3;
}

.empty-description {
  @apply text-muted-foreground mb-6 leading-relaxed;
}

.empty-actions {
  @apply mb-8;
}

.empty-suggestions {
  @apply space-y-4;
}

.suggestions-title {
  @apply text-sm font-medium text-foreground;
}

.suggestions-list {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-2;
}

.suggestion-item {
  @apply flex items-center gap-3 p-3 rounded-lg border border-border;
  @apply hover:bg-accent hover:border-accent-foreground/20 transition-colors;
  @apply text-left w-full;
}

.suggestion-icon {
  @apply size-5 text-muted-foreground flex-shrink-0;
}

.suggestion-text {
  @apply text-sm text-foreground font-medium;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .timeline-empty {
    @apply min-h-[300px] p-4;
  }
  
  .empty-icon {
    @apply size-12;
  }
  
  .empty-title {
    @apply text-lg;
  }
  
  .suggestions-list {
    @apply grid-cols-1;
  }
}
</style>