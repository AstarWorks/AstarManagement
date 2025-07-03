import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import MatterCardEnhanced from './MatterCardEnhanced.vue'
import type { MatterCard } from '~/types/kanban'

const meta: Meta<typeof MatterCardEnhanced> = {
  title: 'Kanban/MatterCardEnhanced',
  component: MatterCardEnhanced,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Enhanced matter card with animations and inline quick edit functionality'
      }
    }
  },
  argTypes: {
    viewPreferences: {
      control: 'object',
      description: 'Display preferences for the card'
    },
    isSelected: {
      control: 'boolean',
      description: 'Whether the card is selected'
    },
    isMultiSelectMode: {
      control: 'boolean', 
      description: 'Whether multi-select mode is active'
    },
    isDragging: {
      control: 'boolean',
      description: 'Whether the card is being dragged'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

const sampleMatter: MatterCard = {
  id: '1',
  caseNumber: '2025-001',
  title: 'Contract Review - ABC Corporation',
  description: 'Review and update employment contract terms for new fiscal year compliance',
  clientName: 'ABC Corporation',
  opponentName: 'N/A',
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
  assignedLawyer: {
    id: '1',
    name: 'Yamada Taro',
    initials: 'YT',
    avatar: 'https://i.pravatar.cc/150?u=yamada'
  },
  assignedClerk: {
    id: '2', 
    name: 'Sato Hanako',
    initials: 'SH',
    avatar: 'https://i.pravatar.cc/150?u=sato'
  },
  tags: ['contract', 'employment', 'urgent'],
  relatedDocuments: 5,
  statusDuration: 3
}

export const Default: Story = {
  args: {
    matter: sampleMatter,
    viewPreferences: {
      cardSize: 'normal',
      showTags: true,
      showAvatars: true,
      showDueDates: true,
      showPriority: true,
      groupBy: 'status'
    }
  }
}

export const CompactView: Story = {
  args: {
    matter: sampleMatter,
    viewPreferences: {
      cardSize: 'compact',
      showTags: true,
      showAvatars: true,
      showDueDates: true,
      showPriority: true,
      groupBy: 'status'
    }
  }
}

export const DetailedView: Story = {
  args: {
    matter: sampleMatter,
    viewPreferences: {
      cardSize: 'detailed',
      showTags: true,
      showAvatars: true,
      showDueDates: true,
      showPriority: true,
      groupBy: 'status'
    }
  }
}

export const Selected: Story = {
  args: {
    matter: sampleMatter,
    viewPreferences: {
      cardSize: 'normal',
      showTags: true,
      showAvatars: true,
      showDueDates: true,
      showPriority: true,
      groupBy: 'status'
    },
    isSelected: true
  }
}

export const MultiSelectMode: Story = {
  args: {
    matter: sampleMatter,
    viewPreferences: {
      cardSize: 'normal',
      showTags: true,
      showAvatars: true,
      showDueDates: true,
      showPriority: true,
      groupBy: 'status'
    },
    isMultiSelectMode: true,
    canSelect: true
  }
}

export const Dragging: Story = {
  args: {
    matter: sampleMatter,
    viewPreferences: {
      cardSize: 'normal',
      showTags: true,
      showAvatars: true,
      showDueDates: true,
      showPriority: true,
      groupBy: 'status'
    },
    isDragging: true
  }
}

export const MinimalInfo: Story = {
  args: {
    matter: {
      ...sampleMatter,
      description: undefined,
      tags: [],
      assignedLawyer: undefined,
      assignedClerk: undefined
    },
    viewPreferences: {
      cardSize: 'normal',
      showTags: false,
      showAvatars: false,
      showDueDates: false,
      showPriority: true,
      groupBy: 'status'
    }
  }
}

export const OverdueMatter: Story = {
  args: {
    matter: {
      ...sampleMatter,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isOverdue: true,
      priority: 'URGENT'
    }
  }
}

export const EditModeDemo: Story = {
  render: (args) => ({
    components: { MatterCardEnhanced },
    setup() {
      const matterRef = ref(args.matter)
      
      const handleUpdate = (matter: MatterCard, field: string, value: any) => {
        console.log('Update:', field, value)
        matterRef.value = {
          ...matterRef.value,
          [field]: value,
          updatedAt: new Date().toISOString()
        }
      }
      
      return { matterRef, handleUpdate, viewPreferences: args.viewPreferences }
    },
    template: `
      <div class="p-4 bg-gray-50">
        <h3 class="text-lg font-semibold mb-4">Double-click or press F2 to edit</h3>
        <div class="max-w-sm">
          <MatterCardEnhanced 
            :matter="matterRef"
            :viewPreferences="viewPreferences"
            @update="handleUpdate"
          />
        </div>
        <div class="mt-4 p-4 bg-white rounded border">
          <h4 class="font-medium mb-2">Current Matter Data:</h4>
          <pre class="text-xs">{{ JSON.stringify(matterRef, null, 2) }}</pre>
        </div>
      </div>
    `
  }),
  args: Default.args
}

export const AnimationShowcase: Story = {
  render: () => ({
    components: { MatterCardEnhanced },
    setup() {
      const matters = ref([
        { ...sampleMatter, id: '1', title: 'Hover over me' },
        { ...sampleMatter, id: '2', title: 'Click to select', priority: 'MEDIUM' },
        { ...sampleMatter, id: '3', title: 'Double-click to edit', priority: 'LOW' }
      ])
      
      const selectedIds = ref(new Set<string>())
      
      const handleClick = (matter: MatterCard) => {
        if (selectedIds.value.has(matter.id)) {
          selectedIds.value.delete(matter.id)
        } else {
          selectedIds.value.add(matter.id)
        }
      }
      
      return { matters, selectedIds, handleClick }
    },
    template: `
      <div class="p-4 bg-gray-50 space-y-4">
        <h3 class="text-lg font-semibold">Animation Examples</h3>
        <div class="grid gap-4 max-w-sm">
          <MatterCardEnhanced
            v-for="matter in matters"
            :key="matter.id"
            :matter="matter"
            :isSelected="selectedIds.has(matter.id)"
            @click="handleClick"
          />
        </div>
        <p class="text-sm text-gray-600">
          Try hovering, clicking, and double-clicking the cards to see different animations
        </p>
      </div>
    `
  })
}