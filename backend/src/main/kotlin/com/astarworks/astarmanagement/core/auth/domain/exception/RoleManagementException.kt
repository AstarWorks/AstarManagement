package com.astarworks.astarmanagement.core.auth.domain.exception

import java.util.UUID

/**
 * Base exception class for role management operations.
 * Provides structured error handling for role-related operations.
 */
sealed class RoleManagementException(
    message: String,
    val code: String,
    cause: Throwable? = null
) : RuntimeException(message, cause) {
    
    /**
     * Thrown when a role cannot be found.
     */
    class RoleNotFoundException(
        val roleId: UUID
    ) : RoleManagementException(
        message = "Role not found: $roleId",
        code = "ROLE_NOT_FOUND"
    )
    
    /**
     * Thrown when attempting to create a role with a duplicate name.
     */
    class DuplicateRoleException(
        val name: String,
        val tenantId: UUID? = null
    ) : RoleManagementException(
        message = if (tenantId != null) {
            "Role '$name' already exists for tenant: $tenantId"
        } else {
            "System role '$name' already exists"
        },
        code = "DUPLICATE_ROLE"
    )
    
    /**
     * Thrown when attempting invalid operations on system roles.
     */
    class SystemRoleException(
        message: String
    ) : RoleManagementException(
        message = message,
        code = "SYSTEM_ROLE_ERROR"
    )
    
    /**
     * Thrown when a permission rule is invalid.
     */
    class InvalidPermissionException(
        val permission: String,
        val reason: String? = null
    ) : RoleManagementException(
        message = if (reason != null) {
            "Invalid permission '$permission': $reason"
        } else {
            "Invalid permission format: $permission"
        },
        code = "INVALID_PERMISSION"
    )
    
    /**
     * Thrown when attempting to delete a role that is still in use.
     */
    class RoleInUseException(
        val roleId: UUID,
        val userCount: Int? = null
    ) : RoleManagementException(
        message = if (userCount != null) {
            "Cannot delete role $roleId: $userCount users are assigned to this role"
        } else {
            "Cannot delete role $roleId: role is still in use"
        },
        code = "ROLE_IN_USE"
    )
    
    /**
     * Thrown when a role does not belong to the expected tenant.
     */
    class RoleTenantMismatchException(
        val roleId: UUID,
        val expectedTenantId: UUID,
        val actualTenantId: UUID?
    ) : RoleManagementException(
        message = "Role $roleId belongs to tenant $actualTenantId, expected $expectedTenantId",
        code = "ROLE_TENANT_MISMATCH"
    )
    
    /**
     * Thrown when a template is not found or invalid.
     */
    class TemplateNotFoundException(
        val templateName: String
    ) : RoleManagementException(
        message = "Template not found: $templateName",
        code = "TEMPLATE_NOT_FOUND"
    )
    
    /**
     * Thrown when template application fails.
     */
    class TemplateApplicationException(
        val templateName: String,
        val reason: String
    ) : RoleManagementException(
        message = "Failed to apply template '$templateName': $reason",
        code = "TEMPLATE_APPLICATION_FAILED"
    )
    
    /**
     * Thrown when role import/export operations fail.
     */
    class RoleImportExportException(
        val operation: String,
        val reason: String
    ) : RoleManagementException(
        message = "Failed to $operation role: $reason",
        code = "ROLE_IMPORT_EXPORT_FAILED"
    )
    
    /**
     * Thrown when permission synchronization fails.
     */
    class PermissionSyncException(
        roleId: UUID,
        reason: String
    ) : RoleManagementException(
        message = "Failed to sync permissions for role $roleId: $reason",
        code = "PERMISSION_SYNC_FAILED"
    )
    
    /**
     * Thrown when role position update conflicts occur.
     */
    class RolePositionConflictException(
        positions: Map<UUID, Int>,
        reason: String
    ) : RoleManagementException(
        message = "Role position conflict: $reason (positions: $positions)",
        code = "ROLE_POSITION_CONFLICT"
    )
    
    /**
     * Thrown when role color validation fails.
     */
    class InvalidRoleColorException(
        val color: String
    ) : RoleManagementException(
        message = "Invalid role color format: $color. Expected hex format (#RRGGBB)",
        code = "INVALID_ROLE_COLOR"
    )
    
    /**
     * Thrown when role name validation fails.
     */
    class InvalidRoleNameException(
        val name: String,
        val reason: String
    ) : RoleManagementException(
        message = "Invalid role name '$name': $reason",
        code = "INVALID_ROLE_NAME"
    )
    
    /**
     * Thrown when exceeding role limits.
     */
    class RoleLimitExceededException(
        val tenantId: UUID,
        val currentCount: Int,
        val limit: Int
    ) : RoleManagementException(
        message = "Tenant $tenantId has reached the maximum role limit: $currentCount/$limit",
        code = "ROLE_LIMIT_EXCEEDED"
    )
}