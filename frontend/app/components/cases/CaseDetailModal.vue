<template>
  <Dialog :open="isOpen" @update:open="handleClose">
    <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-3">
          <span class="text-xl font-bold">{{ caseData.title }}</span>
          <CasePriorityBadge :priority="caseData.priority" size="sm" />
        </DialogTitle>
        <DialogDescription class="flex items-center gap-4 text-sm text-muted-foreground">
          <span>案件番号: {{ caseData.caseNumber }}</span>
          <CaseProgressIndicator :status="caseData.status" size="sm" />
        </DialogDescription>
      </DialogHeader>

      <!-- Case Content -->
      <div class="case-detail-content mt-6">
        <Tabs default-value="overview" class="w-full">
          <TabsList class="grid w-full grid-cols-5">
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="timeline">経緯</TabsTrigger>
            <TabsTrigger value="documents">書類</TabsTrigger>
            <TabsTrigger value="communications">連絡</TabsTrigger>
            <TabsTrigger value="billing">請求</TabsTrigger>
          </TabsList>

          <!-- Overview Tab -->
          <TabsContent value="overview" class="space-y-6">
            <div class="grid grid-cols-2 gap-6">
              <!-- Basic Information -->
              <Card>
                <CardHeader>
                  <CardTitle class="text-lg">基本情報</CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                  <div class="info-row">
                    <Label class="text-sm font-medium text-muted-foreground">依頼者</Label>
                    <div class="flex items-center gap-2 mt-1">
                      <Icon 
                        :name="caseData.client.type === 'individual' ? 'lucide:user' : 'lucide:building'" 
                        class="h-4 w-4 text-muted-foreground" 
                      />
                      <span class="font-medium">{{ caseData.client.name }}</span>
                      <ClientTypeBadge :type="caseData.client.type" size="xs" />
                    </div>
                  </div>

                  <div class="info-row">
                    <Label class="text-sm font-medium text-muted-foreground">担当弁護士</Label>
                    <div class="flex items-center gap-2 mt-1">
                      <Icon name="lucide:user-check" class="h-4 w-4 text-muted-foreground" />
                      <span class="font-medium">{{ caseData.assignedLawyer }}</span>
                    </div>
                  </div>

                  <div class="info-row">
                    <Label class="text-sm font-medium text-muted-foreground">期限日</Label>
                    <div class="flex items-center gap-2 mt-1">
                      <Icon name="lucide:calendar" class="h-4 w-4 text-muted-foreground" />
                      <span class="font-medium">{{ formatDate(caseData.dueDate) }}</span>
                      <DueDateAlert v-if="isDueSoon" :due-date="caseData.dueDate" size="xs" />
                    </div>
                  </div>

                  <div class="info-row">
                    <Label class="text-sm font-medium text-muted-foreground">タグ</Label>
                    <div class="flex flex-wrap gap-1 mt-1">
                      <CaseTag
                        v-for="tag in caseData.tags"
                        :key="tag"
                        :tag="tag"
                        size="xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <!-- Case Status & Progress -->
              <Card>
                <CardHeader>
                  <CardTitle class="text-lg">進捗状況</CardTitle>
                </CardHeader>
                <CardContent class="space-y-4">
                  <div class="status-overview">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm font-medium">現在の状態</span>
                      <Badge :variant="getStatusVariant(caseData.status)">
                        {{ getStatusLabel(caseData.status) }}
                      </Badge>
                    </div>
                    <CaseProgressIndicator :status="caseData.status" size="md" />
                  </div>

                  <div class="dates-info space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-muted-foreground">作成日</span>
                      <span>{{ formatDate(caseData.createdAt) }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-muted-foreground">最終更新</span>
                      <span>{{ formatDate(caseData.updatedAt) }}</span>
                    </div>
                  </div>

                  <!-- Quick Actions -->
                  <div class="quick-actions pt-4 border-t space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      class="w-full justify-start"
                      @click="handleStatusChange"
                    >
                      <Icon name="lucide:arrow-right" class="h-4 w-4 mr-2" />
                      ステータス変更
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      class="w-full justify-start"
                      @click="handleEdit"
                    >
                      <Icon name="lucide:edit-3" class="h-4 w-4 mr-2" />
                      案件を編集
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <!-- Case Description -->
            <Card>
              <CardHeader>
                <CardTitle class="text-lg">案件詳細</CardTitle>
                <CardDescription>
                  案件の詳細な説明や特記事項を記載してください。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div class="prose prose-sm max-w-none">
                  <p class="text-sm text-muted-foreground">
                    {{ caseData.description || '詳細な説明はまだ追加されていません。' }}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <!-- Timeline Tab -->
          <TabsContent value="timeline" class="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle class="text-lg">案件の経緯</CardTitle>
                <CardDescription>
                  案件に関する重要なイベントや変更履歴を時系列で表示します。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div class="timeline-placeholder text-center py-8">
                  <Icon name="lucide:clock" class="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p class="text-muted-foreground">タイムライン機能は開発中です</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <!-- Documents Tab -->
          <TabsContent value="documents" class="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle class="text-lg">関連書類</CardTitle>
                <CardDescription>
                  この案件に関連する書類やファイルを管理します。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div class="documents-placeholder text-center py-8">
                  <Icon name="lucide:file-text" class="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p class="text-muted-foreground">書類管理機能は開発中です</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <!-- Communications Tab -->
          <TabsContent value="communications" class="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle class="text-lg">連絡履歴</CardTitle>
                <CardDescription>
                  依頼者や関係者との連絡記録を管理します。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div class="communications-placeholder text-center py-8">
                  <Icon name="lucide:message-circle" class="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p class="text-muted-foreground">連絡履歴機能は開発中です</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <!-- Billing Tab -->
          <TabsContent value="billing" class="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle class="text-lg">請求・時間管理</CardTitle>
                <CardDescription>
                  この案件の請求情報や作業時間を管理します。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div class="billing-placeholder text-center py-8">
                  <Icon name="lucide:calculator" class="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p class="text-muted-foreground">請求管理機能は開発中です</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <DialogFooter class="mt-6">
        <Button variant="outline" @click="handleClose">
          閉じる
        </Button>
        <Button class="ml-2" @click="handleEdit">
          <Icon name="lucide:edit-3" class="h-4 w-4 mr-2" />
          編集
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Case, CaseStatus } from '~/types/case'

