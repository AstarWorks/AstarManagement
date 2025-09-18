package com.astarworks.astarmanagement.core.editor.api.mapper

import com.astarworks.astarmanagement.core.editor.api.dto.common.EditorBreadcrumbItemResponse
import com.astarworks.astarmanagement.core.editor.api.dto.common.EditorNodeResponse
import com.astarworks.astarmanagement.core.editor.api.dto.document.DocumentMetadataResponse
import com.astarworks.astarmanagement.core.editor.api.dto.document.DocumentResponse
import com.astarworks.astarmanagement.core.editor.api.dto.document.DocumentRevisionResponse
import com.astarworks.astarmanagement.core.editor.api.dto.document.DocumentRevisionSummaryResponse
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentAggregate
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentMetadata
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentNode
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentRevision
import org.springframework.stereotype.Component

@Component
class EditorDtoMapper {

    fun toNodeResponse(node: DocumentNode): EditorNodeResponse {
        return EditorNodeResponse(
            id = node.id.value,
            workspaceId = node.workspaceId.value,
            parentId = node.parentId?.value,
            type = node.type.name.lowercase(),
            title = node.title,
            slug = node.slug,
            materializedPath = node.materializedPath,
            depth = node.depth,
            position = node.position,
            isArchived = node.isArchived,
            createdBy = node.createdBy.value,
            updatedBy = node.updatedBy?.value,
            createdAt = node.createdAt,
            updatedAt = node.updatedAt,
            version = node.version,
        )
    }

    fun toDocumentResponse(aggregate: DocumentAggregate): DocumentResponse {
        return DocumentResponse(
            node = toNodeResponse(aggregate.node),
            latestRevision = toRevisionResponse(aggregate.latestRevision, includeContent = true),
            metadata = aggregate.metadata?.let(::toMetadataResponse),
            revisionCount = aggregate.revisionCount,
        )
    }

    fun toRevisionResponse(revision: DocumentRevision, includeContent: Boolean): DocumentRevisionResponse {
        return DocumentRevisionResponse(
            id = revision.id.value,
            revisionNumber = revision.revisionNumber,
            titleSnapshot = revision.titleSnapshot,
            summary = revision.summary,
            content = if (includeContent) revision.contentPlaintext else null,
            contentType = revision.contentType,
            sizeBytes = revision.sizeBytes,
            checksum = revision.checksum,
            authorId = revision.authorId.value,
            createdAt = revision.createdAt,
        )
    }

    fun toRevisionSummary(revision: DocumentRevision): DocumentRevisionSummaryResponse {
        return DocumentRevisionSummaryResponse(
            id = revision.id.value,
            revisionNumber = revision.revisionNumber,
            titleSnapshot = revision.titleSnapshot,
            summary = revision.summary,
            contentType = revision.contentType,
            sizeBytes = revision.sizeBytes,
            checksum = revision.checksum,
            authorId = revision.authorId.value,
            createdAt = revision.createdAt,
        )
    }

    fun toMetadataResponse(metadata: DocumentMetadata): DocumentMetadataResponse {
        return DocumentMetadataResponse(
            metadata = metadata.metadata,
            tags = metadata.tags,
            isPublished = metadata.isPublished,
            isFavorited = metadata.isFavorited,
            lastViewedAt = metadata.lastViewedAt,
            lastIndexedAt = metadata.lastIndexedAt,
            createdAt = metadata.createdAt,
            updatedAt = metadata.updatedAt,
            version = metadata.version,
        )
    }

    fun toBreadcrumb(nodes: List<DocumentNode>): List<EditorBreadcrumbItemResponse> {
        return nodes.map { node ->
            EditorBreadcrumbItemResponse(
                id = node.id.value,
                title = node.title,
                slug = node.slug,
                materializedPath = node.materializedPath,
            )
        }
    }
}
