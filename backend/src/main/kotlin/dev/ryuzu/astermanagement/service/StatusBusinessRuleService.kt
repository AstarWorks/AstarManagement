package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.modules.matter.domain.MatterStatus
import dev.ryuzu.astermanagement.modules.matter.domain.MatterPriority
import dev.ryuzu.astermanagement.domain.user.UserRole
import dev.ryuzu.astermanagement.service.base.BaseService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.temporal.ChronoUnit

/**
 * Service for validating business rules for status transitions.
 * Implements conditional transitions based on matter properties, priority, timing, and other business context.
 */
@Service
class StatusBusinessRuleService : BaseService() {
    
    companion object {
        private val logger = LoggerFactory.getLogger(StatusBusinessRuleService::class.java)
    }
    
    /**
     * Validates all applicable business rules for a status transition
     */
    fun validateBusinessRules(context: StatusTransitionContext): ValidationResult {
        val validationRules = listOf(
            ::validateCompletionRequirements,
            ::validateClosureRules,
            ::validatePriorityBasedRules,
            ::validateTimeBasedRules,
            ::validateSequentialRules,
            ::validateAssignmentRules
        )
        
        for (rule in validationRules) {
            val result = rule(context)
            if (result.isInvalid()) {
                return result
            }
        }
        
        return ValidationResult.Success
    }
    
    /**
     * Validates requirements for completion/closure
     */
    private fun validateCompletionRequirements(context: StatusTransitionContext): ValidationResult {
        if (context.newStatus != MatterStatus.CLOSED) {
            return ValidationResult.Success
        }
        
        // High-priority matters can be closed from any status by lawyers
        if (context.matter.priority == MatterPriority.HIGH && context.userRole == UserRole.LAWYER) {
            return ValidationResult.Success
        }
        
        // Medium and low priority matters should go through proper workflow
        val allowedPreviousStatuses = setOf(
            MatterStatus.SETTLEMENT,
            MatterStatus.TRIAL,
            MatterStatus.MEDIATION
        )
        
        if (context.matter.priority != MatterPriority.HIGH && 
            !allowedPreviousStatuses.contains(context.currentStatus)) {
            return ValidationResult.Failure(
                errorCode = "COMPLETION_REQUIRES_PROPER_WORKFLOW",
                message = "Non-high priority matters should complete proper workflow before closure",
                additionalInfo = mapOf(
                    "currentPriority" to context.matter.priority,
                    "currentStatus" to context.currentStatus,
                    "allowedPreviousStatuses" to allowedPreviousStatuses
                )
            )
        }
        
        return ValidationResult.Success
    }
    
    /**
     * Validates rules specific to matter closure
     */
    private fun validateClosureRules(context: StatusTransitionContext): ValidationResult {
        if (context.newStatus != MatterStatus.CLOSED) {
            return ValidationResult.Success
        }
        
        // Only lawyers can close matters that are in trial or settlement
        val criticalStatuses = setOf(MatterStatus.TRIAL, MatterStatus.SETTLEMENT)
        if (criticalStatuses.contains(context.currentStatus) && context.userRole != UserRole.LAWYER) {
            return ValidationResult.Failure(
                errorCode = "CLOSURE_REQUIRES_LAWYER",
                message = "Only lawyers can close matters that are in trial or settlement phase"
            )
        }
        
        // Reason is required for closure
        if (context.reason.isNullOrBlank()) {
            return ValidationResult.Failure(
                errorCode = "CLOSURE_REASON_REQUIRED",
                message = "A reason is required when closing a matter",
                field = "reason"
            )
        }
        
        return ValidationResult.Success
    }
    
    /**
     * Validates priority-based business rules
     */
    private fun validatePriorityBasedRules(context: StatusTransitionContext): ValidationResult {
        // High priority matters have different rules
        if (context.matter.priority == MatterPriority.HIGH) {
            // High priority matters can skip certain intermediate steps
            if (context.currentStatus == MatterStatus.INVESTIGATION && 
                context.newStatus == MatterStatus.FILED &&
                context.userRole == UserRole.LAWYER) {
                // Allow direct jump for high priority matters
                return ValidationResult.Success
            }
        }
        
        // Low priority matters may have additional restrictions
        if (context.matter.priority == MatterPriority.LOW) {
            // Low priority matters should not go to trial without mediation attempt
            if (context.newStatus == MatterStatus.TRIAL && 
                context.currentStatus != MatterStatus.MEDIATION &&
                context.currentStatus != MatterStatus.TRIAL_PREP) {
                return ValidationResult.Failure(
                    errorCode = "LOW_PRIORITY_REQUIRES_MEDIATION",
                    message = "Low priority matters should attempt mediation before trial",
                    additionalInfo = mapOf(
                        "priority" to context.matter.priority,
                        "suggestedStatus" to MatterStatus.MEDIATION
                    )
                )
            }
        }
        
        return ValidationResult.Success
    }
    
