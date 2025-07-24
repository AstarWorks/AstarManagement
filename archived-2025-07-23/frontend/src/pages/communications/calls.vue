<template>
  <CommunicationLayout>
    <template #header-actions>
      <Button @click="showNewCall = true">
        <Plus class="size-4 mr-2" />
        Log Call
      </Button>
    </template>
    
    <div class="calls-page">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-content">
            <Phone class="stat-icon" />
            <div class="stat-details">
              <span class="stat-number">{{ totalCalls }}</span>
              <span class="stat-label">Total Calls</span>
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-content">
            <Clock class="stat-icon" />
            <div class="stat-details">
              <span class="stat-number">{{ totalDuration }}</span>
              <span class="stat-label">Total Duration</span>
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-content">
            <Calendar class="stat-icon" />
            <div class="stat-details">
              <span class="stat-number">{{ todaysCalls }}</span>
              <span class="stat-label">Today</span>
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-content">
            <TrendingUp class="stat-icon" />
            <div class="stat-details">
              <span class="stat-number">{{ avgDuration }}</span>
              <span class="stat-label">Avg Duration</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="filters-section">
        <div class="search-filters">
          <div class="search-box">
            <Search class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search calls..."
              class="search-input"
            />
          </div>
          <Select v-model="typeFilter">
            <SelectTrigger class="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="incoming">Incoming</SelectItem>
              <SelectItem value="outgoing">Outgoing</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
            </SelectContent>
          </Select>
          <Select v-model="dateFilter">
            <SelectTrigger class="w-48">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <!-- Calls List -->
      <div class="calls-list">
        <div 
          v-for="call in filteredCalls"
          :key="call.id"
          class="call-item"
          @click="selectCall(call)"
        >
          <div class="call-icon-container">
            <div class="call-icon" :class="`call-icon--${call.type}`">
              <component :is="getCallIcon(call.type)" class="size-4" />
            </div>
          </div>
          
          <div class="call-content">
            <div class="call-header">
              <div class="call-main-info">
                <h3 class="call-contact">{{ call.contact }}</h3>
                <p class="call-purpose">{{ call.purpose }}</p>
              </div>
              <div class="call-meta">
                <Badge :variant="getTypeVariant(call.type)">
                  {{ call.type }}
                </Badge>
                <span class="call-date">{{ formatDate(call.createdAt) }}</span>
              </div>
            </div>
            
            <div class="call-details">
              <div class="call-info-items">
                <div class="call-info-item">
                  <Phone class="info-icon" />
                  <span class="info-text">{{ call.phoneNumber }}</span>
                </div>
                <div class="call-info-item">
                  <Clock class="info-icon" />
                  <span class="info-text">{{ formatDuration(call.duration) }}</span>
                </div>
                <div v-if="call.matterId" class="call-info-item">
                  <Briefcase class="info-icon" />
                  <span class="info-text">{{ call.matterTitle }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="call.notes" class="call-notes">
              <p class="notes-preview">{{ call.notes }}</p>
            </div>
            
            <div class="call-actions">
              <Button variant="ghost" size="sm">
                <Edit class="size-4 mr-2" />
                Edit
              </Button>
              <Button v-if="call.recordingUrl" variant="ghost" size="sm">
                <Play class="size-4 mr-2" />
                Play Recording
              </Button>
              <Button variant="ghost" size="sm">
                <PhoneCall class="size-4 mr-2" />
                Call Back
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="filteredCalls.length === 0" class="empty-state">
        <Phone class="empty-icon" />
        <h3 class="empty-title">No calls found</h3>
        <p class="empty-description">
          {{ searchQuery ? 'Try adjusting your search terms' : 'Log your first phone call to get started' }}
        </p>
        <Button @click="showNewCall = true">
          <Plus class="size-4 mr-2" />
          Log Call
        </Button>
      </div>
    </div>
  </CommunicationLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Plus, 
  Search, 
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneCall,
  Clock,
  Calendar,
  TrendingUp,
  Briefcase,
  Edit,
  Play
} from 'lucide-vue-next'
import { CommunicationLayout } from '~/components/communication'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

