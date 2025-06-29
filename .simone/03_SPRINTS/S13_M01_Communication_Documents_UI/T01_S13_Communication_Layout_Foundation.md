# T01_S13: Communication Layout Foundation

**Complexity**: Medium
**Estimated Hours**: 8-10

## Overview
Build the base layout components and navigation structure for the communication hub, integrating with existing Nuxt.js patterns and ensuring mobile-responsive design.

## Current State Analysis

### Existing Layout Infrastructure
- **Layout Components**: `AppSidebar.vue`, `AppHeader.vue`, `AppFooter.vue`, `MobileNavigation.vue`
- **Navigation Store**: `stores/navigation.ts` with state management for menus and breadcrumbs
- **Responsive Layout**: `layouts/app.vue` with mobile-first responsive structure
- **Navigation Config**: `config/navigation.ts` with hierarchical menu structure

### Communication Hub Requirements (from Architecture)
- Client memo system
- Internal notes
- Email/Slack/Discord integration
- Phone call logging
- Searchable communication history

## Requirements

### 1. Communication Layout Structure
Create a dedicated layout for the communication hub that:
- Integrates with existing `layouts/app.vue` pattern
- Provides navigation between different communication types
- Supports mobile and desktop viewports
- Maintains consistent styling with the application

### 2. Navigation Components
Build navigation components specific to communications:
- **CommunicationSidebar**: Desktop sidebar with communication categories
- **CommunicationTabs**: Mobile-friendly tab navigation
- **CommunicationBreadcrumbs**: Context-aware breadcrumb navigation

### 3. Route Structure
Implement the following route hierarchy:
```
/communications
  /memos          - Client memos
  /notes          - Internal notes
  /emails         - Email communications
  /messages       - Slack/Discord messages
  /calls          - Phone call logs
```

## Technical Implementation

### 1. Create Base Layout Component
`components/communication/CommunicationLayout.vue`
```vue
<template>
  <div class="communication-layout">
    <!-- Desktop Layout -->
    <div class="hidden md:flex h-full">
      <CommunicationSidebar 
        :active-section="activeSection"
        @navigate="handleNavigation"
      />
      <div class="flex-1 flex flex-col">
        <CommunicationHeader :title="sectionTitle" />
        <main class="flex-1 overflow-auto p-6">
          <slot />
        </main>
      </div>
    </div>
    
    <!-- Mobile Layout -->
    <div class="md:hidden flex flex-col h-full">
      <CommunicationHeader 
        :title="sectionTitle"
        :show-menu-toggle="true"
        @toggle-menu="toggleMobileMenu"
      />
      <CommunicationTabs 
        :active-section="activeSection"
        @navigate="handleNavigation"
      />
      <main class="flex-1 overflow-auto p-4">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNavigationStore } from '~/stores/navigation'

const route = useRoute()
const router = useRouter()
const navigationStore = useNavigationStore()

const activeSection = computed(() => {
  const path = route.path
  if (path.includes('/memos')) return 'memos'
  if (path.includes('/notes')) return 'notes'
  if (path.includes('/emails')) return 'emails'
  if (path.includes('/messages')) return 'messages'
  if (path.includes('/calls')) return 'calls'
  return 'memos' // default
})

const sectionTitle = computed(() => {
  const titles = {
    memos: 'Client Memos',
    notes: 'Internal Notes',
    emails: 'Email Communications',
    messages: 'Messages',
    calls: 'Phone Calls'
  }
  return titles[activeSection.value] || 'Communications'
})

const handleNavigation = (section: string) => {
  router.push(`/communications/${section}`)
}

const toggleMobileMenu = () => {
  navigationStore.toggleMobileMenu()
}

// Set breadcrumbs
onMounted(() => {
  navigationStore.setBreadcrumbs([
    { label: 'Home', path: '/' },
    { label: 'Communications', path: '/communications' },
    { label: sectionTitle.value, current: true }
  ])
})
</script>
```

### 2. Communication Sidebar Component
`components/communication/CommunicationSidebar.vue`
```vue
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
```

