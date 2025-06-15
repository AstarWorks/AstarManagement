---
task_id: T05_S01
sprint_sequence_id: S01
status: open
complexity: High
last_updated: 2025-06-15T12:00:00Z
---

# Task: Status Transition Validation System

## Description

Implement a comprehensive status transition validation system for the Aster Management platform, focusing on matter/case status workflows with proper business rule enforcement, role-based access control, and audit trail integration. This system will ensure that status changes follow defined business processes, maintain data integrity, and provide clear feedback when transitions are invalid.

The status transition system will serve as a critical component of the business logic layer, implementing state machine patterns to enforce workflow rules, validate user permissions for status changes, and maintain comprehensive audit logs. It will integrate with the existing Spring Security framework to ensure role-based validation and support complex business scenarios like conditional transitions based on matter type, priority, or current assignee.

## Goal / Objectives

Establish a robust status transition validation framework that provides:
- State machine-based status transition validation with configurable rules
- Role-based permission checking for each transition type
- Comprehensive audit logging for all status changes with user context
- Clear error messages and validation feedback for invalid transitions
- Integration with existing matter management and user systems
- Extensible architecture to support future workflow customizations
- Performance-optimized validation with caching for frequent checks

## Acceptance Criteria

- [ ] Status transition state machine implemented with all valid transitions defined
- [ ] Role-based permission validation integrated with Spring Security context
- [ ] Business rule engine for conditional transitions based on matter properties
- [ ] Comprehensive audit trail with user, timestamp, and reason logging
- [ ] Custom exceptions for different validation failure scenarios
- [ ] Integration with matter service layer for seamless status updates
- [ ] Unit tests covering all transition scenarios and edge cases
- [ ] Integration tests with Spring Security context and database persistence
- [ ] Performance testing for high-volume status transition scenarios
- [ ] Documentation of status transition matrix and business rules
- [ ] Error message internationalization (JP/EN) support
- [ ] Event publishing for status change notifications

## Subtasks

- [ ] Define matter status enumeration with transition capabilities
- [ ] Implement state machine pattern for status transition validation
- [ ] Create role-based permission checking service
- [ ] Develop business rule engine for conditional transitions
- [ ] Implement audit service for status change logging
- [ ] Create custom exception hierarchy for validation failures
- [ ] Integrate with existing matter service and repository layers
- [ ] Add status transition validation to REST API endpoints
- [ ] Implement caching strategy for frequently accessed validation rules
- [ ] Create comprehensive unit tests for all validation scenarios
- [ ] Develop integration tests with Spring Security and JPA
- [ ] Add performance tests for bulk status transition operations
- [ ] Document status transition matrix and business rules
- [ ] Implement internationalized error messages
- [ ] Add event publishing for status change notifications
- [ ] Create migration scripts for existing data validation

## Technical Guidance

### State Machine Pattern Implementation

**Status Enumeration with Transition Logic:**
```kotlin
enum class MatterStatus(val displayName: String) {
    PENDING("Pending"),
    IN_PROGRESS("In Progress"),
    AWAITING_CLIENT("Awaiting Client"),
    AWAITING_COURT("Awaiting Court"),
    UNDER_REVIEW("Under Review"),
    COMPLETED("Completed"),
    CANCELLED("Cancelled"),
    ON_HOLD("On Hold");

    companion object {
        // Define valid transitions for each status
        private val validTransitions = mapOf(
            PENDING to setOf(IN_PROGRESS, CANCELLED, ON_HOLD),
            IN_PROGRESS to setOf(AWAITING_CLIENT, AWAITING_COURT, UNDER_REVIEW, COMPLETED, CANCELLED, ON_HOLD),
            AWAITING_CLIENT to setOf(IN_PROGRESS, CANCELLED, ON_HOLD),
            AWAITING_COURT to setOf(IN_PROGRESS, UNDER_REVIEW, CANCELLED, ON_HOLD),
            UNDER_REVIEW to setOf(IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD),
            COMPLETED to emptySet(), // Terminal status
            CANCELLED to emptySet(), // Terminal status
            ON_HOLD to setOf(PENDING, IN_PROGRESS, AWAITING_CLIENT, AWAITING_COURT, UNDER_REVIEW, CANCELLED)
        )
    }

    fun canTransitionTo(newStatus: MatterStatus): Boolean {
        return validTransitions[this]?.contains(newStatus) ?: false
    }

    fun getValidTransitions(): Set<MatterStatus> {
        return validTransitions[this] ?: emptySet()
    }

    fun isTerminal(): Boolean {
        return this == COMPLETED || this == CANCELLED
    }

    fun requiresReason(): Boolean {
        return this == CANCELLED || this == ON_HOLD
    }
}

// Status transition context for validation
data class StatusTransitionContext(
    val matterId: UUID,
    val currentStatus: MatterStatus,
    val newStatus: MatterStatus,
    val reason: String?,
    val userId: UUID,
    val userRole: UserRole,
    val matterType: MatterType?,
    val priority: MatterPriority?,
    val assignedLawyerId: UUID?
)

// Validation result with detailed feedback
sealed class ValidationResult {
    object Success : ValidationResult()
    
    data class Failure(
        val errorCode: String,
        val message: String,
        val field: String? = null,
        val additionalInfo: Map<String, Any> = emptyMap()
    ) : ValidationResult()
    
    fun isValid(): Boolean = this is Success
    fun isInvalid(): Boolean = this is Failure
}
```

