package com.astarworks.astarmanagement.core.editor.domain.repository

import com.astarworks.astarmanagement.core.editor.domain.model.DocumentRevision
import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.DocumentRevisionId

interface DocumentRevisionRepository {

    fun save(revision: DocumentRevision): DocumentRevision

    fun findById(id: DocumentRevisionId): DocumentRevision?

    fun findLatest(documentId: DocumentNodeId): DocumentRevision?

    fun findByDocumentId(documentId: DocumentNodeId): List<DocumentRevision>

    fun countByDocumentId(documentId: DocumentNodeId): Long
}
