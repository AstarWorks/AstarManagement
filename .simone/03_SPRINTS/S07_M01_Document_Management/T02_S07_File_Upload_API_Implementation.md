---
task_id: T02_S07
sprint_sequence_id: S07
status: in_progress
complexity: Medium
last_updated: 2025-07-01T11:04:00Z
---

# Task: File Upload API Implementation

## Description
Implement secure file upload endpoints with multipart form handling, validation, and progress tracking. This task involves creating REST API endpoints that support both single and batch file uploads with comprehensive security features including file validation, size limits, type checking, virus scanning integration, and real-time progress tracking via WebSocket.

## Goal / Objectives
Create a robust and secure file upload API that:
- Supports single and batch file uploads with multipart form handling
- Implements comprehensive file validation (size, type, content)
- Provides real-time upload progress tracking via WebSocket
- Integrates with virus scanning for security
- Follows existing application patterns and security model
- Handles errors gracefully with proper error responses
- Implements rate limiting to prevent abuse

## Acceptance Criteria
- [ ] DocumentController created with upload endpoints following MatterController patterns
- [ ] Multipart file handling implemented with proper configuration
- [ ] File validation includes size limits, type checking, and content verification
- [ ] WebSocket endpoint provides real-time upload progress updates
- [ ] Virus scanning integration point implemented (can be mocked initially)
- [ ] Request/response DTOs created with proper validation annotations
- [ ] Service layer handles file processing and storage
- [ ] Comprehensive error handling with proper HTTP status codes
- [ ] Rate limiting applied to upload endpoints
- [ ] Integration tests cover all upload scenarios
- [ ] API documentation generated with OpenAPI annotations
- [ ] Security properly integrated with existing authentication

## Subtasks
- [ ] Configure Spring Boot multipart settings in application.yml
- [ ] Create Document entity with audit fields
- [ ] Create DocumentController with upload endpoints
- [ ] Implement multipart file handling with streaming support
- [ ] Add file validation service (size, type, content)
- [ ] Create WebSocket configuration for progress tracking
- [ ] Implement virus scanning integration interface
- [ ] Design and create request/response DTOs
- [ ] Create DocumentService for business logic
- [ ] Implement file storage service (local/cloud abstraction)
- [ ] Add comprehensive error handling
- [ ] Configure rate limiting for upload endpoints
- [ ] Create integration tests for upload scenarios
- [ ] Add OpenAPI documentation annotations

## Technical Guidance

### Spring Boot Multipart Configuration
```yaml
# application.yml
spring:
  servlet:
    multipart:
      enabled: true
      max-file-size: 100MB
      max-request-size: 500MB
      resolve-lazily: true # For streaming large files
  
# Custom properties
app:
  upload:
    max-file-size: 104857600 # 100MB in bytes
    allowed-extensions: 
      - pdf
      - doc
      - docx
      - xls
      - xlsx
      - jpg
      - jpeg
      - png
      - txt
    virus-scan-enabled: true
    storage-path: ${APP_STORAGE_PATH:/var/astermanagement/documents}
```

### Document Entity Design
```kotlin
package dev.ryuzu.astermanagement.domain.document

import dev.ryuzu.astermanagement.domain.BaseEntity
import dev.ryuzu.astermanagement.domain.matter.Matter
import dev.ryuzu.astermanagement.domain.user.User
import jakarta.persistence.*
import java.time.OffsetDateTime
import java.util.*

@Entity
@Table(name = "documents")
class Document : BaseEntity() {
    
    @Column(nullable = false, unique = true)
    var fileId: String = UUID.randomUUID().toString()
    
    @Column(nullable = false)
    var fileName: String = ""
    
    @Column(nullable = false)
    var originalFileName: String = ""
    
    @Column(nullable = false)
    var contentType: String = ""
    
    @Column(nullable = false)
    var fileSize: Long = 0
    
    @Column(nullable = false)
    var storagePath: String = ""
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: DocumentStatus = DocumentStatus.PENDING
    
    @Column
    var virusScanResult: String? = null
    
    @Column
    var virusScanDate: OffsetDateTime? = null
    
    @Column(columnDefinition = "TEXT")
    var description: String? = null
    
    @ElementCollection
    @CollectionTable(name = "document_tags")
    var tags: MutableSet<String> = mutableSetOf()
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matter_id")
    var matter: Matter? = null
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    var uploadedBy: User? = null
    
    @Column
    var checksum: String? = null
    
    @Column(name = "is_public")
    var isPublic: Boolean = false
    
    @Column(name = "expires_at")
    var expiresAt: OffsetDateTime? = null
}

enum class DocumentStatus {
    PENDING,
    UPLOADED,
    SCANNING,
    AVAILABLE,
    QUARANTINED,
    DELETED
}
```

