import type { Meta, StoryObj } from '@storybook/vue3'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from './index'
import { Button } from '../button'
import { Label } from '../label'
import { Input } from '../input'
// import { Calendar } from '../calendar' // TODO: Add calendar component
import { Info, HelpCircle, Settings, Calendar as CalendarIcon } from 'lucide-vue-next'

const meta = {
  title: 'UI/Popover',
  component: Popover,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A popover component built on Radix Vue Popover. Displays rich content in a portal, triggered by a button.'
      }
    }
  }
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

// Basic popover
export const Default: Story = {
  render: () => ({
    components: {
      Popover,
      PopoverContent,
      PopoverTrigger,
      Button
    },
    template: `
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Open Popover</Button>
        </PopoverTrigger>
        <PopoverContent>
          <div class="space-y-2">
            <h4 class="font-medium leading-none">Popover Title</h4>
            <p class="text-sm text-muted-foreground">
              This is a popover content. You can put any content here.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    `
  })
}

// With form content
export const WithForm: Story = {
  render: () => ({
    components: {
      Popover,
      PopoverContent,
      PopoverTrigger,
      Button,
      Label,
      Input
    },
    setup() {
      const dimensions = ref({
        width: '100',
        height: '100'
      })
      
      return { dimensions }
    },
    template: `
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Set Dimensions</Button>
        </PopoverTrigger>
        <PopoverContent class="w-80">
          <div class="grid gap-4">
            <div class="space-y-2">
              <h4 class="font-medium leading-none">Dimensions</h4>
              <p class="text-sm text-muted-foreground">
                Set the dimensions for the layer.
              </p>
            </div>
            <div class="grid gap-2">
              <div class="grid grid-cols-3 items-center gap-4">
                <Label for="width">Width</Label>
                <Input
                  id="width"
                  v-model="dimensions.width"
                  class="col-span-2 h-8"
                />
              </div>
              <div class="grid grid-cols-3 items-center gap-4">
                <Label for="height">Height</Label>
                <Input
                  id="height"
                  v-model="dimensions.height"
                  class="col-span-2 h-8"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Popover containing a form for setting dimensions.'
      }
    }
  }
}

// Information popovers
export const InformationPopovers: Story = {
  render: () => ({
    components: {
      Popover,
      PopoverContent,
      PopoverTrigger,
      Button,
      Info,
      HelpCircle
    },
    template: `
      <div class="flex gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm">Case Status</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" class="h-4 w-4 p-0">
                <Info class="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" class="w-80">
              <div class="space-y-2">
                <h4 class="font-medium text-sm">Case Status Information</h4>
                <div class="text-sm text-muted-foreground space-y-1">
                  <p><strong>Active:</strong> Case is currently being worked on</p>
                  <p><strong>Pending:</strong> Awaiting client response or documents</p>
                  <p><strong>On Hold:</strong> Temporarily paused</p>
                  <p><strong>Closed:</strong> Case has been resolved</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div class="flex items-center gap-2">
          <span class="text-sm">Priority Level</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" class="h-4 w-4 p-0">
                <HelpCircle class="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" class="w-80">
              <div class="space-y-2">
                <h4 class="font-medium text-sm">Priority Levels</h4>
                <div class="text-sm text-muted-foreground space-y-2">
                  <div class="flex items-center gap-2">
                    <div class="h-2 w-2 rounded-full bg-destructive"></div>
                    <p><strong>Urgent:</strong> Requires immediate attention</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="h-2 w-2 rounded-full bg-orange-500"></div>
                    <p><strong>High:</strong> Important, handle within 24 hours</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="h-2 w-2 rounded-full bg-yellow-500"></div>
                    <p><strong>Medium:</strong> Standard priority</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="h-2 w-2 rounded-full bg-green-500"></div>
                    <p><strong>Low:</strong> Can be handled when time permits</p>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Information popovers triggered by icon buttons.'
      }
    }
  }
}

