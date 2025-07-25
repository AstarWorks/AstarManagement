<template>
  <div class="kanban-page min-h-screen p-4 bg-background">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-foreground">案件管理カンバンボード</h1>
        <p class="text-muted-foreground mt-1">案件の進捗状況を可視化し、効率的な案件管理を実現</p>
      </div>
      <div class="flex items-center space-x-3">
        <Button variant="outline" @click="toggleFilters">
          <Icon name="lucide:filter" class="w-4 h-4 mr-2" />
          フィルター
        </Button>
        <Button @click="createNewCase">
          <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
          新規案件
        </Button>
      </div>
    </div>

    <!-- Filters Panel -->
    <KanbanFilters 
      v-if="showFilters"
      v-model:filters="filters"
      class="mb-6"
      @apply="applyFilters"
      @reset="resetFilters"
    />

    <!-- Kanban Board -->
    <div class="kanban-board">
      <div class="kanban-container overflow-x-auto">
        <div class="kanban-columns flex gap-4 min-w-max pb-4">
          <KanbanColumn
            v-for="status in statusColumns"
            :key="status.key"
            :status="status"
            :cases="getCasesByStatus(status.key)"
            :is-loading="isLoading"
            @case-moved="handleCaseMove"
            @case-clicked="handleCaseClick"
          />
        </div>
      </div>
    </div>

    <!-- Case Detail Modal -->
    <CaseDetailModal
      v-if="selectedCase"
      :case-data="selectedCase"
      :is-open="showCaseModal"
      @close="closeCaseModal"
      @updated="handleCaseUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Case, CaseStatus, CaseFilters } from '~/types/case'

// Page metadata
definePageMeta({
  requiresAuth: true,
  layout: 'default',
  title: '案件管理カンバンボード'
})

// Reactive state
const isLoading = ref(false)
const showFilters = ref(false)
const showCaseModal = ref(false)
const selectedCase = ref<Case | null>(null)
const filters = ref<CaseFilters>({
  search: '',
  clientType: 'all',
  priority: 'all',
  assignedLawyer: 'all',
  tags: [],
  dateRange: null
})

// Mock cases data - In real implementation, this would come from a store/API
const cases = ref<Case[]>([
  {
    id: '1',
    caseNumber: 'CASE-2024-001',
    title: '不動産売買契約トラブル',
    client: {
      id: '1',
      name: '田中太郎',
      type: 'individual'
    },
    status: 'new',
    priority: 'high',
    assignedLawyer: '佐藤弁護士',
    dueDate: '2024-08-15',
    tags: ['不動産', '契約'],
    createdAt: '2024-07-01',
    updatedAt: '2024-07-24'
  },
  {
    id: '2',
    caseNumber: 'CASE-2024-002',
    title: '企業買収案件',
    client: {
      id: '2', 
      name: 'ABC株式会社',
      type: 'corporate'
    },
    status: 'accepted',
    priority: 'medium',
    assignedLawyer: '山田弁護士',
    dueDate: '2024-09-30',
    tags: ['M&A', '企業法務'],
    createdAt: '2024-07-05',
    updatedAt: '2024-07-20'
  },
  {
    id: '3',
    caseNumber: 'CASE-2024-003',
    title: '労働争議調停',
    client: {
      id: '3',
      name: '鈴木花子',
      type: 'individual'
    },
    status: 'investigation',
    priority: 'high',
    assignedLawyer: '佐藤弁護士',
    dueDate: '2024-08-01',
    tags: ['労働法', '調停'],
    createdAt: '2024-06-15',
    updatedAt: '2024-07-22'
  }
])

// Status columns configuration
const statusColumns = [
  {
    key: 'new',
    title: '新規',
    description: '案件受付',
    color: 'bg-blue-100 border-blue-300',
    headerColor: 'bg-blue-50'
  },
  {
    key: 'accepted',
    title: '受任',
    description: '正式受任',
    color: 'bg-green-100 border-green-300',
    headerColor: 'bg-green-50'
  },
  {
    key: 'investigation',
    title: '調査',
    description: '証拠収集',
    color: 'bg-yellow-100 border-yellow-300',
    headerColor: 'bg-yellow-50'
  },
  {
    key: 'preparation',
    title: '準備',
    description: '案件準備',
    color: 'bg-purple-100 border-purple-300',
    headerColor: 'bg-purple-50'
  },
  {
    key: 'negotiation',
    title: '交渉',
    description: '和解交渉',
    color: 'bg-orange-100 border-orange-300',
    headerColor: 'bg-orange-50'
  },
  {
    key: 'trial',
    title: '裁判',
    description: '法廷手続',
    color: 'bg-red-100 border-red-300',
    headerColor: 'bg-red-50'
  },
  {
    key: 'completed',
    title: '完了',
    description: '案件終了',
    color: 'bg-gray-100 border-gray-300',
    headerColor: 'bg-gray-50'
  }
] as const

