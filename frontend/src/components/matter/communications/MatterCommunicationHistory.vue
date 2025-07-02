<!--
  Matter Communication History Component
  
  Displays communication activities for a matter including emails, notes, and calls.
  Optimized for activity timeline view with chronological display.
-->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  MessageSquare, 
  Mail, 
  StickyNote, 
  Phone, 
  Plus,
  Reply,
  Forward,
  MoreHorizontal,
  Paperclip,
  Clock
} from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '~/components/ui/dropdown-menu'
import { Skeleton } from '~/components/ui/skeleton'

interface Props {
  /** Matter ID */
  matterId: string
  /** Search term from parent */
  searchTerm?: string
  /** Show filters panel */
  showFilters?: boolean
  /** Enable real-time updates */
  enableRealTime?: boolean
  /** View mode - activity or list */
  viewMode?: 'activity' | 'list'
}

const props = withDefaults(defineProps<Props>(), {
  searchTerm: '',
  showFilters: false,
  enableRealTime: true,
  viewMode: 'activity'
})

// Mock data - in real app, this would come from API
const communications = ref([
  {
    id: '1',
    type: 'email',
    subject: 'Re: Contract Amendment Discussion',
    content: 'Thank you for the clarification on the amendment terms. I\'ve reviewed the proposed changes and have a few additional questions...',
    from: { id: '1', name: 'John Doe', email: 'john@lawfirm.com', avatar: null },
    to: [{ id: '2', name: 'Client Corp', email: 'legal@clientcorp.com' }],
    timestamp: new Date('2024-07-02T14:30:00'),
    direction: 'outbound',
    attachments: 2,
    importance: 'high',
    status: 'sent'
  },
  {
    id: '2',
    type: 'note',
    subject: 'Client Meeting Notes',
    content: 'Met with client to discuss case strategy. Key points:\n- Review discovery timeline\n- Prepare witness statements\n- Schedule follow-up meeting for next week',
    from: { id: '2', name: 'Jane Smith', email: 'jane@lawfirm.com', avatar: null },
    timestamp: new Date('2024-07-02T11:15:00'),
    tags: ['meeting', 'strategy', 'important'],
    private: false
  },
  {
    id: '3',
    type: 'call',
    subject: 'Phone Call with Opposing Counsel',
    content: 'Discussed settlement terms and scheduling for mediation session.',
    from: { id: '1', name: 'John Doe', email: 'john@lawfirm.com', avatar: null },
    to: [{ id: '3', name: 'Opposing Counsel', phone: '+1-555-123-4567' }],
    timestamp: new Date('2024-07-01T16:45:00'),
    duration: 25, // minutes
    direction: 'outbound',
    callType: 'business'
  },
  {
    id: '4',
    type: 'email',
    subject: 'Document Review Request',
    content: 'Please review the attached contract draft and provide your feedback by end of week.',
    from: { id: '4', name: 'Client Contact', email: 'contact@client.com', avatar: null },
    to: [{ id: '1', name: 'John Doe', email: 'john@lawfirm.com' }],
    timestamp: new Date('2024-06-30T09:20:00'),
    direction: 'inbound',
    attachments: 1,
    importance: 'medium',
    status: 'read'
  }
])

const loading = ref(false)

// Computed properties
const filteredCommunications = computed(() => {
  if (!props.searchTerm) return communications.value
  
  return communications.value.filter(comm => 
    comm.subject.toLowerCase().includes(props.searchTerm.toLowerCase()) ||
    comm.content.toLowerCase().includes(props.searchTerm.toLowerCase()) ||
    comm.from.name.toLowerCase().includes(props.searchTerm.toLowerCase())
  )
})

// Communication type icons
const typeIcons = {
  email: Mail,
  note: StickyNote,
  call: Phone
}

// Communication type colors
const typeColors = {
  email: 'text-blue-600 bg-blue-50',
  note: 'text-yellow-600 bg-yellow-50',
  call: 'text-green-600 bg-green-50'
}

// Methods
const formatTimestamp = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return date.toLocaleDateString()
}

const getDirectionLabel = (direction: string) => {
  return direction === 'inbound' ? 'Received' : 'Sent'
}

const getDirectionColor = (direction: string) => {
  return direction === 'inbound' ? 'text-green-600' : 'text-blue-600'
}