### Controller Implementation Following MatterController Patterns
```kotlin
package dev.ryuzu.astermanagement.controller

import dev.ryuzu.astermanagement.controller.base.BaseController
import dev.ryuzu.astermanagement.dto.common.ErrorResponse
import dev.ryuzu.astermanagement.dto.document.*
import dev.ryuzu.astermanagement.service.DocumentService
import dev.ryuzu.astermanagement.security.annotation.CurrentUser
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

@RestController
@RequestMapping("/api/v1/documents")
@Validated
@Tag(name = "Document Management", description = "Endpoints for document upload and management")
@SecurityRequirement(name = "bearerAuth")
class DocumentController(
    private val documentService: DocumentService
) : BaseController() {
    
    @PostMapping("/upload", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasRole('LAWYER') or hasRole('CLERK')")
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
    
    @PostMapping("/upload/batch", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasRole('LAWYER') or hasRole('CLERK')")
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
    
    @GetMapping("/{id}/progress")
    @PreAuthorize("hasRole('LAWYER') or hasRole('CLERK')")
    @Operation(
        summary = "Get upload progress",
        description = "Get the current upload progress for a document"
    )
    fun getUploadProgress(
        @PathVariable id: UUID
    ): ResponseEntity<UploadProgressDto> {
        val progress = documentService.getUploadProgress(id)
        return progress?.let { ok(it) } ?: notFound()
    }
}
```

### DTO Design with Validation
```kotlin
package dev.ryuzu.astermanagement.dto.document

import jakarta.validation.constraints.*
import java.time.OffsetDateTime
import java.util.*

data class DocumentMetadataDto(
    @field:NotNull(message = "Matter ID is required")
    val matterId: UUID?,
    
    @field:Size(max = 2000, message = "Description must not exceed 2000 characters")
    val description: String?,
    
    @field:Size(max = 10, message = "Maximum 10 tags allowed")
    val tags: List<@Size(max = 50, message = "Tag must not exceed 50 characters") String> = emptyList(),
    
    val isPublic: Boolean = false
)

data class BatchDocumentMetadataDto(
    val matterId: UUID?,
    val commonTags: List<String> = emptyList(),
    val documentMetadata: Map<String, DocumentMetadataDto> = emptyMap()
)

data class DocumentDto(
    val id: UUID,
    val fileId: String,
    val fileName: String,
    val originalFileName: String,
    val contentType: String,
    val fileSize: Long,
    val status: String,
    val matterId: UUID?,
    val description: String?,
    val tags: List<String>,
    val uploadedBy: String,
    val uploadedAt: OffsetDateTime,
    val virusScanResult: String?,
    val downloadUrl: String,
    val thumbnailUrl: String?
)

data class UploadProgressDto(
    val documentId: UUID,
    val fileName: String,
    val totalBytes: Long,
    val uploadedBytes: Long,
    val percentComplete: Int,
    val status: UploadStatus,
    val estimatedTimeRemaining: Long?, // seconds
    val message: String?
)

enum class UploadStatus {
    PENDING,
    UPLOADING,
    PROCESSING,
    SCANNING,
    COMPLETED,
    FAILED
}

data class BatchUploadResponseDto(
    val totalFiles: Int,
    val successCount: Int,
    val failureCount: Int,
    val results: List<BatchUploadResultDto>
)

data class BatchUploadResultDto(
    val fileName: String,
    val success: Boolean,
    val documentId: UUID?,
    val error: String?
)

data class DocumentUploadRequest(
    val file: MultipartFile,
    val matterId: UUID?,
    val description: String?,
    val tags: List<String>,
    val isPublic: Boolean
)
```

### WebSocket Configuration for Progress Tracking
```kotlin
package dev.ryuzu.astermanagement.config

import org.springframework.context.annotation.Configuration
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer

@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig : WebSocketMessageBrokerConfigurer {
    
    override fun configureMessageBroker(config: MessageBrokerRegistry) {
        config.enableSimpleBroker("/topic")
        config.setApplicationDestinationPrefixes("/app")
    }
    
    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        registry.addEndpoint("/ws")
            .setAllowedOrigins("*")
            .withSockJS()
    }
}

// Progress notification service
@Service
class UploadProgressService(
    private val messagingTemplate: SimpMessagingTemplate
) {
    fun notifyProgress(userId: String, progress: UploadProgressDto) {
        messagingTemplate.convertAndSendToUser(
            userId,
            "/topic/upload-progress",
            progress
        )
    }
}
```

