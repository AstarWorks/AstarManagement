---
task_id: T06B_S07
sprint_sequence_id: S07
status: open
complexity: Medium
last_updated: 2025-07-01T00:00:00Z
---

# Task: Document Processing Services Implementation

## Description

Implement the core document processing services that handle the actual document analysis, validation, and transformation operations. This task focuses on building robust, secure services for thumbnail generation, file type detection, virus scanning, and metadata extraction that integrate with the Spring Batch infrastructure.

These services form the heart of the document processing pipeline, ensuring that all uploaded documents are properly validated, securely scanned, and processed into formats suitable for the legal case management system.

## Goal / Objectives

- **Comprehensive File Validation**: Implement robust file type detection and security validation using Apache Tika
- **Thumbnail Generation**: Create high-quality thumbnail generation for PDF, image, and Office document formats
- **Virus Scanning**: Integrate ClamAV for comprehensive malware detection with connection pooling
- **Metadata Extraction**: Extract document metadata, properties, and content analysis for searchability
- **Format Support**: Handle legal document formats (PDF, DOCX, images) with proper conversion
- **Performance Optimization**: Ensure efficient processing with minimal resource usage
- **Security First**: Implement security-first processing with sandboxed operations
- **Integration Ready**: Design services for seamless Spring Batch step integration
- **Error Resilience**: Robust error handling with detailed failure reporting
- **Audit Integration**: Full integration with existing audit logging system

## Acceptance Criteria

- [ ] File type detection service using Apache Tika with MIME validation
- [ ] Comprehensive file validation with size limits, format restrictions, and security checks
- [ ] ClamAV integration operational with virus scanning for all file types
- [ ] Thumbnail generation service supporting PDF, JPEG, PNG, TIFF, and Office documents
- [ ] Document metadata extraction service with content analysis capabilities
- [ ] File processing service with temporary file management and cleanup
- [ ] Security validation service for malicious content detection
- [ ] Integration with Spring Batch as processing steps
- [ ] Comprehensive error handling with detailed failure reporting
- [ ] Performance optimization for concurrent processing scenarios
- [ ] Full audit trail integration for all processing operations
- [ ] Unit and integration tests for all service components
- [ ] Proper resource management and memory optimization

## Subtasks

### File Type Detection and Validation
- [ ] Implement FileTypeDetectionService using Apache Tika for MIME type detection
- [ ] Create comprehensive file validation with whitelist/blacklist support
- [ ] Build file format verification against detected vs declared MIME types
- [ ] Implement file structure validation for document integrity
- [ ] Add file size validation with configurable limits per file type
- [ ] Create malicious file pattern detection for security validation

### Virus Scanning Integration
- [ ] Implement VirusScanningService with ClamAV daemon integration
- [ ] Create ClamAV connection pool for concurrent scanning operations
- [ ] Build virus scan result processing with detailed threat reporting
- [ ] Implement scan timeout handling and fallback mechanisms
- [ ] Add virus scan caching for identical file hash optimization
- [ ] Create virus scan audit logging with threat detection details

### Thumbnail Generation Service
- [ ] Implement ThumbnailGenerationService for multiple format support
- [ ] Create PDF thumbnail generation using Apache PDFBox
- [ ] Build image thumbnail generation with format conversion support
- [ ] Implement Office document thumbnail generation via image conversion
- [ ] Add thumbnail quality and size configuration options
- [ ] Create thumbnail storage and retrieval management

### Document Metadata Extraction
- [ ] Implement DocumentMetadataExtractionService for comprehensive analysis
- [ ] Create document property extraction (author, creation date, modification date)
- [ ] Build content analysis for text extraction and language detection
- [ ] Implement document structure analysis (page count, embedded objects)
- [ ] Add security metadata extraction (encryption, digital signatures)
- [ ] Create searchable content indexing preparation

