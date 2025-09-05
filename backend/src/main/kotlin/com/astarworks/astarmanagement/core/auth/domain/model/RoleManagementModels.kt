package com.astarworks.astarmanagement.core.auth.domain.model

import com.astarworks.astarmanagement.shared.domain.value.RoleId
import java.time.Instant
import java.util.UUID

/**
 * Request model for creating a new role with initial permissions.
 */
data class RoleCreateRequest(
    val name: String,
    val displayName: String? = null,
    val color: String? = null,
    val position: Int = 0,
    val permissions: List<String> = emptyList(),
    val metadata: Map<String, Any> = emptyMap()
) {
    init {
        require(name.isNotBlank()) {
            "Role name cannot be blank"
        }
        require(name.length <= 100) {
            "Role name cannot exceed 100 characters"
        }
        require(name.matches(Regex("^[a-z0-9_]+$"))) {
            "Role name can only contain lowercase letters, numbers, and underscores"
        }
        require(displayName?.length?.let { it <= 255 } ?: true) {
            "Display name cannot exceed 255 characters"
        }
        require(color?.matches(Regex("^#[0-9A-Fa-f]{6}$")) ?: true) {
            "Color must be a valid hex color code (e.g., #FF5733)"
        }
        require(position >= 0) {
            "Position must be non-negative"
        }
        // 型安全システムではvalidationは不要 - Controllerで変換時にエラーハンドリング
    }
}

/**
 * Data model for exporting and importing role configurations.
 * Includes all role details and associated permissions.
 */
data class RoleExportData(
    val name: String,
    val displayName: String? = null,
    val color: String? = null,
    val position: Int = 0,
    val permissions: List<String> = emptyList(),
    val isSystem: Boolean = false,
    val metadata: Map<String, Any> = emptyMap(),
    val exportedAt: Instant = Instant.now(),
    val version: String = "1.0"
) {
    /**
     * Converts export data to a role creation request.
     */
    fun toCreateRequest(): RoleCreateRequest {
        return RoleCreateRequest(
            name = name,
            displayName = displayName,
            color = color,
            position = position,
            permissions = permissions,
            metadata = metadata
        )
    }
    
    /**
     * Validates the export data for import compatibility.
     */
    fun validate(): List<String> {
        val errors = mutableListOf<String>()
        
        if (name.isBlank()) {
            errors.add("Role name cannot be blank")
        }
        if (!name.matches(Regex("^[a-z0-9_]+$"))) {
            errors.add("Role name can only contain lowercase letters, numbers, and underscores")
        }
        if (name.length > 100) {
            errors.add("Role name cannot exceed 100 characters")
        }
        displayName?.let {
            if (it.length > 255) {
                errors.add("Display name cannot exceed 255 characters")
            }
        }
        color?.let {
            if (!it.matches(Regex("^#[0-9A-Fa-f]{6}$"))) {
                errors.add("Invalid color format: $it")
            }
        }
        if (position < 0) {
            errors.add("Position must be non-negative")
        }
        // 型安全システムではvalidationは不要 - Controllerで変換時にエラーハンドリング
        
        return errors
    }
    
    companion object {
        /**
         * Creates export data from a DynamicRole and its permissions.
         */
        fun fromRole(role: DynamicRole, permissions: List<String>): RoleExportData {
            return RoleExportData(
                name = role.name,
                displayName = role.displayName,
                color = role.color,
                position = role.position,
                permissions = permissions,
                isSystem = role.isSystem,
                metadata = mapOf(
                    "originalId" to role.id.toString(),
                    "createdAt" to role.createdAt.toString(),
                    "updatedAt" to role.updatedAt.toString()
                )
            )
        }
    }
}

/**
 * Result of a permission synchronization operation.
 */
data class SyncResult(
    val roleId: RoleId,
    val added: List<String>,
    val removed: List<String>,
    val unchanged: List<String>,
    val failed: Map<String, String> = emptyMap(), // permission -> error message
    val syncedAt: Instant = Instant.now()
) {
    val totalChanges: Int = added.size + removed.size
    val isSuccessful: Boolean = failed.isEmpty()
    val summary: String = buildString {
        append("Sync completed: ")
        append("${added.size} added, ")
        append("${removed.size} removed, ")
        append("${unchanged.size} unchanged")
        if (failed.isNotEmpty()) {
            append(", ${failed.size} failed")
        }
    }
}