### Service Layer Implementation
```kotlin
package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.domain.document.Document
import dev.ryuzu.astermanagement.dto.document.*
import org.springframework.web.multipart.MultipartFile
import java.util.*

interface DocumentService {
    fun uploadDocument(request: DocumentUploadRequest, username: String): Document
    fun uploadDocumentsBatch(
        files: List<MultipartFile>, 
        metadata: BatchDocumentMetadataDto?, 
        username: String
    ): BatchUploadResponseDto
    fun getUploadProgress(documentId: UUID): UploadProgressDto?
    fun validateFile(file: MultipartFile): ValidationResult
    fun scanForVirus(documentId: UUID): VirusScanResult
}

@Service
@Transactional
class DocumentServiceImpl(
    private val documentRepository: DocumentRepository,
    private val fileStorageService: FileStorageService,
    private val virusScanningService: VirusScanningService,
    private val uploadProgressService: UploadProgressService,
    private val userRepository: UserRepository,
    @Value("\${app.upload.max-file-size}") private val maxFileSize: Long,
    @Value("\${app.upload.allowed-extensions}") private val allowedExtensions: List<String>
) : DocumentService {
    
    override fun uploadDocument(request: DocumentUploadRequest, username: String): Document {
        // Validate file
        val validation = validateFile(request.file)
        if (!validation.isValid) {
            throw InvalidFileException(validation.errors.joinToString(", "))
        }
        
        // Create document entity
        val document = Document().apply {
            fileName = generateUniqueFileName(request.file.originalFilename ?: "unnamed")
            originalFileName = request.file.originalFilename ?: "unnamed"
            contentType = request.file.contentType ?: "application/octet-stream"
            fileSize = request.file.size
            status = DocumentStatus.UPLOADING
            matter = request.matterId?.let { matterRepository.findById(it).orElse(null) }
            uploadedBy = userRepository.findByUsername(username)
            description = request.description
            tags = request.tags.toMutableSet()
            checksum = calculateChecksum(request.file)
        }
        
        val savedDocument = documentRepository.save(document)
        
        // Upload file asynchronously with progress tracking
        uploadAsync(savedDocument, request.file, username)
        
        return savedDocument
    }
    
    @Async
    protected fun uploadAsync(document: Document, file: MultipartFile, username: String) {
        try {
            // Stream upload with progress tracking
            val progressCallback = { bytesUploaded: Long ->
                val progress = UploadProgressDto(
                    documentId = document.id!!,
                    fileName = document.originalFileName,
                    totalBytes = file.size,
                    uploadedBytes = bytesUploaded,
                    percentComplete = ((bytesUploaded * 100) / file.size).toInt(),
                    status = UploadStatus.UPLOADING,
                    estimatedTimeRemaining = calculateETA(bytesUploaded, file.size),
                    message = "Uploading..."
                )
                uploadProgressService.notifyProgress(username, progress)
            }
            
            val storagePath = fileStorageService.store(file, document.fileId, progressCallback)
            
            document.storagePath = storagePath
            document.status = DocumentStatus.SCANNING
            documentRepository.save(document)
            
            // Initiate virus scan
            if (virusScanEnabled) {
                scanForVirus(document.id!!)
            } else {
                document.status = DocumentStatus.AVAILABLE
                documentRepository.save(document)
            }
            
        } catch (e: Exception) {
            document.status = DocumentStatus.FAILED
            documentRepository.save(document)
            throw e
        }
    }
}
```

### File Storage Service Interface
```kotlin
package dev.ryuzu.astermanagement.service.storage

interface FileStorageService {
    fun store(
        file: MultipartFile, 
        fileId: String, 
        progressCallback: (Long) -> Unit
    ): String
    
    fun retrieve(fileId: String): Resource
    
    fun delete(fileId: String): Boolean
    
    fun generateDownloadUrl(fileId: String): String
    
    fun generateThumbnail(fileId: String): String?
}

// Local storage implementation
@Service
@ConditionalOnProperty(name = ["app.storage.type"], havingValue = "local", matchIfMissing = true)
class LocalFileStorageService(
    @Value("\${app.upload.storage-path}") private val storagePath: String
) : FileStorageService {
    // Implementation details...
}

// Cloud storage implementation (GCS)
@Service
@ConditionalOnProperty(name = ["app.storage.type"], havingValue = "gcs")
class GcsFileStorageService : FileStorageService {
    // Implementation details...
}
```

### Virus Scanning Integration
```kotlin
package dev.ryuzu.astermanagement.service.security

interface VirusScanningService {
    fun scanFile(filePath: String): VirusScanResult
}

data class VirusScanResult(
    val clean: Boolean,
    val threats: List<String> = emptyList(),
    val scanEngine: String,
    val scanDate: OffsetDateTime = OffsetDateTime.now()
)

// Mock implementation for development
@Service
@Profile("dev")
class MockVirusScanningService : VirusScanningService {
    override fun scanFile(filePath: String): VirusScanResult {
        // Simulate scanning delay
        Thread.sleep(2000)
        return VirusScanResult(
            clean = true,
            scanEngine = "MockScanner v1.0"
        )
    }
}

// ClamAV implementation for production
@Service
@Profile("!dev")
class ClamAvVirusScanningService : VirusScanningService {
    // Implementation using ClamAV
}
```