### File Processing Coordination
- [ ] Implement FileProcessingService for orchestrating all processing operations
- [ ] Create temporary file management with automatic cleanup
- [ ] Build processing result aggregation and validation
- [ ] Implement processing pipeline coordination with Spring Batch integration
- [ ] Add processing performance tracking and optimization
- [ ] Create processing result caching for efficiency optimization

### Integration Services
- [ ] Create Spring Batch step implementations for each processing service
- [ ] Implement processing context management for sharing data between steps
- [ ] Build service integration with Redis job queue status updates
- [ ] Create audit event publishing for all processing operations
- [ ] Implement configuration management for processing parameters
- [ ] Add health check endpoints for all processing services

## Technical Guidance

### File Type Detection Service

Implementing comprehensive file validation:

```kotlin
@Service
@Transactional
class FileTypeDetectionService(
    private val documentProcessingProperties: DocumentProcessingProperties,
    private val auditEventPublisher: AuditEventPublisher
) {
    
    private val tika = Tika()
    private val detector = DefaultDetector()
    
    companion object {
        private val ALLOWED_MIME_TYPES = setOf(
            "application/pdf",
            "image/jpeg", "image/png", "image/tiff", "image/bmp",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/msword",
            "application/vnd.ms-excel",
            "application/vnd.ms-powerpoint"
        )
        
        private val EXECUTABLE_SIGNATURES = listOf(
            byteArrayOf(0x4D, 0x5A), // PE executable
            byteArrayOf(0x7F, 0x45, 0x4C, 0x46), // ELF executable
            byteArrayOf(0xCE, 0xFA, 0xED, 0xFE), // Mach-O executable
            byteArrayOf(0xFE, 0xED, 0xFA, 0xCE), // Mach-O executable (reverse)
        )
        
        private const val MAX_FILE_SIZE = 100 * 1024 * 1024L // 100MB
    }
    
    fun detectAndValidateFile(file: MultipartFile, userId: String): FileValidationResult {
        try {
            // Basic validation
            val basicValidation = performBasicValidation(file)
            if (!basicValidation.isValid) {
                return basicValidation
            }
            
            // MIME type detection
            val detectedMimeType = detectMimeType(file)
            val validationResult = validateMimeType(detectedMimeType, file.contentType)
            
            if (!validationResult.isValid) {
                auditEventPublisher.publishAuditEvent(
                    eventType = AuditEventType.DOCUMENT_VALIDATION_FAILED,
                    userId = userId,
                    resourceType = "document",
                    resourceId = file.originalFilename ?: "unknown",
                    action = "file_type_validation",
                    details = mapOf(
                        "reason" to validationResult.errorMessage,
                        "detectedMimeType" to detectedMimeType,
                        "declaredMimeType" to file.contentType
                    )
                )
                return validationResult
            }
            
            // Security validation
            val securityValidation = performSecurityValidation(file)
            if (!securityValidation.isValid) {
                auditEventPublisher.publishAuditEvent(
                    eventType = AuditEventType.SECURITY_THREAT_DETECTED,
                    userId = userId,
                    resourceType = "document",
                    resourceId = file.originalFilename ?: "unknown",
                    action = "malicious_content_detected",
                    details = mapOf(
                        "threat" to securityValidation.errorMessage,
                        "fileSize" to file.size.toString()
                    )
                )
                return securityValidation
            }
            
            return FileValidationResult.success(
                detectedMimeType = detectedMimeType,
                fileSize = file.size,
                fileName = file.originalFilename ?: "unknown"
            )
            
        } catch (exception: Exception) {
            logger.error("File validation failed for file: ${file.originalFilename}", exception)
            return FileValidationResult.failure("File validation failed: ${exception.message}")
        }
    }
    
    private fun detectMimeType(file: MultipartFile): String {
        file.inputStream.use { inputStream ->
            val metadata = Metadata()
            metadata.set(TikaCoreProperties.RESOURCE_NAME_KEY, file.originalFilename)
            
            return detector.detect(inputStream, metadata).toString()
        }
    }
    
    private fun validateMimeType(detectedMimeType: String, declaredMimeType: String?): FileValidationResult {
        if (detectedMimeType !in ALLOWED_MIME_TYPES) {
            return FileValidationResult.failure("File type not allowed: $detectedMimeType")
        }
        
        // Check for MIME type spoofing
        if (declaredMimeType != null && declaredMimeType != detectedMimeType) {
            logger.warn("MIME type mismatch - declared: $declaredMimeType, detected: $detectedMimeType")
            // Allow mismatch but log for security monitoring
        }
        
        return FileValidationResult.success(detectedMimeType, 0, "")
    }
    
    private fun performBasicValidation(file: MultipartFile): FileValidationResult {
        if (file.isEmpty) {
            return FileValidationResult.failure("File is empty")
        }
        
        if (file.size > MAX_FILE_SIZE) {
            return FileValidationResult.failure("File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB")
        }
        
        if (file.originalFilename.isNullOrBlank()) {
            return FileValidationResult.failure("File name is required")
        }
        
        return FileValidationResult.success("", file.size, file.originalFilename)
    }
    
    private fun performSecurityValidation(file: MultipartFile): FileValidationResult {
        file.inputStream.use { inputStream ->
            val header = ByteArray(256)
            val bytesRead = inputStream.read(header)
            
            // Check for executable signatures
            EXECUTABLE_SIGNATURES.forEach { signature ->
                if (header.take(signature.size).toByteArray().contentEquals(signature)) {
                    return FileValidationResult.failure("Executable file detected")
                }
            }
            
            // Additional security checks can be added here
            return FileValidationResult.success("", file.size, file.originalFilename ?: "")
        }
    }
}
```