// Computed properties
const filteredCases = computed(() => {
  let result = cases.value

  // Apply search filter
  if (filters.value.search) {
    const searchTerm = filters.value.search.toLowerCase()
    result = result.filter(case_ =>
      case_.title.toLowerCase().includes(searchTerm) ||
      case_.caseNumber.toLowerCase().includes(searchTerm) ||
      case_.client.name.toLowerCase().includes(searchTerm)
    )
  }

  // Apply client type filter
  if (filters.value.clientType !== 'all') {
    result = result.filter(case_ => case_.client.type === filters.value.clientType)
  }

  // Apply priority filter
  if (filters.value.priority !== 'all') {
    result = result.filter(case_ => case_.priority === filters.value.priority)
  }

  // Apply assigned lawyer filter
  if (filters.value.assignedLawyer !== 'all') {
    result = result.filter(case_ => case_.assignedLawyer === filters.value.assignedLawyer)
  }

  // Apply tag filter
  if (filters.value.tags.length > 0) {
    result = result.filter(case_ =>
      filters.value.tags.some(tag => case_.tags.includes(tag))
    )
  }

  return result
})

// Methods
const getCasesByStatus = (status: CaseStatus) => {
  return filteredCases.value.filter(case_ => case_.status === status)
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const applyFilters = (newFilters: CaseFilters) => {
  filters.value = { ...newFilters }
}

const resetFilters = () => {
  filters.value = {
    search: '',
    clientType: 'all',
    priority: 'all',
    assignedLawyer: 'all',
    tags: [],
    dateRange: null
  }
}

const handleCaseMove = async (caseId: string, newStatus: CaseStatus, oldStatus: CaseStatus) => {
  // Don't move if dropping in the same column
  if (oldStatus === newStatus) return
  
  console.log(`Moving case ${caseId} from ${oldStatus} to ${newStatus}`)
  
  try {
    // Optimistic update
    const caseIndex = cases.value.findIndex(c => c.id === caseId)
    if (caseIndex !== -1) {
      const originalCase = { ...cases.value[caseIndex] }
      
      // Update case status and timestamp
      cases.value[caseIndex].status = newStatus
      cases.value[caseIndex].updatedAt = new Date().toISOString().split('T')[0]
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log(`案件 ${caseId} を ${oldStatus} から ${newStatus} に移動しました`)
      
      // In real implementation, this would trigger notifications, audit logs, etc.
      // await $fetch(`/api/cases/${caseId}/status`, {
      //   method: 'PATCH',
      //   body: { status: newStatus, reason: 'Kanban drag and drop' }
      // })
      
    }
  } catch (error) {
    // Rollback on failure
    const caseIndex = cases.value.findIndex(c => c.id === caseId)
    if (caseIndex !== -1) {
      cases.value[caseIndex].status = oldStatus
    }
    console.error('案件の移動に失敗しました:', error)
    
    // Show error notification
    // useToast().error('案件の移動に失敗しました。もう一度お試しください。')
  }
}

const handleCaseClick = (case_: Case) => {
  selectedCase.value = case_
  showCaseModal.value = true
}

const closeCaseModal = () => {
  showCaseModal.value = false
  selectedCase.value = null
}

const handleCaseUpdate = (updatedCase: Case) => {
  const index = cases.value.findIndex(c => c.id === updatedCase.id)
  if (index !== -1) {
    cases.value[index] = updatedCase
  }
}

const createNewCase = () => {
  // Navigate to case creation page
  navigateTo('/cases/create')
}

// Lifecycle
onMounted(() => {
  // In real implementation, load cases from API
  console.log('カンバンボードが読み込まれました')
})
</script>

<style scoped>
.kanban-page {
  max-width: 100vw;
}

.kanban-container {
  max-height: calc(100vh - 200px);
}

.kanban-columns {
  min-width: 1600px; /* 7 columns × ~230px each */
}

@media (max-width: 768px) {
  .kanban-columns {
    min-width: 100%;
    flex-direction: column;
    gap: 1rem;
  }
}
</style>