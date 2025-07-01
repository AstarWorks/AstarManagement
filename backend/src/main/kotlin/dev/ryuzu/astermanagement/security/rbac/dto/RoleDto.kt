package dev.ryuzu.astermanagement.security.rbac.dto

import dev.ryuzu.astermanagement.security.rbac.entity.Permission
import jakarta.validation.constraints.*
import java.time.LocalDateTime
import java.util.*

/**
 * DTO for role response data.
 * Contains all role information including permissions and metadata.
 */
data class RoleResponseDto(
    val id: UUID,
    val name: String,
    val displayName: String,
    val permissions: List<PermissionDto>,
    val permissionFlags: Long,
    val hierarchyLevel: Int,
    val color: String,
    val description: String?,
    val isActive: Boolean,
    val isSystemRole: Boolean,
    val userCount: Int,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

/**
 * DTO for creating a new role.
 */
data class CreateRoleRequestDto(
    @field:NotBlank(message = "Role name cannot be blank")
    @field:Size(max = 50, message = "Role name must not exceed 50 characters")
    @field:Pattern(regexp = "^[A-Z][A-Z0-9_]*$", message = "Role name must be uppercase with underscores only")
    val name: String,

    @field:NotBlank(message = "Display name cannot be blank")
    @field:Size(max = 100, message = "Display name must not exceed 100 characters")
    val displayName: String,

    @field:NotEmpty(message = "At least one permission must be specified")
    val permissions: List<String>,

    @field:Min(value = 0, message = "Hierarchy level must be non-negative")
    @field:Max(value = 1000, message = "Hierarchy level must not exceed 1000")
    val hierarchyLevel: Int,

    @field:Size(min = 7, max = 7, message = "Color must be a valid hex code (#RRGGBB)")
    @field:Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Color must be a valid hex code")
    val color: String = "#808080",

    @field:Size(max = 500, message = "Description must not exceed 500 characters")
    val description: String? = null,

    val isActive: Boolean = true
)

/**
 * DTO for updating an existing role.
 */
data class UpdateRoleRequestDto(
    @field:NotBlank(message = "Display name cannot be blank")
    @field:Size(max = 100, message = "Display name must not exceed 100 characters")
    val displayName: String,

    @field:Min(value = 0, message = "Hierarchy level must be non-negative")
    @field:Max(value = 1000, message = "Hierarchy level must not exceed 1000")
    val hierarchyLevel: Int,

    @field:Size(min = 7, max = 7, message = "Color must be a valid hex code (#RRGGBB)")
    @field:Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Color must be a valid hex code")
    val color: String,

    @field:Size(max = 500, message = "Description must not exceed 500 characters")
    val description: String? = null,

    val isActive: Boolean
)

/**
 * DTO for updating role permissions.
 */
data class UpdateRolePermissionsRequestDto(
    @field:NotEmpty(message = "At least one permission must be specified")
    val permissions: List<String>
)

/**
 * DTO for permission information.
 */
data class PermissionDto(
    val name: String,
    val description: String,
    val category: String,
    val bit: Int
)

/**
 * DTO for user-role relationship response.
 */
data class UserRoleResponseDto(
    val userId: UUID,
    val email: String,
    val fullName: String,
    val assignedAt: LocalDateTime,
    val assignedBy: String?,
    val isActive: Boolean
)

/**
 * DTO for role hierarchy information.
 */
data class RoleHierarchyDto(
    val id: UUID,
    val name: String,
    val displayName: String,
    val hierarchyLevel: Int,
    val color: String,
    val userCount: Int,
    val parentRoles: List<RoleHierarchyNodeDto>,
    val childRoles: List<RoleHierarchyNodeDto>
)

/**
 * DTO for role hierarchy node (simplified role info).
 */
data class RoleHierarchyNodeDto(
    val id: UUID,
    val name: String,
    val displayName: String,
    val hierarchyLevel: Int
)

/**
 * DTO for cloning a role.
 */
data class CloneRoleRequestDto(
    @field:NotBlank(message = "Role name cannot be blank")
    @field:Size(max = 50, message = "Role name must not exceed 50 characters")
    @field:Pattern(regexp = "^[A-Z][A-Z0-9_]*$", message = "Role name must be uppercase with underscores only")
    val name: String,

    @field:NotBlank(message = "Display name cannot be blank")
    @field:Size(max = 100, message = "Display name must not exceed 100 characters")
    val displayName: String,

    @field:Size(min = 7, max = 7, message = "Color must be a valid hex code (#RRGGBB)")
    @field:Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Color must be a valid hex code")
    val color: String = "#808080",

    @field:Size(max = 500, message = "Description must not exceed 500 characters")
    val description: String? = null,

    val modifyPermissions: Boolean = false,
    val additionalPermissions: List<String> = emptyList(),
    val removedPermissions: List<String> = emptyList()
)

/**
 * Extension functions for converting between entities and DTOs.
 */
fun dev.ryuzu.astermanagement.security.rbac.entity.Role.toResponseDto(userCount: Int = 0): RoleResponseDto {
    return RoleResponseDto(
        id = this.id!!,
        name = this.name,
        displayName = this.displayName,
        permissions = this.getPermissionsList().map { permission ->
            PermissionDto(
                name = permission.name,
                description = permission.description,
                category = permission.category,
                bit = permission.bit
            )
        },
        permissionFlags = this.permissions,
        hierarchyLevel = this.hierarchyLevel,
        color = this.color,
        description = this.description,
        isActive = this.isActive,
        isSystemRole = this.isSystemRole,
        userCount = userCount,
        createdAt = this.createdAt ?: LocalDateTime.now(),
        updatedAt = this.updatedAt ?: LocalDateTime.now()
    )
}

/**
 * Extension function to convert Permission enum to DTO.
 */
fun Permission.toDto(): PermissionDto {
    return PermissionDto(
        name = this.name,
        description = this.description,
        category = this.category,
        bit = this.bit
    )
}