### Virus Scanning Service

ClamAV integration with connection pooling:

```kotlin
@Service
@Transactional
class VirusScanningService(
    private val documentProcessingProperties: DocumentProcessingProperties,
    private val auditEventPublisher: AuditEventPublisher
) {
    
    private val connectionPool = GenericObjectPool(ClamAVConnectionFactory())
    
    init {
        connectionPool.maxTotal = documentProcessingProperties.clamav.connectionPoolSize
        connectionPool.maxIdle = documentProcessingProperties.clamav.connectionPoolSize / 2
        connectionPool.minIdle = 2
        connectionPool.testOnBorrow = true
        connectionPool.testOnReturn = true
    }
    
    fun scanFile(file: MultipartFile, userId: String): VirusScanResult {
        var connection: ClamAVClient? = null
        
        try {
            connection = connectionPool.borrowObject()
            
            val startTime = System.currentTimeMillis()
            
            file.inputStream.use { inputStream ->
                val scanResult = connection.scan(inputStream)
                
                val scanDuration = System.currentTimeMillis() - startTime
                
                val result = when (scanResult.status) {
                    ClamAVStatus.OK -> {
                        logger.debug("File scan completed successfully: ${file.originalFilename} (${scanDuration}ms)")
                        VirusScanResult.clean(scanDuration)
                    }
                    ClamAVStatus.VIRUS_FOUND -> {
                        logger.warn("Virus detected in file: ${file.originalFilename} - ${scanResult.virusName}")
                        
                        auditEventPublisher.publishAuditEvent(
                            eventType = AuditEventType.VIRUS_DETECTED,
                            userId = userId,
                            resourceType = "document",
                            resourceId = file.originalFilename ?: "unknown",
                            action = "virus_scan",
                            details = mapOf(
                                "virusName" to scanResult.virusName,
                                "scanDuration" to scanDuration.toString(),
                                "fileSize" to file.size.toString()
                            )
                        )
                        
                        VirusScanResult.infected(scanResult.virusName, scanDuration)
                    }
                    ClamAVStatus.ERROR -> {
                        logger.error("Virus scan failed for file: ${file.originalFilename} - ${scanResult.errorMessage}")
                        VirusScanResult.error("Scan failed: ${scanResult.errorMessage}", scanDuration)
                    }
                }
                
                return result
            }
            
        } catch (exception: Exception) {
            logger.error("Virus scanning failed for file: ${file.originalFilename}", exception)
            return VirusScanResult.error("Virus scanning failed: ${exception.message}", 0)
        } finally {
            connection?.let { connectionPool.returnObject(it) }
        }
    }
    
    fun healthCheck(): VirusScanHealthResult {
        var connection: ClamAVClient? = null
        
        try {
            connection = connectionPool.borrowObject()
            val version = connection.version()
            
            return VirusScanHealthResult.healthy(
                version = version,
                activeConnections = connectionPool.numActive,
                availableConnections = connectionPool.numIdle
            )
            
        } catch (exception: Exception) {
            logger.error("ClamAV health check failed", exception)
            return VirusScanHealthResult.unhealthy(exception.message ?: "Unknown error")
        } finally {
            connection?.let { connectionPool.returnObject(it) }
        }
    }
}
```

