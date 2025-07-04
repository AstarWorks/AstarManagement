# Spring Modulith Development Guidelines

## Overview

This document provides comprehensive guidelines for developing with Spring Modulith in the Aster Management system. It covers event-driven patterns, module boundaries, testing strategies, and best practices established through the implementation of our audit, matter, and document modules.

## Module Structure Conventions

### Package Organization
```
modules/
├── <module-name>/
│   ├── api/                    # Public interfaces and DTOs
│   │   ├── <Module>Service.kt  # Service interface
│   │   ├── <Module>Events.kt   # Event definitions
│   │   └── dto/                # Data transfer objects
│   ├── domain/                 # Internal domain logic
│   │   ├── <Entity>.kt        # Domain entities
│   │   └── <Entity>Repository.kt
│   └── infrastructure/         # Implementation details
│       ├── <Module>ServiceImpl.kt
│       ├── <Module>Controller.kt
│       └── <Module>EventListener.kt
```

### Module Naming
- **Modules**: Use singular nouns (e.g., `matter`, `document`, `audit`)
- **Events**: Follow pattern `<Entity><Action>Event` (e.g., `MatterCreatedEvent`)
- **Services**: Follow pattern `<Module>Service` for interface, `<Module>ServiceImpl` for implementation

## Event-Driven Communication Patterns

### Event Design Principles

1. **Immutable Events**: All events should be immutable data classes
2. **Complete Context**: Include all necessary information for processing
3. **Correlation IDs**: Use consistent user and entity IDs for tracing
4. **Externalization**: Use `@Externalized` for cross-system communication

### Event Categories

#### Domain Events
Business state changes within a module:
```kotlin
@Externalized("matter.created::#{matterId}")
data class MatterCreatedEvent(
    override val matterId: UUID,
    val caseNumber: String,
    val title: String,
    val clientId: UUID?,
    val assignedLawyerId: UUID,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
    override val userId: UUID
) : MatterEvent
```

#### Integration Events
Cross-module communication events:
```kotlin
@Externalized("document.uploaded::#{documentId}")
data class DocumentUploadedEvent(
    override val documentId: UUID,
    val fileId: String,
    val fileName: String,
    val contentType: String,
    val fileSize: Long,
    val matterId: UUID?,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
    override val userId: UUID
) : DocumentEvent
```

### Event Listeners

Use `@ApplicationModuleListener` for cross-module event handling:
```kotlin
@Component
@Transactional
class AuditEventListener(
    private val auditEventPublisher: AuditEventPublisher
) {
    @ApplicationModuleListener
    fun on(event: MatterCreatedEvent) {
        auditEventPublisher.publishMatterCreated(
            matterId = event.matterId,
            caseNumber = event.caseNumber,
            userId = event.userId
        )
    }
}
```

## Module Boundary Rules

### Allowed Dependencies
✅ **Permitted**:
- Module API packages (`modules.other.api`)
- Shared domain packages (`domain.common`, `domain.user`)
- Infrastructure packages (`config`, `util`)

❌ **Forbidden**:
- Direct domain access (`modules.other.domain`)
- Direct infrastructure access (`modules.other.infrastructure`)
- Cross-module service injection (use events instead)

### API Design Guidelines

1. **Service Interfaces**: Define clear public APIs
2. **DTO Layer**: Never expose domain entities directly
3. **Event Publication**: Publish events for all significant operations
4. **Error Handling**: Return specific error types in API responses

## Testing Strategies

### Module Boundary Tests
```kotlin
@Test
fun verifyModuleBoundaries() {
    val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
    modules.verify()
}
```

### Event Integration Tests
```kotlin
@Test
fun `should handle matter creation workflow`(scenario: Scenario) {
    scenario.publish(
        MatterCreatedEvent(
            matterId = UUID.randomUUID(),
            caseNumber = "TEST-001",
            // ... other fields
        )
    ).andWaitForEventOfType(DocumentUploadedEvent::class.java)
     .toArriveAndVerify { event ->
         // Verify cross-module interaction
     }
}
```

### Performance Benchmarks
```kotlin
@Test
fun `benchmark event processing latency`() {
    val startTime = System.nanoTime()
    applicationEventPublisher.publishEvent(event)
    val endTime = System.nanoTime()
    
    val latencyMs = (endTime - startTime) / 1_000_000
    assertTrue(latencyMs < 10.0, "Event latency should be under 10ms")
}
```

## Event Choreography Patterns

### Simple Workflow
```
1. User Action → Service Method
2. Service → Domain Update
3. Service → Event Publication
4. Other Modules → Event Listeners
5. Listeners → Cross-module Actions
```

