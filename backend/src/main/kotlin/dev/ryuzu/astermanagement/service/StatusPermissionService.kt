package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.modules.matter.domain.MatterStatus
import dev.ryuzu.astermanagement.domain.user.UserRole
import dev.ryuzu.astermanagement.service.base.BaseService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

/**
 * Service for validating role-based permissions for status transitions.
 * Implements fine-grained permission checking based on user roles and matter context.
 */
@Service
class StatusPermissionService : BaseService() {
    
    companion object {
        private val logger = LoggerFactory.getLogger(StatusPermissionService::class.java)
        
        // Define role-based transition permissions using existing workflow
        private val rolePermissions = mapOf(
            UserRole.LAWYER to mapOf(
                MatterStatus.INTAKE to setOf(MatterStatus.INITIAL_REVIEW, MatterStatus.CLOSED),
                MatterStatus.INITIAL_REVIEW to setOf(MatterStatus.INVESTIGATION, MatterStatus.RESEARCH, MatterStatus.CLOSED),
                MatterStatus.INVESTIGATION to setOf(MatterStatus.RESEARCH, MatterStatus.DRAFT_PLEADINGS, MatterStatus.CLOSED),
                MatterStatus.RESEARCH to setOf(MatterStatus.DRAFT_PLEADINGS, MatterStatus.FILED, MatterStatus.CLOSED),
                MatterStatus.DRAFT_PLEADINGS to setOf(MatterStatus.FILED, MatterStatus.RESEARCH, MatterStatus.CLOSED),
                MatterStatus.FILED to setOf(MatterStatus.DISCOVERY, MatterStatus.SETTLEMENT, MatterStatus.CLOSED),
                MatterStatus.DISCOVERY to setOf(MatterStatus.MEDIATION, MatterStatus.TRIAL_PREP, MatterStatus.SETTLEMENT, MatterStatus.CLOSED),
                MatterStatus.MEDIATION to setOf(MatterStatus.SETTLEMENT, MatterStatus.TRIAL_PREP, MatterStatus.CLOSED),
                MatterStatus.TRIAL_PREP to setOf(MatterStatus.TRIAL, MatterStatus.SETTLEMENT, MatterStatus.CLOSED),
                MatterStatus.TRIAL to setOf(MatterStatus.SETTLEMENT, MatterStatus.CLOSED),
                MatterStatus.SETTLEMENT to setOf(MatterStatus.CLOSED),
                MatterStatus.CLOSED to emptySet() // Terminal status
            ),
            UserRole.CLERK to mapOf(
                MatterStatus.INTAKE to setOf(MatterStatus.INITIAL_REVIEW),
                MatterStatus.INITIAL_REVIEW to setOf(MatterStatus.INVESTIGATION, MatterStatus.RESEARCH),
                MatterStatus.INVESTIGATION to setOf(MatterStatus.RESEARCH, MatterStatus.DRAFT_PLEADINGS),
                MatterStatus.RESEARCH to setOf(MatterStatus.DRAFT_PLEADINGS, MatterStatus.FILED),
                MatterStatus.DRAFT_PLEADINGS to setOf(MatterStatus.FILED, MatterStatus.RESEARCH),
                MatterStatus.FILED to setOf(MatterStatus.DISCOVERY),
                MatterStatus.DISCOVERY to setOf(MatterStatus.MEDIATION, MatterStatus.TRIAL_PREP),
                MatterStatus.MEDIATION to setOf(MatterStatus.TRIAL_PREP),
                MatterStatus.TRIAL_PREP to emptySet(), // No trial transitions for clerks
                MatterStatus.TRIAL to emptySet(),
                MatterStatus.SETTLEMENT to emptySet(), // Settlement requires lawyer approval
                MatterStatus.CLOSED to emptySet()
            ),
            UserRole.CLIENT to mapOf(
                // Clients can only provide information to move matters forward in specific scenarios
                MatterStatus.INTAKE to emptySet(),
                MatterStatus.INITIAL_REVIEW to emptySet(),
                MatterStatus.INVESTIGATION to emptySet(),
                MatterStatus.RESEARCH to emptySet(),
                MatterStatus.DRAFT_PLEADINGS to emptySet(),
                MatterStatus.FILED to emptySet(),
                MatterStatus.DISCOVERY to emptySet(),
                MatterStatus.MEDIATION to emptySet(),
                MatterStatus.TRIAL_PREP to emptySet(),
                MatterStatus.TRIAL to emptySet(),
                MatterStatus.SETTLEMENT to emptySet(),
                MatterStatus.CLOSED to emptySet()
            )
        )
    }
    