interface Props {
  caseData: Case
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'updated', caseData: Case): void
  (e: 'statusChanged', caseId: string, newStatus: CaseStatus): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Computed properties
const isDueSoon = computed(() => {
  if (!props.caseData.dueDate) return false
  const daysUntilDue = differenceInDays(parseISO(props.caseData.dueDate), new Date())
  return daysUntilDue >= 0 && daysUntilDue <= 7
})

const statusLabels = {
  new: '新規',
  accepted: '受任',
  investigation: '調査',
  preparation: '準備',
  negotiation: '交渉',
  trial: '裁判',
  completed: '完了'
}

// Methods
const formatDate = (dateString: string): string => {
  if (!dateString) return '未設定'
  return format(parseISO(dateString), 'yyyy年M月d日', { locale: ja })
}

const getStatusLabel = (status: CaseStatus): string => {
  return statusLabels[status] || status
}

const getStatusVariant = (status: CaseStatus) => {
  const variants = {
    new: 'secondary',
    accepted: 'default',
    investigation: 'secondary',
    preparation: 'secondary',
    negotiation: 'secondary',
    trial: 'destructive',
    completed: 'outline'
  }
  return variants[status] || 'default'
}

const handleClose = () => {
  emit('close')
}

const handleEdit = () => {
  // Navigate to edit page or open edit modal
  navigateTo(`/cases/${props.caseData.id}/edit`)
}

const handleStatusChange = () => {
  // Open status change dialog
  console.log('Status change for case:', props.caseData.id)
}
</script>

<style scoped>
.case-detail-content {
  min-height: 400px;
}

.info-row {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgb(229 231 235); /* border color fallback */
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.timeline-placeholder,
.documents-placeholder,
.communications-placeholder,
.billing-placeholder {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.prose p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .grid-cols-2 {
    grid-template-columns: 1fr;
  }
  
  .case-detail-content {
    min-height: 300px;
  }
}
</style>