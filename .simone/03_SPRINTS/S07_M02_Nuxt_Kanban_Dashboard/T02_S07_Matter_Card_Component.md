---
task_id: T02_S07
sprint_id: S07
milestone_id: M02
name: Matter Card Component Migration to Vue 3 SFC
type: development
status: ready
priority: medium
complexity: medium
estimated_hours: 8
dependencies:
  - S06 (Core Components Migration)
  - T01_S07 (Kanban Layout Foundation)
assignee: unassigned
labels:
  - vue-migration
  - kanban
  - components
  - accessibility
  - storybook
---

# T02_S07: Matter Card Component Migration to Vue 3 SFC

## 📋 Objective

Convert the React MatterCard component to a Vue 3 Single File Component (SFC) with enhanced features including priority color coding, lawyer avatars, accessibility support, and proper integration with the Vue 3 kanban layout system.

## 🎯 Success Criteria

- [ ] Vue 3 SFC MatterCard component with TypeScript support
- [ ] Priority-based color coding system matching design specifications
- [ ] Lawyer/clerk avatar display with fallback initials
- [ ] Full accessibility support (ARIA labels, keyboard navigation, screen readers)
- [ ] Integration with Vue drag-and-drop system from T03_S07
- [ ] Responsive design supporting compact/normal/detailed view modes
- [ ] Proper Vue 3 prop definitions, emits, and component composition
- [ ] Comprehensive Storybook stories covering all variants
- [ ] Unit tests for component behavior and interactions
- [ ] Performance optimization with computed properties and memoization

## 🔧 Technical Requirements

### Vue 3 Component Architecture

#### Component Interface
```typescript
// types/kanban.ts - Enhanced interface for Vue component
export interface MatterCard {
  id: string
  caseNumber: string
  title: string
  description?: string
  clientName: string
  opponentName?: string
  status: MatterStatus
  priority: MatterPriority
  dueDate?: string
  createdAt: string
  updatedAt: string
  
  // Assignment information
  assignedLawyer?: {
    id: string
    name: string
    avatar?: string
    initials?: string
  }
  assignedClerk?: {
    id: string
    name: string
    avatar?: string
    initials?: string
  }
  
  // Display enhancements
  statusDuration?: number // days in current status
  isOverdue?: boolean
  relatedDocuments?: number
  tags?: string[]
  
  // Search/highlight support
  searchHighlights?: Record<string, string[]>
  relevanceScore?: number
}

export interface ViewPreferences {
  cardSize: 'compact' | 'normal' | 'detailed'
  showAvatars: boolean
  showPriority: boolean
  showDueDates: boolean
  showTags: boolean
  showSearchHighlights: boolean
}

// Component props
interface MatterCardProps {
  matter: MatterCard
  isDragging?: boolean
  viewPreferences: ViewPreferences
  searchTerms?: string[]
  onClick?: () => void
  onEdit?: () => void
  className?: string
}
```

