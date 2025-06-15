---
task_id: T07_S01
sprint_sequence_id: S01
status: open
complexity: High
last_updated: 2025-06-15T12:00:00Z
---

# Task: Comprehensive Audit Logging System

## Description

Implement a comprehensive audit logging system for the AsterManagement backend API that captures all critical business operations, user actions, and security events with proper compliance and traceability. This task establishes a robust audit infrastructure using Spring Data Auditing, custom event handling, and aspect-oriented programming to ensure all matter changes, document access, and user activities are properly logged with full context.

The audit system must support legal compliance requirements, performance optimization for high-volume logging, and integration with the existing Spring Boot + Spring Modulith architecture. The system will provide immutable audit trails that can be used for security analysis, compliance reporting, and operational monitoring.

Based on the existing Spring Boot project structure, we need to establish:
- Spring Data Auditing configuration with custom AuditorAware implementation
- Event-driven audit logging using Spring's Application Events
- Aspect-oriented programming for transparent audit capture
- Dedicated audit tables with proper indexing and retention policies
- Integration with authentication/authorization system for user context
- Performance optimizations for high-volume audit data

## Goal / Objectives

- Create a comprehensive audit logging system that captures all critical business operations
- Implement immutable audit trails that meet legal compliance requirements
- Establish performance-optimized audit data storage and retrieval patterns
- Integrate seamlessly with Spring Security for proper user context tracking
- Support both real-time audit event processing and historical audit reporting
- Provide audit trail APIs for compliance reporting and security analysis

## Acceptance Criteria

