package com.astarworks.astarmanagement.core.auth.api.controller
import org.springframework.web.server.ResponseStatusException

import com.astarworks.astarmanagement.core.auth.api.dto.*
import com.astarworks.astarmanagement.core.auth.domain.model.*
import com.astarworks.astarmanagement.core.auth.domain.service.RoleManagementService
import com.astarworks.astarmanagement.core.auth.domain.service.RolePermissionService
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime
import java.util.UUID
import jakarta.validation.Valid
import com.astarworks.astarmanagement.shared.domain.value.*

/**
 * REST controller for role permission management.
 * Provides endpoints for managing permissions assigned to roles,
 * including CRUD operations, validation, analysis, and bulk operations.
 */
@RestController
@RequestMapping("/api/v1/roles/{roleId}/permissions")
@PreAuthorize("isAuthenticated()")
class RolePermissionController(
    private val rolePermissionService: RolePermissionService,
    private val roleManagementService: RoleManagementService,
    private val tenantContextService: TenantContextService
) {
    private val logger = LoggerFactory.getLogger(RolePermissionController::class.java)
    
    /**
     * Gets all permissions for a role.
     * 
     * @param roleId Role ID
     * @param detailed Whether to include detailed permission information
     * @return List of permissions or detailed permission information
     */
    @GetMapping
    @PreAuthorize("hasPermissionRule('role.view.all')")
    fun getPermissions(
        @PathVariable roleId: UUID,
        @RequestParam(defaultValue = "false") detailed: Boolean
    ): Any {
        logger.debug("Getting permissions for role: $roleId")
        
        // Verify role exists and belongs to tenant
        if (!verifyRoleAccess(roleId)) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        }
        
        return if (detailed) {
            val permissions = rolePermissionService.getRolePermissions(RoleId(roleId))
            val details = permissions.map { rolePermission ->
                val rule = rolePermission.permissionRule
                GrantedPermission(
                    rule = rule,
                    grantedAt = rolePermission.createdAt
                )
            }
            details
        } else {
            val permissions = rolePermissionService.getRolePermissionRules(RoleId(roleId))
            permissions
        }
    }
    
    /**
     * Grants permissions to a role (additive).
     * 
     * @param roleId Role ID
     * @param request List of permissions to grant
     * @return Grant result with successful and failed permissions
     */
    @PostMapping
    @PreAuthorize("hasPermissionRule('role.edit.all')")
    fun grantPermissions(
        @PathVariable roleId: UUID,
        @Valid @RequestBody request: PermissionGrantRequest
    ): PermissionGrantResult {
        logger.info("Granting ${request.permissions.size} permissions to role: $roleId")
        
        // Verify role exists and belongs to tenant
        if (!verifyRoleAccess(roleId)) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        }
        
        val granted = mutableListOf<PermissionRule>()
        val failed = mutableListOf<FailedPermissionGrant>()
        
        request.permissions.forEach { permissionRule ->
            try {
                rolePermissionService.grantPermission(RoleId(roleId), permissionRule)
                granted.add(permissionRule)
            } catch (e: Exception) {
                failed.add(FailedPermissionGrant(permissionRule, e.message ?: "Unknown error"))
                logger.error("Failed to grant permission '$permissionRule' to role $roleId", e)
            }
        }
        
        val result = PermissionGrantResult(
            roleId = roleId,
            granted = granted,
            failed = failed,
            totalGranted = granted.size
        )
        
        return result
    }
    
    /**
     * Revokes a single permission from a role.
     * 
     * @param roleId Role ID
     * @param permission Permission to revoke (URL encoded)
     */
    @DeleteMapping("/{permission}")
    @PreAuthorize("hasPermissionRule('role.edit.all')")
    fun revokePermission(
        @PathVariable roleId: UUID,
        @PathVariable permission: String
    ): Unit {
        logger.info("Revoking permission '$permission' from role: $roleId")
        
        // Verify role exists and belongs to tenant
        if (!verifyRoleAccess(roleId)) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        }
        
        rolePermissionService.revokePermission(RoleId(roleId), permission)
        return Unit
    }
    
    /**
     * Revokes multiple permissions from a role.
     * 
     * @param roleId Role ID
     * @param request List of permissions to revoke
     */
    @DeleteMapping
    @PreAuthorize("hasPermissionRule('role.edit.all')")
    fun revokePermissions(
        @PathVariable roleId: UUID,
        @Valid @RequestBody request: PermissionBulkDeleteRequest
    ): Unit {
        logger.info("Revoking ${request.permissions.size} permissions from role: $roleId")
        
        // Verify role exists and belongs to tenant
        if (!verifyRoleAccess(roleId)) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        }
        
        val permissionStrings = request.permissions.map { it.toDatabaseString() }
        rolePermissionService.revokePermissions(RoleId(roleId), permissionStrings)
        return Unit
    }
    
    /**
     * Synchronizes permissions for a role (replaces all permissions).
     * 
     * @param roleId Role ID
     * @param request Set of permissions to sync
     * @return Sync result with added, removed, and unchanged permissions
     */
    @PutMapping
    @PreAuthorize("hasPermissionRule('role.edit.all')")
    fun syncPermissions(
        @PathVariable roleId: UUID,
        @Valid @RequestBody request: PermissionSyncRequest
    ): PermissionSyncResult {
        logger.info("Syncing ${request.permissions.size} permissions for role: $roleId")
        
        // Verify role exists and belongs to tenant
        if (!verifyRoleAccess(roleId)) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        }
        
        val permissionStrings = request.permissions.map { it.toDatabaseString() }.toSet()
        val domainResult = rolePermissionService.syncPermissions(RoleId(roleId), permissionStrings)
        
        // Convert domain result to DTO
        val result = PermissionSyncResult(
            added = domainResult.added.map { PermissionRule.fromDatabaseString(it) },
            removed = domainResult.removed.map { PermissionRule.fromDatabaseString(it) },
            unchanged = domainResult.unchanged.map { PermissionRule.fromDatabaseString(it) }
        )
        
        return result
    }
    
    /**
     * Compares permissions between two roles.
     * 
     * @param roleId First role ID
     * @param with Second role ID to compare with
     * @return Permission difference analysis
     */
    @GetMapping("/compare")
    @PreAuthorize("hasPermissionRule('role.view.all')")
    fun comparePermissions(
        @PathVariable roleId: UUID,
        @RequestParam with: UUID
    ): RolePermissionDiff {
        logger.debug("Comparing permissions between roles $roleId and $with")
        
        // Verify both roles exist and belong to tenant
        if (!verifyRoleAccess(roleId) || !verifyRoleAccess(with)) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        }
        
        val domainDiff = rolePermissionService.comparePermissions(roleId, with)
        
        // Convert domain result to DTO
        val diff = RolePermissionDiff(
            onlyInFirst = domainDiff.onlyInFirst.map { PermissionRule.fromDatabaseString(it) }.toSet(),
            onlyInSecond = domainDiff.onlyInSecond.map { PermissionRule.fromDatabaseString(it) }.toSet(),
            common = domainDiff.inBoth.map { PermissionRule.fromDatabaseString(it) }.toSet()
        )
        
        return diff
    }
    
    /**
     * Gets permission suggestions for a role based on current permissions.
     * 
     * @param roleId Role ID
     * @return List of suggested permissions
     */
    @GetMapping("/suggestions")
    @PreAuthorize("hasPermissionRule('role.view.all')")
    fun getPermissionSuggestions(
        @PathVariable roleId: UUID
    ): List<String> {
        logger.debug("Getting permission suggestions for role: $roleId")
        
        // Verify role exists and belongs to tenant
        if (!verifyRoleAccess(roleId)) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        }
        
        val suggestions = rolePermissionService.suggestPermissions(RoleId(roleId))
        return suggestions
    }
    
    /**
     * Gets effective permissions for a role.
     * 
     * @param roleId Role ID
     * @return Direct and effective permissions
     */
    @GetMapping("/effective")
    @PreAuthorize("hasPermissionRule('role.view.all')")
    fun getEffectivePermissions(
        @PathVariable roleId: UUID
    ): EffectivePermissionsResponse {
        logger.debug("Getting effective permissions for role: $roleId")
        
        // Verify role exists and belongs to tenant
        if (!verifyRoleAccess(roleId)) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        }
        
        val directPermissionStrings = rolePermissionService.getRolePermissionRules(RoleId(roleId))
        val effectivePermissionStrings = rolePermissionService.getEffectivePermissions(RoleId(roleId))
        
        val response = EffectivePermissionsResponse(
            directPermissions = directPermissionStrings.map { PermissionRule.fromDatabaseString(it) },
            effectivePermissions = effectivePermissionStrings.map { PermissionRule.fromDatabaseString(it) }.toSet()
        )
        
        return response
    }
    
    /**
     * Validates a list of permissions for correct format.
     * 
     * @param roleId Role ID (for context)
     * @param request List of permissions to validate
     * @return Validation result with valid, invalid, and warnings
     */
    @PostMapping("/validate")
    @PreAuthorize("hasPermissionRule('role.view.all')")
    fun validatePermissions(
        @PathVariable roleId: UUID,
        @Valid @RequestBody request: PermissionGrantRequest
    ): PermissionValidationResult {
        logger.debug("Validating ${request.permissions.size} permissions")
        
        val permissionStrings = request.permissions.map { it.toDatabaseString() }
        val domainResult = rolePermissionService.validatePermissions(permissionStrings)
        
        // Convert domain result to DTO
        val result = PermissionValidationResult(
            valid = domainResult.valid.map { PermissionRule.fromDatabaseString(it) },
            invalid = domainResult.invalid.map { (permissionString, error) ->
                InvalidPermission(permissionString, error)
            },
            warnings = domainResult.warnings.map { (permissionString, warning) ->
                PermissionWarning(PermissionRule.fromDatabaseString(permissionString), warning)
            }
        )
        
        return result
    }
    
    /**
     * Checks if a role has a specific permission.
     * 
     * @param roleId Role ID
     * @param permission Permission to check
     * @return Check result with match details
     */
    @GetMapping("/check")
    @PreAuthorize("hasPermissionRule('role.view.all')")
    fun checkPermission(
        @PathVariable roleId: UUID,
        @RequestParam permission: String
    ): PermissionCheckResult {
        logger.debug("Checking permission '$permission' for role: $roleId")
        
        // Verify role exists and belongs to tenant
        if (!verifyRoleAccess(roleId)) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        }
        
        val permissionRule = PermissionRule.fromDatabaseString(permission)
        val hasPermission = rolePermissionService.hasPermission(RoleId(roleId), permission)
        val permissionStrings = rolePermissionService.getRolePermissionRules(RoleId(roleId))
        
        // Find what rule matched (if any)
        val matchedBy = if (hasPermission) {
            permissionStrings.find { it == permission }
        } else {
            null
        }
        
        val result = PermissionCheckResult(
            rule = permissionRule,
            hasPermission = hasPermission,
            matchedBy = matchedBy
        )
        
        return result
    }
    
    /**
     * Copies permissions from another role.
     * 
     * @param roleId Target role ID
     * @param sourceRoleId Source role ID
     * @param request Copy options (overwrite)
     * @return List of copied permissions
     */
    @PostMapping("/copy-from/{sourceRoleId}")
    @PreAuthorize("hasPermissionRule('role.edit.all')")
    fun copyPermissions(
        @PathVariable roleId: UUID,
        @PathVariable sourceRoleId: UUID,
        @Valid @RequestBody request: PermissionCopyRequest
    ): List<String> {
        logger.info("Copying permissions from role $sourceRoleId to role $roleId")
        
        // Verify both roles exist and belong to tenant
        if (!verifyRoleAccess(roleId) || !verifyRoleAccess(sourceRoleId)) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        }
        
        val copiedPermissions = rolePermissionService.copyPermissions(
            fromRoleId = sourceRoleId,
            toRoleId = roleId,
            overwrite = request.overwrite
        )
        
        val permissions = copiedPermissions.map { it.permissionRule.toDatabaseString() }
        return permissions
    }
    
    
    /**
     * Revokes all permissions from a role.
     * 
     * @param roleId Role ID
     */
    @DeleteMapping("/all")
    @PreAuthorize("hasPermissionRule('role.edit.all')")
    fun revokeAllPermissions(
        @PathVariable roleId: UUID
    ): Unit {
        logger.info("Revoking all permissions from role: $roleId")
        
        // Verify role exists and belongs to tenant
        if (!verifyRoleAccess(roleId)) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        }
        
        rolePermissionService.revokeAllPermissions(RoleId(roleId))
        return Unit
    }
    
    // === Helper Methods ===
    
    /**
     * Verifies that a role exists and belongs to the current tenant.
     * 
     * @param roleId Role ID to verify
     * @return true if role is accessible, false otherwise
     */
    private fun verifyRoleAccess(roleId: UUID): Boolean {
        val role = roleManagementService.findById(RoleId(roleId)) ?: return false
        val tenantId = tenantContextService.getTenantContext()
        
        // System roles (tenantId = null) are accessible to all
        // Tenant-specific roles must match current tenant
        return role.tenantId == null || role.tenantId?.value == tenantId
    }
}