package com.astarworks.astarmanagement.core.editor.domain.service

import com.astarworks.astarmanagement.core.editor.api.exception.DocumentNodeNotFoundException
import com.astarworks.astarmanagement.core.editor.api.exception.DocumentRevisionNotFoundException
import com.astarworks.astarmanagement.core.editor.api.exception.DuplicateDocumentSlugException
import com.astarworks.astarmanagement.core.editor.api.exception.InvalidDocumentOperationException
import com.astarworks.astarmanagement.core.editor.api.exception.InvalidFolderOperationException
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentAggregate
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentMetadata
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentNode
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentNodeType
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentRevision
import com.astarworks.astarmanagement.core.editor.domain.repository.DocumentMetadataRepository
import com.astarworks.astarmanagement.core.editor.domain.repository.DocumentNodeRepository
import com.astarworks.astarmanagement.core.editor.domain.repository.DocumentRevisionRepository
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import com.astarworks.astarmanagement.core.workspace.api.exception.WorkspaceNotFoundException
import com.astarworks.astarmanagement.core.workspace.domain.service.WorkspaceService
import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import java.security.MessageDigest
import java.text.Normalizer
import java.time.Instant
import kotlinx.serialization.json.JsonObject
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.text.Charsets

@Service
@Transactional
class DocumentService(
    private val documentNodeRepository: DocumentNodeRepository,
    private val documentRevisionRepository: DocumentRevisionRepository,
    private val documentMetadataRepository: DocumentMetadataRepository,
    private val workspaceService: WorkspaceService,
    private val tenantContextService: TenantContextService,
) {

    private val logger = LoggerFactory.getLogger(DocumentService::class.java)

    companion object {
        private const val MAX_SLUG_ATTEMPTS = 50
    }

    fun createDocument(
        workspaceId: WorkspaceId,
        parentId: DocumentNodeId?,
        title: String,
        authorId: UserId,
        content: String?,
        summary: String? = null,
        contentType: String = DocumentRevision.DEFAULT_CONTENT_TYPE,
        metadata: JsonObject = JsonObject(emptyMap()),
        tags: List<String> = emptyList(),
        isPublished: Boolean = false,
        isFavorited: Boolean = false,
        position: Double? = null,
    ): DocumentAggregate {
        require(title.isNotBlank()) { "Document title must not be blank" }

        val tenantId = currentTenantId()
        validateWorkspaceAccess(workspaceId, tenantId)

        val parentNode = parentId?.let { requireFolder(it, tenantId, workspaceId) }
        val slug = generateUniqueSlug(title, tenantId, workspaceId, parentId, null)
        val materializedPath = buildMaterializedPath(parentNode?.materializedPath, slug)
        val depth = (parentNode?.depth ?: -1) + 1
        val resolvedPosition = position ?: calculateNextPosition(tenantId, workspaceId, parentId)

        val node = DocumentNode(
            tenantId = tenantId,
            workspaceId = workspaceId,
            parentId = parentNode?.id,
            type = DocumentNodeType.DOCUMENT,
            title = title.trim(),
            slug = slug,
            materializedPath = materializedPath,
            depth = depth,
            position = resolvedPosition,
            createdBy = authorId,
            updatedBy = authorId,
        )
        val savedNode = documentNodeRepository.save(node)

        val sizeBytes = content?.toByteArray(Charsets.UTF_8)?.size?.toLong()
        val revision = DocumentRevision(
            tenantId = tenantId,
            workspaceId = workspaceId,
            documentId = savedNode.id,
            revisionNumber = 1,
            titleSnapshot = savedNode.title,
            authorId = authorId,
            summary = summary,
            contentPlaintext = content,
            contentType = contentType,
            sizeBytes = sizeBytes,
            checksum = checksum(content),
        )
        val savedRevision = documentRevisionRepository.save(revision)

        val savedMetadata = documentMetadataRepository.save(
            DocumentMetadata(
                documentId = savedNode.id,
                tenantId = tenantId,
                workspaceId = workspaceId,
                metadata = metadata,
                tags = tags,
                isPublished = isPublished,
                isFavorited = isFavorited,
            )
        )

        logger.debug("Created document ${savedNode.id} with revision ${savedRevision.revisionNumber}")
        return DocumentAggregate(
            node = savedNode,
            latestRevision = savedRevision,
            metadata = savedMetadata,
            revisionCount = 1,
        )
    }

    fun updateDocument(
        documentId: DocumentNodeId,
        authorId: UserId,
        title: String? = null,
        summary: String? = null,
        content: String? = null,
        contentType: String? = null,
        metadata: JsonObject? = null,
        tags: List<String>? = null,
        isPublished: Boolean? = null,
        isFavorited: Boolean? = null,
    ): DocumentAggregate {
        val tenantId = currentTenantId()
        val existingNode = requireDocument(documentId, tenantId)
        val workspaceId = existingNode.workspaceId

        val updatedNode = updateDocumentNode(existingNode, title, authorId, tenantId)
        val persistedNode = documentNodeRepository.save(updatedNode)

        val revisionCountBefore = documentRevisionRepository.countByDocumentId(documentId)
        val latestRevision = documentRevisionRepository.findLatest(documentId)
            ?: throw DocumentRevisionNotFoundException.forDocument(documentId)

        val newContent = content ?: latestRevision.contentPlaintext
        val newSummary = summary ?: latestRevision.summary
        val newContentType = contentType ?: latestRevision.contentType
        val newSizeBytes = newContent?.toByteArray(Charsets.UTF_8)?.size?.toLong()
        val newChecksum = if (content != null) checksum(content) else latestRevision.checksum
        val nextRevisionNumber = (revisionCountBefore + 1).toInt()

        val persistedRevision = documentRevisionRepository.save(
            DocumentRevision(
                tenantId = tenantId,
                workspaceId = workspaceId,
                documentId = documentId,
                revisionNumber = nextRevisionNumber,
                titleSnapshot = persistedNode.title,
                authorId = authorId,
                summary = newSummary,
                contentPlaintext = newContent,
                contentType = newContentType,
                sizeBytes = newSizeBytes,
                checksum = newChecksum,
            )
        )

        val persistedMetadata = upsertMetadata(
            documentId = documentId,
            tenantId = tenantId,
            workspaceId = workspaceId,
            metadata = metadata,
            tags = tags,
            isPublished = isPublished,
            isFavorited = isFavorited,
        )

        logger.debug(
            "Updated document ${documentId.value} with revision $nextRevisionNumber by user ${authorId.value}"
        )

        return DocumentAggregate(
            node = persistedNode,
            latestRevision = persistedRevision,
            metadata = persistedMetadata,
            revisionCount = revisionCountBefore + 1,
        )
    }

    @Transactional(readOnly = true)
    fun getDocument(documentId: DocumentNodeId): DocumentAggregate {
        val tenantId = currentTenantId()
        val node = requireDocument(documentId, tenantId)
        val latestRevision = documentRevisionRepository.findLatest(documentId)
            ?: throw DocumentRevisionNotFoundException.forDocument(documentId)
        val metadata = documentMetadataRepository.findByDocumentId(documentId)
        val revisionCount = documentRevisionRepository.countByDocumentId(documentId)

        return DocumentAggregate(node, latestRevision, metadata, revisionCount)
    }

    @Transactional(readOnly = true)
    fun listRevisions(documentId: DocumentNodeId): List<DocumentRevision> {
        val tenantId = currentTenantId()
        requireDocument(documentId, tenantId)
        return documentRevisionRepository.findByDocumentId(documentId)
    }

    fun deleteDocument(documentId: DocumentNodeId) {
        val tenantId = currentTenantId()
        val node = requireDocument(documentId, tenantId)
        documentNodeRepository.deleteById(node.id)
        logger.debug("Deleted document ${documentId.value}")
    }

    private fun updateDocumentNode(
        document: DocumentNode,
        title: String?,
        authorId: UserId,
        tenantId: TenantId,
    ): DocumentNode {
        if (title != null && title.isBlank()) {
            throw InvalidDocumentOperationException("Document title must not be blank")
        }

        val needsRename = title != null && title.trim() != document.title
        return if (needsRename) {
            val slug = generateUniqueSlug(
                title = title!!.trim(),
                tenantId = tenantId,
                workspaceId = document.workspaceId,
                parentId = document.parentId,
                excludeNodeId = document.id,
            )
            val newPath = buildMaterializedPath(parentPath(document), slug)
            document
                .rename(title.trim(), slug)
                .moveTo(document.parentId, newPath, document.depth, document.position)
                .copy(updatedBy = authorId)
        } else {
            document.copy(updatedBy = authorId, updatedAt = Instant.now())
        }
    }

    private fun upsertMetadata(
        documentId: DocumentNodeId,
        tenantId: TenantId,
        workspaceId: WorkspaceId,
        metadata: JsonObject?,
        tags: List<String>?,
        isPublished: Boolean?,
        isFavorited: Boolean?,
    ): DocumentMetadata? {
        val existing = documentMetadataRepository.findByDocumentId(documentId)
        val now = Instant.now()

        val base = existing ?: DocumentMetadata(
            documentId = documentId,
            tenantId = tenantId,
            workspaceId = workspaceId,
            metadata = metadata ?: JsonObject(emptyMap()),
            tags = tags ?: emptyList(),
            isPublished = isPublished ?: false,
            isFavorited = isFavorited ?: false,
        )

        var mutated = base
        var dirty = existing == null

        if (metadata != null && metadata != base.metadata) {
            mutated = mutated.copy(metadata = metadata, updatedAt = now)
            dirty = true
        }
        if (tags != null) {
            mutated = mutated.withTags(tags)
            dirty = true
        }
        if (isPublished != null && isPublished != mutated.isPublished) {
            mutated = mutated.markPublished(isPublished)
            dirty = true
        }
        if (isFavorited != null && isFavorited != mutated.isFavorited) {
            mutated = mutated.markFavorited(isFavorited)
            dirty = true
        }
        if (!dirty) {
            mutated = mutated.copy(updatedAt = now)
            dirty = true
        }

        return if (dirty) {
            documentMetadataRepository.save(mutated)
        } else {
            existing
        }
    }

    private fun currentTenantId(): TenantId {
        val tenantUuid = tenantContextService.requireTenantContext()
        return TenantId(tenantUuid)
    }

    private fun validateWorkspaceAccess(workspaceId: WorkspaceId, tenantId: TenantId) {
        val workspace = workspaceService.getWorkspaceByIdForTenant(workspaceId, tenantId)
        if (workspace == null) {
            throw WorkspaceNotFoundException.of(workspaceId)
        }
    }

    private fun requireFolder(
        folderId: DocumentNodeId,
        tenantId: TenantId,
        expectedWorkspace: WorkspaceId?,
    ): DocumentNode {
        val node = documentNodeRepository.findById(folderId)
            ?: throw DocumentNodeNotFoundException.of(folderId)

        if (node.tenantId != tenantId) {
            throw DocumentNodeNotFoundException.of(folderId)
        }
        if (expectedWorkspace != null && node.workspaceId != expectedWorkspace) {
            throw DocumentNodeNotFoundException.inWorkspace(folderId, expectedWorkspace)
        }
        if (node.type != DocumentNodeType.FOLDER) {
            throw InvalidFolderOperationException("Node ${folderId.value} is not a folder")
        }
        return node
    }

    private fun requireDocument(documentId: DocumentNodeId, tenantId: TenantId): DocumentNode {
        val node = documentNodeRepository.findById(documentId)
            ?: throw DocumentNodeNotFoundException.of(documentId)

        if (node.tenantId != tenantId) {
            throw DocumentNodeNotFoundException.of(documentId)
        }
        if (node.type != DocumentNodeType.DOCUMENT) {
            throw InvalidDocumentOperationException("Node ${documentId.value} is not a document")
        }
        return node
    }

    private fun generateUniqueSlug(
        title: String,
        tenantId: TenantId,
        workspaceId: WorkspaceId,
        parentId: DocumentNodeId?,
        excludeNodeId: DocumentNodeId?,
    ): String {
        val base = slugify(title)
        var candidate = base
        var attempt = 1
        while (true) {
            val existing = documentNodeRepository.findByTenantAndSlug(tenantId, workspaceId, parentId, candidate)
            if (existing == null || existing.id == excludeNodeId) {
                return candidate
            }
            attempt++
            if (attempt > MAX_SLUG_ATTEMPTS) {
                throw DuplicateDocumentSlugException.of(title)
            }
            candidate = "$base-$attempt"
        }
    }

    private fun slugify(input: String): String {
        val normalized = Normalizer.normalize(input.trim(), Normalizer.Form.NFKD)
        val ascii = normalized.lowercase()
            .replace(Regex("[^a-z0-9]+"), "-")
            .trim('-')
        if (ascii.isNotBlank()) {
            return ascii.take(160)
        }
        return "doc-${checksum(input)?.take(8) ?: "00000000"}"
    }

    private fun buildMaterializedPath(parentPath: String?, slug: String): String {
        return if (parentPath.isNullOrBlank()) {
            "/$slug"
        } else {
            "$parentPath/$slug"
        }
    }

    private fun calculateNextPosition(
        tenantId: TenantId,
        workspaceId: WorkspaceId,
        parentId: DocumentNodeId?,
    ): Double {
        val siblings = documentNodeRepository.findChildren(tenantId, workspaceId, parentId, includeArchived = true)
        val maxPosition = siblings.maxOfOrNull(DocumentNode::position)
        return if (maxPosition != null) {
            maxPosition + DocumentNode.DEFAULT_POSITION
        } else {
            DocumentNode.DEFAULT_POSITION
        }
    }

    private fun parentPath(node: DocumentNode): String? {
        val base = node.materializedPath.substringBeforeLast('/', missingDelimiterValue = "")
        return base.ifBlank { null }
    }

    private fun checksum(content: String?): String? {
        if (content == null) {
            return null
        }
        val digest = MessageDigest.getInstance("SHA-256")
        val bytes = digest.digest(content.toByteArray(Charsets.UTF_8))
        return bytes.joinToString(separator = "") { byte -> "%02x".format(byte) }
    }
}