### Thumbnail Generation Service

Multi-format thumbnail generation:

```kotlin
@Service
@Transactional
class ThumbnailGenerationService(
    private val documentProcessingProperties: DocumentProcessingProperties,
    private val minioService: MinioService
) {
    
    private val thumbnailConfig = documentProcessingProperties.thumbnail
    
    fun generateThumbnail(
        file: MultipartFile, 
        documentId: String, 
        mimeType: String
    ): ThumbnailGenerationResult {
        
        return try {
            val thumbnail = when {
                mimeType == "application/pdf" -> generatePdfThumbnail(file)
                mimeType.startsWith("image/") -> generateImageThumbnail(file, mimeType)
                isOfficeDocument(mimeType) -> generateOfficeThumbnail(file)
                else -> return ThumbnailGenerationResult.failure("Unsupported file type for thumbnail: $mimeType")
            }
            
            val thumbnailPath = storeThumbnail(documentId, thumbnail)
            
            ThumbnailGenerationResult.success(
                thumbnailPath = thumbnailPath,
                width = thumbnailConfig.maxWidth,
                height = thumbnailConfig.maxHeight,
                format = "JPEG"
            )
            
        } catch (exception: Exception) {
            logger.error("Thumbnail generation failed for document: $documentId", exception)
            ThumbnailGenerationResult.failure("Thumbnail generation failed: ${exception.message}")
        }
    }
    
    private fun generatePdfThumbnail(file: MultipartFile): BufferedImage {
        file.inputStream.use { inputStream ->
            PDDocument.load(inputStream).use { document ->
                if (document.numberOfPages == 0) {
                    throw IllegalArgumentException("PDF document has no pages")
                }
                
                val renderer = PDFRenderer(document)
                val image = renderer.renderImageWithDPI(0, 150f, ImageType.RGB)
                
                return resizeImage(image, thumbnailConfig.maxWidth, thumbnailConfig.maxHeight)
            }
        }
    }
    
    private fun generateImageThumbnail(file: MultipartFile, mimeType: String): BufferedImage {
        file.inputStream.use { inputStream ->
            val originalImage = ImageIO.read(inputStream)
                ?: throw IllegalArgumentException("Invalid image file")
            
            return resizeImage(originalImage, thumbnailConfig.maxWidth, thumbnailConfig.maxHeight)
        }
    }
    
    private fun generateOfficeThumbnail(file: MultipartFile): BufferedImage {
        // For Office documents, we'll convert to PDF first, then generate thumbnail
        // This is a simplified implementation - real implementation would use Apache POI
        
        val tempFile = Files.createTempFile("office-convert", ".pdf")
        
        try {
            // Convert Office document to PDF (implementation would use LibreOffice or similar)
            convertOfficeToPdf(file, tempFile.toFile())
            
            // Generate thumbnail from PDF
            return generatePdfThumbnail(MockMultipartFile(
                "converted.pdf",
                "converted.pdf",
                "application/pdf",
                Files.readAllBytes(tempFile)
            ))
            
        } finally {
            Files.deleteIfExists(tempFile)
        }
    }
    
    private fun resizeImage(originalImage: BufferedImage, maxWidth: Int, maxHeight: Int): BufferedImage {
        val originalWidth = originalImage.width
        val originalHeight = originalImage.height
        
        val aspectRatio = originalWidth.toDouble() / originalHeight.toDouble()
        
        val (targetWidth, targetHeight) = if (aspectRatio > 1) {
            // Landscape
            val width = minOf(maxWidth, originalWidth)
            val height = (width / aspectRatio).toInt()
            width to height
        } else {
            // Portrait
            val height = minOf(maxHeight, originalHeight)
            val width = (height * aspectRatio).toInt()
            width to height
        }
        
        return Scalr.resize(
            originalImage,
            Scalr.Method.QUALITY,
            Scalr.Mode.FIT_EXACT,
            targetWidth,
            targetHeight
        )
    }
    
    private fun storeThumbnail(documentId: String, thumbnail: BufferedImage): String {
        val thumbnailBytes = ByteArrayOutputStream().use { outputStream ->
            ImageIO.write(thumbnail, "JPEG", outputStream)
            outputStream.toByteArray()
        }
        
        val thumbnailPath = "thumbnails/$documentId.jpg"
        
        minioService.uploadFile(
            bucketName = "document-thumbnails",
            objectName = thumbnailPath,
            inputStream = ByteArrayInputStream(thumbnailBytes),
            contentType = "image/jpeg",
            size = thumbnailBytes.size.toLong()
        )
        
        return thumbnailPath
    }
    
    private fun isOfficeDocument(mimeType: String): Boolean {
        return mimeType.startsWith("application/vnd.openxmlformats-officedocument") ||
               mimeType.startsWith("application/vnd.ms-")
    }
    
    private fun convertOfficeToPdf(file: MultipartFile, outputFile: File) {
        // Placeholder for Office to PDF conversion
        // Real implementation would use LibreOffice headless or similar
        throw UnsupportedOperationException("Office document thumbnail generation not yet implemented")
    }
}
```