// Define the page meta
definePageMeta({
  title: 'Phone Calls',
  description: 'Phone call logs and recordings'
})

// Reactive state
const showNewCall = ref(false)
const searchQuery = ref('')
const typeFilter = ref('all')
const dateFilter = ref('all')

// Mock calls data
const calls = ref([
  {
    id: 1,
    type: 'outgoing',
    contact: 'John Smith (Acme Corp)',
    phoneNumber: '+1 (555) 123-4567',
    purpose: 'Contract negotiation follow-up',
    duration: 1847, // seconds
    createdAt: new Date('2024-01-15T14:30:00'),
    notes: 'Discussed contract terms and timeline. Client agreed to 30-day payment terms. Follow up needed on intellectual property clauses.',
    matterId: 'MAT-2024-001',
    matterTitle: 'Acme Corp Service Agreement',
    recordingUrl: '/recordings/call-1.mp3'
  },
  {
    id: 2,
    type: 'incoming',
    contact: 'Sarah Johnson (Tech Startup)',
    phoneNumber: '+1 (555) 987-6543',
    purpose: 'Emergency legal consultation',
    duration: 912,
    createdAt: new Date('2024-01-15T11:15:00'),
    notes: 'Urgent matter regarding employment dispute. Scheduled in-person meeting for tomorrow.',
    matterId: 'MAT-2024-002',
    matterTitle: 'Employment Dispute Consultation',
    recordingUrl: null
  },
  {
    id: 3,
    type: 'missed',
    contact: 'Michael Brown (Manufacturing)',
    phoneNumber: '+1 (555) 456-7890',
    purpose: 'Settlement discussion',
    duration: 0,
    createdAt: new Date('2024-01-15T09:30:00'),
    notes: null,
    matterId: 'MAT-2024-003',
    matterTitle: 'Manufacturing Liability Case',
    recordingUrl: null
  },
  {
    id: 4,
    type: 'outgoing',
    contact: 'Lisa Davis (Consultant)',
    phoneNumber: '+1 (555) 234-5678',
    purpose: 'Expert witness coordination',
    duration: 643,
    createdAt: new Date('2024-01-14T16:45:00'),
    notes: 'Confirmed availability for deposition. Discussed fee structure.',
    matterId: null,
    matterTitle: null,
    recordingUrl: '/recordings/call-4.mp3'
  }
])

// Computed properties
const filteredCalls = computed(() => {
  let filtered = calls.value
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(call => 
      call.contact.toLowerCase().includes(query) ||
      call.purpose.toLowerCase().includes(query) ||
      call.phoneNumber.includes(query) ||
      call.notes?.toLowerCase().includes(query)
    )
  }
  
  // Filter by type
  if (typeFilter.value !== 'all') {
    filtered = filtered.filter(call => call.type === typeFilter.value)
  }
  
  // Filter by date
  if (dateFilter.value !== 'all') {
    const now = new Date()
    const filterDate = new Date()
    
    switch (dateFilter.value) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0)
        filtered = filtered.filter(call => call.createdAt >= filterDate)
        break
      case 'week':
        filterDate.setDate(now.getDate() - 7)
        filtered = filtered.filter(call => call.createdAt >= filterDate)
        break
      case 'month':
        filterDate.setMonth(now.getMonth() - 1)
        filtered = filtered.filter(call => call.createdAt >= filterDate)
        break
    }
  }
  
  return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
})

const totalCalls = computed(() => calls.value.length)

const totalDuration = computed(() => {
  const totalSeconds = calls.value.reduce((sum, call) => sum + call.duration, 0)
  return formatDuration(totalSeconds)
})

const todaysCalls = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return calls.value.filter(call => call.createdAt >= today).length
})

const avgDuration = computed(() => {
  const callsWithDuration = calls.value.filter(call => call.duration > 0)
  if (callsWithDuration.length === 0) return '0m'
  
  const avgSeconds = callsWithDuration.reduce((sum, call) => sum + call.duration, 0) / callsWithDuration.length
  return formatDuration(avgSeconds)
})