**State Machine Service Implementation:**
```kotlin
@Service
class StatusTransitionService(
    private val permissionService: StatusPermissionService,
    private val businessRuleService: StatusBusinessRuleService,
    private val auditService: StatusAuditService,
    private val eventPublisher: ApplicationEventPublisher,
    private val messageSource: MessageSource
) {
    
    companion object {
        private val logger = LoggerFactory.getLogger(StatusTransitionService::class.java)
    }
    
    /**
     * Validates a status transition with comprehensive business rule checking
     */
    fun validateTransition(context: StatusTransitionContext): ValidationResult {
        logger.debug("Validating status transition for matter ${context.matterId}: ${context.currentStatus} -> ${context.newStatus}")
        
        // 1. Basic state machine validation
        if (!context.currentStatus.canTransitionTo(context.newStatus)) {
            return ValidationResult.Failure(
                errorCode = "INVALID_TRANSITION",
                message = getMessage("status.transition.invalid", context.currentStatus, context.newStatus),
                additionalInfo = mapOf(
                    "validTransitions" to context.currentStatus.getValidTransitions()
                )
            )
        }
        
        // 2. Permission validation
        val permissionResult = permissionService.validatePermission(context)
        if (permissionResult.isInvalid()) {
            return permissionResult
        }
        
        // 3. Business rule validation
        val businessRuleResult = businessRuleService.validateBusinessRules(context)
        if (businessRuleResult.isInvalid()) {
            return businessRuleResult
        }
        
        // 4. Required reason validation
        if (context.newStatus.requiresReason() && context.reason.isNullOrBlank()) {
            return ValidationResult.Failure(
                errorCode = "REASON_REQUIRED",
                message = getMessage("status.transition.reason.required", context.newStatus),
                field = "reason"
            )
        }
        
        logger.info("Status transition validation successful for matter ${context.matterId}")
        return ValidationResult.Success
    }
    
    /**
     * Executes a validated status transition with audit logging
     */
    @Transactional
    fun executeTransition(context: StatusTransitionContext): MatterStatusChangeResult {
        // Validate transition
        val validationResult = validateTransition(context)
        if (validationResult.isInvalid()) {
            val failure = validationResult as ValidationResult.Failure
            throw StatusTransitionException(failure.message, failure.errorCode)
        }
        
        // Create audit entry before transition
        val auditEntry = auditService.createTransitionAudit(context)
        
        try {
            // Execute the transition (will be handled by calling service)
            val result = MatterStatusChangeResult(
                matterId = context.matterId,
                oldStatus = context.currentStatus,
                newStatus = context.newStatus,
                reason = context.reason,
                timestamp = Instant.now(),
                userId = context.userId,
                auditId = auditEntry.id
            )
            
            // Publish domain event
            eventPublisher.publishEvent(
                MatterStatusChangedEvent(
                    matterId = context.matterId,
                    oldStatus = context.currentStatus,
                    newStatus = context.newStatus,
                    userId = context.userId,
                    reason = context.reason
                )
            )
            
            logger.info("Status transition executed successfully: ${context.matterId} ${context.currentStatus} -> ${context.newStatus}")
            return result
            
        } catch (exception: Exception) {
            // Mark audit entry as failed
            auditService.markTransitionFailed(auditEntry.id, exception.message)
            throw exception
        }
    }
    
    /**
     * Gets all valid transitions for a matter in current context
     */
    fun getValidTransitions(
        matterId: UUID,
        currentStatus: MatterStatus,
        userId: UUID,
        userRole: UserRole
    ): Set<MatterStatus> {
        val baseTransitions = currentStatus.getValidTransitions()
        
        // Filter based on permissions
        return baseTransitions.filter { targetStatus ->
            val context = StatusTransitionContext(
                matterId = matterId,
                currentStatus = currentStatus,
                newStatus = targetStatus,
                reason = null,
                userId = userId,
                userRole = userRole,
                matterType = null, // Will be loaded if needed
                priority = null,
                assignedLawyerId = null
            )
            
            permissionService.validatePermission(context).isValid()
        }.toSet()
    }
    
    private fun getMessage(code: String, vararg args: Any): String {
        return try {
            messageSource.getMessage(code, args, LocaleContextHolder.getLocale())
        } catch (e: Exception) {
            "Status transition validation failed: $code"
        }
    }
}
```