    /**
     * Validates if a user has permission to perform a status transition
     */
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
        
        // Additional permission checks based on matter ownership and assignment
        return validateOwnershipPermission(context)
    }
    
    /**
     * Validates ownership-based permissions
     */
    private fun validateOwnershipPermission(context: StatusTransitionContext): ValidationResult {
        // Lawyers can modify any matter they're assigned to
        if (context.userRole == UserRole.LAWYER) {
            if (context.matter.assignedLawyer?.id != null && context.matter.assignedLawyer?.id != context.userId) {
                return ValidationResult.Failure(
                    errorCode = "NOT_ASSIGNED_LAWYER",
                    message = "Only the assigned lawyer can modify this matter's status",
                    additionalInfo = mapOf(
                        "assignedLawyerId" to (context.matter.assignedLawyer?.id?.toString() ?: ""),
                        "requestingUserId" to context.userId.toString()
                    )
                )
            }
        }
        
        // Clerks can only modify matters for their assigned lawyers or matters assigned to them
        if (context.userRole == UserRole.CLERK) {
            val isAssignedClerk = context.matter.assignedClerk?.id == context.userId
            val isAssignedToSameLawyer = context.matter.assignedLawyer?.id == context.userId
            
            if (!isAssignedClerk && !isAssignedToSameLawyer) {
                return ValidationResult.Failure(
                    errorCode = "NOT_ASSIGNED_CLERK",
                    message = "Clerk can only modify matters they are assigned to or where they support the assigned lawyer",
                    additionalInfo = mapOf(
                        "assignedClerkId" to (context.matter.assignedClerk?.id?.toString() ?: ""),
                        "assignedLawyerId" to (context.matter.assignedLawyer?.id?.toString() ?: ""),
                        "requestingUserId" to context.userId.toString()
                    )
                )
            }
        }
        
        // Clients generally cannot modify matter status (handled by role permissions above)
        // This is a safety check in case role permissions are expanded
        if (context.userRole == UserRole.CLIENT) {
            return ValidationResult.Failure(
                errorCode = "CLIENT_CANNOT_MODIFY_STATUS",
                message = "Clients cannot modify matter status",
                additionalInfo = mapOf(
                    "matterId" to context.matterId,
                    "requestingUserId" to context.userId
                )
            )
        }
        
        return ValidationResult.Success
    }
    
    /**
     * Gets permitted transitions for a specific role and status
     */
    fun getPermittedTransitions(
        currentStatus: MatterStatus,
        userRole: UserRole
    ): Set<MatterStatus> {
        val roleTransitions = rolePermissions[userRole] ?: emptyMap()
        return roleTransitions[currentStatus] ?: emptySet()
    }
    
    /**
     * Checks if a user role can perform any transitions from a given status
     */
    fun canRoleTransitionFrom(
        currentStatus: MatterStatus,
        userRole: UserRole
    ): Boolean {
        return getPermittedTransitions(currentStatus, userRole).isNotEmpty()
    }
    
    /**
     * Gets all roles that can perform a specific transition
     */
    fun getRolesForTransition(
        fromStatus: MatterStatus,
        toStatus: MatterStatus
    ): Set<UserRole> {
        return rolePermissions.entries
            .filter { (_, statusMap) ->
                statusMap[fromStatus]?.contains(toStatus) == true
            }
            .map { it.key }
            .toSet()
    }
}