### 3. Mobile Tab Navigation
`components/communication/CommunicationTabs.vue`
```vue
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
// Same imports and logic as sidebar
</script>
```

### 4. Update Navigation Configuration
Add communication routes to `config/navigation.ts`:
```typescript
{
  title: 'Communications',
  items: [
    {
      id: 'communications',
      label: 'Communications',
      icon: 'MessageSquare',
      children: [
        {
          id: 'communications-memos',
          label: 'Client Memos',
          path: '/communications/memos',
          icon: 'MessageSquare'
        },
        {
          id: 'communications-notes',
          label: 'Internal Notes',
          path: '/communications/notes',
          icon: 'StickyNote'
        },
        {
          id: 'communications-emails',
          label: 'Emails',
          path: '/communications/emails',
          icon: 'Mail'
        },
        {
          id: 'communications-messages',
          label: 'Messages',
          path: '/communications/messages',
          icon: 'MessageCircle'
        },
        {
          id: 'communications-calls',
          label: 'Phone Calls',
          path: '/communications/calls',
          icon: 'Phone'
        }
      ]
    }
  ]
}
```

### 5. Create Base Pages
Create placeholder pages for each communication type:
```typescript
// pages/communications/index.vue
// pages/communications/memos.vue
// pages/communications/notes.vue
// pages/communications/emails.vue
// pages/communications/messages.vue
// pages/communications/calls.vue
```

### 6. Composable for Communication Navigation
`composables/useCommunicationNavigation.ts`
```typescript
export function useCommunicationNavigation() {
  const route = useRoute()
  const router = useRouter()
  const navigationStore = useNavigationStore()
  
  const currentSection = computed(() => {
    // Extract section from route
  })
  
  const navigateToSection = (section: string) => {
    router.push(`/communications/${section}`)
  }
  
  const updateBreadcrumbs = () => {
    // Update breadcrumbs based on current route
  }
  
  return {
    currentSection,
    navigateToSection,
    updateBreadcrumbs
  }
}
```

## Acceptance Criteria

### Functionality
- [ ] Communication layout renders correctly on desktop and mobile
- [ ] Navigation between communication sections works smoothly
- [ ] Active states are properly highlighted
- [ ] Breadcrumbs update based on current section
- [ ] Layout integrates seamlessly with existing app layout

### Responsive Design
- [ ] Desktop: Sidebar navigation with full labels
- [ ] Tablet: Collapsible sidebar or tab navigation
- [ ] Mobile: Horizontal scrollable tabs or bottom sheet
- [ ] Touch gestures work on mobile (swipe between tabs)

### Integration
- [ ] Uses existing navigation store for state management
- [ ] Follows existing component patterns (AppSidebar, AppHeader)
- [ ] Maintains consistent styling with Tailwind CSS
- [ ] Integrates with existing authentication/permissions

### Performance
- [ ] Lazy loading for communication section components
- [ ] Smooth transitions between sections
- [ ] No layout shifts during navigation

## Testing Requirements

### Unit Tests
- Test navigation state management
- Test active section detection
- Test breadcrumb generation
- Test responsive breakpoint behavior

### Integration Tests
- Test navigation flow between sections
- Test integration with navigation store
- Test mobile menu toggle functionality

### E2E Tests
- Test full navigation flow on desktop
- Test mobile navigation with touch gestures
- Test breadcrumb navigation

## Dependencies
- Existing layout components (AppSidebar, AppHeader)
- Navigation store for state management
- Vue Router for navigation
- Tailwind CSS for styling
- Lucide Vue Next for icons
- shadcn-vue components (Badge, Button, ScrollArea)

## Notes
- Follow Vue 3 Composition API patterns
- Use TypeScript for type safety
- Ensure accessibility with proper ARIA labels
- Consider future expansion for additional communication types
- Mobile-first approach with progressive enhancement

## Complexity: Medium

This task involves creating new layout components while integrating with existing patterns. It requires understanding of Vue 3 composition API, Nuxt.js layouts, and responsive design principles.