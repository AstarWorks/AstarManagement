package dev.ryuzu.astermanagement.modules.document.infrastructure

import dev.ryuzu.astermanagement.modules.document.api.DocumentService
import dev.ryuzu.astermanagement.modules.document.api.DocumentDownload
import dev.ryuzu.astermanagement.modules.document.api.DocumentPreview
import dev.ryuzu.astermanagement.modules.document.api.DocumentStatistics
import dev.ryuzu.astermanagement.modules.document.api.dto.*
import dev.ryuzu.astermanagement.modules.document.domain.*
import dev.ryuzu.astermanagement.modules.document.api.*
import dev.ryuzu.astermanagement.modules.matter.api.MatterService
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.modules.audit.api.AuditEventPublisher
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.security.MessageDigest
import java.time.OffsetDateTime
import java.util.*

/**
 * Implementation of Document module's public API
 */
@Service
@Transactional
class DocumentServiceImpl(
    private val documentRepository: DocumentRepository,
    private val matterService: MatterService,
    private val userRepository: UserRepository,
    private val documentCategoryRepository: DocumentCategoryRepository,
    private val auditEventPublisher: AuditEventPublisher,
    private val applicationEventPublisher: ApplicationEventPublisher
) : DocumentService {

    private val storagePath = "/app/storage/documents" // Would be configurable

    override fun uploadDocument(
        file: MultipartFile,
        request: CreateDocumentRequest,
        uploadedBy: UUID
    ): DocumentDTO {
        val user = userRepository.findById(uploadedBy)
            .orElseThrow { IllegalArgumentException("User not found") }
        
        val matterExists = request.matterId?.let { matterId ->
            matterService.getMatterById(matterId) != null
        } ?: false
        
        val category = request.categoryId?.let { categoryId ->
            documentCategoryRepository.findById(categoryId)
                .orElseThrow { IllegalArgumentException("Category not found") }
        }

        val fileId = UUID.randomUUID().toString()
        val checksum = calculateChecksum(file.bytes)
        
        val document = Document().apply {
            this.fileId = fileId
            this.fileName = "${fileId}_${file.originalFilename}"
            this.originalFileName = file.originalFilename ?: "unknown"
            this.contentType = file.contentType ?: "application/octet-stream"
            this.fileSize = file.size
            this.storagePath = saveFile(file, fileId)
            this.status = DocumentStatus.PENDING
            this.description = request.description
            // Note: Matter relationship handled through matterId field, not direct entity reference
            this.uploadedBy = user
            this.category = category
            this.checksum = checksum
            this.isPublic = request.isPublic
            this.isConfidential = request.isConfidential
            this.title = request.title
            this.expiresAt = request.expiresAt
            request.tags.forEach { addSimpleTag(it) }
        }

        val savedDocument = documentRepository.save(document)
        
        // Publish upload event
        val event = DocumentUploadedEvent(
            documentId = savedDocument.id!!,
            fileId = savedDocument.fileId,
            fileName = savedDocument.originalFileName,
            contentType = savedDocument.contentType,
            fileSize = savedDocument.fileSize,
            matterId = request.matterId,
            userId = uploadedBy
        )
        applicationEventPublisher.publishEvent(event)
        
        auditEventPublisher.publishDocumentUploaded(
            documentId = savedDocument.id!!,
            fileName = savedDocument.originalFileName,
            userId = uploadedBy
        )

        return savedDocument.toDTO()
    }

    @Transactional(readOnly = true)
    override fun getDocumentById(id: UUID): DocumentDTO? {
        return documentRepository.findById(id).orElse(null)?.toDTO()
    }

    @Transactional(readOnly = true)
    override fun getDocumentByFileId(fileId: String): DocumentDTO? {
        return documentRepository.findByFileId(fileId)?.toDTO()
    }

    override fun updateDocument(id: UUID, request: UpdateDocumentRequest): DocumentDTO {
        val document = documentRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Document not found") }
        
        val changes = mutableMapOf<String, Any?>()
        
        request.description?.let { 
            changes["description"] = document.description to it
            document.description = it 
        }
        request.title?.let { 
            changes["title"] = document.title to it
            document.title = it 
        }
        request.tags?.let { newTags ->
            changes["tags"] = document.tags to newTags
            document.tags.clear()
            newTags.forEach { document.addSimpleTag(it) }
        }
        request.categoryId?.let { categoryId ->
            val category = documentCategoryRepository.findById(categoryId)
                .orElseThrow { IllegalArgumentException("Category not found") }
            changes["category"] = document.category?.id to categoryId
            document.category = category
        }
        request.isPublic?.let { 
            changes["isPublic"] = document.isPublic to it
            document.isPublic = it 
        }
        request.isConfidential?.let { 
            changes["isConfidential"] = document.isConfidential to it
            document.isConfidential = it 
        }
        request.expiresAt?.let { 
            changes["expiresAt"] = document.expiresAt to it
            document.expiresAt = it 
        }

        val savedDocument = documentRepository.save(document)
        
        // Publish update event
        if (changes.isNotEmpty()) {
            val event = DocumentUpdatedEvent(
                documentId = savedDocument.id!!,
                changes = changes,
                userId = savedDocument.uploadedBy!!.id!!
            )
            applicationEventPublisher.publishEvent(event)
        }

        return savedDocument.toDTO()
    }

    override fun deleteDocument(id: UUID, userId: UUID) {
        val document = documentRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Document not found") }
        
        document.status = DocumentStatus.DELETED
        documentRepository.save(document)
        
        // Publish delete event
        val event = DocumentDeletedEvent(
            documentId = id,
            matterId = document.matter?.id,
            userId = userId
        )
        applicationEventPublisher.publishEvent(event)
        
        auditEventPublisher.publishDocumentDeleted(
            documentId = id,
            userId = userId
        )
    }

    @Transactional(readOnly = true)
    override fun getDocumentsByMatter(matterId: UUID, pageable: Pageable): Page<DocumentDTO> {
        val matter = matterRepository.findById(matterId)
            .orElseThrow { IllegalArgumentException("Matter not found") }
        
        return documentRepository.findByMatter(matter, pageable)
            .map { it.toDTO() }
    }

    @Transactional(readOnly = true)
    override fun searchDocuments(
        query: String?,
        matterId: UUID?,
        categoryId: UUID?,
        tags: List<String>?,
        contentType: String?,
        uploadedBy: UUID?,
        pageable: Pageable
    ): Page<DocumentDTO> {
        // Simplified search implementation
        return documentRepository.findAll(pageable)
            .map { it.toDTO() }
            .filter { doc ->
                (query == null || doc.title?.contains(query, ignoreCase = true) == true ||
                 doc.originalFileName.contains(query, ignoreCase = true)) &&
                (matterId == null || doc.matterId == matterId) &&
                (categoryId == null || doc.categoryId == categoryId) &&
                (contentType == null || doc.contentType.contains(contentType, ignoreCase = true)) &&
                (uploadedBy == null || doc.uploadedBy == uploadedBy) &&
                (tags == null || tags.any { tag -> doc.tags.contains(tag) })
            }
            .let { filteredDocs ->
                org.springframework.data.domain.PageImpl(filteredDocs.toList(), pageable, filteredDocs.size.toLong())
            }
    }

    @Transactional(readOnly = true)
    override fun getDocumentDownload(id: UUID, userId: UUID): DocumentDownload {
        val document = documentRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Document not found") }
        
        if (!hasAccessToDocument(id, userId)) {
            throw IllegalArgumentException("Access denied")
        }
        
        // Publish access event
        val event = DocumentAccessedEvent(
            documentId = id,
            accessType = "download",
            matterId = document.matter?.id,
            userId = userId
        )
        applicationEventPublisher.publishEvent(event)
        
        return DocumentDownload(
            url = "/api/documents/${document.fileId}/download",
            contentType = document.contentType,
            fileName = document.originalFileName,
            fileSize = document.fileSize,
            expiresAt = OffsetDateTime.now().plusHours(1)
        )
    }

    @Transactional(readOnly = true)
    override fun getDocumentPreview(id: UUID, userId: UUID): DocumentPreview? {
        val document = documentRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Document not found") }
        
        if (!hasAccessToDocument(id, userId)) {
            throw IllegalArgumentException("Access denied")
        }
        
        // Simplified preview generation
        val previewType = when {
            document.contentType.startsWith("image/") -> "image"
            document.contentType == "application/pdf" -> "pdf"
            document.contentType.startsWith("text/") -> "text"
            else -> "unknown"
        }
        
        return if (previewType != "unknown") {
            DocumentPreview(
                previewUrl = "/api/documents/${document.fileId}/preview",
                thumbnailUrl = "/api/documents/${document.fileId}/thumbnail",
                pageCount = document.pageCount,
                previewType = previewType
            )
        } else null
    }

    override fun associateDocumentWithMatter(documentId: UUID, matterId: UUID, userId: UUID): DocumentDTO {
        val document = documentRepository.findById(documentId)
            .orElseThrow { IllegalArgumentException("Document not found") }
        val matter = matterRepository.findById(matterId)
            .orElseThrow { IllegalArgumentException("Matter not found") }
        
        document.matter = matter
        val savedDocument = documentRepository.save(document)
        
        // Publish association event
        val event = DocumentAssociatedWithMatterEvent(
            documentId = documentId,
            matterId = matterId,
            associationType = "attachment",
            userId = userId
        )
        applicationEventPublisher.publishEvent(event)

        return savedDocument.toDTO()
    }

    override fun removeDocumentFromMatter(documentId: UUID, matterId: UUID, userId: UUID): DocumentDTO {
        val document = documentRepository.findById(documentId)
            .orElseThrow { IllegalArgumentException("Document not found") }
        
        document.matter = null
        val savedDocument = documentRepository.save(document)
        
        // Publish disassociation event
        val event = DocumentDisassociatedFromMatterEvent(
            documentId = documentId,
            matterId = matterId,
            userId = userId
        )
        applicationEventPublisher.publishEvent(event)

        return savedDocument.toDTO()
    }

    @Transactional(readOnly = true)
    override fun getDocumentStatistics(matterId: UUID?): DocumentStatistics {
        val totalDocuments = documentRepository.count()
        val totalSize = documentRepository.findAll().sumOf { it.fileSize }
        
        return DocumentStatistics(
            totalDocuments = totalDocuments,
            totalSize = totalSize,
            documentsByType = emptyMap(), // Would need group by query
            recentUploads = 0, // Would need date filtering
            pendingProcessing = documentRepository.countByStatus(DocumentStatus.PENDING)
        )
    }

    @Transactional(readOnly = true)
    override fun hasAccessToDocument(documentId: UUID, userId: UUID): Boolean {
        val document = documentRepository.findById(documentId).orElse(null) ?: return false
        
        // Public documents are accessible to all
        if (document.isPublic) return true
        
        // Uploader has access
        if (document.uploadedBy?.id == userId) return true
        
        // Matter participants have access
        document.matter?.let { matter ->
            return matter.assignedLawyer?.id == userId ||
                   matter.assignedClerk?.id == userId ||
                   matter.client?.id == userId
        }
        
        return false
    }

    override fun extractDocumentText(documentId: UUID): String? {
        val document = documentRepository.findById(documentId)
            .orElseThrow { IllegalArgumentException("Document not found") }
        
        // Placeholder for text extraction logic
        // Would integrate with OCR service or document parser
        return document.extractedText
    }

    @Transactional(readOnly = true)
    override fun getDocumentVersions(documentId: UUID): List<DocumentDTO> {
        val document = documentRepository.findById(documentId)
            .orElseThrow { IllegalArgumentException("Document not found") }
        
        return document.versions.map { it.toDTO() }
    }

    override fun createDocumentVersion(
        parentDocumentId: UUID,
        file: MultipartFile,
        userId: UUID
    ): DocumentDTO {
        val parentDocument = documentRepository.findById(parentDocumentId)
            .orElseThrow { IllegalArgumentException("Parent document not found") }
        
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }
        
        val fileId = UUID.randomUUID().toString()
        val checksum = calculateChecksum(file.bytes)
        val nextVersion = parentDocument.versions.maxOfOrNull { it.versionNumber } ?: 0
        
        val document = Document().apply {
            this.fileId = fileId
            this.fileName = "${fileId}_${file.originalFilename}"
            this.originalFileName = file.originalFilename ?: "unknown"
            this.contentType = file.contentType ?: "application/octet-stream"
            this.fileSize = file.size
            this.storagePath = saveFile(file, fileId)
            this.status = DocumentStatus.PENDING
            this.description = parentDocument.description
            this.matter = parentDocument.matter
            this.uploadedBy = user
            this.category = parentDocument.category
            this.checksum = checksum
            this.isPublic = parentDocument.isPublic
            this.isConfidential = parentDocument.isConfidential
            this.title = parentDocument.title
            this.versionNumber = nextVersion + 1
            this.parentDocument = parentDocument
            parentDocument.tags.forEach { addSimpleTag(it) }
        }

        val savedDocument = documentRepository.save(document)
        
        // Publish version creation event
        val event = DocumentVersionCreatedEvent(
            documentId = savedDocument.id!!,
            parentDocumentId = parentDocumentId,
            versionNumber = savedDocument.versionNumber,
            userId = userId
        )
        applicationEventPublisher.publishEvent(event)

        return savedDocument.toDTO()
    }

    // Helper methods
    private fun saveFile(file: MultipartFile, fileId: String): String {
        val directory = Paths.get(storagePath)
        Files.createDirectories(directory)
        
        val filePath = directory.resolve("${fileId}_${file.originalFilename}")
        Files.write(filePath, file.bytes)
        
        return filePath.toString()
    }
    
    private fun calculateChecksum(bytes: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(bytes)
        return hash.joinToString("") { "%02x".format(it) }
    }

    // Extension function for domain/DTO conversion
    private fun Document.toDTO(): DocumentDTO {
        return DocumentDTO(
            id = this.id!!,
            fileId = this.fileId,
            fileName = this.fileName,
            originalFileName = this.originalFileName,
            contentType = this.contentType,
            fileSize = this.fileSize,
            status = this.status.toDTO(),
            description = this.description,
            tags = this.getAllTagNames(),
            matterId = this.matter?.id,
            uploadedBy = this.uploadedBy!!.id!!,
            uploadedByName = this.uploadedBy?.username,
            categoryId = this.category?.id,
            categoryName = this.category?.name,
            categoryPath = this.getCategoryPath(),
            isPublic = this.isPublic,
            isConfidential = this.isConfidential,
            title = this.title,
            versionNumber = this.versionNumber,
            parentDocumentId = this.parentDocument?.id,
            hasVersions = this.versions.isNotEmpty(),
            extractedText = this.extractedText,
            pageCount = this.pageCount,
            wordCount = this.wordCount,
            checksum = this.checksum,
            virusScanResult = this.virusScanResult,
            virusScanDate = this.virusScanDate,
            expiresAt = this.expiresAt,
            createdAt = this.createdAt,
            updatedAt = this.updatedAt
        )
    }

    private fun DocumentStatus.toDTO(): DocumentStatusDTO = DocumentStatusDTO.valueOf(this.name)
}