### Document Metadata Extraction Service

Comprehensive metadata and content analysis:

```kotlin
@Service
@Transactional
class DocumentMetadataExtractionService(
    private val auditEventPublisher: AuditEventPublisher
) {
    
    private val autoDetectParser = AutoDetectParser()
    private val tika = Tika()
    
    fun extractMetadata(file: MultipartFile, documentId: String): DocumentMetadataResult {
        try {
            file.inputStream.use { inputStream ->
                val metadata = Metadata()
                val contentHandler = BodyContentHandler(-1) // No character limit
                val parseContext = ParseContext()
                
                autoDetectParser.parse(inputStream, contentHandler, metadata, parseContext)
                
                val extractedMetadata = DocumentMetadata(
                    documentId = documentId,
                    fileName = file.originalFilename ?: "unknown",
                    fileSize = file.size,
                    mimeType = metadata.get(HttpHeaders.CONTENT_TYPE) ?: "unknown",
                    title = metadata.get(TikaCoreProperties.TITLE),
                    author = metadata.get(TikaCoreProperties.CREATOR),
                    subject = metadata.get(TikaCoreProperties.SUBJECT),
                    keywords = metadata.get(TikaCoreProperties.KEYWORDS),
                    creationDate = parseDate(metadata.get(TikaCoreProperties.CREATED)),
                    modificationDate = parseDate(metadata.get(TikaCoreProperties.MODIFIED)),
                    pageCount = metadata.get(PagedText.N_PAGES)?.toIntOrNull(),
                    language = metadata.get(TikaCoreProperties.LANGUAGE),
                    wordCount = countWords(contentHandler.toString()),
                    textContent = contentHandler.toString().take(10000), // First 10K characters
                    isEncrypted = metadata.get("pdf:encrypted") == "true",
                    hasDigitalSignature = metadata.get("pdf:hasSignature") == "true",
                    extractedAt = Instant.now()
                )
                
                return DocumentMetadataResult.success(extractedMetadata)
            }
            
        } catch (exception: Exception) {
            logger.error("Metadata extraction failed for document: $documentId", exception)
            return DocumentMetadataResult.failure("Metadata extraction failed: ${exception.message}")
        }
    }
    
    private fun parseDate(dateString: String?): Instant? {
        if (dateString.isNullOrBlank()) return null
        
        return try {
            // Try various date formats
            when {
                dateString.contains("T") -> Instant.parse(dateString)
                dateString.contains("/") -> {
                    val formatter = DateTimeFormatter.ofPattern("MM/dd/yyyy")
                    LocalDate.parse(dateString, formatter).atStartOfDay(ZoneOffset.UTC).toInstant()
                }
                else -> null
            }
        } catch (exception: Exception) {
            logger.debug("Failed to parse date: $dateString", exception)
            null
        }
    }
    
    private fun countWords(text: String): Int {
        return text.trim()
            .split("\\s+".toRegex())
            .count { it.isNotBlank() }
    }
}
```

