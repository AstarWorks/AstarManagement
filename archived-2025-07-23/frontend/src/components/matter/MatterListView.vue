<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { Matter, MatterStatus, MatterPriority } from '~/types/matter'
import type { DataTableColumn } from './DataTable.vue'
import type { SortDirection, TableQueryParams } from '~/types/table'
import { useMattersQuery } from '~/composables/useMattersQuery'
import DataTable from './DataTable.vue'
import DataTableSkeleton from './DataTableSkeleton.vue'
import DataTableError from './DataTableError.vue'

interface Props {
  status?: MatterStatus | 'all'
  search?: string
  assigneeId?: string
  clientId?: string
}

const props = withDefaults(defineProps<Props>(), {
  status: 'all'
})

// Pagination and sorting state
const page = ref(1)
const pageSize = ref(30)
const sortBy = ref<string>('createdAt')
const sortDirection = ref<SortDirection>('desc')

// Build query parameters
const queryParams = computed(() => {
  const params: TableQueryParams & { status?: MatterStatus | 'all' } = {
    page: page.value,
    pageSize: pageSize.value,
    sortBy: sortBy.value,
    sortDirection: sortDirection.value,
    search: props.search
  }
  
  if (props.status && props.status !== 'all') {
    params.status = props.status
  }
  
  return params
})

// Fetch matters using TanStack Query
const { data, isPending, error, refetch } = useMattersQuery(queryParams)

// Column definitions
const columns: DataTableColumn<Matter>[] = [
  {
    key: 'caseNumber',
    header: 'Case #',
    sortable: true,
    width: '120px'
  },
  {
    key: 'title',
    header: 'Title',
    sortable: true,
    formatter: (value: unknown) => {
      const str = String(value || '')
      // Truncate long titles
      return str.length > 50 ? `${str.substring(0, 50)}...` : str
    }
  },
  {
    key: 'clientName',
    header: 'Client',
    sortable: true,
    width: '200px'
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    width: '120px',
    formatter: (value: unknown) => {
      // Format status for display
      const statusMap: Record<MatterStatus, string> = {
        'INTAKE': 'Intake',
        'INITIAL_REVIEW': 'Initial Review',
        'IN_PROGRESS': 'In Progress',
        'REVIEW': 'Review',
        'WAITING_CLIENT': 'Waiting Client',
        'READY_FILING': 'Ready Filing',
        'CLOSED': 'Closed'
      }
      return statusMap[value as MatterStatus] || String(value)
    }
  },
  {
    key: 'priority',
    header: 'Priority',
    sortable: true,
    width: '100px',
    formatter: (value: unknown) => {
      const priorityMap: Record<MatterPriority, string> = {
        'LOW': 'Low',
        'MEDIUM': 'Medium',
        'HIGH': 'High',
        'URGENT': 'Urgent'
      }
      return priorityMap[value as MatterPriority] || String(value)
    }
  },
  {
    key: 'assignedLawyer',
    header: 'Assigned To',
    sortable: true,
    width: '150px',
    formatter: (value: unknown) => String(value || 'Unassigned')
  },
  {
    key: 'dueDate',
    header: 'Due Date',
    sortable: true,
    width: '120px',
    formatter: (value: unknown) => {
      if (!value) return '-'
      const date = new Date(value as string)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  },
  {
    key: 'createdAt',
    header: 'Created',
    sortable: true,
    width: '120px',
    formatter: (value: unknown) => {
      const date = new Date(value as string)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }
]

// Handle sort change
const handleSort = (column: string, direction: SortDirection) => {
  sortBy.value = column
  sortDirection.value = direction
  page.value = 1 // Reset to first page when sorting changes
}

// Handle page change
const handlePageChange = (newPage: number) => {
  page.value = newPage
}

// Handle page size change
const handlePageSizeChange = (newSize: number) => {
  pageSize.value = newSize
  page.value = 1 // Reset to first page when page size changes
}

// Reset page when filters change
watch(() => [props.status, props.search, props.assigneeId, props.clientId], () => {
  page.value = 1
})

// Mobile responsive columns
const mobileColumns = computed(() => {
  // Show fewer columns on mobile
  return columns.filter(col => 
    ['caseNumber', 'title', 'status', 'assignedLawyer'].includes(String(col.key))
  )
})

// Check if mobile
const isMobile = ref(false)
onMounted(() => {
  isMobile.value = window.innerWidth < 768
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
  })
})

const displayColumns = computed(() => isMobile.value ? mobileColumns.value : columns)
</script>

<template>
  <div class="matter-list-view">
    <!-- Loading skeleton -->
    <DataTableSkeleton 
      v-if="isPending && !data"
      :columns="displayColumns.length"
      :rows="pageSize"
      :show-pagination="true"
    />

    <!-- Error state -->
    <DataTableError
      v-else-if="error"
      :error="error as Error"
      @retry="refetch"
    />

    <!-- Data table -->
    <DataTable
      v-else
      :columns="displayColumns"
      :data="data?.data || []"
      :loading="isPending"
      :error="error"
      :page="page"
      :page-size="pageSize"
      :total="data?.total || 0"
      :show-pagination="true"
      :empty-message="search ? 'No matters found matching your search' : 'No matters found'"
      @sort="handleSort"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    />
  </div>
</template>

<style scoped>
.matter-list-view {
  @apply w-full;
}

/* Additional responsive styles */
@media (max-width: 768px) {
  .matter-list-view {
    @apply -mx-4;
  }
  
  .matter-list-view > * {
    @apply mx-4;
  }
}
</style>