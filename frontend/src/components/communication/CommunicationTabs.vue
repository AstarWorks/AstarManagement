<template>
  <div class="communication-tabs">
    <ScrollArea class="w-full">
      <div class="flex space-x-1 p-1">
        <button
          v-for="item in navItems"
          :key="item.id"
          class="tab-item"
          :class="{ 'tab-item--active': activeSection === item.id }"
          @click="$emit('navigate', item.id)"
        >
          <component :is="item.icon" class="tab-icon" />
          <span class="tab-label">{{ item.label }}</span>
          <span v-if="item.count" class="tab-badge">
            {{ item.count }}
          </span>
        </button>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { 
  MessageSquare,
  StickyNote,
  Mail,
  MessageCircle,
  Phone
} from 'lucide-vue-next'
import { ScrollArea } from '~/components/ui/scroll-area'

defineProps<{
  activeSection: string
}>()

defineEmits<{
  navigate: [section: string]
}>()

// Same navigation items as sidebar
const navItems = [
  { 
    id: 'memos', 
    label: 'Memos', 
    icon: MessageSquare,
    count: 12
  },
  { 
    id: 'notes', 
    label: 'Notes', 
    icon: StickyNote,
    count: 5
  },
  { 
    id: 'emails', 
    label: 'Emails', 
    icon: Mail,
    count: 23
  },
  { 
    id: 'messages', 
    label: 'Messages', 
    icon: MessageCircle,
    count: 8
  },
  { 
    id: 'calls', 
    label: 'Calls', 
    icon: Phone,
    count: 3
  }
]
</script>

<style scoped>
.communication-tabs {
  @apply border-b bg-background;
}

.tab-item {
  @apply relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap;
  @apply text-muted-foreground hover:text-foreground transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
}

.tab-item--active {
  @apply text-foreground bg-background border-b-2 border-primary;
  @apply rounded-b-none;
}

.tab-icon {
  @apply size-4 flex-shrink-0;
}

.tab-label {
  @apply hidden sm:inline;
}

.tab-badge {
  @apply inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full;
  @apply bg-muted text-muted-foreground;
  @apply min-w-[1.25rem] h-5;
}

.tab-item--active .tab-badge {
  @apply bg-primary text-primary-foreground;
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .tab-item {
    @apply px-2;
  }
  
  .tab-badge {
    @apply text-[10px] px-1.5 py-0.5 min-w-[1rem] h-4;
  }
}
</style>