## Dependencies Required

Add to build.gradle.kts:

```kotlin
dependencies {
    // Document processing
    implementation("org.apache.pdfbox:pdfbox:3.0.1")
    implementation("org.apache.tika:tika-core:2.9.1")
    implementation("org.apache.tika:tika-parsers-standard-package:2.9.1")
    
    // Image processing
    implementation("org.imgscalr:imgscalr-lib:4.2")
    implementation("com.twelvemonkeys.imageio:imageio-jpeg:3.10.1")
    implementation("com.twelvemonkeys.imageio:imageio-tiff:3.10.1")
    
    // ClamAV integration
    implementation("io.sensesecure:clamav4j:0.7")
    
    // Object pooling for ClamAV connections
    implementation("org.apache.commons:commons-pool2:2.12.0")
    
    // Office document processing (optional)
    implementation("org.apache.poi:poi:5.2.4")
    implementation("org.apache.poi:poi-ooxml:5.2.4")
}
```

## Configuration Integration

Extend application.yml:

```yaml
aster:
  document-processing:
    thumbnail:
      max-width: 300
      max-height: 400
      quality: 0.85
      format: "JPEG"
    clamav:
      host: localhost
      port: 3310
      timeout: 30000
      connection-pool-size: 10
      socket-timeout: 30000
    validation:
      max-file-size: 104857600 # 100MB
      allowed-mime-types:
        - "application/pdf"
        - "image/jpeg"
        - "image/png"
        - "image/tiff"
        - "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    metadata:
      max-text-content-length: 10000
      extract-full-text: true
      language-detection: true
```

## Success Metrics

- **File Validation**: 100% accurate MIME type detection with < 1% false positives
- **Virus Scanning**: 100% scan coverage with < 10 second scan time per file
- **Thumbnail Generation**: 95% success rate with < 5 second generation time
- **Metadata Extraction**: 90% successful extraction rate with comprehensive content analysis
- **Performance**: Process files concurrently with < 2GB memory usage per processing thread
- **Security**: Zero false negatives in malicious file detection
- **Integration**: Seamless Spring Batch step integration with < 100ms overhead

## Implementation Notes

This task focuses on the core processing capabilities that make the document pipeline functional. Each service is designed to be robust, secure, and performant while integrating seamlessly with the Spring Batch infrastructure created in T06A_S07.

The services follow established patterns from the existing codebase and provide comprehensive error handling and audit integration for complete traceability of document processing operations.

## Output Log

*(This section is populated as work progresses on the task)*

[2025-07-01 00:00:00] Task created focusing on core document processing services implementation