/**
 * Comparison result between two roles' permissions.
 */
data class PermissionDiff(
    val role1Id: UUID,
    val role2Id: UUID,
    val onlyInFirst: List<String>,
    val onlyInSecond: List<String>,
    val inBoth: List<String>
) {
    val areIdentical: Boolean = onlyInFirst.isEmpty() && onlyInSecond.isEmpty()
    val totalDifferences: Int = onlyInFirst.size + onlyInSecond.size
    
    /**
     * Gets permissions that would need to be added to role1 to match role2.
     */
    fun getAdditionsForFirst(): List<String> = onlyInSecond
    
    /**
     * Gets permissions that would need to be removed from role1 to match role2.
     */
    fun getRemovalsForFirst(): List<String> = onlyInFirst
    
    /**
     * Creates a merge of both permission sets.
     */
    fun getMergedPermissions(): Set<String> {
        return (onlyInFirst + onlyInSecond + inBoth).toSet()
    }
}

/**
 * Result of permission validation.
 */
data class ValidationResult(
    val valid: List<String>,
    val invalid: Map<String, String>, // permission -> error message
    val warnings: Map<String, String> = emptyMap() // permission -> warning message
) {
    val isValid: Boolean = invalid.isEmpty()
    val hasWarnings: Boolean = warnings.isNotEmpty()
    val totalChecked: Int = valid.size + invalid.size
    
    /**
     * Gets a summary of the validation result.
     */
    fun getSummary(): String {
        return buildString {
            append("Validation: ${valid.size}/${totalChecked} valid")
            if (invalid.isNotEmpty()) {
                append(", ${invalid.size} invalid")
            }
            if (warnings.isNotEmpty()) {
                append(", ${warnings.size} warnings")
            }
        }
    }
}

/**
 * Request for bulk role operations.
 */
data class BulkRoleOperationRequest(
    val roleIds: Set<UUID>,
    val operation: BulkOperation,
    val parameters: Map<String, Any> = emptyMap()
) {
    enum class BulkOperation {
        DELETE,
        UPDATE_POSITION,
        GRANT_PERMISSION,
        REVOKE_PERMISSION,
        UPDATE_COLOR,
        EXPORT
    }
}

/**
 * Result of a bulk role operation.
 */
data class BulkRoleOperationResult(
    val successful: Map<UUID, Any>, // roleId -> result
    val failed: Map<UUID, String>, // roleId -> error message
    val skipped: Map<UUID, String> = emptyMap() // roleId -> reason
) {
    val totalProcessed: Int = successful.size + failed.size + skipped.size
    val isCompleteSuccess: Boolean = failed.isEmpty() && skipped.isEmpty()
}

/**
 * Role template information.
 */
data class RoleTemplate(
    val id: String,
    val name: String,
    val description: String,
    val category: String, // e.g., "legal", "medical", "retail"
    val roles: List<RoleExportData>,
    val requiredPermissions: Set<String> = emptySet(),
    val optionalPermissions: Set<String> = emptySet(),
    val metadata: Map<String, Any> = emptyMap()
) {
    /**
     * Validates if this template can be applied to a tenant.
     */
    fun canApply(existingRoles: List<String>): Boolean {
        val templateRoleNames = roles.map { it.name }.toSet()
        val conflicts = existingRoles.filter { it in templateRoleNames }
        return conflicts.isEmpty()
    }
}

/**
 * Result of applying a role template.
 */
data class TemplateApplicationResult(
    val templateId: String,
    val createdRoles: List<DynamicRole>,
    val grantedPermissions: Map<UUID, List<String>>, // roleId -> permissions
    val skippedRoles: Map<String, String> = emptyMap(), // roleName -> reason
    val errors: List<String> = emptyList(),
    val appliedAt: Instant = Instant.now()
) {
    val isSuccessful: Boolean = errors.isEmpty()
    val totalRolesCreated: Int = createdRoles.size
    val totalPermissionsGranted: Int = grantedPermissions.values.sumOf { it.size }
}