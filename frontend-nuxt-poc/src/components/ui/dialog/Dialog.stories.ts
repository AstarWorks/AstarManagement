import type { Meta, StoryObj } from '@storybook/vue3'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from './index'
import { Button } from '../button'
import { Input } from '../input'
import { Label } from '../label'
import { AlertCircle, Trash2 } from 'lucide-vue-next'

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A modal dialog component built on Radix Vue Dialog primitive. Provides accessible modal dialogs with various configurations.'
      }
    }
  }
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

// Basic dialog
export const Default: Story = {
  render: () => ({
    components: {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogHeader,
      DialogTitle,
      DialogTrigger,
      Button
    },
    template: `
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>
              This is a dialog description that provides context about the dialog content.
            </DialogDescription>
          </DialogHeader>
          <div class="py-4">
            <p>Dialog content goes here.</p>
          </div>
        </DialogContent>
      </Dialog>
    `
  })
}

// With footer actions
export const WithFooterActions: Story = {
  render: () => ({
    components: {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogFooter,
      DialogHeader,
      DialogTitle,
      DialogTrigger,
      DialogClose,
      Button
    },
    template: `
      <Dialog>
        <DialogTrigger asChild>
          <Button>Edit Profile</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div class="py-4">
            <p class="text-sm text-muted-foreground">
              Profile editing form would go here...
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Dialog with footer containing action buttons.'
      }
    }
  }
}

// Form dialog
export const FormDialog: Story = {
  render: () => ({
    components: {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogFooter,
      DialogHeader,
      DialogTitle,
      DialogTrigger,
      DialogClose,
      Button,
      Input,
      Label
    },
    setup() {
      const formData = ref({
        caseNumber: '',
        title: '',
        clientName: ''
      })
      
      const handleSubmit = () => {
        alert('Form submitted: ' + JSON.stringify(formData.value))
      }
      
      return { formData, handleSubmit }
    },
    template: `
      <Dialog>
        <DialogTrigger asChild>
          <Button>Create New Matter</Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Matter</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new legal matter.
            </DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="case-number" class="text-right">
                Case Number
              </Label>
              <Input
                id="case-number"
                v-model="formData.caseNumber"
                placeholder="2025-CV-0001"
                class="col-span-3"
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="title" class="text-right">
                Title
              </Label>
              <Input
                id="title"
                v-model="formData.title"
                placeholder="Matter title"
                class="col-span-3"
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="client" class="text-right">
                Client
              </Label>
              <Input
                id="client"
                v-model="formData.clientName"
                placeholder="Client name"
                class="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button @click="handleSubmit">Create Matter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Dialog containing a form for creating new matters.'
      }
    }
  }
}

// Confirmation dialog
export const ConfirmationDialog: Story = {
  render: () => ({
    components: {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogFooter,
      DialogHeader,
      DialogTitle,
      DialogTrigger,
      DialogClose,
      Button,
      Trash2,
      AlertCircle
    },
    template: `
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive">
            <Trash2 class="mr-2 h-4 w-4" />
            Delete Matter
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle class="flex items-center gap-2 text-destructive">
              <AlertCircle class="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this matter? This action cannot be undone
              and will permanently remove all associated documents and data.
            </DialogDescription>
          </DialogHeader>
          <div class="py-4">
            <div class="rounded-md bg-destructive/10 p-4">
              <p class="text-sm">
                <strong>Matter:</strong> Contract Dispute - ABC Corp<br />
                <strong>Case #:</strong> 2025-CV-0001<br />
                <strong>Documents:</strong> 23 files will be deleted
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive">Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Confirmation dialog for destructive actions.'
      }
    }
  }
}

// Scrollable content
export const ScrollableContent: Story = {
  render: () => ({
    components: {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogHeader,
      DialogTitle,
      DialogTrigger,
      DialogClose,
      DialogFooter,
      Button
    },
    template: `
      <Dialog>
        <DialogTrigger asChild>
          <Button>View Terms & Conditions</Button>
        </DialogTrigger>
        <DialogContent class="max-h-[600px]">
          <DialogHeader>
            <DialogTitle>Terms & Conditions</DialogTitle>
            <DialogDescription>
              Please read through our terms and conditions carefully.
            </DialogDescription>
          </DialogHeader>
          <div class="overflow-y-auto max-h-[400px] space-y-4 px-1">
            <h3 class="font-semibold">1. Introduction</h3>
            <p class="text-sm text-muted-foreground">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 
              tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, 
              quis nostrud exercitation ullamco laboris.
            </p>
            
            <h3 class="font-semibold">2. Acceptance of Terms</h3>
            <p class="text-sm text-muted-foreground">
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum 
              dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non 
              proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            
            <h3 class="font-semibold">3. User Responsibilities</h3>
            <p class="text-sm text-muted-foreground">
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium 
              doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore 
              veritatis et quasi architecto beatae vitae dicta sunt explicabo.
            </p>
            
            <h3 class="font-semibold">4. Privacy Policy</h3>
            <p class="text-sm text-muted-foreground">
              Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, 
              sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
            </p>
            
            <h3 class="font-semibold">5. Limitations of Liability</h3>
            <p class="text-sm text-muted-foreground">
              At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis 
              praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias 
              excepturi sint occaecati cupiditate non provident.
            </p>
            
            <h3 class="font-semibold">6. Governing Law</h3>
            <p class="text-sm text-muted-foreground">
              Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit 
              quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Decline</Button>
            </DialogClose>
            <Button>Accept</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Dialog with scrollable content for long text.'
      }
    }
  }
}

// Custom sized dialogs
export const CustomSizes: Story = {
  render: () => ({
    components: {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogHeader,
      DialogTitle,
      DialogTrigger,
      Button
    },
    template: `
      <div class="flex gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Small Dialog</Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[300px]">
            <DialogHeader>
              <DialogTitle>Small Dialog</DialogTitle>
              <DialogDescription>
                This is a small dialog for quick actions.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Medium Dialog</Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Medium Dialog</DialogTitle>
              <DialogDescription>
                This is a medium-sized dialog for standard content.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Large Dialog</Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Large Dialog</DialogTitle>
              <DialogDescription>
                This is a large dialog for complex content or forms.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Full Width</Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[90vw]">
            <DialogHeader>
              <DialogTitle>Full Width Dialog</DialogTitle>
              <DialogDescription>
                This dialog takes up most of the viewport width.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Dialogs with different sizes using max-width utilities.'
      }
    }
  }
}

// Nested dialogs
export const NestedDialogs: Story = {
  render: () => ({
    components: {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogHeader,
      DialogTitle,
      DialogTrigger,
      DialogFooter,
      DialogClose,
      Button
    },
    template: `
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open Parent Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parent Dialog</DialogTitle>
            <DialogDescription>
              This is the parent dialog. You can open another dialog from here.
            </DialogDescription>
          </DialogHeader>
          <div class="py-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open Nested Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nested Dialog</DialogTitle>
                  <DialogDescription>
                    This dialog is nested inside the parent dialog.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button>Close Nested</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button>Close Parent</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Example of nested dialogs (use with caution for UX).'
      }
    }
  }
}