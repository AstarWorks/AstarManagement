package com.astarworks.astarmanagement.core.editor.api.exception

import com.astarworks.astarmanagement.core.editor.api.controller.EditorDocumentController
import com.astarworks.astarmanagement.core.editor.api.controller.EditorFolderController
import com.astarworks.astarmanagement.core.editor.api.dto.EditorApiResponse
import com.astarworks.astarmanagement.core.editor.api.dto.EditorErrorResponse
import com.astarworks.astarmanagement.core.workspace.api.exception.WorkspaceException
import com.astarworks.astarmanagement.shared.exception.OptimisticLockException
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.contentOrNull
import org.slf4j.LoggerFactory
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice(assignableTypes = [EditorFolderController::class, EditorDocumentController::class])
@Order(Ordered.HIGHEST_PRECEDENCE)
class EditorExceptionHandler {

    private val logger = LoggerFactory.getLogger(EditorExceptionHandler::class.java)

    @ExceptionHandler(DocumentNodeNotFoundException::class)
    fun handleNodeNotFound(ex: DocumentNodeNotFoundException): ResponseEntity<EditorApiResponse<Unit>> {
        logger.warn("Document node not found", ex)
        val details = mutableMapOf<String, String?>()
        details["nodeId"] = ex.nodeId.value.toString()
        ex.workspaceId?.let { details["workspaceId"] = it.value.toString() }
        return buildErrorResponse(HttpStatus.NOT_FOUND, "EDITOR_NODE_NOT_FOUND", ex.message, details)
    }

    @ExceptionHandler(DocumentRevisionNotFoundException::class)
    fun handleRevisionNotFound(ex: DocumentRevisionNotFoundException): ResponseEntity<EditorApiResponse<Unit>> {
        logger.warn("Document revision not found", ex)
        val details = mutableMapOf<String, String?>()
        ex.revisionId?.let { details["revisionId"] = it.value.toString() }
        ex.documentId?.let { details["documentId"] = it.value.toString() }
        return buildErrorResponse(HttpStatus.NOT_FOUND, "EDITOR_REVISION_NOT_FOUND", ex.message, details)
    }

    @ExceptionHandler(DuplicateDocumentSlugException::class)
    fun handleDuplicateSlug(ex: DuplicateDocumentSlugException): ResponseEntity<EditorApiResponse<Unit>> {
        logger.warn("Duplicate document slug detected", ex)
        val details = mapOf("slug" to ex.slug)
        return buildErrorResponse(HttpStatus.CONFLICT, "EDITOR_DUPLICATE_SLUG", ex.message, details)
    }

    @ExceptionHandler(value = [InvalidFolderOperationException::class, InvalidDocumentOperationException::class])
    fun handleInvalidOperation(ex: RuntimeException): ResponseEntity<EditorApiResponse<Unit>> {
        logger.warn("Invalid editor operation", ex)
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "EDITOR_INVALID_OPERATION", ex.message)
    }

    @ExceptionHandler(WorkspaceException::class)
    fun handleWorkspaceException(ex: WorkspaceException): ResponseEntity<EditorApiResponse<Unit>> {
        logger.warn("Workspace error during editor operation", ex)
        val details = ex.details?.mapValues { (_, value) -> value.toReadableString() }
        return buildErrorResponse(HttpStatus.valueOf(ex.httpStatus), ex.errorCode, ex.message, details)
    }

    @ExceptionHandler(OptimisticLockException::class)
    fun handleOptimisticLock(ex: OptimisticLockException): ResponseEntity<EditorApiResponse<Unit>> {
        logger.warn("Optimistic lock conflict", ex)
        return buildErrorResponse(HttpStatus.CONFLICT, "EDITOR_CONFLICT", ex.message)
    }

    private fun buildErrorResponse(
        status: HttpStatus,
        code: String,
        message: String?,
        details: Map<String, String?>? = null,
    ): ResponseEntity<EditorApiResponse<Unit>> {
        val error = EditorErrorResponse(
            code = code,
            message = message ?: "Unexpected error",
            details = details,
        )
        return ResponseEntity.status(status).body(EditorApiResponse(success = false, error = error))
    }
}

private fun JsonElement.toReadableString(): String? =
    (this as? kotlinx.serialization.json.JsonPrimitive)?.contentOrNull ?: this.toString()
