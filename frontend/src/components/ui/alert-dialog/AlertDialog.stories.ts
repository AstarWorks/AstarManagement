import type { Meta, StoryObj } from '@storybook/vue3'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from './index'
import { Button } from '../button'
import { Trash2, AlertTriangle, LogOut, Save } from 'lucide-vue-next'

const meta = {
  title: 'UI/AlertDialog',
  component: AlertDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Alert dialog component built on Radix Vue AlertDialog. Used for important confirmations that require user attention.'
      }
    }
  }
} satisfies Meta<typeof AlertDialog>

export default meta
type Story = StoryObj<typeof meta>

// Basic alert dialog
export const Default: Story = {
  render: () => ({
    components: {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
      Button
    },
    template: `
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button>Show Alert</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `
  })
}

// Delete confirmation
export const DeleteConfirmation: Story = {
  render: () => ({
    components: {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
      Button,
      Trash2,
      AlertTriangle
    },
    template: `
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            <Trash2 class="mr-2 h-4 w-4" />
            Delete Case
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle class="flex items-center gap-2">
              <AlertTriangle class="h-5 w-5 text-destructive" />
              Delete Case Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription class="space-y-2">
              <p>
                You are about to permanently delete case <strong>#2025-CV-0042</strong>.
              </p>
              <p>This action will:</p>
              <ul class="list-disc list-inside space-y-1 text-sm">
                <li>Remove all case documents (23 files)</li>
                <li>Delete all communication history</li>
                <li>Remove billing records</li>
                <li>Cannot be undone</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Destructive action confirmation with detailed consequences.'
      }
    }
  }
}

// Logout confirmation
export const LogoutConfirmation: Story = {
  render: () => ({
    components: {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
      Button,
      LogOut
    },
    template: `
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost">
            <LogOut class="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of your account?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your cases and documents.
              Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay Signed In</AlertDialogCancel>
            <AlertDialogAction>Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Simple logout confirmation dialog.'
      }
    }
  }
}

// Save changes dialog
export const SaveChangesDialog: Story = {
  render: () => ({
    components: {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      Button,
      Save
    },
    setup() {
      const open = ref(false)
      
      const handleDiscard = () => {
        open.value = false
        alert('Changes discarded')
      }
      
      const handleSave = () => {
        open.value = false
        alert('Changes saved')
      }
      
      return { open, handleDiscard, handleSave }
    },
    template: `
      <div>
        <Button @click="open = true">
          Navigate Away
        </Button>
        
        <AlertDialog v-model:open="open">
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle class="flex items-center gap-2">
                <Save class="h-5 w-5" />
                Unsaved Changes
              </AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Would you like to save them before leaving?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter class="sm:space-x-2">
              <AlertDialogCancel @click="handleDiscard" variant="destructive">
                Discard Changes
              </AlertDialogCancel>
              <AlertDialogCancel>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction @click="handleSave">
                Save Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Three-option dialog for handling unsaved changes.'
      }
    }
  }
}

// Legal context dialogs
export const LegalContextDialogs: Story = {
  render: () => ({
    components: {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
      Button,
      AlertTriangle
    },
    template: `
      <div class="space-y-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Submit to Court</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Document to Court?</AlertDialogTitle>
              <AlertDialogDescription>
                <div class="space-y-3">
                  <p>You are about to submit the following document:</p>
                  <div class="rounded-md bg-muted p-3">
                    <p class="font-medium">Motion for Summary Judgment</p>
                    <p class="text-sm text-muted-foreground">Case #2025-CV-0042</p>
                  </div>
                  <p class="text-sm">
                    Once submitted, this document cannot be modified or withdrawn
                    without court approval.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Review Again</AlertDialogCancel>
              <AlertDialogAction>Submit to Court</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Close Case</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Close Case #2025-CV-0042?</AlertDialogTitle>
              <AlertDialogDescription>
                <div class="space-y-3">
                  <p>Please confirm that:</p>
                  <ul class="space-y-2 text-sm">
                    <li class="flex items-start gap-2">
                      <input type="checkbox" class="mt-0.5" />
                      <span>All court documents have been filed</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <input type="checkbox" class="mt-0.5" />
                      <span>Final billing has been sent to client</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <input type="checkbox" class="mt-0.5" />
                      <span>Client has been notified of case closure</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <input type="checkbox" class="mt-0.5" />
                      <span>All evidence has been returned or destroyed</span>
                    </li>
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Open</AlertDialogCancel>
              <AlertDialogAction>Close Case</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Withdraw Representation</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle class="flex items-center gap-2 text-destructive">
                <AlertTriangle class="h-5 w-5" />
                Withdraw from Representation?
              </AlertDialogTitle>
              <AlertDialogDescription>
                <div class="space-y-3">
                  <p class="font-medium text-foreground">
                    This is a serious legal action that requires court approval.
                  </p>
                  <p>By proceeding, you confirm that:</p>
                  <ul class="list-disc list-inside space-y-1 text-sm">
                    <li>Valid grounds for withdrawal exist</li>
                    <li>Client has been properly notified</li>
                    <li>No immediate court deadlines are pending</li>
                    <li>Client interests will not be prejudiced</li>
                  </ul>
                  <p class="text-sm italic">
                    A motion for withdrawal will be prepared for court filing.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Proceed with Withdrawal
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Alert dialogs for legal case management scenarios.'
      }
    }
  }
}