// Date picker popover
export const DatePickerPopover: Story = {
  render: () => ({
    components: {
      Popover,
      PopoverContent,
      PopoverTrigger,
      Button,
      CalendarIcon
    },
    setup() {
      const date = ref(new Date())
      
      const formattedDate = computed(() => {
        return date.value ? date.value.toLocaleDateString() : 'Pick a date'
      })
      
      return { date, formattedDate }
    },
    template: `
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" class="w-[280px] justify-start text-left font-normal">
            <CalendarIcon class="mr-2 h-4 w-4" />
            {{ formattedDate }}
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0">
          <Calendar v-model="date" mode="single" :selected="date" />
        </PopoverContent>
      </Popover>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Date picker implemented with popover and calendar components.'
      }
    }
  }
}

// Settings popover
export const SettingsPopover: Story = {
  render: () => ({
    components: {
      Popover,
      PopoverContent,
      PopoverTrigger,
      Button,
      Label,
      Settings
    },
    setup() {
      const settings = ref({
        notifications: true,
        autoSave: true,
        compactView: false
      })
      
      return { settings }
    },
    template: `
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings class="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-80">
          <div class="grid gap-4">
            <div class="space-y-2">
              <h4 class="font-medium leading-none">Quick Settings</h4>
              <p class="text-sm text-muted-foreground">
                Manage your preferences
              </p>
            </div>
            <div class="grid gap-2">
              <div class="flex items-center space-x-2">
                <input
                  id="notifications"
                  type="checkbox"
                  v-model="settings.notifications"
                  class="h-4 w-4"
                />
                <Label for="notifications" class="text-sm font-normal">
                  Enable notifications
                </Label>
              </div>
              <div class="flex items-center space-x-2">
                <input
                  id="auto-save"
                  type="checkbox"
                  v-model="settings.autoSave"
                  class="h-4 w-4"
                />
                <Label for="auto-save" class="text-sm font-normal">
                  Auto-save changes
                </Label>
              </div>
              <div class="flex items-center space-x-2">
                <input
                  id="compact-view"
                  type="checkbox"
                  v-model="settings.compactView"
                  class="h-4 w-4"
                />
                <Label for="compact-view" class="text-sm font-normal">
                  Use compact view
                </Label>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Quick settings panel in a popover.'
      }
    }
  }
}

// Different positions
export const Positions: Story = {
  render: () => ({
    components: {
      Popover,
      PopoverContent,
      PopoverTrigger,
      Button
    },
    template: `
      <div class="grid grid-cols-3 gap-8 place-items-center min-h-[400px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Top</Button>
          </PopoverTrigger>
          <PopoverContent side="top">
            <p class="text-sm">Popover on top</p>
          </PopoverContent>
        </Popover>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Right</Button>
          </PopoverTrigger>
          <PopoverContent side="right">
            <p class="text-sm">Popover on right</p>
          </PopoverContent>
        </Popover>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Bottom</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom">
            <p class="text-sm">Popover on bottom</p>
          </PopoverContent>
        </Popover>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Left</Button>
          </PopoverTrigger>
          <PopoverContent side="left">
            <p class="text-sm">Popover on left</p>
          </PopoverContent>
        </Popover>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Top Start</Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start">
            <p class="text-sm">Aligned to start</p>
          </PopoverContent>
        </Popover>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Bottom End</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end">
            <p class="text-sm">Aligned to end</p>
          </PopoverContent>
        </Popover>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Popover positioning options with different sides and alignments.'
      }
    }
  }
}

// Legal context popover
export const LegalContextPopover: Story = {
  render: () => ({
    components: {
      Popover,
      PopoverContent,
      PopoverTrigger,
      Button,
      Label,
      Input
    },
    setup() {
      const expense = ref({
        amount: '',
        category: 'transportation',
        description: ''
      })
      
      const handleSubmit = () => {
        alert('Expense recorded: ' + JSON.stringify(expense.value))
      }
      
      return { expense, handleSubmit }
    },
    template: `
      <Popover>
        <PopoverTrigger asChild>
          <Button>Record Expense</Button>
        </PopoverTrigger>
        <PopoverContent class="w-80">
          <div class="grid gap-4">
            <div class="space-y-2">
              <h4 class="font-medium leading-none">Quick Expense Entry</h4>
              <p class="text-sm text-muted-foreground">
                Record case-related expenses
              </p>
            </div>
            <div class="grid gap-2">
              <div class="grid grid-cols-3 items-center gap-4">
                <Label for="amount">Amount (¥)</Label>
                <Input
                  id="amount"
                  v-model="expense.amount"
                  type="number"
                  placeholder="0"
                  class="col-span-2"
                />
              </div>
              <div class="grid grid-cols-3 items-center gap-4">
                <Label for="category">Category</Label>
                <select
                  id="category"
                  v-model="expense.category"
                  class="col-span-2 rounded-md border border-input bg-background px-3 py-1"
                >
                  <option value="transportation">Transportation</option>
                  <option value="filing">Filing Fees</option>
                  <option value="printing">Printing</option>
                  <option value="postage">Postage</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="grid grid-cols-3 items-center gap-4">
                <Label for="desc">Notes</Label>
                <Input
                  id="desc"
                  v-model="expense.description"
                  placeholder="Optional"
                  class="col-span-2"
                />
              </div>
            </div>
            <Button @click="handleSubmit" class="w-full">
              Save Expense
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Quick expense entry form for legal case management.'
      }
    }
  }
}