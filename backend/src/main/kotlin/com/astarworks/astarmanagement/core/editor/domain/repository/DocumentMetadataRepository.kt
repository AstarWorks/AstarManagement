package com.astarworks.astarmanagement.core.editor.domain.repository

import com.astarworks.astarmanagement.core.editor.domain.model.DocumentMetadata
import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId

interface DocumentMetadataRepository {

    fun save(metadata: DocumentMetadata): DocumentMetadata

    fun findByDocumentId(documentId: DocumentNodeId): DocumentMetadata?

    fun findByTenant(
        tenantId: TenantId,
        workspaceId: WorkspaceId,
        includeUnpublished: Boolean = true,
    ): List<DocumentMetadata>

    fun deleteByDocumentId(documentId: DocumentNodeId)
}
