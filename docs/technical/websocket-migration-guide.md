# WebSocket Migration Guide

## Overview

This document outlines the migration path from the current polling-based real-time updates to WebSocket-based real-time communication. The current architecture has been designed to support this migration with minimal changes to the user-facing components.

## Current Architecture

### Polling Implementation

The current system uses React Query with a configurable polling interval:

```typescript
const usePollingUpdates = () => {
  return useQuery({
    queryKey: ['matters', 'polling'],
    queryFn: fetchMatters,
    refetchInterval: isDragging ? false : 30000,
    enabled: pollingEnabled && !isDragging
  })
}
```

### Abstract Update Service

The architecture is already prepared for WebSocket migration through abstraction:

```typescript
interface UpdateService {
  start(): void
  stop(): void
  onUpdate(callback: (matters: MatterCard[]) => void): void
  onError(callback: (error: Error) => void): void
  onConnectionChange(callback: (status: ConnectionStatus) => void): void
}
```

## WebSocket Implementation Plan

### Phase 1: WebSocket Service Implementation

1. **Create WebSocket Service Class**

```typescript
// src/services/websocket-service.ts
import { io, Socket } from 'socket.io-client'

export class WebSocketService implements UpdateService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor(private config: WebSocketConfig) {}

  start(): void {
    this.socket = io(this.config.url, {
      auth: {
        token: this.config.authToken
      },
      transports: ['websocket', 'polling']
    })

    this.setupEventHandlers()
  }

  stop(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0
      this.onConnectionChange('connected')
    })

    this.socket.on('disconnect', () => {
      this.onConnectionChange('disconnected')
      this.attemptReconnect()
    })

    this.socket.on('matter_updated', (data) => {
      this.onUpdate(data.matters)
    })

    this.socket.on('matter_created', (data) => {
      this.onUpdate(data.matters)
    })

    this.socket.on('matter_deleted', (data) => {
      this.onUpdate(data.matters)
    })
  }

  // ... implementation details
}
```

2. **WebSocket Configuration**

```typescript
interface WebSocketConfig {
  url: string
  authToken: string
  reconnectAttempts: number
  heartbeatInterval: number
  namespaces: string[]
}

const WEBSOCKET_CONFIG: WebSocketConfig = {
  url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  authToken: '', // Set from auth context
  reconnectAttempts: 5,
  heartbeatInterval: 30000,
  namespaces: ['matters', 'users', 'notifications']
}
```

### Phase 2: Backend WebSocket Integration

1. **Spring Boot WebSocket Configuration**

```kotlin
// backend/src/main/kotlin/com/astermanagement/config/WebSocketConfig.kt
@Configuration
@EnableWebSocket
class WebSocketConfig : WebSocketConfigurer {
    
    override fun registerWebSocketHandlers(registry: WebSocketHandlerRegistry) {
        registry.addHandler(MatterUpdateHandler(), "/ws/matters")
            .setAllowedOrigins("*")
            .withSockJS()
    }
}

@Component
class MatterUpdateHandler : WebSocketHandler {
    private val sessions = mutableSetOf<WebSocketSession>()
    
    override fun afterConnectionEstablished(session: WebSocketSession) {
        sessions.add(session)
        logger.info("WebSocket connection established: ${session.id}")
    }
    
    override fun handleMessage(session: WebSocketSession, message: WebSocketMessage<*>) {
        // Handle incoming messages from frontend
    }
    
    override fun afterConnectionClosed(session: WebSocketSession, closeStatus: CloseStatus) {
        sessions.remove(session)
        logger.info("WebSocket connection closed: ${session.id}")
    }
    
    fun broadcastMatterUpdate(matter: Matter) {
        val message = TextMessage(objectMapper.writeValueAsString(matter))
        sessions.forEach { session ->
            if (session.isOpen) {
                session.sendMessage(message)
            }
        }
    }
}
```

2. **Matter Service Integration**

```kotlin
@Service
class MatterService(
    private val matterRepository: MatterRepository,
    private val webSocketHandler: MatterUpdateHandler
) {
    
    fun updateMatter(id: Long, request: UpdateMatterRequest): Matter {
        val matter = matterRepository.findById(id)
            .orElseThrow { EntityNotFoundException("Matter not found") }
        
        // Update matter logic...
        val updatedMatter = matterRepository.save(matter)
        
        // Broadcast WebSocket update
        webSocketHandler.broadcastMatterUpdate(updatedMatter)
        
        return updatedMatter
    }
}
```

### Phase 3: Frontend Hook Migration

1. **Update Service Factory**

```typescript
// src/hooks/use-real-time-updates.ts
type UpdateMode = 'polling' | 'websocket'

const createUpdateService = (mode: UpdateMode): UpdateService => {
  switch (mode) {
    case 'websocket':
      return new WebSocketService(WEBSOCKET_CONFIG)
    case 'polling':
    default:
      return new PollingService(POLLING_CONFIG)
  }
}

export function useRealTimeUpdates(mode: UpdateMode = 'polling') {
  const [service] = useState(() => createUpdateService(mode))
  // ... rest of hook implementation
}
```

2. **Feature Flag Integration**

```typescript
// src/hooks/use-feature-flags.ts
export function useRealTimeMode(): UpdateMode {
  const { data: featureFlags } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: fetchFeatureFlags
  })
  
  return featureFlags?.realTimeMode === 'websocket' ? 'websocket' : 'polling'
}
```

