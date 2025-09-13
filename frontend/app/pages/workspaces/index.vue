<template>
  <div class="container mx-auto py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">{{ $t('modules.workspace.title') }}</h1>
          <p class="text-muted-foreground mt-2">
            {{ $t('modules.workspace.subtitle') }}
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
      <WorkspaceCard
        v-for="workspace in workspaces"
        :key="workspace.id"
        :workspace="workspace"
        @edit="handleEditWorkspace"
        @duplicate="handleDuplicateWorkspace"
        @delete="handleDeleteWorkspace"
      />
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
              ? $t('foundation.messages.dialog.editWorkspaceDescription') 
              : $t('foundation.messages.dialog.createWorkspaceDescription') 
            }}
          </DialogDescription>
        </DialogHeader>
        
        <WorkspaceForm
          ref="workspaceFormRef"
          :editing-workspace="editingWorkspace"
          :submitting="crud.creating.value || crud.updating.value"
          @submit="handleFormSubmit"
          @cancel="handleFormCancel"
        />
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <WorkspaceDeleteDialog
      v-model:open="showDeleteDialog"
      :workspace="deletingWorkspace"
      :deleting="crud.deleting.value"
      @confirm="handleDeleteConfirm"
      @cancel="handleDeleteCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWorkspaceNavigation } from '~/composables/useWorkspaceNavigation'
import type { WorkspaceResponse } from '~/modules/workspace/types'
import { useWorkspaceCrud } from '~/modules/workspace/composables/useWorkspaceCrud'
import ErrorDisplay from "@foundation/components/common/states/ErrorDisplay.vue"
import EmptyState from "@foundation/components/common/states/EmptyState.vue"
import LoadingSpinner from "@foundation/components/common/states/LoadingSpinner.vue"
import WorkspaceCard from '~/modules/workspace/components/WorkspaceCard.vue'
import WorkspaceForm from '~/modules/workspace/components/WorkspaceForm.vue'
import WorkspaceDeleteDialog from '~/modules/workspace/components/WorkspaceDeleteDialog.vue'

// Page meta
definePageMeta({
  layout: 'default'
})

// Composables
const { clear } = useWorkspaceNavigation()
const { workspaces, pending, error, refresh } = useWorkspaceList()
const crud = useWorkspaceCrud()

// Clear current workspace when on workspace list
onMounted(() => {
  clear()
})

// State
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const editingWorkspace = ref<WorkspaceResponse | null>(null)
const deletingWorkspace = ref<WorkspaceResponse | null>(null)
const workspaceFormRef = ref()

// Event handlers for WorkspaceCard
const handleEditWorkspace = (workspace: WorkspaceResponse) => {
  editingWorkspace.value = workspace
  showCreateDialog.value = true
}

const handleDuplicateWorkspace = async (workspace: WorkspaceResponse) => {
  await crud.duplicateWorkspace(workspace)
  await refresh()
}

const handleDeleteWorkspace = (workspace: WorkspaceResponse) => {
  deletingWorkspace.value = workspace
  showDeleteDialog.value = true
}

// Event handlers for WorkspaceForm
const handleFormSubmit = async () => {
  const formData = workspaceFormRef.value?.getFormData()
  if (!formData?.isValid) return

  try {
    if (formData.isEditMode && editingWorkspace.value?.id) {
      await crud.updateWorkspace(editingWorkspace.value.id, formData.updateRequest)
    } else {
      await crud.createWorkspace(formData.createRequest)
    }
    
    await refresh()
    handleFormCancel()
  } catch (error) {
    // エラーはuseWorkspaceCrud内でハンドリング済み
  }
}

const handleFormCancel = () => {
  showCreateDialog.value = false
  editingWorkspace.value = null
  workspaceFormRef.value?.resetForm()
}

// Event handlers for WorkspaceDeleteDialog
const handleDeleteConfirm = async (workspace: WorkspaceResponse) => {
  if (!workspace.id) return
  
  try {
    await crud.deleteWorkspace(workspace.id)
    await refresh()
    handleDeleteCancel()
  } catch (error) {
    // エラーはuseWorkspaceCrud内でハンドリング済み
  }
}

const handleDeleteCancel = () => {
  showDeleteDialog.value = false
  deletingWorkspace.value = null
}
</script>