const truncateContent = (content: string, maxLength: number = 150) => {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

const handleCommunicationAction = (action: string, communicationId: string) => {
  console.log(`${action} communication ${communicationId}`)
  // Implement actual actions
}
</script>

<template>
  <div class="matter-communication-history">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold flex items-center gap-2">
        <MessageSquare class="w-5 h-5" />
        Communication History
      </h3>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Plus class="w-4 h-4 mr-2" />
          New Note
        </Button>
        <Button variant="outline" size="sm">
          <Mail class="w-4 h-4 mr-2" />
          Send Email
        </Button>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 4" :key="i" class="border rounded-lg p-4">
        <div class="flex items-start gap-4">
          <Skeleton class="w-8 h-8 rounded-full" />
          <div class="flex-1 space-y-2">
            <div class="flex items-center gap-2">
              <Skeleton class="h-4 w-6" />
              <Skeleton class="h-4 w-32" />
            </div>
            <Skeleton class="h-3 w-3/4" />
            <Skeleton class="h-3 w-1/2" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Communication List -->
    <div v-else class="space-y-4">
      <Card v-for="comm in filteredCommunications" :key="comm.id" class="communication-card">
        <CardContent class="p-4">
          <div class="flex items-start gap-4">
            <!-- Communication Type Icon -->
            <div 
              class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              :class="typeColors[comm.type]"
            >
              <component :is="typeIcons[comm.type]" class="w-4 h-4" />
            </div>
            
            <!-- Communication Content -->
            <div class="flex-1 min-w-0">
              <!-- Header -->
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2 min-w-0">
                  <h4 class="font-medium text-sm truncate">{{ comm.subject }}</h4>
                  <Badge 
                    v-if="comm.type === 'email'" 
                    variant="outline" 
                    class="text-xs"
                    :class="getDirectionColor(comm.direction)"
                  >
                    {{ getDirectionLabel(comm.direction) }}
                  </Badge>
                  <Badge 
                    v-if="comm.importance === 'high'" 
                    variant="destructive" 
                    class="text-xs"
                  >
                    High Priority
                  </Badge>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
                      <MoreHorizontal class="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem v-if="comm.type === 'email'" @click="handleCommunicationAction('reply', comm.id)">
                      <Reply class="w-4 h-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                    <DropdownMenuItem v-if="comm.type === 'email'" @click="handleCommunicationAction('forward', comm.id)">
                      <Forward class="w-4 h-4 mr-2" />
                      Forward
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="handleCommunicationAction('view', comm.id)">
                      View Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <!-- Sender/Recipient Info -->
              <div class="flex items-center gap-2 mb-2 text-xs">
                <Avatar class="w-4 h-4">
                  <AvatarImage :src="comm.from.avatar" />
                  <AvatarFallback class="text-xs">
                    {{ comm.from.name.split(' ').map(n => n[0]).join('') }}
                  </AvatarFallback>
                </Avatar>
                <span class="font-medium">{{ comm.from.name }}</span>
                <span v-if="comm.to && comm.to.length > 0" class="text-muted-foreground">
                  to {{ comm.to.map(t => t.name).join(', ') }}
                </span>
                <span class="text-muted-foreground">{{ formatTimestamp(comm.timestamp) }}</span>
              </div>
              
              <!-- Content Preview -->
              <p class="text-sm text-muted-foreground mb-2 whitespace-pre-line">
                {{ truncateContent(comm.content) }}
              </p>
              
              <!-- Additional Info -->
              <div class="flex items-center gap-4 text-xs text-muted-foreground">
                <!-- Email specific info -->
                <div v-if="comm.type === 'email' && comm.attachments" class="flex items-center gap-1">
                  <Paperclip class="w-3 h-3" />
                  {{ comm.attachments }} attachment{{ comm.attachments > 1 ? 's' : '' }}
                </div>
                
                <!-- Call specific info -->
                <div v-if="comm.type === 'call' && comm.duration" class="flex items-center gap-1">
                  <Clock class="w-3 h-3" />
                  {{ comm.duration }} minutes
                </div>
                
                <!-- Note tags -->
                <div v-if="comm.type === 'note' && comm.tags" class="flex items-center gap-1">
                  <span v-for="tag in comm.tags" :key="tag" class="bg-muted px-1 py-0.5 rounded text-xs">
                    #{{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    
    <!-- Empty State -->
    <div v-if="!loading && filteredCommunications.length === 0" class="text-center py-8">
      <MessageSquare class="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h3 class="font-medium mb-2">No Communications Found</h3>
      <p class="text-sm text-muted-foreground mb-4">
        {{ props.searchTerm ? 'No communications match your search.' : 'No communications have been recorded yet.' }}
      </p>
      <div class="flex justify-center gap-2">
        <Button variant="outline">
          <StickyNote class="w-4 h-4 mr-2" />
          Add Note
        </Button>
        <Button variant="outline">
          <Mail class="w-4 h-4 mr-2" />
          Send Email
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.matter-communication-history {
  @apply w-full;
}

.communication-card {
  @apply transition-colors duration-200 hover:bg-muted/30;
}

.communication-card:hover {
  @apply shadow-sm;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .communication-card .flex {
    @apply gap-2;
  }
  
  .communication-card .w-8 {
    @apply w-6 h-6;
  }
  
  .communication-card .text-xs {
    @apply text-xs;
  }
}

/* Focus states for accessibility */
.communication-card :focus-visible {
  @apply outline-2 outline-offset-2 outline-ring;
}

/* Content formatting */
.communication-card .whitespace-pre-line {
  white-space: pre-line;
  word-break: break-word;
}
</style>