### Role-Based Permission Validation

**Permission Service Implementation:**
```kotlin
@Service
class StatusPermissionService {
    
    companion object {
        private val logger = LoggerFactory.getLogger(StatusPermissionService::class.java)
        
        // Define role-based transition permissions
        private val rolePermissions = mapOf(
            UserRole.LAWYER to mapOf(
                MatterStatus.PENDING to setOf(MatterStatus.IN_PROGRESS, MatterStatus.CANCELLED, MatterStatus.ON_HOLD),
                MatterStatus.IN_PROGRESS to setOf(MatterStatus.AWAITING_CLIENT, MatterStatus.AWAITING_COURT, MatterStatus.UNDER_REVIEW, MatterStatus.COMPLETED, MatterStatus.CANCELLED, MatterStatus.ON_HOLD),
                MatterStatus.AWAITING_CLIENT to setOf(MatterStatus.IN_PROGRESS, MatterStatus.CANCELLED, MatterStatus.ON_HOLD),
                MatterStatus.AWAITING_COURT to setOf(MatterStatus.IN_PROGRESS, MatterStatus.UNDER_REVIEW, MatterStatus.CANCELLED, MatterStatus.ON_HOLD),
                MatterStatus.UNDER_REVIEW to setOf(MatterStatus.IN_PROGRESS, MatterStatus.COMPLETED, MatterStatus.CANCELLED, MatterStatus.ON_HOLD),
                MatterStatus.ON_HOLD to setOf(MatterStatus.PENDING, MatterStatus.IN_PROGRESS, MatterStatus.AWAITING_CLIENT, MatterStatus.AWAITING_COURT, MatterStatus.UNDER_REVIEW, MatterStatus.CANCELLED)
            ),
            UserRole.CLERK to mapOf(
                MatterStatus.PENDING to setOf(MatterStatus.IN_PROGRESS, MatterStatus.ON_HOLD),
                MatterStatus.IN_PROGRESS to setOf(MatterStatus.AWAITING_CLIENT, MatterStatus.AWAITING_COURT, MatterStatus.ON_HOLD),
                MatterStatus.AWAITING_CLIENT to setOf(MatterStatus.IN_PROGRESS, MatterStatus.ON_HOLD),
                MatterStatus.AWAITING_COURT to setOf(MatterStatus.IN_PROGRESS, MatterStatus.ON_HOLD),
                MatterStatus.ON_HOLD to setOf(MatterStatus.PENDING, MatterStatus.IN_PROGRESS, MatterStatus.AWAITING_CLIENT, MatterStatus.AWAITING_COURT)
            ),
            UserRole.CLIENT to mapOf(
                // Clients can only provide information to move from awaiting states
                MatterStatus.AWAITING_CLIENT to setOf(MatterStatus.IN_PROGRESS)
            )
        )
    }
    
    fun validatePermission(context: StatusTransitionContext): ValidationResult {
        logger.debug("Validating permission for user ${context.userId} (${context.userRole}) to transition matter ${context.matterId}")
        
        // Get allowed transitions for this role
        val allowedTransitionsForRole = rolePermissions[context.userRole] ?: emptyMap()
        val allowedFromCurrentStatus = allowedTransitionsForRole[context.currentStatus] ?: emptySet()
        
        // Check if transition is allowed for this role
        if (!allowedFromCurrentStatus.contains(context.newStatus)) {
            return ValidationResult.Failure(
                errorCode = "INSUFFICIENT_PERMISSION",
                message = "Role ${context.userRole} cannot transition matter from ${context.currentStatus} to ${context.newStatus}",
                additionalInfo = mapOf(
                    "userRole" to context.userRole,
                    "allowedTransitions" to allowedFromCurrentStatus
                )
            )
        }
        
        // Additional permission checks based on matter ownership
        return validateOwnershipPermission(context)
    }
    
    private fun validateOwnershipPermission(context: StatusTransitionContext): ValidationResult {
        // Lawyers can modify any matter they're assigned to or own
        if (context.userRole == UserRole.LAWYER) {
            if (context.assignedLawyerId != null && context.assignedLawyerId != context.userId) {
                return ValidationResult.Failure(
                    errorCode = "NOT_ASSIGNED_LAWYER",
                    message = "Only the assigned lawyer can modify this matter's status",
                    additionalInfo = mapOf(
                        "assignedLawyerId" to context.assignedLawyerId,
                        "requestingUserId" to context.userId
                    )
                )
            }
        }
        
        // Clerks can only modify matters for their assigned lawyers
        if (context.userRole == UserRole.CLERK) {
            // This would require additional context about clerk-lawyer relationships
            // For now, we'll allow all clerk transitions that passed the role check
        }
        
        // Clients can only modify their own matters
        if (context.userRole == UserRole.CLIENT) {
            // This would require client-matter relationship validation
            // Implementation would depend on how client ownership is tracked
        }
        
        return ValidationResult.Success
    }
    
    fun getPermittedTransitions(
        currentStatus: MatterStatus,
        userRole: UserRole
    ): Set<MatterStatus> {
        val roleTransitions = rolePermissions[userRole] ?: emptyMap()
        return roleTransitions[currentStatus] ?: emptySet()
    }
}
```