### Phase 4: Gradual Migration Strategy

1. **Feature Flag Rollout**

```typescript
// Percentage-based rollout
const shouldUseWebSocket = (userId: string): boolean => {
  const hash = hashCode(userId)
  const percentage = hash % 100
  return percentage < WEBSOCKET_ROLLOUT_PERCENTAGE
}
```

2. **A/B Testing Integration**

```typescript
// src/providers/RealTimeProvider.tsx
export function RealTimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const mode = useExperiment('realtime-websocket', user.id, {
    websocket: 50, // 50% WebSocket
    polling: 50    // 50% Polling
  })
  
  return (
    <RealTimeContext.Provider value={{ mode }}>
      {children}
    </RealTimeContext.Provider>
  )
}
```

## Migration Checklist

### Pre-Migration Requirements

- [ ] Backend WebSocket infrastructure deployed
- [ ] Authentication/authorization for WebSocket connections
- [ ] WebSocket message schema defined
- [ ] Error handling and reconnection logic tested
- [ ] Performance benchmarks established

### Migration Steps

1. **Phase 1: Infrastructure**
   - [ ] Deploy WebSocket service classes
   - [ ] Set up feature flags
   - [ ] Configure monitoring and logging

2. **Phase 2: Backend Integration**
   - [ ] Implement WebSocket handlers
   - [ ] Add WebSocket broadcasting to service methods
   - [ ] Set up connection authentication
   - [ ] Test backend WebSocket functionality

3. **Phase 3: Frontend Integration**
   - [ ] Update update service factory
   - [ ] Add feature flag checks
   - [ ] Test WebSocket hook functionality
   - [ ] Validate connection status indicators

4. **Phase 4: Gradual Rollout**
   - [ ] Start with 10% WebSocket traffic
   - [ ] Monitor error rates and performance
   - [ ] Gradually increase percentage
   - [ ] Full migration to WebSocket

### Rollback Plan

If issues are encountered during migration:

1. **Immediate Rollback**
   ```typescript
   // Emergency feature flag override
   const FORCE_POLLING_MODE = process.env.NEXT_PUBLIC_FORCE_POLLING === 'true'
   
   const mode = FORCE_POLLING_MODE ? 'polling' : useRealTimeMode()
   ```

2. **Gradual Rollback**
   - Reduce WebSocket percentage in feature flags
   - Monitor system stability
   - Investigate and fix issues
   - Resume migration when stable

## Performance Considerations

### WebSocket Advantages

- **Reduced Latency**: Real-time updates (< 100ms vs 30s polling)
- **Lower Bandwidth**: No repeated HTTP headers
- **Better UX**: Instant conflict resolution and notifications

### WebSocket Challenges

- **Connection Management**: Handle reconnections and network issues
- **Scaling**: WebSocket connections are stateful
- **Browser Compatibility**: Fallback to polling for older browsers

### Monitoring Metrics

Track these metrics during migration:

```typescript
interface WebSocketMetrics {
  connectionCount: number
  averageLatency: number
  reconnectionRate: number
  messageRate: number
  errorRate: number
  fallbackToPollingRate: number
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('WebSocketService', () => {
  it('should establish connection and receive updates', async () => {
    const service = new WebSocketService(config)
    const updateSpy = jest.fn()
    
    service.onUpdate(updateSpy)
    service.start()
    
    // Simulate server message
    mockSocket.emit('matter_updated', mockData)
    
    expect(updateSpy).toHaveBeenCalledWith(mockData.matters)
  })
})
```

### Integration Tests

```typescript
describe('Real-time Updates Integration', () => {
  it('should switch between polling and WebSocket modes', () => {
    const { result, rerender } = renderHook(() => 
      useRealTimeUpdates('polling')
    )
    
    expect(result.current.mode).toBe('polling')
    
    rerender({ mode: 'websocket' })
    expect(result.current.mode).toBe('websocket')
  })
})
```

### Load Testing

Use tools like Artillery.js for WebSocket load testing:

```yaml
config:
  target: 'ws://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'WebSocket Connection Test'
    engine: ws
    weight: 100
```

## Security Considerations

### Authentication

```typescript
// JWT token validation for WebSocket connections
const authenticateWebSocket = (socket: Socket, next: Function) => {
  const token = socket.handshake.auth.token
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'))
    socket.userId = decoded.userId
    next()
  })
}
```

### Rate Limiting

```typescript
// Prevent WebSocket abuse
const rateLimiter = new Map<string, number>()

const checkRateLimit = (userId: string): boolean => {
  const now = Date.now()
  const lastRequest = rateLimiter.get(userId) || 0
  
  if (now - lastRequest < RATE_LIMIT_WINDOW) {
    return false // Rate limited
  }
  
  rateLimiter.set(userId, now)
  return true
}
```

## Conclusion

The migration from polling to WebSocket has been architected to be seamless and gradual. The current polling implementation provides a solid foundation, and the abstracted update service interface ensures that the migration can happen with minimal disruption to the user experience.

Key success factors:
- Feature flag driven rollout
- Comprehensive monitoring and rollback plans
- Thorough testing at each phase
- Performance benchmarking throughout migration