#### Vue 3 SFC Structure
```vue
<!-- components/kanban/MatterCard.vue -->
<script setup lang="ts">
// 1. Imports - external libraries first
import { computed, toRefs } from 'vue'
import { format, isAfter, parseISO } from 'date-fns'
import { Calendar, Clock, User, AlertTriangle, AlertCircle, Info, Minus } from 'lucide-vue-next'

// 2. Internal imports
import type { MatterCard, ViewPreferences, MatterPriority } from '~/types/kanban'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { cn } from '~/lib/utils'

// 3. Props definition with TypeScript
interface Props {
  matter: MatterCard
  isDragging?: boolean
  viewPreferences: ViewPreferences
  searchTerms?: string[]
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  isDragging: false,
  searchTerms: () => [],
  className: ''
})

// 4. Emits definition
const emit = defineEmits<{
  click: [matter: MatterCard]
  edit: [matter: MatterCard]
  statusChange: [matterId: string, newStatus: string]
}>()

// 5. Reactive state and computed properties
const { matter, viewPreferences, isDragging } = toRefs(props)

// Priority configuration
const PRIORITY_COLORS: Record<MatterPriority, PriorityConfig> = {
  URGENT: {
    border: 'border-l-red-500',
    badge: 'bg-red-100 text-red-800',
    icon: AlertTriangle
  },
  HIGH: {
    border: 'border-l-orange-500', 
    badge: 'bg-orange-100 text-orange-800',
    icon: AlertCircle
  },
  MEDIUM: {
    border: 'border-l-blue-500',
    badge: 'bg-blue-100 text-blue-800', 
    icon: Info
  },
  LOW: {
    border: 'border-l-gray-500',
    badge: 'bg-gray-100 text-gray-800',
    icon: Minus
  }
}

// Computed properties for reactive updates
const priorityConfig = computed(() => PRIORITY_COLORS[matter.value.priority])
const PriorityIcon = computed(() => priorityConfig.value.icon)

const isOverdue = computed(() => {
  if (!matter.value.dueDate) return false
  try {
    return isAfter(new Date(), parseISO(matter.value.dueDate))
  } catch {
    return false
  }
})

const cardHeightClass = computed(() => {
  switch (viewPreferences.value.cardSize) {
    case 'compact': return 'h-20'
    case 'detailed': return 'h-36'
    default: return 'h-28'
  }
})

const cardClasses = computed(() => cn(
  'cursor-pointer transition-all duration-150',
  'hover:shadow-md hover:scale-[1.02]',
  'border-l-4',
  priorityConfig.value.border,
  cardHeightClass.value,
  isDragging.value && 'opacity-50 shadow-xl z-50 cursor-grabbing',
  !isDragging.value && 'cursor-grab',
  isOverdue.value && 'ring-1 ring-red-200 bg-red-50/30',
  props.className
))

// Helper functions
const formatDate = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'MMM d')
  } catch {
    return 'Invalid date'
  }
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Event handlers
const handleClick = () => {
  emit('click', matter.value)
}

const handleEdit = (e: Event) => {
  e.stopPropagation()
  emit('edit', matter.value)
}
</script>

<template>
  <Card
    :class="cardClasses"
    @click="handleClick"
    :aria-label="`Matter card for ${matter.caseNumber}: ${matter.title}`"
    role="button"
    tabindex="0"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- Card Header -->
    <CardHeader class="pb-2">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <!-- Title and Priority -->
          <div class="flex items-center gap-2 mb-1">
            <h4 class="font-medium text-sm text-foreground truncate">
              {{ matter.title }}
            </h4>
            <Badge
              v-if="viewPreferences.showPriority"
              variant="secondary"
              :class="priorityConfig.badge"
              class="text-xs"
            >
              <component :is="PriorityIcon" class="w-3 h-3 mr-1" />
              {{ matter.priority }}
            </Badge>
          </div>
          
          <!-- Case Number and Status -->
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <span class="truncate">#{{ matter.caseNumber }}</span>
            <Badge variant="outline" class="text-xs">
              {{ matter.status.replace('_', ' ').toLowerCase() }}
            </Badge>
          </div>
        </div>
        
        <!-- Drag Handle -->
        <div class="flex flex-col gap-1 opacity-30 hover:opacity-60 transition-opacity">
          <div class="w-1 h-1 bg-muted-foreground rounded-full" />
          <div class="w-1 h-1 bg-muted-foreground rounded-full" />
          <div class="w-1 h-1 bg-muted-foreground rounded-full" />
        </div>
      </div>
    </CardHeader>

    <!-- Card Content -->
    <CardContent class="pt-0">
      <div class="space-y-2">
        <!-- Client Information -->
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <User class="w-3 h-3" />
          <span class="truncate">{{ matter.clientName }}</span>
          <span v-if="matter.opponentName" class="text-muted-foreground">
            vs {{ matter.opponentName }}
          </span>
        </div>

        <!-- Due Date -->
        <div 
          v-if="viewPreferences.showDueDates && matter.dueDate"
          class="flex items-center gap-2 text-xs"
        >
          <Calendar class="w-3 h-3" />
          <span 
            :class="cn(
              'truncate',
              isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
            )"
          >
            {{ formatDate(matter.dueDate) }}
            <span v-if="isOverdue" class="ml-1">(Overdue)</span>
          </span>
        </div>

        <!-- Status Duration (Detailed View) -->
        <div 
          v-if="viewPreferences.cardSize === 'detailed' && matter.statusDuration"
          class="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Clock class="w-3 h-3" />
          <span>
            {{ matter.statusDuration }} day{{ matter.statusDuration !== 1 ? 's' : '' }} in status
          </span>
        </div>

        <!-- Last Updated -->
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock class="w-3 h-3" />
          <span>Updated {{ formatDate(matter.updatedAt) }}</span>
        </div>

        <!-- Assignees with Avatars -->
        <div 
          v-if="viewPreferences.showAvatars && (matter.assignedLawyer || matter.assignedClerk)"
          class="flex items-center gap-2 mt-2"
        >
          <Avatar
            v-if="matter.assignedLawyer"
            class="w-6 h-6"
            :aria-label="`Assigned lawyer: ${matter.assignedLawyer.name}`"
          >
            <AvatarImage :src="matter.assignedLawyer.avatar" />
            <AvatarFallback class="text-xs bg-blue-100 text-blue-700">
              {{ matter.assignedLawyer.initials || getInitials(matter.assignedLawyer.name) }}
            </AvatarFallback>
          </Avatar>

          <Avatar
            v-if="matter.assignedClerk"
            class="w-6 h-6"
            :aria-label="`Assigned clerk: ${matter.assignedClerk.name}`"
          >
            <AvatarImage :src="matter.assignedClerk.avatar" />
            <AvatarFallback class="text-xs bg-green-100 text-green-700">
              {{ matter.assignedClerk.initials || getInitials(matter.assignedClerk.name) }}
            </AvatarFallback>
          </Avatar>
        </div>

        <!-- Tags (if enabled and available) -->
        <div 
          v-if="viewPreferences.showTags && matter.tags?.length"
          class="flex flex-wrap gap-1 mt-2"
        >
          <Badge
            v-for="tag in matter.tags.slice(0, 3)"
            :key="tag"
            variant="outline"
            class="text-xs"
          >
            {{ tag }}
          </Badge>
          <Badge
            v-if="matter.tags.length > 3"
            variant="outline"
            class="text-xs"
          >
            +{{ matter.tags.length - 3 }}
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
/* Component-specific animations and hover effects */
.matter-card-enter-active,
.matter-card-leave-active {
  transition: all 0.3s ease;
}

.matter-card-enter-from,
.matter-card-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Focus styles for accessibility */
.card:focus {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .matter-card {
    border-width: 2px;
  }
  
  .priority-badge {
    font-weight: bold;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
  
  .hover\:scale-\[1\.02\]:hover {
    transform: none;
  }
}
</style>
```