### Business Rule Validation Engine

**Conditional Business Rules:**
```kotlin
@Service
class StatusBusinessRuleService(
    private val matterRepository: MatterRepository
) {
    
    fun validateBusinessRules(context: StatusTransitionContext): ValidationResult {
        val validationRules = listOf(
            ::validateCompletionRequirements,
            ::validateCancellationRules,
            ::validatePriorityBasedRules,
            ::validateTimeBasedRules,
            ::validateDocumentRequirements
        )
        
        for (rule in validationRules) {
            val result = rule(context)
            if (result.isInvalid()) {
                return result
            }
        }
        
        return ValidationResult.Success
    }
    
    private fun validateCompletionRequirements(context: StatusTransitionContext): ValidationResult {
        if (context.newStatus != MatterStatus.COMPLETED) {
            return ValidationResult.Success
        }
        
        // Only high-priority matters can be completed without review
        if (context.priority != MatterPriority.HIGH && context.currentStatus != MatterStatus.UNDER_REVIEW) {
            return ValidationResult.Failure(
                errorCode = "COMPLETION_REQUIRES_REVIEW",
                message = "Matters must be reviewed before completion unless they are high priority",
                additionalInfo = mapOf(
                    "currentPriority" to context.priority,
                    "requiredStatus" to MatterStatus.UNDER_REVIEW
                )
            )
        }
        
        return ValidationResult.Success
    }
    
    private fun validateCancellationRules(context: StatusTransitionContext): ValidationResult {
        if (context.newStatus != MatterStatus.CANCELLED) {
            return ValidationResult.Success
        }
        
        // Only lawyers can cancel matters that are in progress
        if (context.currentStatus == MatterStatus.IN_PROGRESS && context.userRole != UserRole.LAWYER) {
            return ValidationResult.Failure(
                errorCode = "CANCELLATION_REQUIRES_LAWYER",
                message = "Only lawyers can cancel matters that are in progress"
            )
        }
        
        return ValidationResult.Success
    }
    
    private fun validatePriorityBasedRules(context: StatusTransitionContext): ValidationResult {
        // High priority matters cannot be put on hold by clerks
        if (context.newStatus == MatterStatus.ON_HOLD && 
            context.priority == MatterPriority.HIGH && 
            context.userRole == UserRole.CLERK) {
            return ValidationResult.Failure(
                errorCode = "HIGH_PRIORITY_HOLD_RESTRICTED",
                message = "Clerks cannot put high priority matters on hold"
            )
        }
        
        return ValidationResult.Success
    }
    
    private fun validateTimeBasedRules(context: StatusTransitionContext): ValidationResult {
        // Add time-based validation rules here
        // For example: matters cannot be completed within 24 hours of creation
        return ValidationResult.Success
    }
    
    private fun validateDocumentRequirements(context: StatusTransitionContext): ValidationResult {
        // Add document-related validation rules here
        // For example: certain transitions require specific documents to be uploaded
        return ValidationResult.Success
    }
}
```

