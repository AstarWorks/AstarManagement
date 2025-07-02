# WebSocket & Real-time API Documentation

This guide covers WebSocket connections and real-time features in Aster Management for live updates, notifications, and collaborative features.

## WebSocket Connection

### Connection URL

```
wss://api.astermanagement.com/ws
ws://localhost:8080/ws (development)
```

### Authentication

WebSocket connections require authentication via query parameter or first message:

```typescript
// Option 1: Query parameter
const ws = new WebSocket('wss://api.astermanagement.com/ws?token=<jwt-token>')

// Option 2: Authentication message
const ws = new WebSocket('wss://api.astermanagement.com/ws')
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'AUTH',
    token: '<jwt-token>'
  }))
}
```

## Message Format

All WebSocket messages follow a standard envelope format:

```typescript
interface WebSocketMessage<T = unknown> {
  id: string          // Unique message ID
  type: string        // Message type
  timestamp: string   // ISO 8601 timestamp
  payload: T          // Message-specific data
  metadata?: {
    version?: string
    userId?: string
    correlationId?: string
  }
}
```

## Message Types

### System Messages

#### Connection Established
```json
{
  "id": "msg-123",
  "type": "CONNECTION_ESTABLISHED",
  "timestamp": "2024-04-01T10:00:00Z",
  "payload": {
    "sessionId": "ws-session-456",
    "userId": "user-789",
    "permissions": ["matter:read", "matter:write"]
  }
}
```

#### Heartbeat (Ping/Pong)
```json
// Client sends
{
  "type": "PING",
  "timestamp": "2024-04-01T10:00:00Z"
}

// Server responds
{
  "type": "PONG",
  "timestamp": "2024-04-01T10:00:01Z"
}
```

#### Error
```json
{
  "id": "msg-124",
  "type": "ERROR",
  "timestamp": "2024-04-01T10:00:00Z",
  "payload": {
    "code": "SUBSCRIPTION_FAILED",
    "message": "You don't have permission to subscribe to this matter",
    "details": {
      "matterId": "matter-123",
      "requiredPermission": "matter:read"
    }
  }
}
```

### Subscription Management

#### Subscribe to Channel
```json
// Client sends
{
  "type": "SUBSCRIBE",
  "payload": {
    "channels": [
      "matter:123",
      "user:notifications",
      "team:updates"
    ]
  }
}

// Server responds
{
  "type": "SUBSCRIPTION_CONFIRMED",
  "payload": {
    "channels": ["matter:123", "user:notifications"],
    "failed": [
      {
        "channel": "team:updates",
        "reason": "Insufficient permissions"
      }
    ]
  }
}
```

#### Unsubscribe from Channel
```json
{
  "type": "UNSUBSCRIBE",
  "payload": {
    "channels": ["matter:123"]
  }
}
```

### Real-time Updates

#### Matter Updates
```json
{
  "id": "msg-125",
  "type": "MATTER_UPDATED",
  "timestamp": "2024-04-01T10:05:00Z",
  "payload": {
    "matterId": "matter-123",
    "changes": {
      "status": {
        "old": "ACTIVE",
        "new": "ON_HOLD"
      },
      "updatedBy": {
        "id": "user-456",
        "name": "John Doe"
      }
    }
  }
}
```

#### Matter Status Changed
```json
{
  "type": "MATTER_STATUS_CHANGED",
  "payload": {
    "matterId": "matter-123",
    "oldStatus": "ACTIVE",
    "newStatus": "COMPLETED",
    "changedBy": {
      "id": "user-789",
      "name": "Jane Smith"
    },
    "reason": "Settlement reached"
  }
}
```

#### Document Uploaded
```json
{
  "type": "DOCUMENT_UPLOADED",
  "payload": {
    "documentId": "doc-456",
    "matterId": "matter-123",
    "title": "Settlement Agreement",
    "uploadedBy": {
      "id": "user-789",
      "name": "Jane Smith"
    }
  }
}
```

#### Memo Received
```json
{
  "type": "MEMO_RECEIVED",
  "payload": {
    "memoId": "memo-789",
    "matterId": "matter-123",
    "subject": "Case Update",
    "from": {
      "id": "user-456",
      "name": "John Doe"
    },
    "priority": "HIGH"
  }
}
```

