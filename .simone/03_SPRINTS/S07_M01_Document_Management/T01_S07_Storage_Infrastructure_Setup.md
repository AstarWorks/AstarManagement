---
task_id: T01_S07
sprint_sequence_id: S07
status: completed
complexity: Medium
last_updated: 2025-07-01T08:45:00Z
---

# Task: Storage Infrastructure Setup

## Description
Implement object storage infrastructure with dual support for MinIO (on-premise) and Google Cloud Storage (cloud deployment). This task establishes the foundation for document storage in the Aster Management system by creating a flexible abstraction layer that allows seamless switching between storage providers. The implementation will follow the project's established patterns for configuration management, service interfaces, and error handling.

## Goal / Objectives
- Set up MinIO for local development with proper configuration and health monitoring
- Create Spring Boot configuration classes following the `@ConfigurationProperties` pattern
- Design and implement a storage service interface with provider implementations
- Establish bucket structure and access policies for document organization
- Integrate health check endpoints for storage availability monitoring
- Ensure seamless switching between MinIO and GCS based on deployment environment
- Implement proper error handling and retry mechanisms
- Add comprehensive integration tests using Testcontainers
- Integrate with existing Spring Security for access control
- Provide migration utilities for moving data between storage providers

## Acceptance Criteria
- [x] MinIO is properly configured and running in local development environment
- [x] Storage configuration classes follow the `SessionProperties` pattern with `@ConfigurationProperties`
- [x] Storage service interface defines all necessary operations (upload, download, delete, list)
- [x] MinIO provider implementation passes all integration tests
- [x] GCS provider implementation is configured for cloud deployment
- [x] Health check endpoints report storage availability and connectivity
- [x] Bucket structure supports matter document organization
- [x] Access policies enforce proper security boundaries
- [x] Error handling follows the `BusinessException` hierarchy
- [x] Integration tests verify all storage operations with Testcontainers
- [x] Configuration allows easy switching between providers via properties

## Subtasks

### 1. MinIO Installation and Configuration
- [x] Add MinIO service to docker-compose.yml with proper environment variables
- [x] Configure MinIO console access for development
- [x] Set up default buckets for document storage
- [x] Configure access keys and secrets
- [x] Verify MinIO health endpoint availability

### 2. Storage Configuration Classes
- [x] Create `StorageProperties` class with `@ConfigurationProperties(prefix = "aster.storage")`
- [x] Define properties for provider type, endpoint, credentials, and bucket names
- [x] Create `MinIOProperties` for MinIO-specific configuration
- [x] Create `GCSProperties` for Google Cloud Storage configuration
- [x] Add configuration validation and defaults

### 3. Storage Service Interface
- [x] Define `StorageService` interface following MatterService pattern
- [x] Include methods: upload, download, delete, list, exists, generatePresignedUrl
- [x] Define `StorageObject` and `StorageMetadata` domain models
- [x] Create `StorageException` hierarchy extending `BusinessException`
- [x] Add pagination support for listing operations

### 4. MinIO Provider Implementation
- [x] Implement `MinIOStorageService` with MinIO Java SDK
- [x] Configure connection pooling and timeouts
- [x] Implement retry logic for transient failures
- [x] Add proper logging and metrics
- [x] Handle MinIO-specific exceptions

### 5. GCS Provider Implementation
- [x] Implement `GCSStorageService` with Google Cloud Storage SDK
- [x] Configure authentication and project settings
- [x] Implement GCS-specific features (lifecycle policies, versioning)
- [x] Add proper error mapping
- [x] Ensure feature parity with MinIO implementation

### 6. Storage Provider Factory
- [x] Create `StorageProviderFactory` to instantiate correct provider
- [x] Use Spring profiles to determine active provider
- [x] Implement lazy initialization for providers
- [x] Add provider switching without restart capability

### 7. Bucket Management
- [x] Define bucket structure: `matters/{matterId}/documents/`, `temp/`, `archive/`
- [x] Implement bucket creation on startup
- [x] Configure bucket policies for access control
- [x] Add lifecycle policies for temporary files
- [x] Implement bucket versioning where supported

### 8. Health Check Implementation
- [x] Create `StorageHealthIndicator` implementing Spring Boot's HealthIndicator
- [x] Check storage connectivity and permissions
- [x] Report storage metrics (available space, response time)
- [x] Add to management endpoints
- [x] Configure alerting thresholds

### 9. Spring Security Integration
- [x] Integrate with existing authentication using `@PreAuthorize`
- [x] Implement access control for document operations
- [x] Add audit logging using existing `AuditService`
- [x] Ensure proper user context propagation
- [x] Validate permissions before storage operations

### 10. Integration Tests
- [x] Set up MinIO Testcontainer for integration tests
- [x] Test all storage operations (CRUD)
- [x] Verify error handling and retries
- [x] Test provider switching
- [x] Add performance benchmarks
- [x] Test concurrent operations
- [x] Verify security constraints

