<template>
  <Dialog :open="true" @update:open="handleClose">
    <DialogContent class="matter-selector-modal max-w-4xl max-h-[80vh] overflow-hidden">
      <DialogHeader>
        <DialogTitle>Select Matter</DialogTitle>
        <DialogDescription>
          Choose a matter to generate your document for. You can search or filter by status, assignee, or client.
        </DialogDescription>
      </DialogHeader>
      
      <div class="modal-content">
        <div class="flex flex-col h-full">
          <!-- Search and Filters -->
          <div class="search-section">
            <div class="flex flex-col gap-4 mb-4">
              <!-- Search Box -->
              <div class="search-box">
                <Search class="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  v-model="searchQuery"
                  placeholder="Search matters by title, client, or case number..."
                  class="pl-9"
                />
              </div>
              
              <!-- Filter Row -->
              <div class="flex items-center gap-4">
                <!-- Status Filter -->
                <Select v-model="statusFilter">
                  <SelectTrigger class="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem 
                      v-for="status in statuses"
                      :key="status.id"
                      :value="status.id"
                    >
                      {{ status.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <!-- Assignee Filter -->
                <Select v-model="assigneeFilter">
                  <SelectTrigger class="w-40">
                    <SelectValue placeholder="All Assignees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    <SelectItem 
                      v-for="assignee in assignees"
                      :key="assignee.id"
                      :value="assignee.id"
                    >
                      {{ assignee.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <!-- Sort Options -->
                <Select v-model="sortBy">
                  <SelectTrigger class="w-48">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated">Recently Updated</SelectItem>
                    <SelectItem value="created">Recently Created</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                  </SelectContent>
                </Select>
                
                <!-- Clear Filters -->
                <Button
                  v-if="hasFilters"
                  @click="clearFilters"
                  variant="outline"
                  size="sm"
                >
                  <X class="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </div>

          <!-- Matter Grid -->
          <div class="matter-grid flex-1 overflow-auto">
            <div v-if="filteredMatters.length === 0" class="empty-state">
              <div class="text-center py-12">
                <Briefcase class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 class="text-lg font-medium mb-2">No matters found</h3>
                <p class="text-muted-foreground">
                  {{ searchQuery || hasFilters 
                    ? 'Try adjusting your search or filters' 
                    : 'No matters available for document generation' }}
                </p>
              </div>
            </div>
            
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="matter in paginatedMatters"
                :key="matter.id"
                class="matter-card"
                @click="selectMatter(matter)"
              >
                <Card class="matter-card-content cursor-pointer hover:shadow-md transition-all duration-200">
                  <CardContent class="p-4">
                    <div class="matter-header">
                      <div class="flex items-start gap-3 mb-3">
                        <div class="matter-icon">
                          <Briefcase class="h-8 w-8 text-blue-500" />
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="font-medium text-sm truncate mb-1">{{ matter.title }}</h4>
                          <div class="text-xs text-muted-foreground">
                            {{ matter.caseNumber }}
                          </div>
                        </div>
                        <Badge :variant="getStatusVariant(matter.status)">
                          {{ matter.status }}
                        </Badge>
                      </div>
                    </div>
                    
                    <div class="matter-details">
                      <!-- Client Information -->
                      <div class="client-info mb-3">
                        <div class="flex items-center gap-2 mb-1">
                          <User class="h-3 w-3 text-muted-foreground" />
                          <span class="text-sm font-medium">{{ matter.client.name }}</span>
                        </div>
                        <div class="text-xs text-muted-foreground">
                          {{ matter.client.email }}
                        </div>
                      </div>
                      
                      <!-- Matter Type & Priority -->
                      <div class="matter-meta mb-3">
                        <div class="flex items-center justify-between text-xs text-muted-foreground">
                          <div class="flex items-center gap-1">
                            <Scale class="h-3 w-3" />
                            {{ matter.type }}
                          </div>
                          <div class="flex items-center gap-1">
                            <Flag class="h-3 w-3" />
                            {{ matter.priority }}
                          </div>
                        </div>
                      </div>
                      
                      <!-- Assignee -->
                      <div class="assignee-info mb-3">
                        <div class="flex items-center gap-2">
                          <UserCheck class="h-3 w-3 text-muted-foreground" />
                          <span class="text-xs">{{ matter.assignee?.name || 'Unassigned' }}</span>
                        </div>
                      </div>
                      
                      <!-- Dates -->
                      <div class="matter-dates">
                        <div class="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>
                            <div class="font-medium">Created</div>
                            <div>{{ formatRelativeTime(matter.createdAt) }}</div>
                          </div>
                          <div>
                            <div class="font-medium">Updated</div>
                            <div>{{ formatRelativeTime(matter.updatedAt) }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Document Count -->
                    <div class="matter-stats mt-3 pt-3 border-t border-muted/50">
                      <div class="flex items-center justify-between text-xs text-muted-foreground">
                        <div class="flex items-center gap-1">
                          <FileText class="h-3 w-3" />
                          {{ matter.documentCount || 0 }} documents
                        </div>
                        <div class="flex items-center gap-1">
                          <Clock class="h-3 w-3" />
                          {{ matter.hoursLogged || 0 }}h logged
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination-section mt-4">
            <div class="flex items-center justify-between">
              <div class="text-sm text-muted-foreground">
                Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to 
                {{ Math.min(currentPage * itemsPerPage, filteredMatters.length) }} of 
                {{ filteredMatters.length }} matters
              </div>
              
              <div class="flex items-center gap-2">
                <Button
                  @click="currentPage--"
                  :disabled="currentPage === 1"
                  size="sm"
                  variant="outline"
                >
                  <ChevronLeft class="h-4 w-4" />
                </Button>
                
                <div class="flex items-center gap-1">
                  <Button
                    v-for="page in visiblePages"
                    :key="page"
                    @click="currentPage = page"
                    :variant="page === currentPage ? 'default' : 'outline'"
                    size="sm"
                    class="w-10"
                  >
                    {{ page }}
                  </Button>
                </div>
                
                <Button
                  @click="currentPage++"
                  :disabled="currentPage === totalPages"
                  size="sm"
                  variant="outline"
                >
                  <ChevronRight class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <div class="flex items-center justify-between w-full">
          <div class="matter-count text-sm text-muted-foreground">
            {{ filteredMatters.length }} matters available
          </div>
          <div class="modal-actions">
            <Button @click="handleClose" variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  Search, 
  Briefcase, 
  User, 
  UserCheck,
  Scale, 
  Flag, 
  FileText, 
  Clock,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

// Utils
import { formatRelativeTime } from '~/utils/formatters'

// Types
interface Matter {
  id: string
  title: string
  caseNumber: string
  status: string
  priority: string
  type: string
  client: {
    id: string
    name: string
    email: string
  }
  assignee?: {
    id: string
    name: string
  }
  createdAt: Date
  updatedAt: Date
  documentCount?: number
  hoursLogged?: number
}

interface Status {
  id: string
  name: string
}

interface Assignee {
  id: string
  name: string
}

// Emits
const emit = defineEmits<{
  select: [matter: Matter]
  close: []
}>()

// State
const searchQuery = ref('')
const statusFilter = ref('all')
const assigneeFilter = ref('all')
const sortBy = ref('updated')
const currentPage = ref(1)
const itemsPerPage = 12

// Mock Data
const matters = ref<Matter[]>([
  {
    id: 'matter-1',
    title: 'Estate Planning for Johnson Family',
    caseNumber: 'EP-2024-001',
    status: 'active',
    priority: 'high',
    type: 'Estate Planning',
    client: {
      id: 'client-1',
      name: 'Robert Johnson',
      email: 'robert.johnson@email.com'
    },
    assignee: {
      id: 'lawyer-1',
      name: 'Sarah Wilson'
    },
    createdAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
    updatedAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
    documentCount: 12,
    hoursLogged: 45
  },
  {
    id: 'matter-2',
    title: 'Corporate Contract Amendment - TechCorp',
    caseNumber: 'CC-2024-0089',
    status: 'review',
    priority: 'medium',
    type: 'Corporate Law',
    client: {
      id: 'client-2',
      name: 'TechCorp Industries',
      email: 'legal@techcorp.com'
    },
    assignee: {
      id: 'lawyer-2',
      name: 'Michael Chen'
    },
    createdAt: new Date(Date.now() - 86400000 * 12), // 12 days ago
    updatedAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
    documentCount: 8,
    hoursLogged: 32
  },
  {
    id: 'matter-3',
    title: 'Employment Dispute Resolution',
    caseNumber: 'ED-2024-0156',
    status: 'pending',
    priority: 'urgent',
    type: 'Employment Law',
    client: {
      id: 'client-3',
      name: 'Global Solutions Ltd',
      email: 'hr@globalsolutions.com'
    },
    assignee: {
      id: 'lawyer-3',
      name: 'Emily Rodriguez'
    },
    createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    updatedAt: new Date(Date.now() - 3600000 * 6), // 6 hours ago
    documentCount: 15,
    hoursLogged: 28
  },
  {
    id: 'matter-4',
    title: 'Real Estate Transaction - Maple Street',
    caseNumber: 'RE-2024-0203',
    status: 'completed',
    priority: 'low',
    type: 'Real Estate',
    client: {
      id: 'client-4',
      name: 'Jennifer Smith',
      email: 'jennifer.smith@email.com'
    },
    assignee: {
      id: 'lawyer-1',
      name: 'Sarah Wilson'
    },
    createdAt: new Date(Date.now() - 86400000 * 30), // 30 days ago
    updatedAt: new Date(Date.now() - 86400000 * 7), // 7 days ago
    documentCount: 22,
    hoursLogged: 18
  },
  {
    id: 'matter-5',
    title: 'IP Protection and Trademark Filing',
    caseNumber: 'IP-2024-0087',
    status: 'active',
    priority: 'medium',
    type: 'Intellectual Property',
    client: {
      id: 'client-5',
      name: 'Innovation Labs',
      email: 'legal@innovationlabs.com'
    },
    assignee: {
      id: 'lawyer-2',
      name: 'Michael Chen'
    },
    createdAt: new Date(Date.now() - 86400000 * 8), // 8 days ago
    updatedAt: new Date(Date.now() - 3600000 * 4), // 4 hours ago
    documentCount: 6,
    hoursLogged: 22
  },
  {
    id: 'matter-6',
    title: 'Family Law - Custody Agreement',
    caseNumber: 'FL-2024-0134',
    status: 'active',
    priority: 'high',
    type: 'Family Law',
    client: {
      id: 'client-6',
      name: 'David Martinez',
      email: 'david.martinez@email.com'
    },
    assignee: {
      id: 'lawyer-3',
      name: 'Emily Rodriguez'
    },
    createdAt: new Date(Date.now() - 86400000 * 15), // 15 days ago
    updatedAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    documentCount: 18,
    hoursLogged: 56
  }
])

const statuses = ref<Status[]>([
  { id: 'active', name: 'Active' },
  { id: 'pending', name: 'Pending' },
  { id: 'review', name: 'Under Review' },
  { id: 'completed', name: 'Completed' },
  { id: 'on-hold', name: 'On Hold' }
])

const assignees = ref<Assignee[]>([
  { id: 'lawyer-1', name: 'Sarah Wilson' },
  { id: 'lawyer-2', name: 'Michael Chen' },
  { id: 'lawyer-3', name: 'Emily Rodriguez' }
])

// Computed
const hasFilters = computed(() => 
  searchQuery.value || 
  statusFilter.value !== 'all' || 
  assigneeFilter.value !== 'all'
)

const filteredMatters = computed(() => {
  let filtered = [...matters.value]
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(matter =>
      matter.title.toLowerCase().includes(query) ||
      matter.caseNumber.toLowerCase().includes(query) ||
      matter.client.name.toLowerCase().includes(query) ||
      matter.type.toLowerCase().includes(query)
    )
  }
  
  // Status filter
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(matter => matter.status === statusFilter.value)
  }
  
  // Assignee filter
  if (assigneeFilter.value !== 'all') {
    filtered = filtered.filter(matter => matter.assignee?.id === assigneeFilter.value)
  }
  
  // Sort
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'title':
        return a.title.localeCompare(b.title)
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
               (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
      default:
        return 0
    }
  })
  
  return filtered
})

const paginatedMatters = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredMatters.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredMatters.value.length / itemsPerPage))

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default'
    case 'pending': return 'secondary'
    case 'review': return 'outline'
    case 'completed': return 'default' // success variant doesn't exist
    case 'on-hold': return 'destructive'
    default: return 'outline'
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  assigneeFilter.value = 'all'
  currentPage.value = 1
}