- [ ] Spring Data Auditing configured with custom AuditorAware implementation
- [ ] All matter operations audited with full context (who, what, when, why)
- [ ] Document access and modifications tracked with file metadata
- [ ] User authentication and authorization events captured
- [ ] Custom audit events for business-specific operations (status changes, approvals)
- [ ] Audit data stored in dedicated tables with proper indexing
- [ ] Aspect-oriented audit capture for transparent logging
- [ ] Event-driven architecture for real-time audit processing
- [ ] Audit trail APIs for compliance reporting (/v1/audit/*)
- [ ] Performance optimizations for high-volume logging scenarios
- [ ] Audit data retention and archival policies implemented
- [ ] Integration tests validate audit capture across all operations

## Subtasks

- [ ] Analyze existing Spring Boot project for audit integration points
- [ ] Design audit data model and database schema
- [ ] Configure Spring Data Auditing with custom AuditorAware
- [ ] Create audit event hierarchy and event publishing infrastructure
- [ ] Implement aspect-oriented audit capture for service layer operations
- [ ] Create dedicated audit tables with proper indexes and constraints
- [ ] Develop audit trail REST APIs for compliance reporting
- [ ] Integrate audit logging with authentication and authorization system
- [ ] Implement performance optimizations (async processing, batching)
- [ ] Create audit data retention and cleanup mechanisms
- [ ] Write comprehensive integration tests for audit capture
- [ ] Document audit logging patterns and compliance features

## Technical Guidance

### Existing Spring Boot Audit Analysis

The project currently has:
- **Spring Data JPA** with Hibernate ORM 6.6.15 and auditing capabilities
- **Spring Security** for authentication context integration
- **Spring Modulith** for event-driven architecture support
- **Spring Boot Actuator** for operational monitoring
- **PostgreSQL** for transactional audit data storage
- **Redis** for session management and audit event caching

Key dependencies already configured:
- `spring-boot-starter-data-jpa` (includes Spring Data Auditing)
- `spring-boot-starter-security` (for SecurityContext integration)
- `spring-modulith-starter-jpa` (for event-driven patterns)
- `spring-boot-starter-actuator` (for audit metrics)

### Spring Data Auditing Configuration

**Core Auditing Configuration:**
```kotlin
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
@EnableJpaRepositories(basePackages = ["dev.ryuzu.astermanagement"])
class AuditConfiguration {
    
    @Bean
    fun auditorProvider(): AuditorAware<String> = SecurityAuditorAware()
    
    @Bean
    fun auditingDateTimeProvider(): DateTimeProvider = CurrentDateTimeProvider.INSTANCE
}

@Component
class SecurityAuditorAware : AuditorAware<String> {
    
    override fun getCurrentAuditor(): Optional<String> {
        return SecurityContextHolder.getContext()
            .authentication
            ?.let { auth ->
                when {
                    auth.principal is UserDetails -> Optional.of((auth.principal as UserDetails).username)
                    auth.name != null -> Optional.of(auth.name)
                    else -> Optional.of("system")
                }
            } ?: Optional.of("anonymous")
    }
}
```

**Base Auditable Entity:**
```kotlin
@MappedSuperclass
@EntityListeners(AuditingEntityListener::class)
abstract class AuditableEntity {
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    lateinit var createdAt: OffsetDateTime
    
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    lateinit var updatedAt: OffsetDateTime
    
    @CreatedBy
    @Column(name = "created_by", updatable = false, length = 255)
    var createdBy: String? = null
    
    @LastModifiedBy
    @Column(name = "last_modified_by", length = 255)
    var lastModifiedBy: String? = null
    
    @Version
    @Column(name = "version")
    var version: Long = 0
}
```

### Custom Audit Event Handling

**Audit Event Hierarchy:**
```kotlin
sealed class AuditEvent(
    val eventType: AuditEventType,
    val entityType: String,
    val entityId: String,
    val userId: String,
    val timestamp: OffsetDateTime = OffsetDateTime.now(),
    val metadata: Map<String, Any> = emptyMap()
) {
    data class MatterCreated(
        val matterId: String,
        val matterTitle: String,
        val clientId: String,
        val assignedLawyer: String,
        override val userId: String
    ) : AuditEvent(AuditEventType.MATTER_CREATED, "Matter", matterId, userId)
    
    data class MatterStatusChanged(
        val matterId: String,
        val oldStatus: String,
        val newStatus: String,
        val reason: String?,
        override val userId: String
    ) : AuditEvent(AuditEventType.MATTER_STATUS_CHANGED, "Matter", matterId, userId)
    
    data class DocumentAccessed(
        val documentId: String,
        val matterId: String,
        val accessType: DocumentAccessType,
        val ipAddress: String,
        override val userId: String
    ) : AuditEvent(AuditEventType.DOCUMENT_ACCESSED, "Document", documentId, userId)
    
    data class SecurityEvent(
        val eventSubType: SecurityEventType,
        val resourceAccessed: String?,
        val success: Boolean,
        val failureReason: String?,
        override val userId: String
    ) : AuditEvent(AuditEventType.SECURITY_EVENT, "Security", userId, userId)
}

enum class AuditEventType {
    MATTER_CREATED, MATTER_UPDATED, MATTER_STATUS_CHANGED, MATTER_DELETED,
    DOCUMENT_UPLOADED, DOCUMENT_ACCESSED, DOCUMENT_MODIFIED, DOCUMENT_DELETED,
    USER_LOGIN, USER_LOGOUT, AUTHENTICATION_FAILED, AUTHORIZATION_DENIED,
    SECURITY_EVENT, SYSTEM_EVENT
}

enum class DocumentAccessType { VIEW, DOWNLOAD, PRINT, EXPORT }
enum class SecurityEventType { LOGIN_SUCCESS, LOGIN_FAILED, TOKEN_REFRESH, PERMISSION_DENIED }
```

**Event Publishing Infrastructure:**
```kotlin
@Service
class AuditEventPublisher(
    private val applicationEventPublisher: ApplicationEventPublisher
) {
    
    fun publishMatterCreated(matter: Matter, userId: String) {
        val event = AuditEvent.MatterCreated(
            matterId = matter.id.toString(),
            matterTitle = matter.title,
            clientId = matter.clientId,
            assignedLawyer = matter.assignedLawyer,
            userId = userId
        )
        applicationEventPublisher.publishEvent(event)
    }
    
    fun publishMatterStatusChanged(
        matterId: String,
        oldStatus: String,
        newStatus: String,
        reason: String?,
        userId: String
    ) {
        val event = AuditEvent.MatterStatusChanged(matterId, oldStatus, newStatus, reason, userId)
        applicationEventPublisher.publishEvent(event)
    }
    
    fun publishDocumentAccessed(
        documentId: String,
        matterId: String,
        accessType: DocumentAccessType,
        request: HttpServletRequest,
        userId: String
    ) {
        val event = AuditEvent.DocumentAccessed(
            documentId = documentId,
            matterId = matterId,
            accessType = accessType,
            ipAddress = getClientIpAddress(request),
            userId = userId
        )
        applicationEventPublisher.publishEvent(event)
    }
    
    private fun getClientIpAddress(request: HttpServletRequest): String {
        return request.getHeader("X-Forwarded-For")
            ?: request.getHeader("X-Real-IP")
            ?: request.remoteAddr
    }
}
```

### Database Audit Table Design

**Audit Log Entity:**
```kotlin
@Entity
@Table(
    name = "audit_logs",
    indexes = [
        Index(name = "idx_audit_entity_type_id", columnList = "entity_type,entity_id"),
        Index(name = "idx_audit_user_timestamp", columnList = "user_id,event_timestamp"),
        Index(name = "idx_audit_event_type", columnList = "event_type"),
        Index(name = "idx_audit_timestamp", columnList = "event_timestamp")
    ]
)
class AuditLog(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,
    
    @Column(name = "event_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    val eventType: AuditEventType,
    
    @Column(name = "entity_type", nullable = false, length = 50)
    val entityType: String,
    
    @Column(name = "entity_id", nullable = false, length = 255)
    val entityId: String,
    
    @Column(name = "user_id", nullable = false, length = 255)
    val userId: String,
    
    @Column(name = "event_timestamp", nullable = false)
    val eventTimestamp: OffsetDateTime,
    
    @Column(name = "ip_address", length = 45)
    val ipAddress: String? = null,
    
    @Column(name = "user_agent", columnDefinition = "TEXT")
    val userAgent: String? = null,
    
    @Column(name = "session_id", length = 255)
    val sessionId: String? = null,
    
    @Column(name = "event_details", columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    val eventDetails: Map<String, Any> = emptyMap(),
    
    @Column(name = "old_values", columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    val oldValues: Map<String, Any>? = null,
    
    @Column(name = "new_values", columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    val newValues: Map<String, Any>? = null,
    
    @Column(name = "correlation_id", length = 255)
    val correlationId: String? = null
)
```

**Audit Log Repository:**
```kotlin
@Repository
interface AuditLogRepository : JpaRepository<AuditLog, UUID>, JpaSpecificationExecutor<AuditLog> {
    
    fun findByEntityTypeAndEntityIdOrderByEventTimestampDesc(
        entityType: String,
        entityId: String,
        pageable: Pageable
    ): Page<AuditLog>
    
    fun findByUserIdAndEventTimestampBetween(
        userId: String,
        startTime: OffsetDateTime,
        endTime: OffsetDateTime,
        pageable: Pageable
    ): Page<AuditLog>
    
    fun findByEventTypeAndEventTimestampAfter(
        eventType: AuditEventType,
        timestamp: OffsetDateTime
    ): List<AuditLog>
    
    @Query("""
        SELECT al FROM AuditLog al 
        WHERE al.entityType = :entityType 
        AND al.entityId = :entityId 
        AND al.eventType IN :eventTypes
        ORDER BY al.eventTimestamp DESC
    """)
    fun findEntityAuditTrail(
        @Param("entityType") entityType: String,
        @Param("entityId") entityId: String,
        @Param("eventTypes") eventTypes: List<AuditEventType>,
        pageable: Pageable
    ): Page<AuditLog>
    
    @Modifying
    @Query("DELETE FROM AuditLog al WHERE al.eventTimestamp < :cutoffDate")
    fun deleteOldAuditLogs(@Param("cutoffDate") cutoffDate: OffsetDateTime): Int
}
```

### Integration with Existing Spring Modulith Architecture

**Audit Event Listener Configuration:**
```kotlin
@Component
@ApplicationModuleListener
class AuditEventListener(
    private val auditLogService: AuditLogService,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(AuditEventListener::class.java)
    
    @EventListener
    @Async("auditExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun handleAuditEvent(event: AuditEvent) {
        try {
            auditLogService.saveAuditLog(event)
        } catch (e: Exception) {
            logger.error("Failed to save audit log for event: ${event.eventType}", e)
            // Could publish to dead letter queue or alternative storage
        }
    }
    
    @EventListener
    fun handleAuthenticationSuccessEvent(event: AuthenticationSuccessEvent) {
        val auditEvent = AuditEvent.SecurityEvent(
            eventSubType = SecurityEventType.LOGIN_SUCCESS,
            resourceAccessed = null,
            success = true,
            failureReason = null,
            userId = event.authentication.name
        )
        auditLogService.saveAuditLog(auditEvent)
    }
    
    @EventListener
    fun handleAuthenticationFailureEvent(event: AbstractAuthenticationFailureEvent) {
        val auditEvent = AuditEvent.SecurityEvent(
            eventSubType = SecurityEventType.LOGIN_FAILED,
            resourceAccessed = null,
            success = false,
            failureReason = event.exception.message,
            userId = event.authentication.name
        )
        auditLogService.saveAuditLog(auditEvent)
    }
}
```

## Implementation Notes

### Step-by-Step Implementation Approach

1. **Audit Infrastructure Setup** (Priority: High)
   ```kotlin
   // Create audit configuration
   // src/main/kotlin/dev/ryuzu/astermanagement/config/AuditConfiguration.kt
   @Configuration
   @EnableJpaAuditing(auditorAwareRef = "auditorProvider")
   class AuditConfiguration {
       
       @Bean
       fun auditorProvider(): AuditorAware<String> = SecurityAuditorAware()
       
       @Bean("auditExecutor")
       fun auditTaskExecutor(): TaskExecutor {
           val executor = ThreadPoolTaskExecutor()
           executor.corePoolSize = 2
           executor.maxPoolSize = 10
           executor.queueCapacity = 100
           executor.setThreadNamePrefix("audit-")
           executor.setRejectedExecutionHandler(ThreadPoolExecutor.CallerRunsPolicy())
           executor.initialize()
           return executor
       }
   }
   ```

2. **Database Schema Migration** (Priority: High)
   ```sql
   -- V007__Create_audit_tables.sql
   CREATE TABLE audit_logs (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       event_type VARCHAR(50) NOT NULL,
       entity_type VARCHAR(50) NOT NULL,
       entity_id VARCHAR(255) NOT NULL,
       user_id VARCHAR(255) NOT NULL,
       event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
       ip_address INET,
       user_agent TEXT,
       session_id VARCHAR(255),
       event_details JSONB DEFAULT '{}',
       old_values JSONB,
       new_values JSONB,
       correlation_id VARCHAR(255)
   );
   
   -- Performance indexes
   CREATE INDEX idx_audit_entity_type_id ON audit_logs(entity_type, entity_id);
   CREATE INDEX idx_audit_user_timestamp ON audit_logs(user_id, event_timestamp DESC);
   CREATE INDEX idx_audit_event_type ON audit_logs(event_type);
   CREATE INDEX idx_audit_timestamp ON audit_logs(event_timestamp DESC);
   CREATE INDEX idx_audit_correlation ON audit_logs(correlation_id) WHERE correlation_id IS NOT NULL;
   
   -- JSONB indexes for event details
   CREATE INDEX idx_audit_event_details_gin ON audit_logs USING GIN(event_details);
   ```

3. **Aspect-Oriented Audit Capture** (Priority: Medium)
   ```kotlin
   @Aspect
   @Component
   class AuditAspect(
       private val auditEventPublisher: AuditEventPublisher,
       private val objectMapper: ObjectMapper
   ) {
       
       @AfterReturning(pointcut = "@annotation(auditLog)", returning = "result")
       fun auditMethodExecution(joinPoint: ProceedingJoinPoint, auditLog: AuditLog, result: Any?) {
           val methodName = joinPoint.signature.name
           val args = joinPoint.args
           val userId = getCurrentUserId()
           
           // Capture method execution details
           val auditEvent = createAuditEvent(auditLog.eventType, methodName, args, result, userId)
           auditEventPublisher.publishEvent(auditEvent)
       }
       
       @Around("@annotation(auditMatterOperation)")
       fun auditMatterOperation(joinPoint: ProceedingJoinPoint, auditMatterOperation: AuditMatterOperation): Any? {
           val startTime = System.currentTimeMillis()
           val userId = getCurrentUserId()
           val correlationId = UUID.randomUUID().toString()
           
           return try {
               val result = joinPoint.proceed()
               val duration = System.currentTimeMillis() - startTime
               
               // Publish success audit event
               auditEventPublisher.publishMatterOperationSuccess(
                   operation = auditMatterOperation.operation,
                   result = result,
                   duration = duration,
                   userId = userId,
                   correlationId = correlationId
               )
               
               result
           } catch (e: Exception) {
               // Publish failure audit event
               auditEventPublisher.publishMatterOperationFailure(
                   operation = auditMatterOperation.operation,
                   exception = e,
                   userId = userId,
                   correlationId = correlationId
               )
               throw e
           }
       }
   }
   
   @Target(AnnotationTarget.FUNCTION)
   @Retention(AnnotationRetention.RUNTIME)
   annotation class AuditLog(val eventType: AuditEventType)
   
   @Target(AnnotationTarget.FUNCTION)
   @Retention(AnnotationRetention.RUNTIME)
   annotation class AuditMatterOperation(val operation: String)
   ```

### Event-Driven Audit Architecture

**Audit Service Implementation:**
```kotlin
@Service
@Transactional
class AuditLogService(
    private val auditLogRepository: AuditLogRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(AuditLogService::class.java)
    
    fun saveAuditLog(event: AuditEvent) {
        val auditLog = AuditLog(
            eventType = event.eventType,
            entityType = event.entityType,
            entityId = event.entityId,
            userId = event.userId,
            eventTimestamp = event.timestamp,
            eventDetails = event.metadata,
            correlationId = event.metadata["correlationId"] as? String
        )
        
        auditLogRepository.save(auditLog)
        logger.debug("Saved audit log: ${event.eventType} for entity ${event.entityType}:${event.entityId}")
    }
    
    fun getEntityAuditTrail(
        entityType: String,
        entityId: String,
        eventTypes: List<AuditEventType> = emptyList(),
        pageable: Pageable
    ): Page<AuditLog> {
        return if (eventTypes.isEmpty()) {
            auditLogRepository.findByEntityTypeAndEntityIdOrderByEventTimestampDesc(
                entityType, entityId, pageable
            )
        } else {
            auditLogRepository.findEntityAuditTrail(entityType, entityId, eventTypes, pageable)
        }
    }
    
    fun getUserActivityLog(
        userId: String,
        startTime: OffsetDateTime,
        endTime: OffsetDateTime,
        pageable: Pageable
    ): Page<AuditLog> {
        return auditLogRepository.findByUserIdAndEventTimestampBetween(userId, startTime, endTime, pageable)
    }
    
    @Scheduled(cron = "0 0 2 * * ?") // Daily at 2 AM
    @Transactional
    fun cleanupOldAuditLogs() {
        val cutoffDate = OffsetDateTime.now().minusMonths(24) // Keep 2 years
        val deletedCount = auditLogRepository.deleteOldAuditLogs(cutoffDate)
        logger.info("Cleaned up $deletedCount old audit log entries")
    }
}
```

### Performance Considerations for High-Volume Logging

**Async Processing Configuration:**
```kotlin
@Configuration
@EnableAsync
class AsyncConfiguration : AsyncConfigurer {
    
    override fun getAsyncExecutor(): Executor {
        val executor = ThreadPoolTaskExecutor()
        executor.corePoolSize = 5
        executor.maxPoolSize = 20
        executor.queueCapacity = 500
        executor.setThreadNamePrefix("async-audit-")
        executor.setRejectedExecutionHandler(ThreadPoolExecutor.CallerRunsPolicy())
        executor.initialize()
        return executor
    }
    
    override fun getAsyncUncaughtExceptionHandler(): AsyncUncaughtExceptionHandler {
        return CustomAsyncExceptionHandler()
    }
}

@Component
class CustomAsyncExceptionHandler : AsyncUncaughtExceptionHandler {
    private val logger = LoggerFactory.getLogger(CustomAsyncExceptionHandler::class.java)
    
    override fun handleUncaughtException(throwable: Throwable, method: Method, vararg objects: Any?) {
        logger.error("Async audit logging error in method ${method.name}", throwable)
        // Could send to monitoring system or dead letter queue
    }
}
```

**Batch Processing for High Volume:**
```kotlin
@Service
class BatchAuditProcessor(
    private val auditLogRepository: AuditLogRepository,
    private val redisTemplate: RedisTemplate<String, String>
) {
    private val auditQueue = ArrayBlockingQueue<AuditEvent>(1000)
    private val batchSize = 50
    
    @Scheduled(fixedDelay = 5000) // Process every 5 seconds
    fun processBatch() {
        val events = mutableListOf<AuditEvent>()
        auditQueue.drainTo(events, batchSize)
        
        if (events.isNotEmpty()) {
            val auditLogs = events.map { event ->
                AuditLog(
                    eventType = event.eventType,
                    entityType = event.entityType,
                    entityId = event.entityId,
                    userId = event.userId,
                    eventTimestamp = event.timestamp,
                    eventDetails = event.metadata
                )
            }
            
            auditLogRepository.saveAll(auditLogs)
        }
    }
    
    fun queueAuditEvent(event: AuditEvent): Boolean {
        return auditQueue.offer(event)
    }
}
```

### Legal Compliance Requirements

**Immutable Audit Records:**
```kotlin
@Entity
@Immutable
@Table(name = "audit_logs")
class AuditLog(/* ... */) {
    