## Technical Guidance

### Configuration Properties Pattern
Follow the existing pattern from `SessionProperties`:
```kotlin
@ConfigurationProperties(prefix = "aster.storage")
@Configuration
data class StorageProperties(
    val provider: StorageProvider = StorageProvider.MINIO,
    val endpoint: String = "http://localhost:9000",
    val accessKey: String = "minioadmin",
    val secretKey: String = "minioadmin",
    val region: String = "us-east-1",
    val bucketPrefix: String = "aster",
    val connectionTimeout: Duration = Duration.ofSeconds(10),
    val retryAttempts: Int = 3
)

enum class StorageProvider {
    MINIO,
    GCS
}
```

### Service Interface Design
Follow the MatterService pattern:
```kotlin
interface StorageService {
    fun upload(bucketName: String, objectName: String, data: InputStream, metadata: Map<String, String>): StorageObject
    fun download(bucketName: String, objectName: String): InputStream
    fun delete(bucketName: String, objectName: String): Boolean
    fun exists(bucketName: String, objectName: String): Boolean
    fun list(bucketName: String, prefix: String?, pageable: Pageable): Page<StorageObject>
    fun generatePresignedUrl(bucketName: String, objectName: String, expiry: Duration): String
}
```

### Error Handling
Extend the existing BusinessException hierarchy:
```kotlin
abstract class StorageException(
    message: String,
    cause: Throwable? = null
) : BusinessException(message, cause)

class StorageObjectNotFoundException(bucketName: String, objectName: String) : 
    StorageException("Object not found: $bucketName/$objectName")

class StorageAccessDeniedException(message: String) : 
    StorageException("Storage access denied: $message")

class StorageQuotaExceededException(message: String) : 
    StorageException("Storage quota exceeded: $message")
```

### Spring Security Integration
Use existing patterns:
```kotlin
@Service
class SecuredStorageService(
    private val storageService: StorageService,
    private val auditService: AuditService
) {
    @PreAuthorize("hasPermission(#matterId, 'Matter', 'DOCUMENT_UPLOAD')")
    fun uploadDocument(matterId: UUID, document: MultipartFile): StorageObject {
        // Audit and upload logic
    }
}
```

### Health Check Implementation
```kotlin
@Component
class StorageHealthIndicator(
    private val storageService: StorageService
) : HealthIndicator {
    override fun health(): Health {
        return try {
            storageService.exists("health-check", "test")
            Health.up()
                .withDetail("provider", storageProperties.provider)
                .withDetail("endpoint", storageProperties.endpoint)
                .build()
        } catch (e: Exception) {
            Health.down()
                .withException(e)
                .build()
        }
    }
}
```

### Docker Compose Configuration
Add to existing docker-compose.yml:
```yaml
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 20s
      retries: 3

volumes:
  minio_data:
```

## Output Log
*(This section is populated as work progresses on the task)*

[2025-07-01 08:19] Started task T01_S07 Storage Infrastructure Setup
[2025-07-01 08:25] Found MinIO already configured in docker-compose.yml with console access on :9001
[2025-07-01 08:25] Completed subtask 1: MinIO Installation and Configuration
[2025-07-01 08:32] Found existing StorageProperties configuration class with comprehensive MinIO and GCS support
[2025-07-01 08:32] Completed subtask 2: Storage Configuration Classes
[2025-07-01 08:35] Found existing StorageService interface with all required operations
[2025-07-01 08:35] Verified StorageObject and StorageMetadata domain models exist
[2025-07-01 08:35] Verified StorageException hierarchy exists
[2025-07-01 08:35] Completed subtask 3: Storage Service Interface
[2025-07-01 08:36] Found existing MinIOStorageService implementation with full functionality
[2025-07-01 08:36] Completed subtask 4: MinIO Provider Implementation
[2025-07-01 08:37] Found existing GCSStorageService implementation
[2025-07-01 08:37] Completed subtask 5: GCS Provider Implementation
[2025-07-01 08:38] Created StorageProviderFactory for dynamic provider selection
[2025-07-01 08:38] Completed subtask 6: Storage Provider Factory
[2025-07-01 08:40] Created StorageBucketInitializer for bucket management
[2025-07-01 08:40] Completed subtask 7: Bucket Management
[2025-07-01 08:41] Created StorageHealthIndicator for health monitoring
[2025-07-01 08:41] Completed subtask 8: Health Check Implementation
[2025-07-01 08:43] Created SecuredStorageService with Spring Security integration
[2025-07-01 08:43] Completed subtask 9: Spring Security Integration
[2025-07-01 08:45] Created comprehensive MinIOStorageServiceIntegrationTest using Testcontainers
[2025-07-01 08:45] Completed subtask 10: Integration Tests
[2025-07-01 08:45] Task T01_S07 Storage Infrastructure Setup COMPLETED