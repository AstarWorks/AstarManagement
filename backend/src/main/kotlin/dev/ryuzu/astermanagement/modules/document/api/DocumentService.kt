package dev.ryuzu.astermanagement.modules.document.api

import dev.ryuzu.astermanagement.modules.document.api.dto.DocumentDTO
import dev.ryuzu.astermanagement.modules.document.api.dto.CreateDocumentRequest
import dev.ryuzu.astermanagement.modules.document.api.dto.UpdateDocumentRequest
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.web.multipart.MultipartFile
import java.util.*

/**
 * Public API for Document module
 * Defines all operations available to other modules and controllers
 */
interface DocumentService {
    
    /**
     * Upload a new document
     */
    fun uploadDocument(
        file: MultipartFile,
        request: CreateDocumentRequest,
        uploadedBy: UUID
    ): DocumentDTO
    
    /**
     * Get document by ID
     */
    fun getDocumentById(id: UUID): DocumentDTO?
    
    /**
     * Get document by file ID
     */
    fun getDocumentByFileId(fileId: String): DocumentDTO?
    
    /**
     * Update document metadata
     */
    fun updateDocument(id: UUID, request: UpdateDocumentRequest): DocumentDTO
    
    /**
     * Delete document (soft delete)
     */
    fun deleteDocument(id: UUID, userId: UUID)
    
    /**
     * Get documents for a specific matter
     */
    fun getDocumentsByMatter(matterId: UUID, pageable: Pageable): Page<DocumentDTO>
    
    /**
     * Search documents by various criteria
     */
    fun searchDocuments(
        query: String? = null,
        matterId: UUID? = null,
        categoryId: UUID? = null,
        tags: List<String>? = null,
        contentType: String? = null,
        uploadedBy: UUID? = null,
        pageable: Pageable
    ): Page<DocumentDTO>
    
    /**
     * Get document download URL/stream
     */
    fun getDocumentDownload(id: UUID, userId: UUID): DocumentDownload
    
    /**
     * Get document preview/thumbnail
     */
    fun getDocumentPreview(id: UUID, userId: UUID): DocumentPreview?
    
    /**
     * Associate document with matter
     */
    fun associateDocumentWithMatter(documentId: UUID, matterId: UUID, userId: UUID): DocumentDTO
    
    /**
     * Remove document from matter
     */
    fun removeDocumentFromMatter(documentId: UUID, matterId: UUID, userId: UUID): DocumentDTO
    
    /**
     * Get document statistics
     */
    fun getDocumentStatistics(matterId: UUID? = null): DocumentStatistics
    
    /**
     * Check if user has access to document
     */
    fun hasAccessToDocument(documentId: UUID, userId: UUID): Boolean
    
    /**
     * Extract text content from document (OCR/parsing)
     */
    fun extractDocumentText(documentId: UUID): String?
    
    /**
     * Get document versions/history
     */
    fun getDocumentVersions(documentId: UUID): List<DocumentDTO>
    
    /**
     * Create new version of document
     */
    fun createDocumentVersion(
        parentDocumentId: UUID,
        file: MultipartFile,
        userId: UUID
    ): DocumentDTO
}

/**
 * Document download information
 */
data class DocumentDownload(
    val url: String?,
    val contentType: String,
    val fileName: String,
    val fileSize: Long,
    val expiresAt: java.time.OffsetDateTime?
)

/**
 * Document preview information
 */
data class DocumentPreview(
    val previewUrl: String,
    val thumbnailUrl: String?,
    val pageCount: Int?,
    val previewType: String // "image", "pdf", "text"
)

/**
 * Document statistics
 */
data class DocumentStatistics(
    val totalDocuments: Long,
    val totalSize: Long,
    val documentsByType: Map<String, Long>,
    val recentUploads: Long,
    val pendingProcessing: Long
)