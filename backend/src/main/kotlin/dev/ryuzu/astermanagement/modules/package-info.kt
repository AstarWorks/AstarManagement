/**
 * Spring Modulith Event-Driven Architecture Patterns and Guidelines
 * 
 * This package contains the modular architecture implementation using Spring Modulith,
 * with comprehensive event-driven communication patterns between modules.
 * 
 * ## Module Structure
 * 
 * Each module follows a consistent 3-layer architecture:
 * 
 * ```
 * modules/
 * ├── <module-name>/
 * │   ├── api/                 # Public API (interfaces, DTOs, events)
 * │   ├── domain/              # Domain entities and repositories  
 * │   └── infrastructure/      # Controllers and service implementations
 * ```
 * 
 * ## Event-Driven Communication Patterns
 * 
 * ### 1. Event Types and Conventions
 * 
 * **Domain Events**: Represent business state changes
 * - Naming: `<Entity><Action>Event` (e.g., `MatterCreatedEvent`)
 * - Immutable data classes with all necessary context
 * - Include correlation IDs for tracing
 * - Use `@Externalized` annotation for inter-module events
 * 
 * Example:
 * ```kotlin
 * @Externalized("matter.created::#{matterId}")
 * data class MatterCreatedEvent(
 *     override val matterId: UUID,
 *     val caseNumber: String,
 *     val title: String,
 *     override val timestamp: LocalDateTime = LocalDateTime.now(),
 *     override val userId: UUID
 * ) : MatterEvent
 * ```
 * 
 * ### 2. Event Choreography Patterns
 * 
 * **Pattern 1: Entity Creation Workflow**
 * ```
 * 1. UI -> MatterController.createMatter()
 * 2. MatterModule publishes MatterCreatedEvent
 * 3. DocumentModule listens and prepares document workspace
 * 4. AuditModule logs the creation
 * 5. NotificationModule sends confirmation (future)
 * ```
 * 
 * **Pattern 2: Cross-Module Data Synchronization**
 * ```
 * 1. DocumentModule publishes DocumentUploadedEvent
 * 2. MatterModule updates document count/metadata
 * 3. AuditModule creates audit trail
 * 4. SearchModule indexes document content (future)
 * ```
 * 
 * **Pattern 3: Status-Based Workflow Triggers**
 * ```
 * 1. MatterModule publishes MatterStatusChangedEvent
 * 2. DocumentModule enables/disables workflows based on status
 * 3. NotificationModule sends status notifications (future)
 * 4. ReportingModule updates metrics (future)
 * ```
 * 
 * ### 3. Event Listener Implementation
 * 
 * Use `@ApplicationModuleListener` for cross-module event handling:
 * 
 * ```kotlin
 * @Component
 * @Transactional
 * class DocumentEventListener(
 *     private val documentService: DocumentService,
 *     private val auditEventPublisher: AuditEventPublisher
 * ) {
 *     @ApplicationModuleListener
 *     fun on(event: MatterCreatedEvent) {
 *         // Handle matter creation in document module
 *         logger.info("Processing MatterCreatedEvent for matter: ${event.matterId}")
 *         // ... implementation
 *     }
 * }
 * ```
 * 
 * ## Module Boundaries and Dependencies
 * 
 * ### Allowed Dependencies
 * 
 * ✅ **Controllers** can depend on multiple module APIs
 * ✅ **Modules** can depend on other module APIs (through interfaces)
 * ✅ **Event listeners** can call other module APIs
 * ✅ **Shared utilities** in common packages
 * 
 * ### Forbidden Dependencies
 * 
 * ❌ **Direct domain-to-domain** dependencies
 * ❌ **Infrastructure-to-infrastructure** cross-module calls
 * ❌ **Circular module** dependencies
 * ❌ **Direct repository** access across modules
 * 
 * ## Testing Strategies
 * 
 * ### 1. Module Boundary Tests
 * ```kotlin
 * @ApplicationModuleTest
 * class ModularityTests {
 *     @Test
 *     fun verifyModularStructure() {
 *         val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
 *         modules.verify()
 *     }
 * }
 * ```
 * 
 * ### 2. Event Choreography Tests
 * ```kotlin
 * @Test
 * fun `should handle matter creation choreography`(scenario: Scenario) {
 *     scenario.publish(MatterCreatedEvent(...))
 *         .andWaitForEventOfType(DocumentUploadedEvent::class.java)
 *         .matching { event -> event.fileName.contains("workspace") }
 *         .toArriveAndVerify { event -> /* assertions */ }
 * }
 * ```
 * 
 * ### 3. Integration Tests
 * - Test complete business workflows across modules
 * - Verify event publishing and handling
 * - Ensure module isolation and proper API usage
 * 
 * ## Performance Considerations
 * 
 * ### Event Processing Guidelines
 * - **Asynchronous by default**: Use `@ApplicationModuleListener` for async processing
 * - **Lightweight listeners**: Keep event handlers fast and simple
 * - **Error isolation**: Handle exceptions gracefully to prevent cascade failures
 * - **Circuit breakers**: Implement for inter-module communication resilience
 * 
 * ### Monitoring and Observability
 * - Monitor event processing latency (target: < 10ms per event)
 * - Track event throughput (target: > 100 events/second)
 * - Alert on event processing failures
 * - Measure memory usage during high event volumes
 * 
 * ## Best Practices
 * 
 * ### 1. Event Design
 * - Include all necessary context in events
 * - Use immutable data structures
 * - Version events for backward compatibility
 * - Include correlation IDs for tracing
 * 
 * ### 2. Module Communication
 * - Prefer events over direct API calls for workflow coordination
 * - Use APIs for synchronous data queries
 * - Implement proper error handling and retry mechanisms
 * - Design for eventual consistency
 * 
 * ### 3. Documentation
 * - Auto-generate module documentation on startup
 * - Document event flow diagrams for complex workflows
 * - Maintain module dependency graphs
 * - Create examples for common patterns
 * 
 * ## Future Microservices Migration
 * 
 * This modular monolith design enables easy extraction to microservices:
 * 
 * 1. **Module boundaries** become service boundaries
 * 2. **@Externalized events** become message queue events
 * 3. **Module APIs** become REST/gRPC APIs
 * 4. **Event choreography** patterns remain unchanged
 * 
 * ## Related Documentation
 * 
 * - Spring Modulith Reference: https://docs.spring.io/spring-modulith/docs/current/reference/html/
 * - Module documentation: build/spring-modulith-docs/
 * - Architecture overview: .simone/01_PROJECT_DOCS/ARCHITECTURE.md
 * 
 * @since 1.0.0
 * @author Aster Management Team
 */
package dev.ryuzu.astermanagement.modules