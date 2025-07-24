import { computed, onMounted, onUnmounted, watch, unref, ref } from 'vue'
import type { MaybeRef } from '@vueuse/core'
import type { 
  Communication, 
  CommunicationFilters, 
  TimelineGroup, 
  PaginatedResponse 
} from '~/types/communication'

export function useCommunicationTimeline(
  filters: MaybeRef<CommunicationFilters> = {},
  options: { enabled?: MaybeRef<boolean> } = {}
) {
  // In a real implementation, this would use TanStack Query
  // For now, we'll simulate the behavior with reactive state
  
  const data = ref<PaginatedResponse<Communication>[]>([])
  const isLoading = ref(false)
  const isError = ref(false)
  const error = ref<Error | null>(null)
  const isFetchingNextPage = ref(false)
  const hasNextPage = ref(true)
  
  // Group communications by date
  const timelineGroups = computed((): TimelineGroup[] => {
    if (!data.value.length) return []
    
    const allItems = data.value.flatMap(page => page.data)
    return groupByDate(allItems)
  })
  
  // Simulate WebSocket connection status
  const isRealTimeConnected = ref(true)
  
  // Fetch initial data
  const fetchData = async () => {
    if (!unref(options.enabled ?? true)) return
    
    isLoading.value = true
    isError.value = false
    error.value = null
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockData = generateMockData(unref(filters))
      data.value = [mockData]
      hasNextPage.value = mockData.pagination.hasNext
    } catch (err) {
      isError.value = true
      error.value = err as Error
    } finally {
      isLoading.value = false
    }
  }
  
  const fetchNextPage = async () => {
    if (!hasNextPage.value || isFetchingNextPage.value) return
    
    isFetchingNextPage.value = true
    
    try {
      // Simulate API call for next page
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const nextPage = data.value.length + 1
      const mockData = generateMockData(unref(filters), nextPage)
      data.value.push(mockData)
      hasNextPage.value = mockData.pagination.hasNext
    } catch (err) {
      console.error('Failed to fetch next page:', err)
    } finally {
      isFetchingNextPage.value = false
    }
  }
  
  const refetch = async () => {
    data.value = []
    hasNextPage.value = true
    await fetchData()
  }
  
  // Watch filters for changes
  watch(
    () => unref(filters),
    () => {
      refetch()
    },
    { deep: true }
  )
  
  // Simulate real-time updates
  const handleRealtimeUpdate = (event: any) => {
    console.log('Received real-time update:', event)
    // In a real implementation, this would update the timeline data
  }
  
  onMounted(() => {
    fetchData()
    // Simulate WebSocket connection
    window.addEventListener('communication-update', handleRealtimeUpdate)
  })
  
  onUnmounted(() => {
    window.removeEventListener('communication-update', handleRealtimeUpdate)
  })
  
  return {
    data,
    timelineGroups,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    isRealTimeConnected,
    fetchNextPage,
    refetch
  }
}

// Helper function to group communications by date
function groupByDate(communications: Communication[]): TimelineGroup[] {
  const groups = new Map<string, Communication[]>()
  
  communications.forEach(comm => {
    const dateKey = new Date(comm.timestamp).toDateString()
    if (!groups.has(dateKey)) {
      groups.set(dateKey, [])
    }
    groups.get(dateKey)!.push(comm)
  })
  
  return Array.from(groups.entries())
    .map(([date, items]) => ({
      date,
      items: items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
      count: items.length
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// Generate mock data for timeline
function generateMockData(
  filters: CommunicationFilters, 
  page: number = 1
): PaginatedResponse<Communication> {
  const allMockCommunications: Communication[] = [
    {
      id: '1',
      type: 'memo',
      subject: 'Contract Review - Q1 2024',
      summary: 'Please review the attached contract terms for the Q1 2024 engagement',
      participants: [
        { id: '1', name: 'Alice Johnson', role: 'sender', email: 'alice@lawfirm.com' },
        { id: '2', name: 'John Smith', role: 'recipient', email: 'john@acme.com' }
      ],
      timestamp: new Date('2024-01-15T14:30:00'),
      relatedMatterId: 'MAT-2024-001',
      relatedMatterTitle: 'Acme Corp Service Agreement',
      isRead: false,
      isImportant: true,
      tags: ['contract', 'urgent']
    },
    {
      id: '2',
      type: 'email',
      subject: 'Settlement Proposal',
      summary: 'We have reviewed the settlement terms and have the following comments',
      participants: [
        { id: '3', name: 'Bob Chen', role: 'sender', email: 'bob@lawfirm.com' },
        { id: '4', name: 'Sarah Wilson', role: 'recipient', email: 'sarah@manufacturing.com' }
      ],
      timestamp: new Date('2024-01-15T11:15:00'),
      relatedMatterId: 'MAT-2024-002',
      relatedMatterTitle: 'Manufacturing Liability Case',
      isRead: true,
      attachments: [
        { id: '1', name: 'settlement-proposal.pdf', size: 245760, type: 'application/pdf', url: '/docs/settlement.pdf' }
      ]
    },
    {
      id: '3',
      type: 'phone',
      subject: 'Client consultation call',
      summary: 'Discussed case strategy and next steps',
      participants: [
        { id: '1', name: 'Alice Johnson', role: 'attendee', phone: '+1-555-0123' },
        { id: '5', name: 'Mike Davis', role: 'attendee', phone: '+1-555-0456' }
      ],
      timestamp: new Date('2024-01-15T09:00:00'),
      duration: 1800, // 30 minutes
      relatedMatterId: 'MAT-2024-003',
      relatedMatterTitle: 'Davis Employment Dispute',
      isRead: true
    },
    {
      id: '4',
      type: 'note',
      subject: 'Research findings - Employment Law',
      summary: 'Key findings from recent employment law changes',
      participants: [
        { id: '6', name: 'Carol Smith', role: 'sender' }
      ],
      timestamp: new Date('2024-01-14T16:45:00'),
      relatedMatterId: 'MAT-2024-004',
      relatedMatterTitle: 'Employment Law Research',
      isRead: true,
      tags: ['research', 'employment-law']
    },
    {
      id: '5',
      type: 'meeting',
      subject: 'Case strategy meeting',
      summary: 'Team meeting to discuss litigation strategy',
      participants: [
        { id: '1', name: 'Alice Johnson', role: 'attendee' },
        { id: '3', name: 'Bob Chen', role: 'attendee' },
        { id: '6', name: 'Carol Smith', role: 'attendee' }
      ],
      timestamp: new Date('2024-01-14T14:00:00'),
      duration: 3600, // 1 hour
      relatedMatterId: 'MAT-2024-001',
      relatedMatterTitle: 'Acme Corp Service Agreement',
      isRead: true
    }
  ]
  
  // Apply filters
  let filtered = allMockCommunications
  
  if (filters.types?.length) {
    filtered = filtered.filter(comm => filters.types!.includes(comm.type))
  }
  
  if (filters.search) {
    const query = filters.search.toLowerCase()
    filtered = filtered.filter(comm => 
      comm.subject.toLowerCase().includes(query) ||
      comm.summary?.toLowerCase().includes(query) ||
      comm.participants.some(p => p.name.toLowerCase().includes(query))
    )
  }
  
  if (filters.matterId) {
    filtered = filtered.filter(comm => comm.relatedMatterId === filters.matterId)
  }
  
  // Pagination
  const limit = 20
  const offset = (page - 1) * limit
  const paginatedData = filtered.slice(offset, offset + limit)
  
  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: filtered.length,
      hasNext: offset + limit < filtered.length,
      hasPrev: page > 1
    }
  }
}