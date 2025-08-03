<template>
  <Dialog :open="isOpen" @update:open="handleClose">
    <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-3">
          <span class="text-xl font-bold">{{ caseData.title }}</span>
          <CasePriorityBadge :priority="caseData.priority" size="sm" />
        </DialogTitle>
        <DialogDescription class="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{{ $t('matter.detail.info.caseNumber') }}: {{ caseData.caseNumber }}</span>
          <CaseProgressIndicator :status="caseData.status" size="sm" />
        </DialogDescription>
      </DialogHeader>

      <!-- Case Content -->
      <div class="case-detail-content mt-6">
        <Tabs default-value="overview" class="w-full">
          <TabsList class="grid w-full grid-cols-5">
            <TabsTrigger value="overview">{{ $t('matter.detail.tabs.overview') }}</TabsTrigger>
            <TabsTrigger value="timeline">{{ $t('matter.detail.tabs.timeline') }}</TabsTrigger>
            <TabsTrigger value="documents">{{ $t('matter.detail.tabs.documents') }}</TabsTrigger>
            <TabsTrigger value="communications">{{ $t('matter.detail.tabs.communications') }}</TabsTrigger>
            <TabsTrigger value="billing">{{ $t('matter.detail.tabs.billing') }}</TabsTrigger>
          </TabsList>

          <!-- Overview Tab -->
          <TabsContent value="overview">
            <CaseDetailOverview 
              :case-data="caseData"
              @status-change-clicked="handleStatusChangeAction"
              @edit-clicked="handleEditAction"
            />
          </TabsContent>

          <!-- Timeline Tab -->
          <TabsContent value="timeline">
            <CaseDetailPlaceholder
              :title="$t('matter.detail.sections.timelineTitle')"
              :description="$t('matter.detail.sections.timelineDesc')"
              icon-name="lucide:clock"
              :placeholder-text="$t('matter.detail.placeholders.timeline')"
            />
          </TabsContent>

          <!-- Documents Tab -->
          <TabsContent value="documents">
            <CaseDetailPlaceholder
              :title="$t('matter.detail.sections.documentsTitle')"
              :description="$t('matter.detail.sections.documentsDesc')"
              icon-name="lucide:file-text"
              :placeholder-text="$t('matter.detail.placeholders.documents')"
            />
          </TabsContent>

          <!-- Communications Tab -->
          <TabsContent value="communications">
            <CaseDetailPlaceholder
              :title="$t('matter.detail.sections.communicationsTitle')"
              :description="$t('matter.detail.sections.communicationsDesc')"
              icon-name="lucide:message-circle"
              :placeholder-text="$t('matter.detail.placeholders.communications')"
            />
          </TabsContent>

          <!-- Billing Tab -->
          <TabsContent value="billing">
            <CaseDetailPlaceholder
              :title="$t('matter.detail.sections.billingTitle')"
              :description="$t('matter.detail.sections.billingDesc')"
              icon-name="lucide:calculator"
              :placeholder-text="$t('matter.detail.placeholders.billing')"
            />
          </TabsContent>
        </Tabs>
      </div>

      <DialogFooter class="mt-6">
        <Button variant="outline" @click="handleClose">
          {{ $t('matter.detail.actions.close') }}
        </Button>
        <Button class="ml-2" @click="handleEditAction">
          <Icon name="lucide:edit-3" class="h-4 w-4 mr-2" />
          {{ $t('matter.detail.actions.edit') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { ICase, CaseStatus } from '~/types/case'

interface Props {
  caseData: ICase
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'updated', caseData: ICase): void
  (e: 'statusChanged', caseId: string, newStatus: CaseStatus): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Use composables for clean separation of concerns
const { handleClose, handleEdit, handleStatusChange } = useCaseActions(emit as (event: string, ...args: unknown[]) => void)

// Handle edit action
const handleEditAction = () => {
  handleEdit(props.caseData.id)
}

// Handle status change action
const handleStatusChangeAction = () => {
  handleStatusChange(props.caseData.id)
}
</script>

<style scoped>
.case-detail-content {
  min-height: 400px;
}

@media (max-width: 768px) {
  .case-detail-content {
    min-height: 300px;
  }
}
</style>