### Error Handling
```kotlin
package dev.ryuzu.astermanagement.exception

class InvalidFileException(message: String) : RuntimeException(message)
class FileTooLargeException(message: String) : RuntimeException(message)
class UnsupportedFileTypeException(message: String) : RuntimeException(message)
class VirusScanException(message: String) : RuntimeException(message)

@RestControllerAdvice
class FileUploadExceptionHandler {
    
    @ExceptionHandler(MaxUploadSizeExceededException::class)
    fun handleMaxSizeException(ex: MaxUploadSizeExceededException): ResponseEntity<ErrorResponse> {
        val error = ErrorResponse(
            status = 413,
            error = "Payload Too Large",
            message = "File size exceeds maximum allowed size",
            path = request.requestURI
        )
        return ResponseEntity.status(413).body(error)
    }
    
    @ExceptionHandler(InvalidFileException::class)
    fun handleInvalidFile(ex: InvalidFileException): ResponseEntity<ErrorResponse> {
        val error = ErrorResponse(
            status = 422,
            error = "Unprocessable Entity",
            message = ex.message ?: "Invalid file",
            path = request.requestURI
        )
        return ResponseEntity.status(422).body(error)
    }
}
```

### Rate Limiting Configuration
```kotlin
// Add to existing RateLimitingFilter or create endpoint-specific config
@Component
class UploadRateLimitingFilter(
    private val rateLimiter: RateLimiter
) : OncePerRequestFilter() {
    
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        if (request.requestURI.startsWith("/api/v1/documents/upload")) {
            val key = "upload:${getClientIP(request)}"
            val info = rateLimiter.getRateLimitInfo(key, 10, Duration.ofMinutes(15))
            
            if (!info.allowed) {
                response.status = 429
                response.addHeader("X-RateLimit-Limit", info.limit.toString())
                response.addHeader("X-RateLimit-Remaining", info.remaining.toString())
                response.addHeader("X-RateLimit-Reset", info.resetTime.toString())
                return
            }
        }
        
        filterChain.doFilter(request, response)
    }
}
```

### Integration Test Example
```kotlin
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = ["app.upload.virus-scan-enabled=false"])
class DocumentControllerIntegrationTest {
    
    @Autowired
    private lateinit var mockMvc: MockMvc
    
    @Test
    @WithMockUser(roles = ["LAWYER"])
    fun `should upload single document successfully`() {
        val file = MockMultipartFile(
            "file",
            "test-document.pdf",
            MediaType.APPLICATION_PDF_VALUE,
            "test content".toByteArray()
        )
        
        val metadata = """
            {
                "matterId": "123e4567-e89b-12d3-a456-426614174000",
                "description": "Test document",
                "tags": ["important", "contract"]
            }
        """.trimIndent()
        
        mockMvc.multipart("/api/v1/documents/upload") {
            file(file)
            part(MockPart("metadata", metadata.toByteArray()))
        }.andExpect {
            status { isCreated() }
            header { exists("Location") }
            jsonPath("$.fileName") { exists() }
            jsonPath("$.status") { value("PENDING") }
        }
    }
    
    @Test
    @WithMockUser(roles = ["CLERK"])
    fun `should reject oversized file`() {
        val largeContent = ByteArray(110 * 1024 * 1024) // 110MB
        val file = MockMultipartFile(
            "file",
            "large-file.pdf",
            MediaType.APPLICATION_PDF_VALUE,
            largeContent
        )
        
        mockMvc.multipart("/api/v1/documents/upload") {
            file(file)
        }.andExpect {
            status { isPayloadTooLarge() }
        }
    }
}
```

## Risk Mitigation
- **Large File Handling**: Use streaming multipart resolver to prevent memory issues
- **Malicious Files**: Implement virus scanning and content type verification
- **Storage Limits**: Monitor disk space and implement quotas per user/matter
- **Network Failures**: Implement resumable uploads for large files
- **Performance**: Use async processing and consider CDN for file delivery

## Output Log
*(This section is populated as work progresses on the task)*

[YYYY-MM-DD HH:MM:SS] Started task
[YYYY-MM-DD HH:MM:SS] Modified files: file1.kt, file2.kt
[YYYY-MM-DD HH:MM:SS] Completed subtask: Implemented feature X
[YYYY-MM-DD HH:MM:SS] Task completed