<template>
  <div class="container mx-auto space-y-8 p-8">
    <h1 class="text-4xl font-bold">Dialog Components Test</h1>

    <!-- Basic Dialog Section -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Basic Dialog</h2>
      
      <Dialog v-model:open="basicDialogOpen">
        <DialogTrigger as-child>
          <Button>Open Basic Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Basic Dialog Example</DialogTitle>
            <DialogDescription>
              This is a basic dialog component. It demonstrates the fundamental structure 
              and functionality of the dialog system.
            </DialogDescription>
          </DialogHeader>
          
          <div class="py-4">
            <p class="text-sm text-muted-foreground">
              Dialog content goes here. You can include forms, information, or any other content.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" @click="basicDialogOpen = false">
              Cancel
            </Button>
            <Button @click="basicDialogOpen = false">
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>

    <Separator />

    <!-- Form Dialog Section -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Form Dialog</h2>
      
      <Dialog v-model:open="formDialogOpen">
        <DialogTrigger as-child>
          <Button variant="outline">Open Form Dialog</Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="name" class="text-right">Name</Label>
              <Input
                id="name"
                v-model="formData.name"
                placeholder="John Doe"
                class="col-span-3"
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="username" class="text-right">Username</Label>
              <Input
                id="username"
                v-model="formData.username"
                placeholder="@johndoe"
                class="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button @click="saveProfile">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>

    <Separator />

    <!-- AlertDialog Section -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Alert Dialog</h2>
      
      <div class="flex gap-4">
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="destructive">Delete Account</Button>
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
              <AlertDialogAction variant="destructive" @click="deleteAccount">
                Yes, delete account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="outline">Save Changes</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Save Changes?</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Do you want to save them before continuing?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel @click="discardChanges">
                Discard
              </AlertDialogCancel>
              <AlertDialogAction @click="saveChanges">
                Save Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>

    <Separator />

    <!-- StatusConfirmationDialog Section -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Status Confirmation Dialog</h2>
      
      <div class="flex gap-4 flex-wrap">
        <Button @click="openStatusDialog('normal')">
          Normal Status Change
        </Button>
        <Button variant="outline" @click="openStatusDialog('settlement')">
          Settlement Status
        </Button>
        <Button variant="destructive" @click="openStatusDialog('closing')">
          Close Matter
        </Button>
      </div>

      <StatusConfirmationDialog
        v-model:open="statusDialogOpen"
        :transition="statusTransition"
        :is-loading="statusLoading"
        @confirm="handleStatusConfirm"
      />
    </section>

    <Separator />

    <!-- Nested Dialog Demo -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Nested Dialog Example</h2>
      
      <Dialog v-model:open="parentDialogOpen">
        <DialogTrigger as-child>
          <Button>Open Parent Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parent Dialog</DialogTitle>
            <DialogDescription>
              This dialog can open another dialog to demonstrate nested behavior.
            </DialogDescription>
          </DialogHeader>
          
          <div class="py-4">
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <Button variant="outline">Open Child Dialog</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Child Dialog</AlertDialogTitle>
                  <AlertDialogDescription>
                    This is a child dialog opened from within another dialog.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Close</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          
          <DialogFooter>
            <Button @click="parentDialogOpen = false">Close Parent</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>

    <!-- State Display -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold">Dialog State</h2>
      <div class="p-4 bg-muted rounded-lg">
        <pre class="text-sm">{{ JSON.stringify({
          basicDialogOpen,
          formDialogOpen,
          statusDialogOpen,
          parentDialogOpen,
          statusTransition,
          formData
        }, null, 2) }}</pre>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '~/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel
} from '~/components/ui/alert-dialog'
import StatusConfirmationDialog from '~/components/dialogs/StatusConfirmationDialog.vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'

// Dialog states
const basicDialogOpen = ref(false)
const formDialogOpen = ref(false)
const statusDialogOpen = ref(false)
const parentDialogOpen = ref(false)
const statusLoading = ref(false)

// Form data
const formData = ref({
  name: 'John Doe',
  username: '@johndoe'
})

// Status dialog data
const statusTransition = ref<{
  from: string
  to: string
  matterId: string
  matterTitle: string
} | null>(null)

// Dialog actions
const saveProfile = () => {
  console.log('Saving profile:', formData.value)
  formDialogOpen.value = false
}

const deleteAccount = () => {
  console.log('Account deleted')
}

const saveChanges = () => {
  console.log('Changes saved')
}

const discardChanges = () => {
  console.log('Changes discarded')
}

const openStatusDialog = (type: 'normal' | 'settlement' | 'closing') => {
  const transitions = {
    normal: {
      from: 'INVESTIGATION' as const,
      to: 'RESEARCH' as const,
      matterId: '1',
      matterTitle: 'Contract Dispute Case'
    },
    settlement: {
      from: 'MEDIATION' as const,
      to: 'SETTLEMENT' as const,
      matterId: '2',
      matterTitle: 'Personal Injury Claim'
    },
    closing: {
      from: 'TRIAL' as const,
      to: 'CLOSED' as const,
      matterId: '3',
      matterTitle: 'Property Dispute'
    }
  }
  
  statusTransition.value = transitions[type]
  statusDialogOpen.value = true
}

const handleStatusConfirm = async (reason: string) => {
  console.log('Status change confirmed:', { transition: statusTransition.value, reason })
  
  statusLoading.value = true
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000))
  statusLoading.value = false
  statusDialogOpen.value = false
}
</script>