### Priority Color System

#### Color Configuration
```typescript
// constants/kanban.ts
export const PRIORITY_COLORS = {
  URGENT: {
    border: 'border-l-red-500',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-800 border-red-200',
    text: 'text-red-700',
    icon: AlertTriangle
  },
  HIGH: {
    border: 'border-l-orange-500',
    bg: 'bg-orange-50', 
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    text: 'text-orange-700',
    icon: AlertCircle
  },
  MEDIUM: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-800 border-blue-200', 
    text: 'text-blue-700',
    icon: Info
  },
  LOW: {
    border: 'border-l-gray-500',
    bg: 'bg-gray-50',
    badge: 'bg-gray-100 text-gray-800 border-gray-200',
    text: 'text-gray-700', 
    icon: Minus
  }
} as const

// Status color mapping for status badges
export const STATUS_COLORS = {
  INTAKE: 'bg-blue-100 text-blue-800 border-blue-200',
  INITIAL_REVIEW: 'bg-blue-100 text-blue-800 border-blue-200',
  INVESTIGATION: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  RESEARCH: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  DRAFT_PLEADINGS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  FILED: 'bg-green-100 text-green-800 border-green-200',
  DISCOVERY: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIATION: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  TRIAL_PREP: 'bg-orange-100 text-orange-800 border-orange-200',
  TRIAL: 'bg-purple-100 text-purple-800 border-purple-200',
  SETTLEMENT: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  CLOSED: 'bg-gray-100 text-gray-800 border-gray-200'
} as const
```

