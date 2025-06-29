import type { Meta, StoryObj } from '@storybook/vue3'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from './index'
import { Button } from '../button'
import { Input } from '../input'
import { Label } from '../label'
import { Badge } from '../badge'
import { ScrollArea } from '../scroll-area'
import { Settings, Menu, X } from 'lucide-vue-next'

const meta = {
  title: 'UI/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A sheet component built on Radix Vue Dialog. Slides in from the edge of the screen, perfect for mobile menus, settings panels, and detail views.'
      }
    }
  }
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

// Basic sheet
export const Default: Story = {
  render: () => ({
    components: {
      Sheet,
      SheetContent,
      SheetDescription,
      SheetHeader,
      SheetTitle,
      SheetTrigger,
      Button
    },
    template: `
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open Sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>
              This is a sheet description that provides context about the sheet content.
            </SheetDescription>
          </SheetHeader>
          <div class="py-4">
            <p>Sheet content goes here.</p>
          </div>
        </SheetContent>
      </Sheet>
    `
  })
}

// Different sides
export const DifferentSides: Story = {
  render: () => ({
    components: {
      Sheet,
      SheetContent,
      SheetDescription,
      SheetHeader,
      SheetTitle,
      SheetTrigger,
      Button
    },
    template: `
      <div class="flex gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Right (Default)</Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Right Sheet</SheetTitle>
              <SheetDescription>
                This sheet slides in from the right side.
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Left</Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Left Sheet</SheetTitle>
              <SheetDescription>
                This sheet slides in from the left side.
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Top</Button>
          </SheetTrigger>
          <SheetContent side="top">
            <SheetHeader>
              <SheetTitle>Top Sheet</SheetTitle>
              <SheetDescription>
                This sheet slides in from the top.
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Bottom</Button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Bottom Sheet</SheetTitle>
              <SheetDescription>
                This sheet slides in from the bottom.
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Sheets can slide in from any edge of the screen.'
      }
    }
  }
}

// Settings panel
export const SettingsPanel: Story = {
  render: () => ({
    components: {
      Sheet,
      SheetContent,
      SheetDescription,
      SheetHeader,
      SheetTitle,
      SheetTrigger,
      Button,
      Input,
      Label,
      Settings
    },
    setup() {
      const settings = ref({
        notifications: true,
        darkMode: false,
        language: 'en'
      })
      
      return { settings }
    },
    template: `
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings class="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>
              Manage your application preferences and account settings.
            </SheetDescription>
          </SheetHeader>
          
          <div class="space-y-6 py-6">
            <div class="space-y-4">
              <h3 class="text-sm font-medium">Appearance</h3>
              
              <div class="flex items-center justify-between">
                <Label for="dark-mode">Dark Mode</Label>
                <input
                  id="dark-mode"
                  type="checkbox"
                  v-model="settings.darkMode"
                  class="toggle"
                />
              </div>
            </div>
            
            <div class="space-y-4">
              <h3 class="text-sm font-medium">Notifications</h3>
              
              <div class="flex items-center justify-between">
                <Label for="notifications">Email Notifications</Label>
                <input
                  id="notifications"
                  type="checkbox"
                  v-model="settings.notifications"
                  class="toggle"
                />
              </div>
            </div>
            
            <div class="space-y-4">
              <h3 class="text-sm font-medium">Language</h3>
              
              <div class="space-y-2">
                <Label for="language">Display Language</Label>
                <select
                  id="language"
                  v-model="settings.language"
                  class="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                  <option value="zh">中文</option>
                </select>
              </div>
            </div>
            
            <div class="space-y-4">
              <h3 class="text-sm font-medium">Account</h3>
              
              <div class="space-y-2">
                <Label for="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value="user@example.com"
                  disabled
                />
              </div>
              
              <Button variant="destructive" class="w-full">
                Sign Out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'A settings panel implementation using Sheet component.'
      }
    }
  }
}

