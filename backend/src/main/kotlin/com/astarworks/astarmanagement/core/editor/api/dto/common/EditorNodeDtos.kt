package com.astarworks.astarmanagement.core.editor.api.dto.common

import java.time.Instant
import java.util.UUID
import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable

@Serializable
data class EditorNodeResponse(
    @Contextual
    val id: UUID,
    @Contextual
    val workspaceId: UUID,
    @Contextual
    val parentId: UUID? = null,
    val type: String,
    val title: String,
    val slug: String,
    val materializedPath: String,
    val depth: Int,
    val position: Double,
    val isArchived: Boolean,
    @Contextual
    val createdBy: UUID,
    @Contextual
    val updatedBy: UUID? = null,
    @Contextual
    val createdAt: Instant,
    @Contextual
    val updatedAt: Instant,
)

@Serializable
data class EditorBreadcrumbItemResponse(
    @Contextual
    val id: UUID,
    val title: String,
    val slug: String,
    val materializedPath: String,
)