### Accessibility Implementation

#### ARIA Labels and Roles
```vue
<template>
  <Card
    :class="cardClasses"
    @click="handleClick"
    role="button"
    tabindex="0"
    :aria-label="`Matter ${matter.caseNumber}: ${matter.title}. Priority: ${matter.priority}. Status: ${matter.status}. Client: ${matter.clientName}`"
    :aria-describedby="`matter-${matter.id}-details`"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- Content with proper semantic structure -->
    <div :id="`matter-${matter.id}-details`" class="sr-only">
      Additional details: 
      <span v-if="matter.dueDate">Due {{ formatDate(matter.dueDate) }}.</span>
      <span v-if="isOverdue">This matter is overdue.</span>
      <span v-if="matter.assignedLawyer">Assigned to {{ matter.assignedLawyer.name }}.</span>
    </div>
    
    <!-- Visible content -->
  </Card>
</template>
```

#### Screen Reader Support
```typescript
// composables/useAccessibility.ts
export function useAccessibility() {
  const announceUpdate = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }
  
  return {
    announceUpdate
  }
}
```

### Drag and Drop Integration

#### Vue 3 Draggable Attributes
```vue
<script setup lang="ts">
// Drag and drop integration
const dragAttributes = computed(() => ({
  draggable: true,
  'data-matter-id': matter.value.id,
  'data-priority': matter.value.priority,
  'data-status': matter.value.status
}))

const handleDragStart = (event: DragEvent) => {
  if (!event.dataTransfer) return
  
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', matter.value.id)
  event.dataTransfer.setData('application/json', JSON.stringify(matter.value))
  
  // Visual feedback
  isDragging.value = true
  
  // Accessibility announcement
  announceUpdate(`Started dragging matter ${matter.value.caseNumber}`)
}

const handleDragEnd = () => {
  isDragging.value = false
  announceUpdate(`Finished dragging matter ${matter.value.caseNumber}`)
}
</script>

<template>
  <Card
    v-bind="dragAttributes"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    :class="cardClasses"
  >
    <!-- Card content -->
  </Card>
</template>
```

## 📚 Storybook Implementation

