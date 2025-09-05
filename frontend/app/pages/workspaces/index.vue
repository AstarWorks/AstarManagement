<template>
  <div class="container mx-auto py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">{{ $t('modules.matter.title') }}</h1>
          <p class="text-muted-foreground mt-2">
            {{ $t('modules.matter.kanban.subtitle') }}
          </p>
        </div>
        <Button @click="showCreateDialog = true">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          {{ $t('foundation.actions.basic.create') }}
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <LoadingSpinner />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="py-12">
      <ErrorDisplay :error="error" @retry="refresh" />
    </div>

    <!-- Empty State -->
    <div v-else-if="workspaces.length === 0" class="py-12">
      <EmptyState
        :title="$t('foundation.messages.info.noData')"
        :description="$t('foundation.messages.info.noResults')"
        icon="lucide:folder"
      >
        <Button @click="showCreateDialog = true">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          {{ $t('foundation.actions.basic.create') }}
        </Button>
      </EmptyState>
    </div>

    <!-- Workspace Grid -->
    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="item in workspaces"
        :key="item.id"
        class="hover:shadow-lg transition-shadow cursor-pointer"
        @click="navigateToWorkspace(item.id)"
      >
        <CardHeader>
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div
                class="h-12 w-12 rounded-lg flex items-center justify-center text-2xl"
                :style="{ backgroundColor: item.color + '20', color: item.color }"
              >
                {{ item.icon || '📁' }}
              </div>
              <div>
                <CardTitle>{{ item.name }}</CardTitle>
                <CardDescription v-if="item.description" class="mt-1">
                  {{ item.description }}
                </CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger @click.stop>
                <Button variant="ghost" size="icon">
                  <Icon name="lucide:more-vertical" class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click.stop="editWorkspace(workspace)">
                  <Icon name="lucide:edit" class="mr-2 h-4 w-4" />
                  {{ $t('foundation.actions.basic.edit') }}
                </DropdownMenuItem>
                <DropdownMenuItem @click.stop="duplicateWorkspace(workspace)">
                  <Icon name="lucide:copy" class="mr-2 h-4 w-4" />
                  {{ $t('foundation.actions.data.duplicate') }}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  class="text-destructive"
                  @click.stop="deleteWorkspace(workspace)"
                >
                  <Icon name="lucide:trash" class="mr-2 h-4 w-4" />
                  {{ $t('foundation.actions.basic.delete') }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div class="flex items-center gap-4 text-sm text-muted-foreground">
            <div class="flex items-center gap-1">
              <Icon name="lucide:users" class="h-4 w-4" />
              <span>{{ 1 }} {{ $t('foundation.common.general.users') }}</span>
            </div>
            <div class="flex items-center gap-1">
              <Icon name="lucide:calendar" class="h-4 w-4" />
              <span>{{ formatDate(item.createdAt) }}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:open="showCreateDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {{ editingWorkspace ? $t('foundation.actions.basic.edit') : $t('foundation.actions.basic.create') }}
          </DialogTitle>
          <DialogDescription>
            {{ editingWorkspace 
              ? $t('foundation.common.fields.description') 
              : $t('foundation.common.fields.description') 
            }}
          </DialogDescription>
        </DialogHeader>
        
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <Label for="name">{{ $t('foundation.common.fields.name') }}</Label>
            <Input
              id="name"
              v-model="formData.name"
              :placeholder="$t('foundation.common.fields.name')"
              required
            />
          </div>
          
          <div class="space-y-2">
            <Label for="description">{{ $t('foundation.common.fields.description') }}</Label>
            <Textarea
              id="description"
              v-model="formData.description"
              :placeholder="$t('foundation.common.fields.description')"
              rows="3"
            />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="icon">{{ $t('foundation.common.fields.tags') }}</Label>
              <Input
                id="icon"
                v-model="formData.icon"
                placeholder="📁"
                maxlength="2"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="color">{{ $t('foundation.common.fields.type') }}</Label>
              <Input
                id="color"
                v-model="formData.color"
                type="color"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" @click="closeDialog">
              {{ $t('foundation.actions.basic.cancel') }}
            </Button>
            <Button type="submit" :disabled="submitting">
              <LoadingSpinner v-if="submitting" class="mr-2 h-4 w-4" />
              {{ editingWorkspace ? $t('foundation.actions.basic.save') : $t('foundation.actions.basic.create') }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ $t('foundation.messages.confirmation.delete') }}</DialogTitle>
          <DialogDescription>
            {{ $t('foundation.messages.warning.irreversible') }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">
            {{ $t('foundation.actions.basic.cancel') }}
          </Button>
          <Button 
            variant="destructive" 
            :disabled="deleting"
            @click="confirmDelete"
          >
            <LoadingSpinner v-if="deleting" class="mr-2 h-4 w-4" />
            {{ $t('foundation.actions.basic.delete') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { toast } from 'vue-sonner'
import type { WorkspaceResponse, WorkspaceCreateRequest, WorkspaceUpdateRequest } from '~/modules/workspace/types'

// Page meta
definePageMeta({
  layout: 'default'
})

// Composables
const { t } = useI18n()
const router = useRouter()
const workspace = useWorkspace()
const { workspaces, pending, error, refresh } = useWorkspaceList()

// State
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const editingWorkspace = ref<WorkspaceResponse | null>(null)
const deletingWorkspace = ref<WorkspaceResponse | null>(null)
const submitting = ref(false)
const deleting = ref(false)

// Form data
const formData = reactive({
  name: '',
  description: '',
  icon: '📁',
  color: '#3B82F6'
})

// Methods
const formatDate = (date: string) => {
  return format(new Date(date), 'yyyy/MM/dd')
}

const navigateToWorkspace = (id: string) => {
  router.push(`/workspaces/${id}`)
}

const editWorkspace = (ws: WorkspaceResponse) => {
  editingWorkspace.value = ws
  formData.name = ws.name
  formData.description = ws.description || ''
  formData.icon = ws.icon || '📁'
  formData.color = ws.color || '#3B82F6'
  showCreateDialog.value = true
}

const duplicateWorkspace = async (ws: WorkspaceResponse) => {
  try {
    const data: WorkspaceCreateRequest = {
      name: `${ws.name} (Copy)`,
      description: ws.description,
      icon: ws.icon,
      color: ws.color,
      settings: ws.settings
    }
    
    await item.createWorkspace(data)
    await refresh()
    toast.success(t('foundation.messages.success.copied'))
  } catch (error) {
    console.error('Failed to duplicate workspace:', error)
    toast.error(t('foundation.messages.error.copyFailed'))
  }
}

const deleteWorkspace = (ws: WorkspaceResponse) => {
  deletingWorkspace.value = ws
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!deletingWorkspace.value) return
  
  deleting.value = true
  try {
    await item.deleteWorkspace(deletingWorkspace.value.id)
    await refresh()
    toast.success(t('foundation.messages.success.deleted'))
    showDeleteDialog.value = false
  } catch (error) {
    console.error('Failed to delete workspace:', error)
    toast.error(t('foundation.messages.error.default'))
  } finally {
    deleting.value = false
    deletingWorkspace.value = null
  }
}

const handleSubmit = async () => {
  submitting.value = true
  
  try {
    if (editingWorkspace.value) {
      // Update existing workspace
      const data: WorkspaceUpdateRequest = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        color: formData.color
      }
      
      await item.updateWorkspace(editingWorkspace.value.id, data)
      toast.success(t('foundation.messages.success.updated'))
    } else {
      // Create new workspace
      const data: WorkspaceCreateRequest = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        color: formData.color
      }
      
      await item.createWorkspace(data)
      toast.success(t('foundation.messages.success.created'))
    }
    
    await refresh()
    closeDialog()
  } catch (error) {
    console.error('Failed to save workspace:', error)
    toast.error(editingWorkspace.value 
      ? t('foundation.messages.error.default')
      : t('foundation.messages.error.default')
    )
  } finally {
    submitting.value = false
  }
}

const closeDialog = () => {
  showCreateDialog.value = false
  editingWorkspace.value = null
  formData.name = ''
  formData.description = ''
  formData.icon = '📁'
  formData.color = '#3B82F6'
}
</script>