### Notifications

#### User Notification
```json
{
  "type": "NOTIFICATION",
  "payload": {
    "id": "notif-123",
    "title": "New Task Assigned",
    "message": "You have been assigned to review the discovery documents",
    "type": "TASK_ASSIGNED",
    "priority": "HIGH",
    "actionUrl": "/matters/123/tasks/456",
    "actions": [
      {
        "label": "View Task",
        "action": "NAVIGATE",
        "url": "/matters/123/tasks/456"
      },
      {
        "label": "Dismiss",
        "action": "DISMISS"
      }
    ]
  }
}
```

### Collaborative Features

#### User Presence
```json
// User joins
{
  "type": "USER_JOINED",
  "payload": {
    "channelId": "matter:123",
    "user": {
      "id": "user-789",
      "name": "Jane Smith",
      "avatar": "https://..."
    }
  }
}

// User leaves
{
  "type": "USER_LEFT",
  "payload": {
    "channelId": "matter:123",
    "userId": "user-789"
  }
}
```

#### Live Cursor/Selection
```json
{
  "type": "CURSOR_POSITION",
  "payload": {
    "documentId": "doc-456",
    "userId": "user-789",
    "position": {
      "page": 1,
      "x": 100,
      "y": 200
    },
    "selection": {
      "start": { "page": 1, "x": 100, "y": 200 },
      "end": { "page": 1, "x": 300, "y": 250 }
    }
  }
}
```

#### Typing Indicator
```json
{
  "type": "TYPING_INDICATOR",
  "payload": {
    "channelId": "memo:thread:123",
    "userId": "user-789",
    "isTyping": true
  }
}
```

## Channel Types

### Matter Channel
Subscribe to updates for a specific matter:
- Channel format: `matter:{matterId}`
- Events: status changes, document uploads, memo updates, team changes

### User Channel
Personal notifications and updates:
- Channel format: `user:notifications`
- Events: task assignments, mentions, system notifications

### Document Channel
Real-time collaboration on documents:
- Channel format: `document:{documentId}`
- Events: annotations, comments, edits, cursor positions

### Team Channel
Team-wide updates:
- Channel format: `team:{teamId}`
- Events: team member changes, general announcements

## Nuxt.js WebSocket Integration

### WebSocket Plugin

```typescript
// plugins/websocket.client.ts
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const { token } = useAuthStore()
  
  const ws = new WebSocketManager({
    url: config.public.wsUrl,
    token: token.value,
    reconnect: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5
  })
  
  return {
    provide: {
      ws
    }
  }
})
```

### WebSocket Manager Class

```typescript
// utils/websocket-manager.ts
import type { WebSocketMessage } from '~/types/api/common'

export class WebSocketManager {
  private ws: WebSocket | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private subscriptions = new Map<string, Set<Function>>()
  private messageQueue: WebSocketMessage[] = []
  
  constructor(private config: WebSocketConfig) {
    this.connect()
  }
  
  private connect() {
    const url = new URL(this.config.url)
    url.searchParams.set('token', this.config.token)
    
    this.ws = new WebSocket(url.toString())
    
    this.ws.onopen = this.handleOpen.bind(this)
    this.ws.onmessage = this.handleMessage.bind(this)
    this.ws.onclose = this.handleClose.bind(this)
    this.ws.onerror = this.handleError.bind(this)
  }
  
  private handleOpen() {
    console.log('WebSocket connected')
    
    // Send queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) this.send(message)
    }
    
    // Start heartbeat
    this.startHeartbeat()
    
    // Resubscribe to channels
    this.resubscribe()
  }
  
  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      
      // Handle system messages
      if (message.type === 'PONG') {
        return // Heartbeat response
      }
      
      // Notify subscribers
      this.notifySubscribers(message)
      
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }
  
  private handleClose() {
    console.log('WebSocket disconnected')
    this.stopHeartbeat()
    
    if (this.config.reconnect) {
      this.scheduleReconnect()
    }
  }
  
  private handleError(error: Event) {
    console.error('WebSocket error:', error)
  }
  
  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.send({
        type: 'PING',
        timestamp: new Date().toISOString()
      })
    }, 30000) // Every 30 seconds
  }
  
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }
  
  subscribe(channel: string, callback: Function) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set())
      
      // Send subscription message
      this.send({
        type: 'SUBSCRIBE',
        payload: { channels: [channel] }
      })
    }
    
    this.subscriptions.get(channel)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(channel)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.subscriptions.delete(channel)
          this.send({
            type: 'UNSUBSCRIBE',
            payload: { channels: [channel] }
          })
        }
      }
    }
  }
  
  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      // Queue message if not connected
      this.messageQueue.push(message)
    }
  }
  
  private notifySubscribers(message: WebSocketMessage) {
    // Check for channel-specific messages
    const channel = this.getChannelFromMessage(message)
    if (channel && this.subscriptions.has(channel)) {
      this.subscriptions.get(channel)!.forEach(callback => {
        callback(message)
      })
    }
    
    // Also notify global subscribers
    if (this.subscriptions.has('*')) {
      this.subscriptions.get('*')!.forEach(callback => {
        callback(message)
      })
    }
  }
  
  private getChannelFromMessage(message: WebSocketMessage): string | null {
    // Extract channel from message type or payload
    if (message.type.startsWith('MATTER_')) {
      return `matter:${message.payload.matterId}`
    }
    if (message.type === 'NOTIFICATION') {
      return 'user:notifications'
    }
    return null
  }
  
  disconnect() {
    this.config.reconnect = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    if (this.ws) {
      this.ws.close()
    }
  }
}
```

