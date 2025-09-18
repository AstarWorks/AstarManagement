package com.astarworks.astarmanagement.core.editor.api.controller

import com.astarworks.astarmanagement.core.auth.domain.model.AuthenticatedUserContext
import com.astarworks.astarmanagement.core.editor.api.dto.EditorApiResponse
import com.astarworks.astarmanagement.core.editor.api.dto.document.DocumentCreateRequest
import com.astarworks.astarmanagement.core.editor.api.dto.document.DocumentDeletionResponse
import com.astarworks.astarmanagement.core.editor.api.dto.document.DocumentResponse
import com.astarworks.astarmanagement.core.editor.api.dto.document.DocumentRevisionsResponse
import com.astarworks.astarmanagement.core.editor.api.dto.document.DocumentUpdateRequest
import com.astarworks.astarmanagement.core.editor.api.mapper.EditorDtoMapper
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentRevision
import com.astarworks.astarmanagement.core.editor.domain.service.DocumentService
import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import java.util.UUID
import kotlinx.serialization.json.JsonObject
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/editor/documents")
@ConditionalOnProperty(prefix = "app.features.editor", name = ["enabled"], havingValue = "true")
@PreAuthorize("isAuthenticated()")
@Tag(
    name = "Editor Documents",
    description = "Document CRUD and revision endpoints for the editor module"
)
class EditorDocumentController(
    private val documentService: DocumentService,
    private val dtoMapper: EditorDtoMapper,
) {

    private val logger = LoggerFactory.getLogger(EditorDocumentController::class.java)

    @PostMapping
    @PreAuthorize("hasPermissionRule('document.create.all')")
    fun createDocument(
        @AuthenticationPrincipal principal: AuthenticatedUserContext,
        @Valid @RequestBody request: DocumentCreateRequest,
    ): EditorApiResponse<DocumentResponse> {
        logger.info("Creating document '{}' in workspace {}", request.title, request.workspaceId)

        val metadata = request.metadata ?: JsonObject(emptyMap())
        val tags = request.tags ?: emptyList()

        val aggregate = documentService.createDocument(
            workspaceId = WorkspaceId(request.workspaceId),
            parentId = request.parentId?.let(::DocumentNodeId),
            title = request.title,
            authorId = UserId(principal.userId),
            content = request.content,
            summary = request.summary,
            contentType = request.contentType ?: DocumentRevision.DEFAULT_CONTENT_TYPE,
            metadata = metadata,
            tags = tags,
            isPublished = request.isPublished ?: false,
            isFavorited = request.isFavorited ?: false,
            position = request.position,
        )

        val response = dtoMapper.toDocumentResponse(aggregate)
        return EditorApiResponse(success = true, data = response)
    }

    @PutMapping("/{documentId}")
    @PreAuthorize("hasPermissionRule('document.edit.all')")
    fun updateDocument(
        @PathVariable documentId: UUID,
        @AuthenticationPrincipal principal: AuthenticatedUserContext,
        @Valid @RequestBody request: DocumentUpdateRequest,
    ): EditorApiResponse<DocumentResponse> {
        logger.info("Updating document {}", documentId)

        val aggregate = documentService.updateDocument(
            documentId = DocumentNodeId(documentId),
            authorId = UserId(principal.userId),
            nodeVersion = request.nodeVersion,
            metadataVersion = request.metadataVersion,
            title = request.title,
            summary = request.summary,
            content = request.content,
            contentType = request.contentType,
            metadata = request.metadata,
            tags = request.tags,
            isPublished = request.isPublished,
            isFavorited = request.isFavorited,
        )

        val response = dtoMapper.toDocumentResponse(aggregate)
        return EditorApiResponse(success = true, data = response)
    }

    @GetMapping("/{documentId}")
    @PreAuthorize("hasPermissionRule('document.view.all')")
    fun getDocument(
        @PathVariable documentId: UUID,
    ): EditorApiResponse<DocumentResponse> {
        logger.debug("Fetching document {}", documentId)

        val aggregate = documentService.getDocument(DocumentNodeId(documentId))
        val response = dtoMapper.toDocumentResponse(aggregate)
        return EditorApiResponse(success = true, data = response)
    }

    @GetMapping("/{documentId}/revisions")
    @PreAuthorize("hasPermissionRule('document.view.all')")
    fun listRevisions(
        @PathVariable documentId: UUID,
    ): EditorApiResponse<DocumentRevisionsResponse> {
        logger.debug("Listing revisions for document {}", documentId)

        val revisions = documentService.listRevisions(DocumentNodeId(documentId))
        val response = DocumentRevisionsResponse(revisions.map(dtoMapper::toRevisionSummary))
        return EditorApiResponse(success = true, data = response)
    }

    @DeleteMapping("/{documentId}")
    @PreAuthorize("hasPermissionRule('document.delete.all')")
    fun deleteDocument(
        @PathVariable documentId: UUID,
        @RequestParam version: Long,
    ): EditorApiResponse<DocumentDeletionResponse> {
        logger.info("Deleting document {}", documentId)

        documentService.deleteDocument(DocumentNodeId(documentId), version)
        val response = DocumentDeletionResponse(deleted = true)
        return EditorApiResponse(success = true, data = response)
    }
}
