package dev.ryuzu.astermanagement.controller

import dev.ryuzu.astermanagement.controller.base.BaseController
import dev.ryuzu.astermanagement.dto.common.ErrorResponse
import dev.ryuzu.astermanagement.dto.document.*
import dev.ryuzu.astermanagement.service.DocumentService
import dev.ryuzu.astermanagement.security.auth.annotation.CurrentUser
import dev.ryuzu.astermanagement.security.annotation.*
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.util.*

/**
 * REST controller for document management operations.
 * Provides endpoints for document upload, download, and management.
 */
@RestController
@RequestMapping("/api/v1/documents")
@Validated
@Tag(name = "Document Management", description = "Endpoints for document upload and management")
@SecurityRequirement(name = "bearerAuth")
class DocumentController(
    private val documentService: DocumentService
) : BaseController() {
    
    /**
     * Upload a single document.
     */
    @PostMapping("/upload", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasPermission(null, 'DOCUMENT_CREATE')")
    @Operation(
        summary = "Upload a single document",
        description = "Upload a document with optional metadata. File size limit is 100MB."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Document uploaded successfully"),
        ApiResponse(responseCode = "400", description = "Invalid file or request",
            content = [Content(schema = Schema(implementation = ErrorResponse::class))]),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "413", description = "File too large"),
        ApiResponse(responseCode = "422", description = "Unsupported file type"),
        ApiResponse(responseCode = "429", description = "Too many upload requests")
    )
    fun uploadDocument(
        @RequestPart("file") @Parameter(description = "File to upload") file: MultipartFile,
        @RequestPart(value = "metadata", required = false) @Valid metadata: DocumentMetadataDto?,
        @CurrentUser user: UserDetails
    ): ResponseEntity<DocumentDto> {
        val uploadRequest = DocumentUploadRequest(
            file = file,
            matterId = metadata?.matterId,
            description = metadata?.description,
            tags = metadata?.tags ?: emptyList(),
            isPublic = metadata?.isPublic ?: false
        )
        
        val document = documentService.uploadDocument(uploadRequest, user.username)
        return created(document.toDto(), document.id.toString())
    }
    
    /**
     * Upload multiple documents in batch.
     */
    @PostMapping("/upload/batch", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasPermission(null, 'DOCUMENT_CREATE')")
    @Operation(
        summary = "Upload multiple documents",
        description = "Upload multiple documents in a single request. Total size limit is 500MB."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Documents uploaded successfully"),
        ApiResponse(responseCode = "207", description = "Partial success - some documents failed"),
        ApiResponse(responseCode = "400", description = "Invalid request"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "413", description = "Total size too large"),
        ApiResponse(responseCode = "429", description = "Too many upload requests")
    )
    fun uploadDocumentsBatch(
        @RequestPart("files") files: List<MultipartFile>,
        @RequestPart(value = "metadata", required = false) @Valid metadata: BatchDocumentMetadataDto?,
        @CurrentUser user: UserDetails
    ): ResponseEntity<BatchUploadResponseDto> {
        val results = documentService.uploadDocumentsBatch(files, metadata, user.username)
        return ok(results)
    }
    
    /**
     * Get upload progress for a document.
     */
    @GetMapping("/{documentId}/progress")
    @PreAuthorize("hasPermission(#documentId, 'Document', 'DOCUMENT_READ')")
    @Operation(
        summary = "Get upload progress",
        description = "Get the current upload progress for a document"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Progress retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Document not found")
    )
    fun getUploadProgress(
        @PathVariable documentId: UUID
    ): ResponseEntity<UploadProgressDto> {
        val progress = documentService.getUploadProgress(documentId)
        return progress?.let { ok(it) } ?: notFound()
    }
    
    /**
     * Get document by ID.
     */
    @GetMapping("/{documentId}")
    @PreAuthorize("hasPermission(#documentId, 'Document', 'DOCUMENT_READ')")
    @Operation(
        summary = "Get document by ID",
        description = "Retrieve document metadata by its ID. Clients can only access documents from their matters."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Document found"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Document not found")
    )
    fun getDocumentById(
        @PathVariable @Parameter(description = "Document ID") documentId: UUID
    ): ResponseEntity<DocumentDto> {
        val document = documentService.getDocumentById(documentId)
        return document?.let { ok(it.toDto()) } ?: notFound()
    }
    
    /**
     * Download document content.
     */
    @GetMapping("/{documentId}/download")
    @Operation(
        summary = "Download document",
        description = "Download the actual document file. Returns the file as a binary stream."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "File downloaded successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Document not found")
    )
    @PreAuthorize("hasPermission(#documentId, 'Document', 'DOCUMENT_READ')")
    fun downloadDocument(
        @PathVariable @Parameter(description = "Document ID") documentId: UUID
    ): ResponseEntity<org.springframework.core.io.Resource> {
        val result = documentService.downloadDocument(documentId)
        return result?.let { (resource, document) ->
            ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(document.contentType))
                .header("Content-Disposition", "attachment; filename=\"${document.originalFileName}\"")
                .body(resource)
        } ?: notFound()
    }
    
    /**
     * Get document thumbnail.
     */
    @GetMapping("/{documentId}/thumbnail")
    @PreAuthorize("hasPermission(#documentId, 'Document', 'DOCUMENT_READ')")
    @Operation(
        summary = "Get document thumbnail",
        description = "Get a thumbnail preview of the document if available (images and PDFs)."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Thumbnail retrieved successfully"),
        ApiResponse(responseCode = "204", description = "No thumbnail available for this document type"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Document not found")
    )
    fun getDocumentThumbnail(
        @PathVariable @Parameter(description = "Document ID") documentId: UUID
    ): ResponseEntity<org.springframework.core.io.Resource> {
        val thumbnail = documentService.getDocumentThumbnail(documentId)
        return thumbnail?.let { resource ->
            ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(resource)
        } ?: ResponseEntity.noContent().build()
    }
    
    /**
     * Search documents with filtering.
     */
    @GetMapping("/search")
    @PreAuthorize("hasPermission(null, 'DOCUMENT_READ')")
    @Operation(
        summary = "Search documents",
        description = "Search documents with various filters including filename, content type, tags, and date range."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Search completed successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    fun searchDocuments(
        @RequestParam(required = false) @Parameter(description = "Search by filename") fileName: String?,
        @RequestParam(required = false) @Parameter(description = "Filter by content type") contentType: String?,
        @RequestParam(required = false) @Parameter(description = "Filter by matter ID") matterId: UUID?,
        @RequestParam(required = false) @Parameter(description = "Filter by tag") tag: String?,
        @RequestParam(defaultValue = "0") @Parameter(description = "Page number") page: Int,
        @RequestParam(defaultValue = "20") @Parameter(description = "Page size") size: Int
    ): ResponseEntity<PagedDocumentResponseDto> {
        val (validatedPage, validatedSize) = validatePagination(page, size)
        val results = documentService.searchDocuments(
            fileName = fileName,
            contentType = contentType,
            matterId = matterId,
            tag = tag,
            page = validatedPage,
            size = validatedSize
        )
        return ok(results)
    }
    
    /**
     * Update document metadata.
     */
    @PutMapping("/{documentId}/metadata")
    @PreAuthorize("hasPermission(#documentId, 'Document', 'DOCUMENT_UPDATE')")
    @Operation(
        summary = "Update document metadata",
        description = "Update document description and tags. File content cannot be modified."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Metadata updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Document not found")
    )
    fun updateDocumentMetadata(
        @PathVariable @Parameter(description = "Document ID") documentId: UUID,
        @Valid @RequestBody metadata: UpdateDocumentMetadataDto
    ): ResponseEntity<DocumentDto> {
        val document = documentService.updateDocumentMetadata(documentId, metadata)
        return document?.let { ok(it.toDto()) } ?: notFound()
    }
    
    /**
     * Delete document (soft delete).
     */
    @DeleteMapping("/{documentId}")
    @PreAuthorize("hasPermission(#documentId, 'Document', 'DOCUMENT_DELETE')")
    @Operation(
        summary = "Delete document",
        description = "Soft delete a document. The file is marked as deleted but not physically removed."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Document deleted successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Document not found")
    )
    fun deleteDocument(
        @PathVariable @Parameter(description = "Document ID") documentId: UUID
    ): ResponseEntity<Void> {
        return if (documentService.deleteDocument(documentId)) {
            noContent()
        } else {
            ResponseEntity.notFound().build()
        }
    }
    
    /**
     * Get document versions.
     */
    @GetMapping("/{documentId}/versions")
    @PreAuthorize("hasPermission(#documentId, 'Document', 'DOCUMENT_READ')")
    @Operation(
        summary = "Get document versions",
        description = "Get all versions of a document including the version history."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Versions retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Document not found")
    )
    fun getDocumentVersions(
        @PathVariable @Parameter(description = "Document ID") documentId: UUID
    ): ResponseEntity<List<DocumentVersionDto>> {
        val versions = documentService.getDocumentVersions(documentId)
        return if (versions.isNotEmpty()) {
            ok(versions)
        } else {
            notFound()
        }
    }
    
    /**
     * Upload new version of document.
     */
    @PostMapping("/{documentId}/versions", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasPermission(#documentId, 'Document', 'DOCUMENT_UPDATE')")
    @Operation(
        summary = "Upload new document version",
        description = "Upload a new version of an existing document. The original document is preserved."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "New version uploaded successfully"),
        ApiResponse(responseCode = "400", description = "Invalid file or request"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Original document not found"),
        ApiResponse(responseCode = "413", description = "File too large")
    )
    fun uploadDocumentVersion(
        @PathVariable @Parameter(description = "Document ID") documentId: UUID,
        @RequestPart("file") @Parameter(description = "New version file") file: MultipartFile,
        @RequestPart(value = "metadata", required = false) @Valid metadata: VersionMetadataDto?,
        @CurrentUser user: UserDetails
    ): ResponseEntity<DocumentDto> {
        val newVersion = documentService.uploadDocumentVersion(documentId, file, metadata?.comment, user.username)
        return newVersion?.let { 
            created(it.toDto(), it.id.toString())
        } ?: notFound()
    }
}