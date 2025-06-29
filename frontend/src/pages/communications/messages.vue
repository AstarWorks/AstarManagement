<template>
  <CommunicationLayout>
    <div class="messages-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h2 class="text-xl font-semibold text-foreground">Messages</h2>
          <p class="text-muted-foreground">
            Slack, Discord, and other messaging platform communications
          </p>
        </div>
      </div>
      
      <!-- Platform Tabs -->
      <div class="platform-tabs">
        <div class="tabs-list">
          <button
            v-for="platform in platforms"
            :key="platform.id"
            class="platform-tab"
            :class="{ 'platform-tab--active': selectedPlatform === platform.id }"
            @click="selectPlatform(platform.id)"
          >
            <component :is="platform.icon" class="platform-icon" />
            <span class="platform-label">{{ platform.name }}</span>
            <Badge v-if="platform.unreadCount > 0" class="platform-badge">
              {{ platform.unreadCount }}
            </Badge>
          </button>
        </div>
      </div>
      
      <!-- Messages Layout -->
      <div class="messages-layout">
        <!-- Channels/Conversations Sidebar -->
        <div class="channels-sidebar">
          <div class="channels-header">
            <h3 class="text-sm font-medium text-foreground">Channels</h3>
            <Button variant="ghost" size="sm">
              <Plus class="size-4" />
            </Button>
          </div>
          <div class="channels-list">
            <button
              v-for="channel in filteredChannels"
              :key="channel.id"
              class="channel-item"
              :class="{ 'channel-item--active': selectedChannel === channel.id }"
              @click="selectChannel(channel.id)"
            >
              <div class="channel-info">
                <component :is="channel.icon" class="channel-icon" />
                <span class="channel-name">{{ channel.name }}</span>
              </div>
              <div class="channel-meta">
                <Badge v-if="channel.unreadCount > 0" class="channel-badge">
                  {{ channel.unreadCount }}
                </Badge>
                <span class="channel-time">{{ formatTime(channel.lastMessageAt) }}</span>
              </div>
            </button>
          </div>
        </div>
        
        <!-- Messages Content -->
        <div class="messages-content">
          <div v-if="selectedChannelData" class="message-thread">
            <!-- Thread Header -->
            <div class="thread-header">
              <div class="thread-info">
                <component :is="selectedChannelData.icon" class="thread-icon" />
                <div>
                  <h3 class="thread-title">{{ selectedChannelData.name }}</h3>
                  <p class="thread-description">{{ selectedChannelData.description }}</p>
                </div>
              </div>
              <div class="thread-actions">
                <Button variant="ghost" size="sm">
                  <Search class="size-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical class="size-4" />
                </Button>
              </div>
            </div>
            
            <!-- Messages List -->
            <div class="messages-list">
              <div 
                v-for="message in channelMessages"
                :key="message.id"
                class="message-item"
              >
                <div class="message-avatar">
                  <Avatar class="message-user-avatar">
                    <AvatarFallback>{{ getInitials(message.sender) }}</AvatarFallback>
                  </Avatar>
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-sender">{{ message.sender }}</span>
                    <span class="message-time">{{ formatMessageTime(message.sentAt) }}</span>
                  </div>
                  <div class="message-text">{{ message.text }}</div>
                  <div v-if="message.attachments?.length" class="message-attachments">
                    <div 
                      v-for="attachment in message.attachments"
                      :key="attachment.id"
                      class="attachment-item"
                    >
                      <Paperclip class="attachment-icon" />
                      <span class="attachment-name">{{ attachment.name }}</span>
                    </div>
                  </div>
                  <div v-if="message.reactions?.length" class="message-reactions">
                    <button
                      v-for="reaction in message.reactions"
                      :key="reaction.emoji"
                      class="reaction-item"
                    >
                      {{ reaction.emoji }} {{ reaction.count }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Message Input -->
            <div class="message-input-area">
              <div class="message-input-container">
                <textarea
                  v-model="newMessage"
                  placeholder="Type a message..."
                  class="message-input"
                  rows="1"
                  @keydown.enter.prevent="sendMessage"
                />
                <div class="input-actions">
                  <Button variant="ghost" size="sm">
                    <Paperclip class="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Smile class="size-4" />
                  </Button>
                  <Button 
                    size="sm"
                    :disabled="!newMessage.trim()"
                    @click="sendMessage"
                  >
                    <Send class="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- No Channel Selected -->
          <div v-else class="no-selection">
            <MessageCircle class="no-selection-icon" />
            <h3 class="no-selection-title">Select a conversation</h3>
            <p class="no-selection-description">
              Choose a channel or conversation to view messages
            </p>
          </div>
        </div>
      </div>
    </div>
  </CommunicationLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Plus, 
  Search, 
  MoreVertical,
  MessageCircle,
  Hash,
  Lock,
  Users,
  Paperclip,
  Smile,
  Send
} from 'lucide-vue-next'
import { CommunicationLayout } from '~/components/communication'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'

