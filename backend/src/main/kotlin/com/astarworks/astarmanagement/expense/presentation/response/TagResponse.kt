package com.astarworks.astarmanagement.expense.presentation.response

import com.astarworks.astarmanagement.expense.domain.model.TagScope
import java.time.Instant
import java.util.UUID

/**
 * Response DTO for tag data.
 * Includes usage statistics and metadata.
 */
data class TagResponse(
    val id: UUID,
    val name: String,
    val color: String,
    val scope: TagScope,
    val ownerId: UUID?,
    val usageCount: Int,
    val lastUsedAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant,
    val isPersonal: Boolean,
    val isShared: Boolean
)