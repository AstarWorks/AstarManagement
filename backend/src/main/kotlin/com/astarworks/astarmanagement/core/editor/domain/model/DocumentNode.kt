package com.astarworks.astarmanagement.core.editor.domain.model

import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import java.time.Instant
import java.util.UUID

/**
 * Represents a node in the editor tree. Nodes can be folders or documents.
 */
data class DocumentNode(
    val id: DocumentNodeId = DocumentNodeId(UUID.randomUUID()),
    val tenantId: TenantId,
    val workspaceId: WorkspaceId,
    val parentId: DocumentNodeId?,
    val type: DocumentNodeType,
    val title: String,
    val slug: String,
    val materializedPath: String,
    val depth: Int = 0,
    val position: Double = DEFAULT_POSITION,
    val isArchived: Boolean = false,
    val createdBy: UserId,
    val updatedBy: UserId? = null,
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now(),
    val version: Long = 0,
) {

    init {
        require(title.isNotBlank()) { "DocumentNode title must not be blank" }
        require(slug.isNotBlank()) { "DocumentNode slug must not be blank" }
        require(materializedPath.isNotBlank()) { "DocumentNode materializedPath must not be blank" }
        require(PATH_REGEX.matches(materializedPath)) {
            "DocumentNode materializedPath must match pattern '/segment[/segment]'"
        }
        require(depth >= 0) { "DocumentNode depth must not be negative" }
        require(position >= 0) { "DocumentNode position must be positive" }
    }

    fun rename(newTitle: String, newSlug: String): DocumentNode {
        require(newTitle.isNotBlank()) { "DocumentNode title must not be blank" }
        require(newSlug.isNotBlank()) { "DocumentNode slug must not be blank" }

        return copy(
            title = newTitle,
            slug = newSlug,
            updatedAt = Instant.now()
        )
    }

    fun moveTo(parent: DocumentNodeId?, newPath: String, newDepth: Int, newPosition: Double): DocumentNode {
        require(newPath.isNotBlank()) { "DocumentNode materializedPath must not be blank" }
        require(PATH_REGEX.matches(newPath)) {
            "DocumentNode materializedPath must match pattern '/segment[/segment]'"
        }
        require(newDepth >= 0) { "DocumentNode depth must not be negative" }
        require(newPosition >= 0) { "DocumentNode position must be positive" }

        return copy(
            parentId = parent,
            materializedPath = newPath,
            depth = newDepth,
            position = newPosition,
            updatedAt = Instant.now()
        )
    }

    fun markArchived(archived: Boolean): DocumentNode = copy(
        isArchived = archived,
        updatedAt = Instant.now()
    )

    companion object {
        const val DEFAULT_POSITION: Double = 65_536.0

        private val PATH_REGEX = "^(/[a-zA-Z0-9_-]+)+$".toRegex()
    }
}