// Define the page meta
definePageMeta({
  title: 'Messages',
  description: 'Slack, Discord, and messaging platform communications'
})

// Reactive state
const selectedPlatform = ref('slack')
const selectedChannel = ref(1)
const newMessage = ref('')

// Platforms
const platforms = [
  { id: 'slack', name: 'Slack', icon: MessageCircle, unreadCount: 5 },
  { id: 'discord', name: 'Discord', icon: MessageCircle, unreadCount: 2 },
  { id: 'teams', name: 'Teams', icon: MessageCircle, unreadCount: 1 }
]

// Mock channels data
const channels = ref([
  {
    id: 1,
    name: 'general',
    description: 'General team discussions',
    icon: Hash,
    platform: 'slack',
    unreadCount: 3,
    lastMessageAt: new Date('2024-01-15T14:30:00')
  },
  {
    id: 2,
    name: 'legal-cases',
    description: 'Case discussions and updates',
    icon: Lock,
    platform: 'slack',
    unreadCount: 2,
    lastMessageAt: new Date('2024-01-15T13:45:00')
  },
  {
    id: 3,
    name: 'client-updates',
    description: 'Client communication updates',
    icon: Users,
    platform: 'slack',
    unreadCount: 0,
    lastMessageAt: new Date('2024-01-15T12:20:00')
  },
  {
    id: 4,
    name: 'law-firm-general',
    description: 'General law firm discussion',
    icon: Hash,
    platform: 'discord',
    unreadCount: 1,
    lastMessageAt: new Date('2024-01-15T11:15:00')
  },
  {
    id: 5,
    name: 'case-strategy',
    description: 'Strategic discussions',
    icon: Lock,
    platform: 'discord',
    unreadCount: 1,
    lastMessageAt: new Date('2024-01-15T10:30:00')
  }
])

// Mock messages data
const messages = ref([
  {
    id: 1,
    channelId: 1,
    sender: 'Alice Johnson',
    text: 'Good morning team! Just a reminder about the client meeting at 2 PM today.',
    sentAt: new Date('2024-01-15T09:00:00'),
    reactions: [{ emoji: '👍', count: 3 }]
  },
  {
    id: 2,
    channelId: 1,
    sender: 'Bob Chen',
    text: 'Thanks for the reminder! I have the documents ready.',
    sentAt: new Date('2024-01-15T09:05:00'),
    attachments: [{ id: 1, name: 'meeting-agenda.pdf' }]
  },
  {
    id: 3,
    channelId: 1,
    sender: 'Carol Davis',
    text: 'I might be a few minutes late due to traffic.',
    sentAt: new Date('2024-01-15T13:45:00')
  },
  {
    id: 4,
    channelId: 2,
    sender: 'Alice Johnson',
    text: 'Update on the Smith vs. Jones case - discovery phase is complete.',
    sentAt: new Date('2024-01-15T11:30:00')
  },
  {
    id: 5,
    channelId: 2,
    sender: 'Bob Chen',
    text: 'Great! When do we move to the next phase?',
    sentAt: new Date('2024-01-15T11:35:00')
  }
])

// Computed properties
const filteredChannels = computed(() => {
  return channels.value.filter(channel => channel.platform === selectedPlatform.value)
})

const selectedChannelData = computed(() => {
  return channels.value.find(channel => channel.id === selectedChannel.value)
})

const channelMessages = computed(() => {
  return messages.value
    .filter(message => message.channelId === selectedChannel.value)
    .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime())
})

// Methods
const selectPlatform = (platformId: string) => {
  selectedPlatform.value = platformId
  // Select first channel of the platform
  const firstChannel = filteredChannels.value[0]
  if (firstChannel) {
    selectedChannel.value = firstChannel.id
  }
}

const selectChannel = (channelId: number) => {
  selectedChannel.value = channelId
}