### Audit Trail Integration

**Status Change Audit Service:**
```kotlin
@Entity
@Table(name = "status_change_audit")
data class StatusChangeAudit(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,
    
    @Column(name = "matter_id", nullable = false)
    val matterId: UUID,
    
    @Column(name = "old_status", nullable = false)
    @Enumerated(EnumType.STRING)
    val oldStatus: MatterStatus,
    
    @Column(name = "new_status", nullable = false)
    @Enumerated(EnumType.STRING)
    val newStatus: MatterStatus,
    
    @Column(name = "user_id", nullable = false)
    val userId: UUID,
    
    @Column(name = "user_role", nullable = false)
    @Enumerated(EnumType.STRING)
    val userRole: UserRole,
    
    @Column(name = "reason", columnDefinition = "TEXT")
    val reason: String?,
    
    @Column(name = "success", nullable = false)
    val success: Boolean = true,
    
    @Column(name = "error_message", columnDefinition = "TEXT")
    val errorMessage: String? = null,
    
    @Column(name = "additional_context", columnDefinition = "JSONB")
    val additionalContext: String? = null,
    
    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),
    
    @Column(name = "ip_address")
    val ipAddress: String? = null,
    
    @Column(name = "user_agent")
    val userAgent: String? = null
)

@Repository
interface StatusChangeAuditRepository : JpaRepository<StatusChangeAudit, UUID> {
    fun findByMatterIdOrderByCreatedAtDesc(matterId: UUID): List<StatusChangeAudit>
    fun findByUserIdAndCreatedAtBetween(userId: UUID, start: Instant, end: Instant): List<StatusChangeAudit>
    fun findByMatterIdAndSuccessFalse(matterId: UUID): List<StatusChangeAudit>
}

@Service
class StatusAuditService(
    private val auditRepository: StatusChangeAuditRepository,
    private val objectMapper: ObjectMapper,
    private val request: HttpServletRequest
) {
    
    fun createTransitionAudit(context: StatusTransitionContext): StatusChangeAudit {
        val additionalContext = mapOf(
            "matterType" to context.matterType,
            "priority" to context.priority,
            "assignedLawyerId" to context.assignedLawyerId,
            "timestamp" to Instant.now()
        )
        
        val audit = StatusChangeAudit(
            matterId = context.matterId,
            oldStatus = context.currentStatus,
            newStatus = context.newStatus,
            userId = context.userId,
            userRole = context.userRole,
            reason = context.reason,
            success = true,
            additionalContext = objectMapper.writeValueAsString(additionalContext),
            ipAddress = getClientIpAddress(),
            userAgent = request.getHeader("User-Agent")
        )
        
        return auditRepository.save(audit)
    }
    
    fun markTransitionFailed(auditId: UUID, errorMessage: String) {
        auditRepository.findById(auditId).ifPresent { audit ->
            val failedAudit = audit.copy(
                success = false,
                errorMessage = errorMessage
            )
            auditRepository.save(failedAudit)
        }
    }
    
    fun getStatusHistory(matterId: UUID): List<StatusChangeAudit> {
        return auditRepository.findByMatterIdOrderByCreatedAtDesc(matterId)
    }
    
    fun getFailedTransitions(matterId: UUID): List<StatusChangeAudit> {
        return auditRepository.findByMatterIdAndSuccessFalse(matterId)
    }
    
    private fun getClientIpAddress(): String? {
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        return when {
            !xForwardedFor.isNullOrBlank() -> xForwardedFor.split(",")[0].trim()
            !request.getHeader("X-Real-IP").isNullOrBlank() -> request.getHeader("X-Real-IP")
            else -> request.remoteAddr
        }
    }
}
```

