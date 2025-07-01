package dev.ryuzu.astermanagement.service.impl

import dev.ryuzu.astermanagement.domain.document.Document
import dev.ryuzu.astermanagement.domain.document.DocumentRepository
import dev.ryuzu.astermanagement.domain.document.DocumentStatus
import dev.ryuzu.astermanagement.domain.matter.MatterRepository
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.dto.document.*
import dev.ryuzu.astermanagement.dto.document.ValidationResult
import dev.ryuzu.astermanagement.service.DocumentService
import dev.ryuzu.astermanagement.service.VirusScanningService
import dev.ryuzu.astermanagement.service.VirusScanResult
import dev.ryuzu.astermanagement.service.UploadProgressService
import dev.ryuzu.astermanagement.service.base.BaseService
import dev.ryuzu.astermanagement.service.exception.*
import dev.ryuzu.astermanagement.storage.service.StorageService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.Resource
import org.springframework.data.domain.PageRequest
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.security.MessageDigest
import java.util.*
import kotlin.math.max

/**
 * Implementation of DocumentService with comprehensive business logic
 */
@Service
@Transactional(readOnly = true)
class DocumentServiceImpl(
    private val documentRepository: DocumentRepository,
    private val matterRepository: MatterRepository,
    private val userRepository: UserRepository,
    private val storageService: StorageService,
    private val virusScanningService: VirusScanningService,
    private val uploadProgressService: UploadProgressService,
    @Value("\${aster.upload.max-file-size}") private val maxFileSize: Long,
    @Value("\${aster.upload.allowed-extensions}") private val allowedExtensions: List<String>,
    @Value("\${aster.upload.allowed-mime-types}") private val allowedMimeTypes: List<String>,
    @Value("\${aster.upload.virus-scan-enabled}") private val virusScanEnabled: Boolean
) : BaseService(), DocumentService {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    @Transactional
    override fun uploadDocument(request: DocumentUploadRequest, username: String): Document {
        logger.info("Starting document upload for user: $username, file: ${request.file.originalFilename}")
        
        // Validate file
        val validation = validateFile(request.file)
        if (!validation.isValid) {
            throw InvalidFileException("File validation failed: ${validation.errors.joinToString(", ")}")
        }
        
        // Get user
        val user = userRepository.findByUsername(username)
            ?: throw UserNotFoundException("User not found: $username")
        
        // Get matter if specified
        val matter = request.matterId?.let { matterId ->
            matterRepository.findById(matterId).orElseThrow {
                MatterNotFoundException(matterId)
            }
        }
        
        // Create document entity
        val document = Document().apply {
            fileName = generateUniqueFileName(request.file.originalFilename ?: "unnamed")
            originalFileName = request.file.originalFilename ?: "unnamed"
            contentType = request.file.contentType ?: "application/octet-stream"
            fileSize = request.file.size
            status = DocumentStatus.UPLOADING
            this.matter = matter
            uploadedBy = user
            description = request.description
            tags = request.tags.toMutableSet()
            isPublic = request.isPublic
            checksum = calculateChecksum(request.file)
        }
        
        val savedDocument = documentRepository.save(document)
        logger.info("Document entity created with ID: ${savedDocument.id}")
        
        // Start async upload
        uploadAsync(savedDocument, request.file, username)
        
        return savedDocument
    }
    
    @Transactional
    override fun uploadDocumentsBatch(
        files: List<MultipartFile>, 
        metadata: BatchDocumentMetadataDto?, 
        username: String
    ): BatchUploadResponseDto {
        logger.info("Starting batch upload for user: $username, files: ${files.size}")
        
        val results = mutableListOf<BatchUploadResultDto>()
        var successCount = 0
        var failureCount = 0
        
        files.forEach { file ->
            try {
                val fileMetadata = metadata?.documentMetadata?.get(file.originalFilename)
                val uploadRequest = DocumentUploadRequest(
                    file = file,
                    matterId = fileMetadata?.matterId ?: metadata?.matterId,
                    description = fileMetadata?.description,
                    tags = (fileMetadata?.tags ?: emptyList()) + (metadata?.commonTags ?: emptyList()),
                    isPublic = fileMetadata?.isPublic ?: false
                )
                
                val document = uploadDocument(uploadRequest, username)
                results.add(BatchUploadResultDto(
                    fileName = file.originalFilename ?: "unnamed",
                    success = true,
                    documentId = document.id,
                    error = null
                ))
                successCount++
            } catch (e: Exception) {
                logger.error("Failed to upload file: ${file.originalFilename}", e)
                results.add(BatchUploadResultDto(
                    fileName = file.originalFilename ?: "unnamed",
                    success = false,
                    documentId = null,
                    error = e.message
                ))
                failureCount++
            }
        }
        
        return BatchUploadResponseDto(
            totalFiles = files.size,
            successCount = successCount,
            failureCount = failureCount,
            results = results
        )
    }
    
    override fun getUploadProgress(documentId: UUID): UploadProgressDto? {
        return uploadProgressService.getProgress(documentId)
    }
    
    override fun getDocumentById(id: UUID): Document? {
        return documentRepository.findById(id).orElse(null)
    }
    
    override fun downloadDocument(id: UUID): Pair<org.springframework.core.io.Resource, Document>? {
        val document = getDocumentById(id) ?: return null
        
        if (document.status != DocumentStatus.AVAILABLE) {
            throw DocumentNotAvailableException("Document is not available for download")
        }
        
        val inputStream = storageService.download("documents", document.fileId)
        val resource = org.springframework.core.io.InputStreamResource(inputStream)
        return Pair(resource, document)
    }
    
    override fun getDocumentThumbnail(id: UUID): org.springframework.core.io.Resource? {
        val document = getDocumentById(id) ?: return null
        
        return try {
            val inputStream = storageService.download("thumbnails", "${document.fileId}_thumb.png")
            org.springframework.core.io.InputStreamResource(inputStream)
        } catch (e: Exception) {
            logger.debug("Thumbnail not found for document: $id")
            null
        }
    }
    
    override fun searchDocuments(
        fileName: String?,
        contentType: String?,
        matterId: UUID?,
        tag: String?,
        page: Int,
        size: Int
    ): PagedDocumentResponseDto {
        val pageable = PageRequest.of(page, size)
        val result = documentRepository.searchDocuments(
            fileName = fileName,
            contentType = contentType,
            status = null,
            matterId = matterId,
            uploadedBy = null,
            tag = tag,
            fromDate = null,
            toDate = null,
            pageable = pageable
        )
        
        return PagedDocumentResponseDto(
            content = result.content.map { it.toDto() },
            totalElements = result.totalElements,
            totalPages = result.totalPages,
            number = result.number,
            size = result.size,
            first = result.isFirst,
            last = result.isLast
        )
    }
    
    @Transactional
    override fun updateDocumentMetadata(id: UUID, metadata: UpdateDocumentMetadataDto): Document? {
        val document = getDocumentById(id) ?: return null
        
        metadata.description?.let { document.description = it }
        metadata.tags?.let { document.tags = it.toMutableSet() }
        
        return documentRepository.save(document)
    }
    
    @Transactional
    override fun deleteDocument(id: UUID): Boolean {
        val document = getDocumentById(id) ?: return false
        
        document.status = DocumentStatus.DELETED
        documentRepository.save(document)
        
        return true
    }
    
    override fun getDocumentVersions(id: UUID): List<DocumentVersionDto> {
        val document = getDocumentById(id) ?: return emptyList()
        
        val versions = documentRepository.findVersions(document)
        return versions.map { version ->
            DocumentVersionDto(
                id = version.id!!,
                fileId = version.fileId,
                versionNumber = version.versionNumber,
                fileName = version.fileName,
                fileSize = version.fileSize,
                uploadedBy = version.uploadedBy?.let { "${it.firstName} ${it.lastName}" } ?: "Unknown",
                uploadedAt = version.createdAt!!,
                comment = version.description,
                downloadUrl = "/api/v1/documents/${version.id}/download"
            )
        }
    }
    
    @Transactional
    override fun uploadDocumentVersion(id: UUID, file: MultipartFile, comment: String?, username: String): Document? {
        val originalDocument = getDocumentById(id) ?: return null
        
        // Validate file
        val validation = validateFile(file)
        if (!validation.isValid) {
            throw InvalidFileException("File validation failed: ${validation.errors.joinToString(", ")}")
        }
        
        // Get user
        val user = userRepository.findByUsername(username)
            ?: throw UserNotFoundException("User not found: $username")
        
        // Get highest version number
        val maxVersion = documentRepository.findVersions(originalDocument).maxOfOrNull { it.versionNumber } ?: 0
        val newVersionNumber = max(originalDocument.versionNumber, maxVersion) + 1
        
        // Create new version
        val newVersion = Document().apply {
            fileName = generateUniqueFileName(file.originalFilename ?: "unnamed")
            originalFileName = file.originalFilename ?: "unnamed"
            contentType = file.contentType ?: "application/octet-stream"
            fileSize = file.size
            status = DocumentStatus.UPLOADING
            matter = originalDocument.matter
            uploadedBy = user
            description = comment
            tags = originalDocument.tags.toMutableSet()
            isPublic = originalDocument.isPublic
            checksum = calculateChecksum(file)
            versionNumber = newVersionNumber
            parentDocument = originalDocument
        }
        
        val savedVersion = documentRepository.save(newVersion)
        
        // Start async upload
        uploadAsync(savedVersion, file, username)
        
        return savedVersion
    }
    
    override fun validateFile(file: MultipartFile): ValidationResult {
        val errors = mutableListOf<String>()
        
        // Check file size
        if (file.size > maxFileSize) {
            errors.add("File size (${file.size} bytes) exceeds maximum allowed size ($maxFileSize bytes)")
        }
        
        // Check file extension
        val extension = file.originalFilename?.substringAfterLast(".", "")?.lowercase()
        if (extension != null && extension !in allowedExtensions) {
            errors.add("File extension '$extension' is not allowed. Allowed extensions: ${allowedExtensions.joinToString(", ")}")
        }
        
        // Check MIME type
        val mimeType = file.contentType
        if (mimeType != null && mimeType !in allowedMimeTypes) {
            errors.add("MIME type '$mimeType' is not allowed. Allowed types: ${allowedMimeTypes.joinToString(", ")}")
        }
        
        // Check for empty file
        if (file.isEmpty) {
            errors.add("File cannot be empty")
        }
        
        return ValidationResult(
            isValid = errors.isEmpty(),
            errors = errors
        )
    }
    
    override fun scanForVirus(documentId: UUID): VirusScanResult {
        return virusScanningService.scanDocument(documentId)
    }
    
    @Async
    protected fun uploadAsync(document: Document, file: MultipartFile, username: String) {
        try {
            logger.info("Starting async upload for document: ${document.id}")
            
            // Progress callback (currently unused as storage service doesn't support progress tracking)
            // Future enhancement: Pass this callback to storage service when streaming support is added
            // val progressCallback: (Long) -> Unit = { bytesUploaded ->
            //     val progress = UploadProgressDto(
            //         documentId = document.id!!,
            //         fileName = document.originalFileName,
            //         totalBytes = file.size,
            //         uploadedBytes = bytesUploaded,
            //         percentComplete = ((bytesUploaded * 100) / file.size).toInt(),
            //         status = UploadStatus.UPLOADING,
            //         estimatedTimeRemaining = calculateETA(bytesUploaded, file.size),
            //         message = "Uploading..."
            //     )
            //     uploadProgressService.notifyProgress(username, progress)
            // }
            
            // Upload to storage
            val storageObject = storageService.upload("documents", document.fileId, file.inputStream)
            val storagePath = storageObject.objectName
            
            // Update document
            document.storagePath = storagePath
            document.status = if (virusScanEnabled) DocumentStatus.SCANNING else DocumentStatus.AVAILABLE
            documentRepository.save(document)
            
            logger.info("Upload completed for document: ${document.id}")
            
            // Start virus scan if enabled
            if (virusScanEnabled) {
                val scanResult = scanForVirus(document.id!!)
                document.virusScanResult = if (scanResult.clean) "CLEAN" else "INFECTED"
                document.virusScanDate = scanResult.scanDate
                document.status = if (scanResult.clean) DocumentStatus.AVAILABLE else DocumentStatus.QUARANTINED
                documentRepository.save(document)
            }
            
        } catch (e: Exception) {
            logger.error("Failed to upload document: ${document.id}", e)
            document.status = DocumentStatus.FAILED
            documentRepository.save(document)
            
            val progress = UploadProgressDto(
                documentId = document.id!!,
                fileName = document.originalFileName,
                totalBytes = file.size,
                uploadedBytes = 0,
                percentComplete = 0,
                status = UploadStatus.FAILED,
                estimatedTimeRemaining = null,
                message = "Upload failed: ${e.message}"
            )
            uploadProgressService.notifyProgress(username, progress)
        }
    }
    
    private fun generateUniqueFileName(originalFilename: String): String {
        val timestamp = System.currentTimeMillis()
        val extension = originalFilename.substringAfterLast(".", "")
        val baseName = originalFilename.substringBeforeLast(".")
        return "${baseName}_${timestamp}.${extension}"
    }
    
    private fun calculateChecksum(file: MultipartFile): String {
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream.use { inputStream ->
            val buffer = ByteArray(8192)
            var bytesRead: Int
            while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                digest.update(buffer, 0, bytesRead)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }
    
    private fun calculateETA(uploadedBytes: Long, totalBytes: Long): Long? {
        // Simple ETA calculation - in real implementation, would track upload speed
        return if (uploadedBytes > 0) {
            val remainingBytes = totalBytes - uploadedBytes
            val avgSpeed = 1024 * 1024 // Assume 1MB/s
            remainingBytes / avgSpeed
        } else null
    }
}