// Methods
const selectCall = (call: any) => {
  console.log('Selected call:', call.id)
  // Navigate to call detail page or open modal
  navigateTo(`/communications/calls/${call.id}`)
}

const getCallIcon = (type: string) => {
  const icons = {
    incoming: PhoneIncoming,
    outgoing: PhoneOutgoing,
    missed: PhoneMissed
  }
  return icons[type as keyof typeof icons] || Phone
}

const getTypeVariant = (type: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
  const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
    incoming: 'default',
    outgoing: 'secondary',
    missed: 'destructive'
  }
  return variants[type] || 'default'
}

const formatDuration = (seconds: number) => {
  if (seconds === 0) return '0m'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}

const formatDate = (date: Date) => {
  const now = new Date()
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffHours < 48) return 'Yesterday'
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}
</script>

<style scoped>
.calls-page {
  @apply space-y-6;
}

.stats-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4;
}

.stat-card {
  @apply bg-card border border-border rounded-lg p-4;
}

.stat-content {
  @apply flex items-center gap-3;
}

.stat-icon {
  @apply size-8 text-primary flex-shrink-0;
}

.stat-details {
  @apply flex flex-col;
}

.stat-number {
  @apply text-2xl font-bold text-foreground;
}

.stat-label {
  @apply text-sm text-muted-foreground;
}

.filters-section {
  @apply space-y-4;
}

.search-filters {
  @apply flex flex-col sm:flex-row gap-4;
}

.search-box {
  @apply relative flex-1;
}

.search-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground;
}

.search-input {
  @apply w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md;
  @apply bg-background text-foreground placeholder:text-muted-foreground;
  @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
}

.calls-list {
  @apply space-y-4;
}

.call-item {
  @apply bg-card border border-border rounded-lg p-4 cursor-pointer transition-all;
  @apply hover:shadow-md hover:border-primary/50;
}

.call-item {
  @apply flex gap-4;
}

.call-icon-container {
  @apply flex-shrink-0;
}

.call-icon {
  @apply size-10 rounded-full flex items-center justify-center;
}

.call-icon--incoming {
  @apply bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400;
}

.call-icon--outgoing {
  @apply bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400;
}

.call-icon--missed {
  @apply bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400;
}

.call-content {
  @apply flex-1 space-y-3;
}

.call-header {
  @apply flex justify-between items-start;
}

.call-main-info {
  @apply flex-1;
}

.call-contact {
  @apply font-medium text-foreground text-base;
}

.call-purpose {
  @apply text-sm text-muted-foreground mt-1;
}

.call-meta {
  @apply flex flex-col items-end gap-2;
}

.call-date {
  @apply text-xs text-muted-foreground;
}

.call-details {
  @apply space-y-2;
}

.call-info-items {
  @apply flex flex-wrap gap-4;
}

.call-info-item {
  @apply flex items-center gap-2 text-sm text-muted-foreground;
}

.info-icon {
  @apply size-4 flex-shrink-0;
}

.call-notes {
  @apply bg-muted/50 rounded-md p-3;
}

.notes-preview {
  @apply text-sm text-foreground line-clamp-2;
}

.call-actions {
  @apply flex gap-2 pt-3 border-t border-border;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.empty-icon {
  @apply size-12 text-muted-foreground mb-4;
}

.empty-title {
  @apply text-lg font-medium text-foreground mb-2;
}

.empty-description {
  @apply text-muted-foreground mb-6 max-w-sm;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .call-item {
    @apply flex-col gap-3;
  }
  
  .call-icon-container {
    @apply self-start;
  }
  
  .call-header {
    @apply flex-col gap-3;
  }
  
  .call-meta {
    @apply flex-row items-center self-start;
  }
  
  .call-info-items {
    @apply flex-col gap-2;
  }
  
  .call-actions {
    @apply grid grid-cols-2 gap-2;
  }
}
</style>