### Using WebSocket in Components

```vue
<script setup lang="ts">
// Real-time matter updates
const { $ws } = useNuxtApp()
const matterId = useRoute().params.id

const matter = ref<Matter>()
const onlineUsers = ref<User[]>([])

onMounted(() => {
  // Subscribe to matter updates
  const unsubscribeMatter = $ws.subscribe(
    `matter:${matterId}`,
    (message: WebSocketMessage) => {
      switch (message.type) {
        case 'MATTER_UPDATED':
          // Update local matter data
          Object.assign(matter.value, message.payload.changes)
          break
          
        case 'USER_JOINED':
          onlineUsers.value.push(message.payload.user)
          break
          
        case 'USER_LEFT':
          onlineUsers.value = onlineUsers.value.filter(
            u => u.id !== message.payload.userId
          )
          break
      }
    }
  )
  
  // Subscribe to notifications
  const unsubscribeNotifications = $ws.subscribe(
    'user:notifications',
    (message: WebSocketMessage) => {
      if (message.type === 'NOTIFICATION') {
        showNotification(message.payload)
      }
    }
  )
  
  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribeMatter()
    unsubscribeNotifications()
  })
})
</script>

<template>
  <div>
    <!-- Online users indicator -->
    <div class="online-users">
      <div 
        v-for="user in onlineUsers" 
        :key="user.id"
        class="user-avatar"
        :title="user.name"
      >
        <img :src="user.avatar" :alt="user.name" />
      </div>
    </div>
    
    <!-- Matter content with real-time updates -->
    <div class="matter-content">
      <h1>{{ matter?.title }}</h1>
      <span class="status" :class="matter?.status">
        {{ matter?.status }}
      </span>
    </div>
  </div>
</template>
```

### Notification System

```typescript
// composables/useNotifications.ts
export const useNotifications = () => {
  const { $ws } = useNuxtApp()
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  
  const showNotification = (notification: Notification) => {
    notifications.value.unshift(notification)
    unreadCount.value++
    
    // Show toast
    useToast().show({
      title: notification.title,
      message: notification.message,
      type: notification.priority === 'HIGH' ? 'warning' : 'info',
      duration: 5000,
      action: notification.actions?.[0]
    })
    
    // Browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon.png',
        tag: notification.id
      })
    }
  }
  
  const markAsRead = (notificationId: string) => {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification && !notification.read) {
      notification.read = true
      unreadCount.value--
    }
  }
  
  const clearAll = () => {
    notifications.value = []
    unreadCount.value = 0
  }
  
  // Subscribe to notifications on mount
  onMounted(() => {
    const unsubscribe = $ws.subscribe(
      'user:notifications',
      (message: WebSocketMessage) => {
        if (message.type === 'NOTIFICATION') {
          showNotification(message.payload)
        }
      }
    )
    
    onUnmounted(unsubscribe)
  })
  
  return {
    notifications: readonly(notifications),
    unreadCount: readonly(unreadCount),
    markAsRead,
    clearAll
  }
}
```