    /**
     * Validates time-based business rules
     */
    private fun validateTimeBasedRules(context: StatusTransitionContext): ValidationResult {
        val createdAt = context.matter.createdAt
        if (createdAt == null) {
            return ValidationResult.Success
        }
        
        val matterAge = ChronoUnit.DAYS.between(createdAt.toLocalDate(), LocalDate.now())
        
        // Matters cannot be closed within 24 hours of creation (except by lawyers for high priority)
        if (context.newStatus == MatterStatus.CLOSED && matterAge < 1) {
            if (context.userRole != UserRole.LAWYER || context.matter.priority != MatterPriority.HIGH) {
                return ValidationResult.Failure(
                    errorCode = "PREMATURE_CLOSURE",
                    message = "Matters cannot be closed within 24 hours of creation unless by lawyer for high priority matter",
                    additionalInfo = mapOf(
                        "matterAge" to matterAge,
                        "priority" to context.matter.priority,
                        "userRole" to context.userRole
                    )
                )
            }
        }
        
        // Filing should happen within reasonable time after pleading drafts
        if (context.newStatus == MatterStatus.FILED && 
            context.currentStatus == MatterStatus.DRAFT_PLEADINGS &&
            matterAge > 90) {
            logger.warn("Filing after 90 days from matter creation for matter ${context.matterId}")
            // This is a warning, not a blocking rule
        }
        
        return ValidationResult.Success
    }
    
    /**
     * Validates sequential workflow rules
     */
    private fun validateSequentialRules(context: StatusTransitionContext): ValidationResult {
        // Certain statuses must follow proper sequence
        when (context.newStatus) {
            MatterStatus.TRIAL -> {
                // Trial should come after proper preparation
                val validPreviousStatuses = setOf(
                    MatterStatus.TRIAL_PREP,
                    MatterStatus.MEDIATION, // If mediation fails
                    MatterStatus.DISCOVERY
                )
                
                if (!validPreviousStatuses.contains(context.currentStatus)) {
                    return ValidationResult.Failure(
                        errorCode = "TRIAL_REQUIRES_PREPARATION",
                        message = "Trial status requires proper preparation phase",
                        additionalInfo = mapOf(
                            "currentStatus" to context.currentStatus,
                            "validPreviousStatuses" to validPreviousStatuses
                        )
                    )
                }
            }
            
            MatterStatus.SETTLEMENT -> {
                // Settlement can happen at various stages but should be documented
                if (context.reason.isNullOrBlank()) {
                    return ValidationResult.Failure(
                        errorCode = "SETTLEMENT_REASON_REQUIRED",
                        message = "Settlement status requires documentation of terms or reasoning",
                        field = "reason"
                    )
                }
            }
            
            MatterStatus.FILED -> {
                // Filing requires draft pleadings to be completed
                if (context.currentStatus != MatterStatus.DRAFT_PLEADINGS) {
                    // Allow direct filing from research for high priority matters
                    if (!(context.matter.priority == MatterPriority.HIGH && 
                          context.currentStatus == MatterStatus.RESEARCH &&
                          context.userRole == UserRole.LAWYER)) {
                        return ValidationResult.Failure(
                            errorCode = "FILING_REQUIRES_DRAFTS",
                            message = "Filing typically requires completed draft pleadings",
                            additionalInfo = mapOf(
                                "currentStatus" to context.currentStatus,
                                "priority" to context.matter.priority
                            )
                        )
                    }
                }
            }
            
            else -> {
                // Other statuses follow standard state machine rules
            }
        }
        
        return ValidationResult.Success
    }
    
    /**
     * Validates assignment-related rules
     */
    private fun validateAssignmentRules(context: StatusTransitionContext): ValidationResult {
        // Critical statuses require assigned lawyer
        val criticalStatuses = setOf(
            MatterStatus.TRIAL,
            MatterStatus.SETTLEMENT,
            MatterStatus.CLOSED
        )
        
        if (criticalStatuses.contains(context.newStatus) && context.matter.assignedLawyer == null) {
            return ValidationResult.Failure(
                errorCode = "CRITICAL_STATUS_REQUIRES_LAWYER",
                message = "Critical status transitions require an assigned lawyer",
                additionalInfo = mapOf(
                    "status" to context.newStatus,
                    "criticalStatuses" to criticalStatuses
                )
            )
        }
        
        // Certain transitions may require both lawyer and clerk assignment
        if (context.newStatus == MatterStatus.DISCOVERY && 
            context.matter.assignedClerk == null &&
            context.matter.priority == MatterPriority.HIGH) {
            logger.warn("High priority discovery without assigned clerk for matter ${context.matterId}")
            // This is a warning for high priority matters
        }
        
        return ValidationResult.Success
    }
    
    /**
     * Validates matter type specific rules (future extension point)
     */
    private fun validateMatterTypeRules(context: StatusTransitionContext): ValidationResult {
        // Future: Add matter type specific validation
        // For example: litigation vs. transactional matters may have different workflows
        return ValidationResult.Success
    }
    
    /**
     * Gets business rule recommendations for a transition
     */
    fun getTransitionRecommendations(context: StatusTransitionContext): List<String> {
        val recommendations = mutableListOf<String>()
        
        // Check if clerk assignment would be beneficial
        if (context.matter.assignedClerk == null && 
            context.newStatus in setOf(MatterStatus.DISCOVERY, MatterStatus.TRIAL_PREP)) {
            recommendations.add("Consider assigning a clerk for discovery/trial preparation assistance")
        }
        
        // Check if deadline setting would be beneficial
        if (context.matter.estimatedCompletionDate == null && 
            context.newStatus in setOf(MatterStatus.FILED, MatterStatus.TRIAL_PREP)) {
            recommendations.add("Consider setting an estimated completion date")
        }
        
        // Priority-based recommendations
        if (context.matter.priority == MatterPriority.LOW && 
            context.newStatus == MatterStatus.TRIAL_PREP) {
            recommendations.add("Consider attempting mediation before trial preparation for cost efficiency")
        }
        
        return recommendations
    }
}