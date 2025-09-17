package com.astarworks.astarmanagement.core.editor.domain.repository

import com.astarworks.astarmanagement.core.editor.domain.model.DocumentNode
import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId

/**
 * Repository interface for editor document tree nodes.
 */
interface DocumentNodeRepository {

    fun save(node: DocumentNode): DocumentNode

    fun findById(id: DocumentNodeId): DocumentNode?

    fun findByTenantAndPath(tenantId: TenantId, workspaceId: WorkspaceId, path: String): DocumentNode?

    fun findByTenantAndSlug(
        tenantId: TenantId,
        workspaceId: WorkspaceId,
        parentId: DocumentNodeId?,
        slug: String,
    ): DocumentNode?

    fun findChildren(
        tenantId: TenantId,
        workspaceId: WorkspaceId,
        parentId: DocumentNodeId?,
        includeArchived: Boolean = false,
    ): List<DocumentNode>

    fun findByIds(ids: Collection<DocumentNodeId>): List<DocumentNode>

    fun existsById(id: DocumentNodeId): Boolean

    fun deleteById(id: DocumentNodeId)
}