### Comprehensive Story Coverage
```typescript
// stories/MatterCard.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import MatterCard from '~/components/kanban/MatterCard.vue'
import { DEFAULT_VIEW_PREFERENCES } from '~/constants/kanban'

const meta: Meta<typeof MatterCard> = {
  title: 'Kanban/MatterCard',
  component: MatterCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Vue 3 SFC component for displaying matter information in kanban cards with priority coding, avatars, and accessibility features.'
      }
    }
  },
  decorators: [
    () => ({
      template: '<div class="w-80 p-4"><story /></div>'
    })
  ],
  argTypes: {
    'matter.priority': {
      control: 'select',
      options: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    },
    'viewPreferences.cardSize': {
      control: 'select', 
      options: ['compact', 'normal', 'detailed']
    }
  },
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof meta>

// Base matter data
const baseMatter = {
  id: '1',
  caseNumber: '2025-CV-0001',
  title: 'Contract Dispute with ABC Corporation',
  clientName: 'ABC Corporation',
  opponentName: 'XYZ Industries',
  status: 'INTAKE' as const,
  priority: 'HIGH' as const,
  dueDate: '2025-07-15T10:00:00Z',
  createdAt: '2025-06-15T10:00:00Z',
  updatedAt: '2025-06-17T05:00:00Z',
  statusDuration: 2,
  assignedLawyer: {
    id: 'lawyer1',
    name: 'John Smith',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
  },
  assignedClerk: {
    id: 'clerk1', 
    name: 'Jane Doe',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face'
  },
  tags: ['Contract', 'Commercial', 'Urgent']
}

export const Default: Story = {
  args: {
    matter: baseMatter,
    viewPreferences: DEFAULT_VIEW_PREFERENCES
  }
}

export const AllPriorities: Story = {
  render: () => ({
    components: { MatterCard },
    setup() {
      const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
      const matters = priorities.map((priority, index) => ({
        ...baseMatter,
        id: `matter-${index}`,
        priority,
        title: `${priority} Priority Matter`,
        caseNumber: `2025-CV-000${index + 1}`
      }))
      
      return { matters, viewPreferences: DEFAULT_VIEW_PREFERENCES }
    },
    template: `
      <div class="space-y-4">
        <MatterCard
          v-for="matter in matters"
          :key="matter.id"
          :matter="matter"
          :viewPreferences="viewPreferences"
        />
      </div>
    `
  })
}

export const ViewSizes: Story = {
  render: () => ({
    components: { MatterCard },
    setup() {
      const sizes = ['compact', 'normal', 'detailed'] as const
      return { 
        matter: baseMatter,
        sizes: sizes.map(size => ({
          cardSize: size,
          ...DEFAULT_VIEW_PREFERENCES
        }))
      }
    },
    template: `
      <div class="space-y-4">
        <div v-for="prefs in sizes" :key="prefs.cardSize">
          <h3 class="text-sm font-medium mb-2 capitalize">{{ prefs.cardSize }} View</h3>
          <MatterCard :matter="matter" :viewPreferences="prefs" />
        </div>
      </div>
    `
  })
}

export const OverdueMatter: Story = {
  args: {
    matter: {
      ...baseMatter,
      dueDate: '2025-06-01T10:00:00Z', // Past date
      priority: 'URGENT',
      title: 'Overdue Response Required - Court Filing'
    },
    viewPreferences: DEFAULT_VIEW_PREFERENCES
  }
}

export const NoAssignees: Story = {
  args: {
    matter: {
      ...baseMatter,
      assignedLawyer: undefined,
      assignedClerk: undefined,
      title: 'Unassigned New Intake Matter'
    },
    viewPreferences: DEFAULT_VIEW_PREFERENCES
  }
}

export const WithoutAvatars: Story = {
  args: {
    matter: baseMatter,
    viewPreferences: {
      ...DEFAULT_VIEW_PREFERENCES,
      showAvatars: false
    }
  }
}

export const DraggingState: Story = {
  args: {
    matter: baseMatter,
    isDragging: true,
    viewPreferences: DEFAULT_VIEW_PREFERENCES
  }
}

export const InteractiveCard: Story = {
  args: {
    matter: baseMatter,
    viewPreferences: DEFAULT_VIEW_PREFERENCES
  },
  play: async ({ canvasElement }) => {
    // Interaction testing can be added here
  }
}
```

## 🧪 Testing Strategy