// Custom styling
export const CustomStyling: Story = {
  render: () => ({
    components: {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
      Button
    },
    template: `
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button>Custom Styled Dialog</Button>
        </AlertDialogTrigger>
        <AlertDialogContent class="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle class="text-2xl">
              Premium Feature
            </AlertDialogTitle>
            <AlertDialogDescription class="text-base">
              <div class="space-y-4 pt-4">
                <div class="rounded-lg bg-primary/10 p-4">
                  <h4 class="font-medium mb-2">Upgrade to Pro</h4>
                  <ul class="space-y-1 text-sm">
                    <li>✓ Unlimited case storage</li>
                    <li>✓ Advanced analytics</li>
                    <li>✓ Priority support</li>
                    <li>✓ Custom integrations</li>
                  </ul>
                </div>
                <p class="text-center text-3xl font-bold">
                  $99<span class="text-base font-normal">/month</span>
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter class="flex-col sm:flex-col gap-2">
            <AlertDialogAction class="w-full bg-primary">
              Upgrade Now
            </AlertDialogAction>
            <AlertDialogCancel class="w-full">
              Maybe Later
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Alert dialog with custom styling and layout.'
      }
    }
  }
}

// Programmatic control
export const ProgrammaticControl: Story = {
  render: () => ({
    components: {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      Button
    },
    setup() {
      const dialogOpen = ref(false)
      const actionCount = ref(0)
      
      const triggerAction = () => {
        dialogOpen.value = true
      }
      
      const handleConfirm = () => {
        actionCount.value++
        dialogOpen.value = false
      }
      
      const handleCancel = () => {
        dialogOpen.value = false
      }
      
      return { dialogOpen, actionCount, triggerAction, handleConfirm, handleCancel }
    },
    template: `
      <div class="space-y-4">
        <div class="flex gap-4">
          <Button @click="triggerAction">
            Trigger Action
          </Button>
          <Button variant="outline" @click="dialogOpen = true">
            Open Dialog Directly
          </Button>
        </div>
        
        <p class="text-sm text-muted-foreground">
          Action confirmed {{ actionCount }} times
        </p>
        
        <AlertDialog v-model:open="dialogOpen">
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Action</AlertDialogTitle>
              <AlertDialogDescription>
                This dialog is controlled programmatically. You can open and close
                it using the component's state.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel @click="handleCancel">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction @click="handleConfirm">
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Alert dialog with programmatic open/close control.'
      }
    }
  }
}