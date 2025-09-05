package com.astarworks.astarmanagement.core.auth.api.dto

import kotlinx.serialization.Contextual
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import java.time.Instant
import java.util.UUID

/**
 * Response DTO for role information.
 * Includes role details, permissions, and metadata.
 */
@Serializable
data class RoleResponse(
    @Contextual val id: UUID,
    @Contextual val tenantId: UUID?,
    val name: String,
    val displayName: String?,
    val color: String?,
    val position: Int,
    val isSystem: Boolean,
    val permissions: List<PermissionRule>? = null,
    val userCount: Int? = null,
    @Contextual val createdAt: Instant,
    @Contextual val updatedAt: Instant
)

/**
 * Request DTO for creating a new role.
 */
@Serializable
data class RoleCreateRequestDto(
    val name: String,
    val displayName: String? = null,
    val color: String? = null,
    val position: Int = 0,
    val permissions: List<PermissionRule> = emptyList()
)

/**
 * Request DTO for updating role information.
 */
@Serializable
data class RoleUpdateRequest(
    val displayName: String? = null,
    val color: String? = null,
    val position: Int? = null
)

/**
 * Request DTO for reordering multiple roles.
 */
@Serializable
data class RoleReorderRequest(
    val positions: List<RolePositionUpdate>
)

/**
 * DTO for updating a single role position.
 */
@Serializable
data class RolePositionUpdate(
    @Contextual val roleId: UUID,
    val position: Int
)

/**
 * Request DTO for duplicating a role.
 */
@Serializable
data class RoleDuplicateRequest(
    val newName: String,
    val includePermissions: Boolean = true
)

/**
 * Response DTO for user permissions.
 */
@Serializable
data class UserPermissionsResponse(
    @Contextual val userId: UUID,
    @Contextual val tenantUserId: UUID,
    val roles: List<RoleResponse>,
    val effectivePermissions: Set<PermissionRule>,
    val permissionsByRole: List<RolePermissions>
)

/**
 * DTO for permissions grouped by role.
 */
@Serializable
data class RolePermissions(
    val roleName: String,
    val permissions: List<PermissionRule>
)

/**
 * Request DTO for assigning roles to a user.
 */
@Serializable
data class UserRoleAssignmentRequest(
    val roleIds: List<@Contextual UUID>
)

/**
 * Response DTO for role assignment result.
 */
@Serializable
data class UserRoleAssignmentResult(
    @Contextual val userId: UUID,
    val assignedRoles: List<@Contextual UUID>,
    val failedRoles: List<FailedRoleAssignment>,
    val totalAssigned: Int
)

/**
 * DTO for a failed role assignment.
 */
@Serializable
data class FailedRoleAssignment(
    @Contextual val roleId: UUID,
    val reason: String
)

/**
 * Request DTO for granting permissions to a role.
 */
@Serializable
data class PermissionGrantRequest(
    val permissions: List<PermissionRule>
)

/**
 * Response DTO for permission grant result.
 */
@Serializable
data class PermissionGrantResult(
    @Contextual val roleId: UUID,
    val granted: List<PermissionRule>,
    val failed: List<FailedPermissionGrant>,
    val totalGranted: Int
)

/**
 * DTO for a failed permission grant.
 */
@Serializable
data class FailedPermissionGrant(
    val permission: PermissionRule,
    val reason: String
)

/**
 * Request DTO for syncing permissions.
 */
@Serializable
data class PermissionSyncRequest(
    val permissions: Set<PermissionRule>
)

/**
 * Response DTO for role template summary.
 */
@Serializable
data class RoleTemplateResponse(
    val id: String,
    val name: String,
    val description: String,
    val category: String,
    val roleCount: Int,
    val totalPermissions: Int
)

/**
 * DTO for granted permission with timestamp.
 */
@Serializable
data class GrantedPermission(
    val rule: PermissionRule,
    @Contextual val grantedAt: Instant? = null
)

/**
 * Result of permission check.
 */
@Serializable
data class PermissionCheckResult(
    val rule: PermissionRule,
    val hasPermission: Boolean,
    val matchedBy: String? = null
)

/**
 * Request for bulk permission deletion.
 */
@Serializable
data class PermissionBulkDeleteRequest(
    val permissions: List<PermissionRule>
)

/**
 * Request for copying permissions.
 */
@Serializable
data class PermissionCopyRequest(
    val overwrite: Boolean = false
)

/**
 * Request for applying permission template.
 */
@Serializable
data class PermissionTemplateRequest(
    val template: String
)

/**
 * Response for effective permissions.
 */
@Serializable
data class EffectivePermissionsResponse(
    val directPermissions: List<PermissionRule>,
    val effectivePermissions: Set<PermissionRule>
)

/**
 * Result of permission synchronization operation.
 */
@Serializable
data class PermissionSyncResult(
    val added: List<PermissionRule>,
    val removed: List<PermissionRule>,
    val unchanged: List<PermissionRule>
)

/**
 * Result of permission comparison between two roles.
 */
@Serializable
data class RolePermissionDiff(
    val onlyInFirst: Set<PermissionRule>,
    val onlyInSecond: Set<PermissionRule>,
    val common: Set<PermissionRule>
)

/**
 * Result of permission validation.
 */
@Serializable
data class PermissionValidationResult(
    val valid: List<PermissionRule>,
    val invalid: List<InvalidPermission>,
    val warnings: List<PermissionWarning>
)

/**
 * Invalid permission information.
 */
@Serializable
data class InvalidPermission(
    val input: String,
    val reason: String
)

/**
 * Permission warning information.
 */
@Serializable
data class PermissionWarning(
    val rule: PermissionRule,
    val message: String
)