### Complex Multi-Step Workflow
```
1. Matter Creation
   ↓ (MatterCreatedEvent)
2. Document Workspace Setup
   ↓ (DocumentUploadedEvent)
3. Initial Document Processing
   ↓ (DocumentProcessedEvent)
4. Matter Status Update
   ↓ (MatterStatusChangedEvent)
5. Audit Trail Completion
```

## Error Handling Patterns

### Event Processing Errors
```kotlin
@ApplicationModuleListener
fun on(event: DocumentProcessedEvent) {
    try {
        // Process event
    } catch (Exception e) {
        logger.error("Failed to process document event: ${event.documentId}", e)
        // Publish error event for monitoring
        applicationEventPublisher.publishEvent(
            DocumentProcessingFailedEvent(
                documentId = event.documentId,
                error = e.message,
                timestamp = LocalDateTime.now()
            )
        )
    }
}
```

### Circuit Breaker Pattern
```kotlin
@Component
class ResilientEventProcessor {
    
    @CircuitBreaker(name = "document-processing")
    @Retryable(value = [Exception::class], maxAttempts = 3)
    fun processDocument(event: DocumentUploadedEvent) {
        // Process with resilience
    }
}
```

## Performance Guidelines

### Event Volume Targets
- **Single Event Latency**: < 10ms (95th percentile)
- **Bulk Throughput**: > 100 events/second
- **Concurrent Processing**: > 200 events/second
- **Memory Usage**: < 10KB per event

### Optimization Strategies
1. **Async Processing**: Use `@Async` for non-critical events
2. **Batch Processing**: Group related events when possible
3. **Event Sourcing**: Consider for high-frequency events
4. **Monitoring**: Track event processing metrics

## Documentation Generation

### Automated Documentation
```kotlin
@Test
fun generateModuleDocumentation() {
    val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
    Documenter(modules)
        .writeDocumentation()
        .writeIndividualModulesAsPlantUml()
}
```

### Event Flow Documentation
Document major workflows with sequence diagrams:
```
@startuml
participant Client
participant MatterService
participant DocumentService
participant AuditService

Client -> MatterService: createMatter()
MatterService -> MatterService: save(matter)
MatterService -> EventBus: publish(MatterCreatedEvent)
EventBus -> DocumentService: on(MatterCreatedEvent)
DocumentService -> DocumentService: createWorkspace()
EventBus -> AuditService: on(MatterCreatedEvent)
AuditService -> AuditService: logCreation()
@enduml
```

## Migration to Microservices

### Module Extraction Steps
1. **Identify Boundaries**: Verify module has clean API
2. **Extract Database**: Move tables to separate schema
3. **Event Bridge**: Replace in-process events with message queue
4. **Service Deployment**: Deploy as separate service
5. **API Gateway**: Route requests to appropriate service

### Event System Migration
```kotlin
// Before: In-process events
@ApplicationModuleListener
fun on(event: MatterCreatedEvent) { }

// After: External message broker
@EventListener
@MessageEndpoint
fun on(@Payload event: MatterCreatedEvent) { }
```

## Monitoring and Observability

### Event Metrics
- Event publication rates
- Event processing latency
- Failed event processing counts
- Cross-module dependency health

### Tracing
Use correlation IDs for distributed tracing:
```kotlin
data class MatterCreatedEvent(
    val correlationId: String = UUID.randomUUID().toString(),
    // ... other fields
)
```

## Best Practices Summary

### ✅ DO
- Use events for all cross-module communication
- Design events as immutable data classes
- Include complete context in events
- Test module boundaries regularly
- Monitor event processing performance
- Document event flows and choreography

### ❌ DON'T
- Access other modules' domain classes directly
- Inject services across module boundaries
- Create tightly coupled event chains
- Ignore event processing errors
- Skip performance benchmarking
- Expose internal implementation details

## Example: Adding a New Module

1. **Create Package Structure**:
   ```
   modules/notification/
   ├── api/NotificationService.kt
   ├── domain/Notification.kt
   └── infrastructure/NotificationServiceImpl.kt
   ```

2. **Define Events**:
   ```kotlin
   @Externalized("notification.sent::#{notificationId}")
   data class NotificationSentEvent(...)
   ```

3. **Create Listeners**:
   ```kotlin
   @ApplicationModuleListener
   fun on(event: MatterCreatedEvent) {
       // Send notification
   }
   ```

4. **Add Tests**:
   ```kotlin
   @Test
   fun verifyNotificationModule() {
       // Module boundary tests
   }
   ```

5. **Update Documentation**:
   - Add to module structure diagram
   - Document new event flows
   - Update performance benchmarks

This pattern ensures consistent, maintainable, and scalable module development within the Spring Modulith architecture.