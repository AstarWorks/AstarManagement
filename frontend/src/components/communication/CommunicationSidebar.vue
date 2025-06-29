<template>
  <aside class="communication-sidebar">
    <nav class="sidebar-nav">
      <h3 class="sidebar-title">Communications</h3>
      <div class="nav-items">
        <button
          v-for="item in navItems"
          :key="item.id"
          class="nav-item"
          :class="{ 'nav-item--active': activeSection === item.id }"
          @click="$emit('navigate', item.id)"
        >
          <component :is="item.icon" class="nav-icon" />
          <span class="nav-label">{{ item.label }}</span>
          <Badge v-if="item.count" class="nav-badge">
            {{ item.count }}
          </Badge>
        </button>
      </div>
    </nav>
    
    <!-- Quick Actions -->
    <div class="sidebar-actions">
      <Button variant="outline" size="sm" class="w-full">
        <Plus class="size-4 mr-2" />
        New Message
      </Button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { 
  MessageSquare,
  StickyNote,
  Mail,
  MessageCircle,
  Phone,
  Plus
} from 'lucide-vue-next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

defineProps<{
  activeSection: string
}>()

defineEmits<{
  navigate: [section: string]
}>()

// Navigation items with counts (will be connected to stores later)
const navItems = [
  { 
    id: 'memos', 
    label: 'Client Memos', 
    icon: MessageSquare,
    count: 12
  },
  { 
    id: 'notes', 
    label: 'Internal Notes', 
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
    label: 'Phone Calls', 
    icon: Phone,
    count: 3
  }
]
</script>

<style scoped>
.communication-sidebar {
  @apply w-64 border-r bg-card h-full flex flex-col;
}

.sidebar-nav {
  @apply flex-1 p-4;
}

.sidebar-title {
  @apply text-lg font-semibold mb-4 text-foreground;
}

.nav-items {
  @apply space-y-1;
}

.nav-item {
  @apply w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors;
  @apply hover:bg-accent hover:text-accent-foreground;
  @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
}

.nav-item--active {
  @apply bg-primary text-primary-foreground;
}

.nav-item--active:hover {
  @apply bg-primary/90;
}

.nav-icon {
  @apply size-4 flex-shrink-0;
}

.nav-label {
  @apply flex-1 text-sm font-medium;
}

.nav-badge {
  @apply text-xs;
}

.sidebar-actions {
  @apply p-4 border-t;
}
</style>