    @PreUpdate
    fun preventUpdate() {
        throw IllegalStateException("Audit logs are immutable and cannot be updated")
    }
    
    @PreRemove
    fun preventDeletion() {
        throw IllegalStateException("Audit logs cannot be deleted")
    }
}
```

**Compliance Reporting APIs:**
```kotlin
@RestController
@RequestMapping("/v1/audit")
@PreAuthorize("hasAuthority('audit:read')")
class AuditController(
    private val auditLogService: AuditLogService
) {
    
    @GetMapping("/entity/{entityType}/{entityId}")
    fun getEntityAuditTrail(
        @PathVariable entityType: String,
        @PathVariable entityId: String,
        @RequestParam(required = false) eventTypes: List<AuditEventType>?,
        @PageableDefault(size = 50) pageable: Pageable
    ): ResponseEntity<Page<AuditLogDto>> {
        val auditTrail = auditLogService.getEntityAuditTrail(
            entityType, entityId, eventTypes ?: emptyList(), pageable
        )
        return ResponseEntity.ok(auditTrail.map { it.toDto() })
    }
    
    @GetMapping("/user/{userId}")
    fun getUserActivityLog(
        @PathVariable userId: String,
        @RequestParam startTime: OffsetDateTime,
        @RequestParam endTime: OffsetDateTime,
        @PageableDefault(size = 100) pageable: Pageable
    ): ResponseEntity<Page<AuditLogDto>> {
        val activityLog = auditLogService.getUserActivityLog(userId, startTime, endTime, pageable)
        return ResponseEntity.ok(activityLog.map { it.toDto() })
    }
    
    @GetMapping("/compliance-report")
    @PreAuthorize("hasAuthority('compliance:read')")
    fun generateComplianceReport(
        @RequestParam startDate: LocalDate,
        @RequestParam endDate: LocalDate,
        @RequestParam(required = false) entityTypes: List<String>?
    ): ResponseEntity<ComplianceReportDto> {
        val report = auditLogService.generateComplianceReport(startDate, endDate, entityTypes)
        return ResponseEntity.ok(report)
    }
}
```

### Integration Testing Strategy

**Comprehensive Audit Integration Tests:**
```kotlin
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT) 
@Testcontainers
@TestMethodOrder(OrderAnnotation::class)
class AuditLoggingIntegrationTest {
    