const sendMessage = () => {
  if (!newMessage.value.trim()) return
  
  const message = {
    id: messages.value.length + 1,
    channelId: selectedChannel.value,
    sender: 'You',
    text: newMessage.value.trim(),
    sentAt: new Date()
  }
  
  messages.value.push(message)
  newMessage.value = ''
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const formatTime = (date: Date) => {
  const now = new Date()
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffHours < 1) return 'now'
  if (diffHours < 24) return `${diffHours}h`
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(date)
}

const formatMessageTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date)
}
</script>

<style scoped>
.messages-page {
  @apply h-full flex flex-col;
}

.page-header {
  @apply border-b border-border pb-4 mb-4;
}

.header-content {
  @apply space-y-1;
}

.platform-tabs {
  @apply border-b border-border mb-4;
}

.tabs-list {
  @apply flex gap-1;
}

.platform-tab {
  @apply flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-md;
  @apply text-muted-foreground hover:text-foreground transition-colors;
  @apply border-b-2 border-transparent;
}

.platform-tab--active {
  @apply text-foreground border-primary bg-background;
}

.platform-icon {
  @apply size-4;
}

.platform-badge {
  @apply text-xs;
}

.messages-layout {
  @apply flex-1 flex gap-4 min-h-0;
}

.channels-sidebar {
  @apply w-64 border-r border-border flex-shrink-0;
}

.channels-header {
  @apply flex justify-between items-center p-3 border-b border-border;
}

.channels-list {
  @apply space-y-1 p-2;
}

.channel-item {
  @apply w-full flex items-center justify-between p-2 rounded-md;
  @apply text-sm hover:bg-accent transition-colors;
}

.channel-item--active {
  @apply bg-primary text-primary-foreground;
}

.channel-info {
  @apply flex items-center gap-2 flex-1 min-w-0;
}

.channel-icon {
  @apply size-4 flex-shrink-0;
}

.channel-name {
  @apply truncate;
}

.channel-meta {
  @apply flex items-center gap-2;
}

.channel-badge {
  @apply text-xs;
}

.channel-time {
  @apply text-xs text-muted-foreground;
}

.messages-content {
  @apply flex-1 flex flex-col min-w-0;
}

.message-thread {
  @apply flex flex-col h-full;
}

.thread-header {
  @apply flex justify-between items-center p-4 border-b border-border;
}

.thread-info {
  @apply flex items-center gap-3;
}

.thread-icon {
  @apply size-5 text-primary;
}

.thread-title {
  @apply font-medium text-foreground;
}

.thread-description {
  @apply text-sm text-muted-foreground;
}

.thread-actions {
  @apply flex gap-2;
}

.messages-list {
  @apply flex-1 overflow-auto p-4 space-y-4;
}

.message-item {
  @apply flex gap-3;
}

.message-avatar {
  @apply flex-shrink-0;
}

.message-user-avatar {
  @apply size-8;
}

.message-content {
  @apply flex-1 min-w-0;
}

.message-header {
  @apply flex items-center gap-2 mb-1;
}

.message-sender {
  @apply font-medium text-sm text-foreground;
}

.message-time {
  @apply text-xs text-muted-foreground;
}

.message-text {
  @apply text-sm text-foreground mb-2;
}

.message-attachments {
  @apply space-y-1 mb-2;
}

.attachment-item {
  @apply flex items-center gap-2 text-xs text-muted-foreground;
  @apply bg-muted rounded px-2 py-1 inline-flex;
}

.attachment-icon {
  @apply size-3;
}

.message-reactions {
  @apply flex gap-1;
}

.reaction-item {
  @apply text-xs bg-muted rounded px-2 py-1 hover:bg-accent transition-colors;
}

.message-input-area {
  @apply border-t border-border p-4;
}

.message-input-container {
  @apply border border-input rounded-lg p-3 focus-within:ring-2 focus-within:ring-ring;
}

.message-input {
  @apply w-full resize-none bg-transparent border-0 outline-none text-sm;
  @apply placeholder:text-muted-foreground;
}

.input-actions {
  @apply flex justify-between items-center mt-2;
}

.no-selection {
  @apply flex flex-col items-center justify-center h-full text-center;
}

.no-selection-icon {
  @apply size-12 text-muted-foreground mb-4;
}

.no-selection-title {
  @apply text-lg font-medium text-foreground mb-2;
}

.no-selection-description {
  @apply text-muted-foreground;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .messages-layout {
    @apply flex-col;
  }
  
  .channels-sidebar {
    @apply w-full border-r-0 border-b;
  }
  
  .channels-list {
    @apply flex overflow-x-auto;
  }
  
  .channel-item {
    @apply flex-shrink-0 whitespace-nowrap;
  }
}
</style>