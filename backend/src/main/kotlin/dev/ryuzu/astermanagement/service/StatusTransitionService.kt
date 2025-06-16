package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.domain.matter.Matter
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.domain.matter.MatterPriority
import dev.ryuzu.astermanagement.domain.user.UserRole
import dev.ryuzu.astermanagement.service.base.BaseService
import dev.ryuzu.astermanagement.service.exception.*
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.context.MessageSource
import org.springframework.context.i18n.LocaleContextHolder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.*

/**
 * Status transition context for comprehensive validation
 */
data class StatusTransitionContext(
    val matterId: UUID,
    val currentStatus: MatterStatus,
    val newStatus: MatterStatus,
    val reason: String?,
    val userId: UUID,
    val userRole: UserRole,
    val matter: Matter,
    val clientId: UUID? = null
)

/**
 * Validation result with detailed feedback
 */
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

/**
 * Result of a successful status transition
 */
data class MatterStatusChangeResult(
    val matterId: UUID,
    val oldStatus: MatterStatus,
    val newStatus: MatterStatus,
    val reason: String?,
    val timestamp: Instant,
    val userId: UUID,
    val auditId: UUID? = null
)

/**
 * Domain event for status changes
 */
data class MatterStatusChangedEvent(
    val matterId: UUID,
    val oldStatus: MatterStatus,
    val newStatus: MatterStatus,
    val userId: UUID,
    val reason: String?
)

/**
 * Enhanced status transition validation service implementing comprehensive business rules,
 * role-based permissions, and audit trail integration.
 */
@Service
class StatusTransitionService(
    private val statusPermissionService: StatusPermissionService,
    private val statusBusinessRuleService: StatusBusinessRuleService,
    private val auditService: AuditService,
    private val eventPublisher: ApplicationEventPublisher,
    private val messageSource: MessageSource
) : BaseService() {
    
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
        val permissionResult = statusPermissionService.validatePermission(context)
        if (permissionResult.isInvalid()) {
            return permissionResult
        }
        
        // 3. Business rule validation
        val businessRuleResult = statusBusinessRuleService.validateBusinessRules(context)
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
        val auditId = auditService.recordMatterStatusChange(
            matterId = context.matterId,
            oldStatus = context.currentStatus,
            newStatus = context.newStatus,
            userId = context.userId,
            reason = context.reason
        )
        
        try {
            // Create the result (actual status update will be handled by calling service)
            val result = MatterStatusChangeResult(
                matterId = context.matterId,
                oldStatus = context.currentStatus,
                newStatus = context.newStatus,
                reason = context.reason,
                timestamp = Instant.now(),
                userId = context.userId,
                auditId = auditId
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
            logger.error("Status transition execution failed", exception)
            throw exception
        }
    }
    
    /**
     * Gets all valid transitions for a matter in current context
     */
    fun getValidTransitions(
        matter: Matter,
        userId: UUID,
        userRole: UserRole
    ): Set<MatterStatus> {
        val baseTransitions = matter.status.getValidTransitions()
        
        // Filter based on permissions
        return baseTransitions.filter { targetStatus ->
            val context = StatusTransitionContext(
                matterId = matter.id!!,
                currentStatus = matter.status,
                newStatus = targetStatus,
                reason = null,
                userId = userId,
                userRole = userRole,
                matter = matter
            )
            
            statusPermissionService.validatePermission(context).isValid()
        }.toSet()
    }
    
    /**
     * Creates a status transition context from current state
     */
    fun createTransitionContext(
        matter: Matter,
        newStatus: MatterStatus,
        reason: String?,
        userId: UUID,
        userRole: UserRole
    ): StatusTransitionContext {
        return StatusTransitionContext(
            matterId = matter.id!!,
            currentStatus = matter.status,
            newStatus = newStatus,
            reason = reason,
            userId = userId,
            userRole = userRole,
            matter = matter
        )
    }
    
    private fun getMessage(code: String, vararg args: Any): String {
        return try {
            messageSource.getMessage(code, args, LocaleContextHolder.getLocale())
        } catch (e: Exception) {
            "Status transition validation failed: $code"
        }
    }
}

/**
 * Extension functions for MatterStatus to support enhanced state machine behavior
 * These use the existing canTransitionTo() logic to maintain consistency
 */
fun MatterStatus.getValidTransitions(): Set<MatterStatus> {
    return MatterStatus.values().filter { newStatus ->
        this.canTransitionTo(newStatus) && newStatus != this
    }.toSet()
}

fun MatterStatus.requiresReason(): Boolean {
    return this == MatterStatus.CLOSED
}

fun MatterStatus.isTerminal(): Boolean {
    return this == MatterStatus.CLOSED
}