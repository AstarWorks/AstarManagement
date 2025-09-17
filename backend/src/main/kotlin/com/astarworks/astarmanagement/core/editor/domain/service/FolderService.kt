package com.astarworks.astarmanagement.core.editor.domain.service

import com.astarworks.astarmanagement.core.editor.api.exception.DocumentNodeNotFoundException
import com.astarworks.astarmanagement.core.editor.api.exception.DuplicateDocumentSlugException
import com.astarworks.astarmanagement.core.editor.api.exception.InvalidFolderOperationException
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentNode
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentNodeType
import com.astarworks.astarmanagement.core.editor.domain.repository.DocumentNodeRepository
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import com.astarworks.astarmanagement.core.workspace.api.exception.WorkspaceNotFoundException
import com.astarworks.astarmanagement.core.workspace.domain.service.WorkspaceService
import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import java.text.Normalizer
import java.util.ArrayDeque
import java.util.UUID
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class FolderService(
    private val documentNodeRepository: DocumentNodeRepository,
    private val workspaceService: WorkspaceService,
    private val tenantContextService: TenantContextService,
) {

    private val logger = LoggerFactory.getLogger(FolderService::class.java)

    companion object {
        private const val MAX_SLUG_ATTEMPTS = 50
    }

    fun createFolder(
        workspaceId: WorkspaceId,
        parentId: DocumentNodeId?,
        title: String,
        createdBy: UserId,
        position: Double? = null,
    ): DocumentNode {
        require(title.isNotBlank()) { "Folder title must not be blank" }

        val tenantId = currentTenantId()
        validateWorkspaceAccess(workspaceId, tenantId)

        val parentNode = parentId?.let { requireFolder(it, tenantId, workspaceId) }
        val slug = generateUniqueSlug(title, tenantId, workspaceId, parentId, null)
        val materializedPath = buildMaterializedPath(parentNode?.materializedPath, slug)
        val depth = (parentNode?.depth ?: -1) + 1
        val resolvedPosition = position ?: calculateNextPosition(tenantId, workspaceId, parentId)

        val folder = DocumentNode(
            tenantId = tenantId,
            workspaceId = workspaceId,
            parentId = parentNode?.id,
            type = DocumentNodeType.FOLDER,
            title = title.trim(),
            slug = slug,
            materializedPath = materializedPath,
            depth = depth,
            position = resolvedPosition,
            createdBy = createdBy,
            updatedBy = createdBy,
        )

        val saved = documentNodeRepository.save(folder)
        logger.debug("Created folder ${saved.id} under parent ${parentNode?.id} in workspace $workspaceId")
        return saved
    }

    fun renameFolder(
        folderId: DocumentNodeId,
        newTitle: String,
        updatedBy: UserId,
    ): DocumentNode {
        require(newTitle.isNotBlank()) { "Folder title must not be blank" }

        val tenantId = currentTenantId()
        val folder = requireFolder(folderId, tenantId, null)
        val workspaceId = folder.workspaceId

        val parentPath = folder.parentId?.let { folder.materializedPath.substringBeforeLast("/") } ?: ""
        val slug = generateUniqueSlug(newTitle, tenantId, workspaceId, folder.parentId, folder.id)
        val newPath = buildMaterializedPath(parentPath.ifBlank { null }, slug)

        val descendants = loadDescendants(folder, tenantId)
        val updatedRoot = folder.rename(newTitle.trim(), slug)
            .moveTo(folder.parentId, newPath, folder.depth, folder.position)
            .copy(updatedBy = updatedBy)

        documentNodeRepository.save(updatedRoot)
        updateDescendantPaths(folder.materializedPath, newPath, descendants, updatedBy)

        logger.debug("Renamed folder $folderId to '$newTitle' with slug '$slug'")
        return updatedRoot
    }

    fun moveFolder(
        folderId: DocumentNodeId,
        targetParentId: DocumentNodeId?,
        updatedBy: UserId,
        newPosition: Double? = null,
    ): DocumentNode {
        val tenantId = currentTenantId()
        val folder = requireFolder(folderId, tenantId, null)
        val workspaceId = folder.workspaceId

        val targetParent = targetParentId?.let { requireFolder(it, tenantId, workspaceId) }
        val slugCollision = documentNodeRepository.findByTenantAndSlug(tenantId, workspaceId, targetParentId, folder.slug)
        if (slugCollision != null && slugCollision.id != folder.id) {
            throw DuplicateDocumentSlugException.of(folder.slug)
        }

        val oldPath = folder.materializedPath
        val newDepth = (targetParent?.depth ?: -1) + 1
        val newPath = buildMaterializedPath(targetParent?.materializedPath, folder.slug)
        val descendants = loadDescendants(folder, tenantId)
        val depthDelta = newDepth - folder.depth
        val resolvedPosition = newPosition ?: calculateNextPosition(tenantId, workspaceId, targetParentId)

        val updatedRoot = folder.moveTo(targetParentId, newPath, newDepth, resolvedPosition)
            .copy(updatedBy = updatedBy)
        documentNodeRepository.save(updatedRoot)

        updateDescendantPaths(oldPath, newPath, descendants, updatedBy, depthDelta)

        logger.debug("Moved folder $folderId to parent ${targetParentId ?: "<root>"}")
        return updatedRoot
    }

    fun archiveFolder(
        folderId: DocumentNodeId,
        archived: Boolean,
        updatedBy: UserId,
    ): DocumentNode {
        val tenantId = currentTenantId()
        val folder = requireFolder(folderId, tenantId, null)
        val descendants = loadDescendants(folder, tenantId)

        val updatedRoot = folder.markArchived(archived).copy(updatedBy = updatedBy)
        documentNodeRepository.save(updatedRoot)

        descendants.forEach { node ->
            val updated = node.markArchived(archived).copy(updatedBy = updatedBy)
            documentNodeRepository.save(updated)
        }

        logger.debug("${if (archived) "Archived" else "Unarchived"} folder $folderId and ${descendants.size} descendants")
        return updatedRoot
    }

    fun deleteFolder(folderId: DocumentNodeId) {
        val tenantId = currentTenantId()
        val folder = requireFolder(folderId, tenantId, null)
        documentNodeRepository.deleteById(folder.id)
        logger.debug("Deleted folder $folderId (cascade deletes applied)")
    }

    @Transactional(readOnly = true)
    fun listChildren(
        workspaceId: WorkspaceId,
        parentId: DocumentNodeId?,
        includeArchived: Boolean = false,
    ): List<DocumentNode> {
        val tenantId = currentTenantId()
        validateWorkspaceAccess(workspaceId, tenantId)

        parentId?.let { requireFolder(it, tenantId, workspaceId) }

        return documentNodeRepository.findChildren(tenantId, workspaceId, parentId, includeArchived)
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
                throw IllegalStateException("Unable to generate unique slug for title '$title'")
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
        val fallback = UUID.nameUUIDFromBytes(input.trim().toByteArray())
            .toString()
            .replace("-", "")
            .take(8)
        return "folder-$fallback"
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

    private fun loadDescendants(root: DocumentNode, tenantId: TenantId): List<DocumentNode> {
        val result = mutableListOf<DocumentNode>()
        val queue: ArrayDeque<DocumentNodeId> = ArrayDeque()
        queue.add(root.id)
        while (queue.isNotEmpty()) {
            val currentId = queue.removeFirst()
            val children = documentNodeRepository.findChildren(tenantId, root.workspaceId, currentId, includeArchived = true)
            result.addAll(children)
            children.forEach { queue.add(it.id) }
        }
        return result
    }

    private fun updateDescendantPaths(
        oldRootPath: String,
        newRootPath: String,
        descendants: List<DocumentNode>,
        updatedBy: UserId,
        depthDelta: Int = 0,
    ) {
        descendants.forEach { node ->
            val relativePath = node.materializedPath.removePrefix(oldRootPath)
            val nextPath = (newRootPath + relativePath).replace("//", "/")
            val nextDepth = node.depth + depthDelta
            val updated = node.moveTo(node.parentId, nextPath, nextDepth, node.position)
                .copy(updatedBy = updatedBy)
            documentNodeRepository.save(updated)
        }
    }
}
