package com.astarworks.astarmanagement.core.auth.api.dto

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import java.time.Instant
import java.util.UUID

/**
 * Data transfer object for workspace information in multi-tenant context.
 * 
 * Represents a workspace/tenant that a user has access to, with minimal
 * information needed for workspace selection and switching.
 * 
 * @property id The workspace/tenant ID
 * @property name The internal name of the workspace
 * @property displayName The user-friendly display name
 * @property isActive Whether the user's access is currently active
 * @property role The user's role in this workspace (e.g., "Owner", "Member", "Viewer")
 * @property lastAccessedAt When the user last accessed this workspace
 */
@Serializable
data class WorkspaceDto(
    @Contextual
    val id: UUID,
    val name: String,
    val displayName: String?,
    val isActive: Boolean,
    val role: String,
    @Contextual
    val lastAccessedAt: Instant?
)