### Unit Tests
```typescript
// __tests__/components/kanban/MatterCard.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MatterCard from '~/components/kanban/MatterCard.vue'

describe('MatterCard', () => {
  const mockMatter = {
    id: '1',
    caseNumber: '2025-CV-0001',
    title: 'Test Matter',
    clientName: 'Test Client',
    status: 'INTAKE' as const,
    priority: 'HIGH' as const,
    createdAt: '2025-06-15T10:00:00Z',
    updatedAt: '2025-06-17T05:00:00Z'
  }

  const mockViewPreferences = {
    cardSize: 'normal' as const,
    showAvatars: true,
    showPriority: true,
    showDueDates: true,
    showTags: true,
    showSearchHighlights: false
  }

  it('renders matter information correctly', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      }
    })

    expect(wrapper.text()).toContain('Test Matter')
    expect(wrapper.text()).toContain('2025-CV-0001')
    expect(wrapper.text()).toContain('Test Client')
    expect(wrapper.text()).toContain('HIGH')
  })

  it('applies correct priority colors', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: { ...mockMatter, priority: 'URGENT' },
        viewPreferences: mockViewPreferences
      }
    })

    expect(wrapper.find('.border-l-red-500').exists()).toBe(true)
  })

  it('shows overdue styling for past due dates', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: {
          ...mockMatter,
          dueDate: '2025-01-01T10:00:00Z' // Past date
        },
        viewPreferences: mockViewPreferences
      }
    })

    expect(wrapper.find('.ring-red-200').exists()).toBe(true)
    expect(wrapper.text()).toContain('(Overdue)')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      }
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.[0]).toEqual([mockMatter])
  })

  it('handles keyboard navigation', async () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      }
    })

    await wrapper.trigger('keydown.enter')
    expect(wrapper.emitted('click')).toBeTruthy()

    await wrapper.trigger('keydown.space')
    expect(wrapper.emitted('click')).toHaveLength(2)
  })

  it('shows avatars when enabled', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: {
          ...mockMatter,
          assignedLawyer: {
            id: 'lawyer1',
            name: 'John Smith',
            avatar: 'https://example.com/avatar.jpg'
          }
        },
        viewPreferences: mockViewPreferences
      }
    })

    expect(wrapper.findComponent({ name: 'Avatar' }).exists()).toBe(true)
  })

  it('hides avatars when disabled', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: {
          ...mockMatter,
          assignedLawyer: {
            id: 'lawyer1',
            name: 'John Smith'
          }
        },
        viewPreferences: {
          ...mockViewPreferences,
          showAvatars: false
        }
      }
    })

    expect(wrapper.findComponent({ name: 'Avatar' }).exists()).toBe(false)
  })

  it('applies dragging styles correctly', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences,
        isDragging: true
      }
    })

    expect(wrapper.find('.opacity-50').exists()).toBe(true)
    expect(wrapper.find('.cursor-grabbing').exists()).toBe(true)
  })
})
```

### Accessibility Tests
```typescript
// __tests__/accessibility/MatterCard.a11y.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { axe, toHaveNoViolations } from 'jest-axe'
import MatterCard from '~/components/kanban/MatterCard.vue'

expect.extend(toHaveNoViolations)

describe('MatterCard Accessibility', () => {
  const mockMatter = {
    id: '1',
    caseNumber: '2025-CV-0001',
    title: 'Test Matter',
    clientName: 'Test Client',
    status: 'INTAKE' as const,
    priority: 'HIGH' as const,
    createdAt: '2025-06-15T10:00:00Z',
    updatedAt: '2025-06-17T05:00:00Z'
  }

  const mockViewPreferences = {
    cardSize: 'normal' as const,
    showAvatars: true,
    showPriority: true,
    showDueDates: true,
    showTags: true,
    showSearchHighlights: false
  }

  it('should not have accessibility violations', async () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      }
    })

    const results = await axe(wrapper.element)
    expect(results).toHaveNoViolations()
  })

  it('has proper ARIA labels', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      }
    })

    const card = wrapper.find('[role="button"]')
    expect(card.attributes('aria-label')).toContain('2025-CV-0001')
    expect(card.attributes('aria-label')).toContain('Test Matter')
  })

  it('has proper keyboard support', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      }
    })

    const card = wrapper.find('[role="button"]')
    expect(card.attributes('tabindex')).toBe('0')
  })
})
```

## 🔄 Performance Optimization

### Vue 3 Reactivity Patterns
```typescript
// Performance optimized computed properties
const priorityConfig = computed(() => PRIORITY_COLORS[matter.value.priority])
const memoizedInitials = computed(() => 
  matter.value.assignedLawyer ? getInitials(matter.value.assignedLawyer.name) : ''
)

// Memoized date formatting
const formattedDueDate = computed(() => 
  matter.value.dueDate ? formatDate(matter.value.dueDate) : null
)

// Efficient class computation
const cardClasses = computed(() => {
  const classes = [
    'cursor-pointer transition-all duration-150',
    'hover:shadow-md hover:scale-[1.02]',
    'border-l-4',
    priorityConfig.value.border,
    cardHeightClass.value
  ]
  
  if (isDragging.value) {
    classes.push('opacity-50 shadow-xl z-50 cursor-grabbing')
  } else {
    classes.push('cursor-grab')
  }
  
  if (isOverdue.value) {
    classes.push('ring-1 ring-red-200 bg-red-50/30')
  }
  
  if (props.className) {
    classes.push(props.className)
  }
  
  return classes.join(' ')
})
```

