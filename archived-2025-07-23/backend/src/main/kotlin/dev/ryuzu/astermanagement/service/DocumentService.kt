package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.modules.document.domain.Document
import dev.ryuzu.astermanagement.dto.document.*
import dev.ryuzu.astermanagement.dto.document.ValidationResult
import org.springframework.core.io.Resource
import org.springframework.web.multipart.MultipartFile
import java.util.*

/**
 * Service interface for document management operations.
 * Defines business logic for handling document uploads, downloads, and metadata management.
 */
interface DocumentService {
    
    /**
     * Upload a single document with metadata.
     * 
     * @param request The upload request containing file and metadata
     * @param username The username of the user uploading the document
     * @return The created document entity
     */
    fun uploadDocument(request: DocumentUploadRequest, username: String): Document
    
    /**
     * Upload multiple documents in batch.
     * 
     * @param files List of files to upload
     * @param metadata Batch metadata for the uploads
     * @param username The username of the user uploading the documents
     * @return Batch upload response with results
     */
    fun uploadDocumentsBatch(
        files: List<MultipartFile>, 
        metadata: BatchDocumentMetadataDto?, 
        username: String
    ): BatchUploadResponseDto
    
    /**
     * Get upload progress for a document.
     * 
     * @param documentId The document ID
     * @return Upload progress information or null if not found
     */
    fun getUploadProgress(documentId: UUID): UploadProgressDto?
    
    /**
     * Get document by ID.
     * 
     * @param id The document ID
     * @return The document entity or null if not found
     */
    fun getDocumentById(id: UUID): Document?
    
    /**
     * Download document content.
     * 
     * @param id The document ID
     * @return Pair of resource and document metadata, or null if not found
     */
    fun downloadDocument(id: UUID): Pair<Resource, Document>?
    
    /**
     * Get document thumbnail if available.
     * 
     * @param id The document ID
     * @return Thumbnail resource or null if not available
     */
    fun getDocumentThumbnail(id: UUID): Resource?
    
    /**
     * Search documents with various filters.
     * 
     * @param fileName Optional filename filter
     * @param contentType Optional content type filter
     * @param matterId Optional matter ID filter
     * @param tag Optional tag filter
     * @param page Page number
     * @param size Page size
     * @return Paged document results
     */
    fun searchDocuments(
        fileName: String?,
        contentType: String?,
        matterId: UUID?,
        tag: String?,
        page: Int,
        size: Int
    ): PagedDocumentResponseDto
    
    /**
     * Update document metadata.
     * 
     * @param id The document ID
     * @param metadata New metadata
     * @return Updated document or null if not found
     */
    fun updateDocumentMetadata(id: UUID, metadata: UpdateDocumentMetadataDto): Document?
    
    /**
     * Soft delete a document.
     * 
     * @param id The document ID
     * @return True if deleted, false if not found
     */
    fun deleteDocument(id: UUID): Boolean
    
    /**
     * Get document versions.
     * 
     * @param id The document ID
     * @return List of document versions
     */
    fun getDocumentVersions(id: UUID): List<DocumentVersionDto>
    
    /**
     * Upload a new version of an existing document.
     * 
     * @param id The original document ID
     * @param file The new version file
     * @param comment Optional version comment
     * @param username The username of the user uploading the version
     * @return The new document version or null if original not found
     */
    fun uploadDocumentVersion(id: UUID, file: MultipartFile, comment: String?, username: String): Document?
    
    /**
     * Validate file before upload.
     * 
     * @param file The file to validate
     * @return Validation result
     */
    fun validateFile(file: MultipartFile): ValidationResult
    
    /**
     * Scan document for viruses.
     * 
     * @param documentId The document ID to scan
     * @return Virus scan result
     */
    fun scanForVirus(documentId: UUID): VirusScanResult
}