### Typing Indicators

```vue
<script setup lang="ts">
// Typing indicator for memos
const { $ws } = useNuxtApp()
const threadId = ref('thread-123')
const typingUsers = ref<Map<string, NodeJS.Timeout>>(new Map())

// Send typing indicator
const isTyping = ref(false)
let typingTimeout: NodeJS.Timeout

const handleTyping = () => {
  if (!isTyping.value) {
    isTyping.value = true
    $ws.send({
      type: 'TYPING_INDICATOR',
      payload: {
        channelId: `memo:thread:${threadId.value}`,
        userId: currentUser.value.id,
        isTyping: true
      }
    })
  }
  
  // Clear existing timeout
  clearTimeout(typingTimeout)
  
  // Stop typing after 3 seconds of inactivity
  typingTimeout = setTimeout(() => {
    isTyping.value = false
    $ws.send({
      type: 'TYPING_INDICATOR',
      payload: {
        channelId: `memo:thread:${threadId.value}`,
        userId: currentUser.value.id,
        isTyping: false
      }
    })
  }, 3000)
}

// Listen for others typing
onMounted(() => {
  const unsubscribe = $ws.subscribe(
    `memo:thread:${threadId.value}`,
    (message: WebSocketMessage) => {
      if (message.type === 'TYPING_INDICATOR') {
        const { userId, isTyping } = message.payload
        
        if (isTyping) {
          // Clear existing timeout for this user
          const existingTimeout = typingUsers.value.get(userId)
          if (existingTimeout) clearTimeout(existingTimeout)
          
          // Set new timeout
          const timeout = setTimeout(() => {
            typingUsers.value.delete(userId)
          }, 5000)
          
          typingUsers.value.set(userId, timeout)
        } else {
          // User stopped typing
          const timeout = typingUsers.value.get(userId)
          if (timeout) clearTimeout(timeout)
          typingUsers.value.delete(userId)
        }
      }
    }
  )
  
  onUnmounted(unsubscribe)
})

const typingUsersList = computed(() => 
  Array.from(typingUsers.value.keys())
    .map(id => users.find(u => u.id === id))
    .filter(Boolean)
)
</script>

<template>
  <div>
    <textarea 
      @input="handleTyping"
      placeholder="Type your message..."
    />
    
    <div v-if="typingUsersList.length > 0" class="typing-indicator">
      <span v-if="typingUsersList.length === 1">
        {{ typingUsersList[0].name }} is typing...
      </span>
      <span v-else>
        {{ typingUsersList.length }} people are typing...
      </span>
    </div>
  </div>
</template>
```

## Error Handling

### Connection Errors

```typescript
// Handle connection failures
const handleConnectionError = (error: WebSocketError) => {
  switch (error.code) {
    case 'AUTH_FAILED':
      // Token expired or invalid
      await refreshToken()
      ws.reconnect()
      break
      
    case 'RATE_LIMITED':
      // Too many connections
      showToast('Connection rate limited. Please wait.', 'error')
      setTimeout(() => ws.reconnect(), 60000)
      break
      
    case 'MAINTENANCE':
      // Server in maintenance mode
      showMaintenanceBanner()
      break
  }
}
```

### Subscription Errors

```typescript
// Handle subscription failures
ws.subscribe('matter:123', (message) => {
  if (message.type === 'SUBSCRIPTION_ERROR') {
    if (message.payload.code === 'FORBIDDEN') {
      showToast('You don\'t have access to this matter', 'error')
      navigateTo('/matters')
    }
  }
})
```

## Best Practices

1. **Connection Management**
   - Implement automatic reconnection with exponential backoff
   - Clean up subscriptions on component unmount
   - Handle connection state in UI

2. **Performance**
   - Throttle frequent updates (cursor positions, typing)
   - Batch messages when possible
   - Use channel-specific subscriptions

3. **Security**
   - Always validate permissions server-side
   - Sanitize user-generated content
   - Implement rate limiting

4. **User Experience**
   - Show connection status indicators
   - Queue messages when offline
   - Provide fallback for WebSocket failures