### Component Optimization
```vue
<script setup lang="ts">
// Use shallowRef for large objects that don't need deep reactivity
import { shallowRef, computed, toRefs } from 'vue'

// Prevent unnecessary re-renders
defineOptions({
  inheritAttrs: false
})

// Optimize props with readonly where appropriate
const { matter, viewPreferences } = toRefs(props)
</script>
```

## 📝 Migration Notes

### Key Differences from React Version
1. **Event Handling**: Vue's `@click` vs React's `onClick`
2. **Conditional Rendering**: `v-if` vs `{condition && <element>}`
3. **Class Binding**: `:class` with computed properties vs `className` with useMemo
4. **Props**: `defineProps<T>()` vs interface props
5. **Events**: `defineEmits<T>()` vs callback props
6. **Reactivity**: `computed()` vs `useMemo()`

### Component Integration Points
1. **Drag & Drop**: Will integrate with Vue 3 drag library from T03_S07
2. **Store Integration**: Uses Pinia store from T04_S07
3. **Search Highlighting**: Integrates with Vue search composables from T05_S07
4. **Responsive Design**: Uses VueUse composables for mobile detection from T07_S07

## 🎯 Acceptance Criteria

### Functional Requirements
- [ ] Component renders all matter information accurately
- [ ] Priority color coding system works correctly for all priority levels
- [ ] Avatar display with fallback initials functioning
- [ ] Overdue matter highlighting works properly
- [ ] All view preference options (compact/normal/detailed) implemented
- [ ] Click and edit events emitted correctly
- [ ] Tags display with truncation for long lists

### Accessibility Requirements
- [ ] All ARIA labels and roles properly implemented
- [ ] Keyboard navigation (Enter/Space) working
- [ ] Screen reader compatible content structure
- [ ] High contrast mode support
- [ ] Focus indicators visible and properly styled
- [ ] No axe-core accessibility violations

### Performance Requirements
- [ ] Component renders in <16ms (60fps target)
- [ ] Computed properties optimize expensive calculations
- [ ] No unnecessary re-renders on prop changes
- [ ] Memory usage stable during drag operations
- [ ] Smooth hover animations and transitions

### Testing Requirements
- [ ] Unit tests cover all major functionality
- [ ] Accessibility tests pass with axe-core
- [ ] Storybook stories demonstrate all variants
- [ ] Visual regression tests for priority colors
- [ ] Interaction tests for click/keyboard events

### Integration Requirements
- [ ] Compatible with Vue 3 drag-and-drop system
- [ ] Integrates with Pinia store state management
- [ ] Works with Vue router for matter navigation
- [ ] Supports SSR rendering without hydration issues
- [ ] Mobile responsive design with touch support

## 📚 Resources

### Vue 3 Documentation
- [Vue 3 Composition API](https://vuejs.org/guide/typescript/composition-api.html)
- [Vue 3 SFC Syntax](https://vuejs.org/api/sfc-spec.html)
- [Props and Emits](https://vuejs.org/guide/typescript/composition-api.html#typing-component-props)

### Accessibility Resources
- [Vue A11y Guide](https://vue-a11y.github.io/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Testing Resources
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Vitest Vue Testing](https://vitest.dev/guide/testing-types.html)
- [Jest Axe for Accessibility](https://github.com/nickcolley/jest-axe)

### Performance Resources
- [Vue 3 Performance Guide](https://vuejs.org/guide/best-practices/performance.html)
- [Web Vitals](https://web.dev/vitals/)
- [Vue DevTools Performance](https://devtools.vuejs.org/guide/performance.html)