// Mobile navigation menu
export const MobileNavigation: Story = {
  render: () => ({
    components: {
      Sheet,
      SheetContent,
      SheetHeader,
      SheetTitle,
      SheetTrigger,
      Button,
      Menu,
      X
    },
    template: `
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" class="md:hidden">
            <Menu class="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" class="w-[300px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          
          <nav class="flex flex-col space-y-4 mt-8">
            <a href="#" class="text-lg font-medium hover:text-primary transition-colors">
              Dashboard
            </a>
            <a href="#" class="text-lg font-medium hover:text-primary transition-colors">
              Cases
            </a>
            <a href="#" class="text-lg font-medium hover:text-primary transition-colors">
              Documents
            </a>
            <a href="#" class="text-lg font-medium hover:text-primary transition-colors">
              Clients
            </a>
            <a href="#" class="text-lg font-medium hover:text-primary transition-colors">
              Calendar
            </a>
            <a href="#" class="text-lg font-medium hover:text-primary transition-colors">
              Reports
            </a>
          </nav>
          
          <div class="absolute bottom-8 left-6 right-6">
            <div class="space-y-4">
              <Button class="w-full">Sign In</Button>
              <Button variant="outline" class="w-full">Create Account</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Mobile navigation menu pattern using Sheet component.'
      }
    }
  }
}

// Case details sheet
export const CaseDetailsSheet: Story = {
  render: () => ({
    components: {
      Sheet,
      SheetContent,
      SheetDescription,
      SheetFooter,
      SheetHeader,
      SheetTitle,
      SheetTrigger,
      SheetClose,
      Button,
      Badge,
      ScrollArea
    },
    setup() {
      const caseData = {
        number: '2025-CV-0042',
        title: 'Contract Dispute - ABC Corp vs XYZ Ltd',
        status: 'active',
        priority: 'high',
        client: 'ABC Corporation',
        lawyer: 'Tanaka Hiroshi',
        created: '2025-01-15',
        lastUpdate: '2025-06-20',
        description: 'Commercial contract dispute regarding software development agreement. Client alleges breach of contract due to delayed delivery and substandard quality.',
        documents: [
          { name: 'Original Contract.pdf', size: '2.4 MB', date: '2025-01-15' },
          { name: 'Correspondence.pdf', size: '1.1 MB', date: '2025-02-10' },
          { name: 'Evidence Bundle.pdf', size: '5.7 MB', date: '2025-03-22' },
          { name: 'Expert Report.pdf', size: '890 KB', date: '2025-04-15' }
        ],
        timeline: [
          { date: '2025-01-15', event: 'Case opened' },
          { date: '2025-01-20', event: 'Initial client meeting' },
          { date: '2025-02-10', event: 'Demand letter sent' },
          { date: '2025-03-01', event: 'Response received' },
          { date: '2025-03-22', event: 'Evidence gathered' },
          { date: '2025-04-15', event: 'Expert opinion obtained' },
          { date: '2025-05-10', event: 'Settlement negotiations began' }
        ]
      }
      
      return { caseData }
    },
    template: `
      <Sheet>
        <SheetTrigger asChild>
          <Button>View Case Details</Button>
        </SheetTrigger>
        <SheetContent class="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Case Details</SheetTitle>
            <SheetDescription>
              {{ caseData.number }} - {{ caseData.title }}
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea class="h-[calc(100vh-180px)] mt-6">
            <div class="space-y-6 pr-4">
              <!-- Status badges -->
              <div class="flex gap-2">
                <Badge variant="default">{{ caseData.status }}</Badge>
                <Badge variant="destructive">{{ caseData.priority }} priority</Badge>
              </div>
              
              <!-- Case information -->
              <div class="space-y-4">
                <div>
                  <h4 class="text-sm font-medium text-muted-foreground">Client</h4>
                  <p class="text-sm">{{ caseData.client }}</p>
                </div>
                
                <div>
                  <h4 class="text-sm font-medium text-muted-foreground">Assigned Lawyer</h4>
                  <p class="text-sm">{{ caseData.lawyer }}</p>
                </div>
                
                <div>
                  <h4 class="text-sm font-medium text-muted-foreground">Created</h4>
                  <p class="text-sm">{{ caseData.created }}</p>
                </div>
                
                <div>
                  <h4 class="text-sm font-medium text-muted-foreground">Last Update</h4>
                  <p class="text-sm">{{ caseData.lastUpdate }}</p>
                </div>
              </div>
              
              <!-- Description -->
              <div>
                <h4 class="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                <p class="text-sm">{{ caseData.description }}</p>
              </div>
              
              <!-- Documents -->
              <div>
                <h4 class="text-sm font-medium text-muted-foreground mb-2">Documents</h4>
                <div class="space-y-2">
                  <div 
                    v-for="doc in caseData.documents" 
                    :key="doc.name"
                    class="flex items-center justify-between p-2 rounded-md border"
                  >
                    <div>
                      <p class="text-sm font-medium">{{ doc.name }}</p>
                      <p class="text-xs text-muted-foreground">{{ doc.size }} • {{ doc.date }}</p>
                    </div>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                </div>
              </div>
              
              <!-- Timeline -->
              <div>
                <h4 class="text-sm font-medium text-muted-foreground mb-2">Timeline</h4>
                <div class="space-y-3">
                  <div 
                    v-for="item in caseData.timeline" 
                    :key="item.date"
                    class="flex gap-3"
                  >
                    <div class="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <div class="flex-1">
                      <p class="text-sm">{{ item.event }}</p>
                      <p class="text-xs text-muted-foreground">{{ item.date }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <SheetFooter class="mt-6">
            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
            <Button>Edit Case</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Complex case details view in a sheet with scrollable content.'
      }
    }
  }
}

// Form in sheet
export const FormInSheet: Story = {
  render: () => ({
    components: {
      Sheet,
      SheetContent,
      SheetDescription,
      SheetFooter,
      SheetHeader,
      SheetTitle,
      SheetTrigger,
      SheetClose,
      Button,
      Input,
      Label
    },
    setup() {
      const formData = ref({
        title: '',
        description: '',
        dueDate: '',
        assignee: ''
      })
      
      const handleSubmit = () => {
        alert('Task created: ' + JSON.stringify(formData.value))
      }
      
      return { formData, handleSubmit }
    },
    template: `
      <Sheet>
        <SheetTrigger asChild>
          <Button>Create New Task</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create Task</SheetTitle>
            <SheetDescription>
              Add a new task to your case workflow.
            </SheetDescription>
          </SheetHeader>
          
          <div class="space-y-4 py-6">
            <div class="space-y-2">
              <Label for="title">Task Title</Label>
              <Input
                id="title"
                v-model="formData.title"
                placeholder="Enter task title"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="description">Description</Label>
              <textarea
                id="description"
                v-model="formData.description"
                placeholder="Describe the task..."
                class="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="due-date">Due Date</Label>
              <Input
                id="due-date"
                type="date"
                v-model="formData.dueDate"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="assignee">Assignee</Label>
              <select
                id="assignee"
                v-model="formData.assignee"
                class="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="">Select assignee</option>
                <option value="tanaka">Tanaka Hiroshi</option>
                <option value="yamada">Yamada Akiko</option>
                <option value="sato">Sato Kenji</option>
              </select>
            </div>
          </div>
          
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button @click="handleSubmit">Create Task</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Form implementation inside a sheet component.'
      }
    }
  }
}