    @Container
    static val postgres = PostgreSQLContainer<Nothing>("postgres:15").apply {
        withDatabaseName("astermanagement_test")
        withUsername("test")
        withPassword("test")
    }
    
    @Test
    @Order(1)
    fun `should audit matter creation with proper context`() {
        // Given
        val matterRequest = CreateMatterRequest("Test Legal Matter", "CLIENT_001")
        
        // When
        val response = restTemplate.exchange(
            "/v1/matters",
            HttpMethod.POST,
            HttpEntity(matterRequest, authHeaders),
            Matter::class.java
        )
        
        // Then
        assertThat(response.statusCode).isEqualTo(HttpStatus.CREATED)
        
        // Verify audit log was created
        await().atMost(Duration.ofSeconds(5)).untilAsserted {
            val auditLogs = auditLogRepository.findByEventType(AuditEventType.MATTER_CREATED)
            assertThat(auditLogs).hasSize(1)
            
            val auditLog = auditLogs.first()
            assertThat(auditLog.entityType).isEqualTo("Matter")
            assertThat(auditLog.userId).isEqualTo("lawyer@example.com")
            assertThat(auditLog.eventDetails["matterTitle"]).isEqualTo("Test Legal Matter")
        }
    }
    
    @Test
    @Order(2)
    fun `should audit document access with IP and user agent`() {
        // Given
        val documentId = "doc-123"
        val headers = HttpHeaders()
        headers.set("User-Agent", "Mozilla/5.0 Test Browser")
        headers.set("X-Forwarded-For", "192.168.1.100")
        headers.addAll(authHeaders)
        
        // When
        restTemplate.exchange(
            "/v1/documents/$documentId/download",
            HttpMethod.GET,
            HttpEntity<Void>(headers),
            ByteArray::class.java
        )
        
        // Then
        await().atMost(Duration.ofSeconds(5)).untilAsserted {
            val auditLogs = auditLogRepository.findByEventType(AuditEventType.DOCUMENT_ACCESSED)
            assertThat(auditLogs).isNotEmpty()
            
            val auditLog = auditLogs.first()
            assertThat(auditLog.entityId).isEqualTo(documentId)
            assertThat(auditLog.ipAddress).isEqualTo("192.168.1.100")
            assertThat(auditLog.userAgent).isEqualTo("Mozilla/5.0 Test Browser")
        }
    }
}
```

## Output Log

*(This section is populated as work progresses on the task)*

[2025-06-15 12:00:00] Task created with comprehensive audit logging system implementation plan