## Implementation Notes

### Custom Exception Hierarchy

**Status Transition Exception Framework:**
```kotlin
// Base exception for status transition failures
open class StatusTransitionException(
    message: String,
    val errorCode: String,
    cause: Throwable? = null
) : BusinessException(message, cause)

// Specific exceptions for different failure scenarios
class InvalidStatusTransitionException(
    currentStatus: MatterStatus,
    newStatus: MatterStatus
) : StatusTransitionException(
    "Invalid status transition from $currentStatus to $newStatus",
    "INVALID_TRANSITION"
)

class InsufficientPermissionException(
    userRole: UserRole,
    requiredPermission: String
) : StatusTransitionException(
    "User with role $userRole lacks permission: $requiredPermission",
    "INSUFFICIENT_PERMISSION"
)

class BusinessRuleViolationException(
    ruleName: String,
    message: String
) : StatusTransitionException(
    "Business rule violation in $ruleName: $message",
    "BUSINESS_RULE_VIOLATION"
)

class TransitionReasonRequiredException(
    status: MatterStatus
) : StatusTransitionException(
    "Reason is required for transition to $status",
    "REASON_REQUIRED"
)
```

### Integration with Matter Service

**Matter Service Integration:**
```kotlin
@Service
@Transactional(readOnly = true)
class MatterServiceImpl(
    private val matterRepository: MatterRepository,
    private val statusTransitionService: StatusTransitionService,
    private val userService: UserService,
    private val matterMapper: MatterMapper
) : MatterService {
    
    @Transactional
    override fun updateMatterStatus(
        id: UUID,
        newStatus: MatterStatus,
        reason: String?
    ): MatterDto {
        val matter = getMatterEntity(id)
        val currentUser = getCurrentUser()
        
        // Create transition context
        val context = StatusTransitionContext(
            matterId = id,
            currentStatus = matter.status,
            newStatus = newStatus,
            reason = reason,
            userId = currentUser.id,
            userRole = currentUser.role,
            matterType = matter.type,
            priority = matter.priority,
            assignedLawyerId = matter.assignedLawyerId
        )
        
        // Execute validated transition
        val transitionResult = statusTransitionService.executeTransition(context)
        
        // Update matter entity
        val updatedMatter = matter.copy(
            status = newStatus,
            lastStatusChange = transitionResult.timestamp,
            lastModifiedBy = currentUser.id
        )
        
        val savedMatter = matterRepository.save(updatedMatter)
        return matterMapper.toDto(savedMatter)
    }
    
    override fun getAvailableStatusTransitions(id: UUID): Set<MatterStatus> {
        val matter = getMatterEntity(id)
        val currentUser = getCurrentUser()
        
        return statusTransitionService.getValidTransitions(
            matterId = id,
            currentStatus = matter.status,
            userId = currentUser.id,
            userRole = currentUser.role
        )
    }
}
```

### Performance Optimization with Caching

**Caching Strategy for Validation Rules:**
```kotlin
@Service
@EnableCaching
class CachedStatusTransitionService(
    private val statusTransitionService: StatusTransitionService,
    private val cacheManager: CacheManager
) {
    
    @Cacheable(
        value = ["status-transitions"],
        key = "#currentStatus.name + '_' + #userRole.name"
    )
    fun getValidTransitionsForRole(
        currentStatus: MatterStatus,
        userRole: UserRole
    ): Set<MatterStatus> {
        return statusPermissionService.getPermittedTransitions(currentStatus, userRole)
    }
    
    @CacheEvict(
        value = ["status-transitions"],
        allEntries = true
    )
    fun clearTransitionCache() {
        // Clear cache when business rules change
    }
    
    // Performance-optimized bulk validation
    fun validateBulkTransitions(
        transitions: List<StatusTransitionContext>
    ): Map<UUID, ValidationResult> {
        return transitions.parallelStream()
            .collect(Collectors.toConcurrentMap(
                { it.matterId },
                { statusTransitionService.validateTransition(it) }
            ))
    }
}
```

