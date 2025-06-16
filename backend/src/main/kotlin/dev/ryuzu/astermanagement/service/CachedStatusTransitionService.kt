package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.domain.user.UserRole
import dev.ryuzu.astermanagement.service.base.BaseService
import org.slf4j.LoggerFactory
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.cache.annotation.EnableCaching
import org.springframework.stereotype.Service
import java.util.*
import java.util.concurrent.CompletableFuture
import java.util.stream.Collectors

/**
 * Cached wrapper service for status transition operations to improve performance
 * for frequently accessed validation rules and permission checks.
 */
@Service
@EnableCaching
class CachedStatusTransitionService(
    private val statusPermissionService: StatusPermissionService,
    private val statusTransitionService: StatusTransitionService
) : BaseService() {
    
    companion object {
        private val logger = LoggerFactory.getLogger(CachedStatusTransitionService::class.java)
    }
    
    /**
     * Cached version of valid transitions for role combinations
     */
    @Cacheable(
        value = ["status-transitions"],
        key = "#currentStatus.name + '_' + #userRole.name",
        condition = "#currentStatus != null and #userRole != null"
    )
    fun getValidTransitionsForRole(
        currentStatus: MatterStatus,
        userRole: UserRole
    ): Set<MatterStatus> {
        logger.debug("Computing valid transitions for status {} and role {} (not from cache)", currentStatus, userRole)
        return statusPermissionService.getPermittedTransitions(currentStatus, userRole)
    }
    
    /**
     * Cached version of role capabilities for each status
     */
    @Cacheable(
        value = ["role-capabilities"],
        key = "#currentStatus.name + '_can_transition'",
        condition = "#currentStatus != null"
    )
    fun getRoleCapabilitiesForStatus(currentStatus: MatterStatus): Map<UserRole, Boolean> {
        logger.debug("Computing role capabilities for status {} (not from cache)", currentStatus)
        return UserRole.values().associateWith { role ->
            statusPermissionService.canRoleTransitionFrom(currentStatus, role)
        }
    }
    
    /**
     * Cached version of transition matrix for UI display
     */
    @Cacheable(
        value = ["transition-matrix"],
        key = "'full_matrix'",
        condition = "true"
    )
    fun getFullTransitionMatrix(): Map<MatterStatus, Map<UserRole, Set<MatterStatus>>> {
        logger.debug("Computing full transition matrix (not from cache)")
        return MatterStatus.values().associateWith { status ->
            UserRole.values().associateWith { role ->
                statusPermissionService.getPermittedTransitions(status, role)
            }
        }
    }
    
    /**
     * Cached version of status validation rules
     */
    @Cacheable(
        value = ["status-rules"],
        key = "#fromStatus.name + '_to_' + #toStatus.name",
        condition = "#fromStatus != null and #toStatus != null"
    )
    fun getTransitionRules(
        fromStatus: MatterStatus,
        toStatus: MatterStatus
    ): TransitionRuleInfo {
        logger.debug("Computing transition rules for {} to {} (not from cache)", fromStatus, toStatus)
        
        val allowedRoles = statusPermissionService.getRolesForTransition(fromStatus, toStatus)
        val requiresReason = toStatus.requiresReason()
        val isTerminalTransition = toStatus.isTerminal()
        
        return TransitionRuleInfo(
            fromStatus = fromStatus,
            toStatus = toStatus,
            allowedRoles = allowedRoles,
            requiresReason = requiresReason,
            isTerminalTransition = isTerminalTransition,
            businessRules = getBusinessRulesForTransition(fromStatus, toStatus)
        )
    }
    
    /**
     * Performance-optimized bulk validation for multiple transitions
     */
    fun validateBulkTransitions(
        transitions: List<StatusTransitionContext>
    ): Map<UUID, ValidationResult> {
        logger.info("Validating {} transitions in bulk", transitions.size)
        
        return transitions.parallelStream()
            .collect(Collectors.toConcurrentMap(
                { it.matterId },
                { context ->
                    try {
                        statusTransitionService.validateTransition(context)
                    } catch (exception: Exception) {
                        logger.error("Bulk validation failed for matter ${context.matterId}", exception)
                        ValidationResult.Failure(
                            errorCode = "BULK_VALIDATION_ERROR",
                            message = "Validation failed: ${exception.message}"
                        )
                    }
                }
            ))
    }
    
    /**
     * Asynchronous validation for non-blocking operations
     */
    fun validateTransitionAsync(context: StatusTransitionContext): CompletableFuture<ValidationResult> {
        return CompletableFuture.supplyAsync {
            statusTransitionService.validateTransition(context)
        }.exceptionally { exception ->
            logger.error("Async validation failed for matter ${context.matterId}", exception)
            ValidationResult.Failure(
                errorCode = "ASYNC_VALIDATION_ERROR",
                message = "Async validation failed: ${exception.message}"
            )
        }
    }
    
    /**
     * Clears all status transition related caches
     */
    @CacheEvict(
        value = ["status-transitions", "role-capabilities", "transition-matrix", "status-rules"],
        allEntries = true
    )
    fun clearAllTransitionCaches() {
        logger.info("Clearing all status transition caches")
    }
    
    /**
     * Clears cache for specific status
     */
    @CacheEvict(
        value = ["status-transitions", "role-capabilities"],
        key = "#status.name + '_*'",
        condition = "#status != null"
    )
    fun clearCacheForStatus(status: MatterStatus) {
        logger.info("Clearing cache for status: {}", status)
    }
    
    /**
     * Clears cache for specific role
     */
    @CacheEvict(
        value = ["status-transitions"],
        key = "'*_' + #role.name",
        condition = "#role != null"
    )
    fun clearCacheForRole(role: UserRole) {
        logger.info("Clearing cache for role: {}", role)
    }
    
    /**
     * Warms up the cache with common transition combinations
     */
    fun warmUpCache() {
        logger.info("Warming up status transition caches")
        
        // Pre-compute common combinations
        for (status in MatterStatus.values()) {
            for (role in UserRole.values()) {
                getValidTransitionsForRole(status, role)
            }
            getRoleCapabilitiesForStatus(status)
        }
        
        // Pre-compute full matrix
        getFullTransitionMatrix()
        
        logger.info("Cache warm-up completed")
    }
    
    private fun getBusinessRulesForTransition(
        fromStatus: MatterStatus,
        toStatus: MatterStatus
    ): List<String> {
        val rules = mutableListOf<String>()
        
        // Add common business rules based on transition
        when (toStatus) {
            MatterStatus.CLOSED -> {
                rules.add("Requires reason")
                rules.add("Only lawyers can close from trial/settlement")
            }
            MatterStatus.TRIAL -> {
                rules.add("Requires proper preparation")
                rules.add("Only lawyers allowed")
            }
            MatterStatus.SETTLEMENT -> {
                rules.add("Requires documentation of terms")
            }
            else -> {
                // Add other rule checks as needed
            }
        }
        
        return rules
    }
}

/**
 * Data class for cached transition rule information
 */
data class TransitionRuleInfo(
    val fromStatus: MatterStatus,
    val toStatus: MatterStatus,
    val allowedRoles: Set<UserRole>,
    val requiresReason: Boolean,
    val isTerminalTransition: Boolean,
    val businessRules: List<String>
)