const selectMatter = (matter: Matter) => {
  emit('select', matter)
}

const handleClose = () => {
  emit('close')
}

// Watchers
watch([searchQuery, statusFilter, assigneeFilter, sortBy], () => {
  currentPage.value = 1
})
</script>

<style scoped>
.matter-selector-modal {
  @apply w-full h-full;
}

.modal-content {
  @apply flex-1 overflow-hidden;
}

.search-section {
  @apply flex-shrink-0;
}

.search-box {
  @apply relative;
}

.matter-grid {
  @apply min-h-0;
}

.empty-state {
  @apply border-2 border-dashed border-muted-foreground/25 rounded-lg;
}

.matter-card {
  @apply transition-all duration-200;
}

.matter-card:hover .matter-card-content {
  @apply shadow-lg border-primary/20;
}

.matter-card-content {
  @apply h-full transition-all duration-200;
}

.matter-header {
  @apply border-b border-muted/50 pb-3;
}

.matter-icon {
  @apply flex-shrink-0;
}

.matter-details {
  @apply space-y-2;
}

.client-info {
  @apply space-y-1;
}

.matter-meta {
  @apply border-y border-muted/50 py-2;
}

.assignee-info {
  @apply space-y-1;
}

.matter-dates {
  @apply space-y-1;
}

.matter-stats {
  @apply border-t border-muted/50 pt-2;
}

.pagination-section {
  @apply flex-shrink-0 border-t pt-4;
}

.matter-count {
  @apply flex-shrink-0;
}

.modal-actions {
  @apply flex items-center gap-2;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .search-section .flex {
    @apply flex-col gap-2;
  }
  
  .matter-grid .grid {
    @apply grid-cols-1;
  }
  
  .pagination-section .flex {
    @apply flex-col gap-2;
  }
  
  .modal-actions {
    @apply w-full justify-end;
  }
}

/* Scrollbar styling */
.matter-grid::-webkit-scrollbar {
  @apply w-2;
}

.matter-grid::-webkit-scrollbar-track {
  @apply bg-muted/30;
}

.matter-grid::-webkit-scrollbar-thumb {
  @apply bg-muted-foreground/30 rounded;
}

.matter-grid::-webkit-scrollbar-thumb:hover {
  @apply bg-muted-foreground/50;
}
</style>