### Testing Strategy

**Comprehensive Unit Testing:**
```kotlin
@ExtendWith(MockitoExtension::class)
class StatusTransitionServiceTest {
    
    @Mock
    private lateinit var permissionService: StatusPermissionService
    
    @Mock
    private lateinit var businessRuleService: StatusBusinessRuleService
    
    @Mock
    private lateinit var auditService: StatusAuditService
    
    @Mock
    private lateinit var eventPublisher: ApplicationEventPublisher
    
    @InjectMocks
    private lateinit var statusTransitionService: StatusTransitionService
    
    @Test
    fun `should allow valid status transition`() {
        // Given
        val context = StatusTransitionContext(
            matterId = UUID.randomUUID(),
            currentStatus = MatterStatus.PENDING,
            newStatus = MatterStatus.IN_PROGRESS,
            reason = null,
            userId = UUID.randomUUID(),
            userRole = UserRole.LAWYER,
            matterType = MatterType.LITIGATION,
            priority = MatterPriority.MEDIUM,
            assignedLawyerId = UUID.randomUUID()
        )
        
        whenever(permissionService.validatePermission(context))
            .thenReturn(ValidationResult.Success)
        whenever(businessRuleService.validateBusinessRules(context))
            .thenReturn(ValidationResult.Success)
        
        // When
        val result = statusTransitionService.validateTransition(context)
        
        // Then
        assertThat(result).isInstanceOf(ValidationResult.Success::class.java)
    }
    
    @Test
    fun `should reject invalid status transition`() {
        // Given
        val context = StatusTransitionContext(
            matterId = UUID.randomUUID(),
            currentStatus = MatterStatus.COMPLETED,
            newStatus = MatterStatus.IN_PROGRESS,
            reason = null,
            userId = UUID.randomUUID(),
            userRole = UserRole.LAWYER,
            matterType = null,
            priority = null,
            assignedLawyerId = null
        )
        
        // When
        val result = statusTransitionService.validateTransition(context)
        
        // Then
        assertThat(result).isInstanceOf(ValidationResult.Failure::class.java)
        val failure = result as ValidationResult.Failure
        assertThat(failure.errorCode).isEqualTo("INVALID_TRANSITION")
    }
    
    @Test
    fun `should require reason for cancellation`() {
        // Given
        val context = StatusTransitionContext(
            matterId = UUID.randomUUID(),
            currentStatus = MatterStatus.IN_PROGRESS,
            newStatus = MatterStatus.CANCELLED,
            reason = null, // No reason provided
            userId = UUID.randomUUID(),
            userRole = UserRole.LAWYER,
            matterType = null,
            priority = null,
            assignedLawyerId = null
        )
        
        whenever(permissionService.validatePermission(context))
            .thenReturn(ValidationResult.Success)
        whenever(businessRuleService.validateBusinessRules(context))
            .thenReturn(ValidationResult.Success)
        
        // When
        val result = statusTransitionService.validateTransition(context)
        
        // Then
        assertThat(result).isInstanceOf(ValidationResult.Failure::class.java)
        val failure = result as ValidationResult.Failure
        assertThat(failure.errorCode).isEqualTo("REASON_REQUIRED")
    }
}

@SpringBootTest
@Transactional
class StatusTransitionIntegrationTest {
    
    @Autowired
    private lateinit var statusTransitionService: StatusTransitionService
    
    @Autowired
    private lateinit var matterRepository: MatterRepository
    
    @Autowired
    private lateinit var statusChangeAuditRepository: StatusChangeAuditRepository
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `should create audit trail for successful transition`() {
        // Given
        val matter = createTestMatter()
        val context = createTransitionContext(matter)
        
        // When
        val result = statusTransitionService.executeTransition(context)
        
        // Then
        val auditRecords = statusChangeAuditRepository.findByMatterIdOrderByCreatedAtDesc(matter.id!!)
        assertThat(auditRecords).hasSize(1)
        assertThat(auditRecords[0].success).isTrue
        assertThat(auditRecords[0].oldStatus).isEqualTo(MatterStatus.PENDING)
        assertThat(auditRecords[0].newStatus).isEqualTo(MatterStatus.IN_PROGRESS)
    }
}
```

## Output Log

*(This section is populated as work progresses on the task)*