package dev.ryuzu.astermanagement.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.context.annotation.Configuration
import java.time.Duration

/**
 * Storage configuration properties following the established SessionProperties pattern.
 * Provides configuration for both MinIO and Google Cloud Storage providers with
 * environment-specific defaults and validation.
 * 
 * Configuration prefix: aster.storage
 * 
 * Example application.yml:
 * ```yaml
 * aster:
 *   storage:
 *     provider: MINIO
 *     endpoint: http://localhost:9000
 *     access-key: minioadmin
 *     secret-key: minioadmin
 *     region: us-east-1
 *     bucket-prefix: aster
 *     connection-timeout: 10s
 *     retry-attempts: 3
 * ```
 */
@Configuration
@ConfigurationProperties(prefix = "aster.storage")
@ConfigurationPropertiesScan
data class StorageProperties(
    /**
     * Storage provider type - determines which implementation to use
     */
    val provider: StorageProvider = StorageProvider.MINIO,
    
    /**
     * Storage service endpoint URL
     * For MinIO: http://localhost:9000 (local) or https://minio.example.com (production)
     * For GCS: https://storage.googleapis.com (automatically set by GCS SDK)
     */
    val endpoint: String = "http://localhost:9000",
    
    /**
     * Access key for authentication
     * For MinIO: configured access key
     * For GCS: service account key (or use default credentials)
     */
    val accessKey: String = "minioadmin",
    
    /**
     * Secret key for authentication
     * For MinIO: configured secret key
     * For GCS: service account secret (or use default credentials)
     */
    val secretKey: String = "minioadmin",
    
    /**
     * Storage region for the service
     * For MinIO: can be any valid region name
     * For GCS: actual GCS region (e.g., us-central1, europe-west1)
     */
    val region: String = "us-east-1",
    
    /**
     * Prefix for all bucket names to avoid conflicts
     * All bucket names will be prefixed with this value
     */
    val bucketPrefix: String = "aster",
    
    /**
     * Connection timeout for storage operations
     */
    val connectionTimeout: Duration = Duration.ofSeconds(10),
    
    /**
     * Read timeout for storage operations
     */
    val readTimeout: Duration = Duration.ofSeconds(30),
    
    /**
     * Write timeout for storage operations
     */
    val writeTimeout: Duration = Duration.ofSeconds(60),
    
    /**
     * Number of retry attempts for failed operations
     */
    val retryAttempts: Int = 3,
    
    /**
     * Delay between retry attempts
     */
    val retryDelay: Duration = Duration.ofSeconds(1),
    
    /**
     * Maximum file size for uploads (in bytes)
     * Default: 100MB
     */
    val maxFileSize: Long = 100 * 1024 * 1024,
    
    /**
     * Allowed MIME types for uploads
     * Empty list means all types are allowed
     */
    val allowedMimeTypes: List<String> = listOf(
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ),
    
    /**
     * Enable multipart uploads for large files
     */
    val enableMultipartUpload: Boolean = true,
    
    /**
     * Multipart upload threshold (files larger than this will use multipart)
     * Default: 5MB
     */
    val multipartThreshold: Long = 5 * 1024 * 1024,
    
    /**
     * Multipart upload part size
     * Default: 5MB
     */
    val multipartPartSize: Long = 5 * 1024 * 1024,
    
    /**
     * Enable presigned URL generation
     */
    val enablePresignedUrls: Boolean = true,
    
    /**
     * Default expiry time for presigned URLs
     */
    val presignedUrlExpiry: Duration = Duration.ofHours(1),
    
    /**
     * Enable storage health checks
     */
    val enableHealthCheck: Boolean = true,
    
    /**
     * Health check interval
     */
    val healthCheckInterval: Duration = Duration.ofMinutes(5),
    
    /**
     * MinIO-specific configuration
     */
    val minio: MinIOProperties = MinIOProperties(),
    
    /**
     * Google Cloud Storage specific configuration
     */
    val gcs: GCSProperties = GCSProperties()
) {
    
    /**
     * Get the full bucket name with prefix
     */
    fun getBucketName(baseName: String): String {
        return if (bucketPrefix.isNotEmpty()) {
            "${bucketPrefix}-${baseName}"
        } else {
            baseName
        }
    }
    
    /**
     * Validate configuration based on selected provider
     */
    fun validate() {
        when (provider) {
            StorageProvider.MINIO -> {
                require(endpoint.isNotEmpty()) { "MinIO endpoint is required" }
                require(accessKey.isNotEmpty()) { "MinIO access key is required" }
                require(secretKey.isNotEmpty()) { "MinIO secret key is required" }
            }
            StorageProvider.GCS -> {
                require(gcs.projectId.isNotEmpty()) { "GCS project ID is required" }
            }
        }
        
        require(connectionTimeout.toMillis() > 0) { "Connection timeout must be positive" }
        require(retryAttempts >= 0) { "Retry attempts must be non-negative" }
        require(maxFileSize > 0) { "Max file size must be positive" }
    }
}

/**
 * Storage provider enumeration
 */
enum class StorageProvider {
    /**
     * MinIO object storage (for on-premise and development)
     */
    MINIO,
    
    /**
     * Google Cloud Storage (for cloud deployment)
     */
    GCS
}

/**
 * MinIO-specific configuration properties
 */
data class MinIOProperties(
    /**
     * Enable SSL/TLS for MinIO connections
     */
    val ssl: Boolean = false,
    
    /**
     * Custom SSL certificate path (if using self-signed certificates)
     */
    val sslCertPath: String? = null,
    
    /**
     * Skip SSL certificate verification (for development only)
     */
    val skipSslVerification: Boolean = false,
    
    /**
     * Enable MinIO server-side encryption
     */
    val serverSideEncryption: Boolean = false,
    
    /**
     * MinIO server-side encryption key
     */
    val serverSideEncryptionKey: String? = null,
    
    /**
     * Enable MinIO distributed mode support
     */
    val distributedMode: Boolean = false,
    
    /**
     * MinIO console URL (for admin operations)
     */
    val consoleUrl: String = "http://localhost:9001",
    
    /**
     * Enable MinIO notifications (for real-time updates)
     */
    val enableNotifications: Boolean = false,
    
    /**
     * MinIO notification topic ARN (if using notifications)
     */
    val notificationTopicArn: String? = null
)

/**
 * Google Cloud Storage specific configuration properties
 */
data class GCSProperties(
    /**
     * GCS project ID
     */
    val projectId: String = "",
    
    /**
     * Path to GCS service account key file
     * If not provided, will use default credentials
     */
    val serviceAccountKeyPath: String? = null,
    
    /**
     * GCS service account key content (as JSON string)
     * Alternative to serviceAccountKeyPath
     */
    val serviceAccountKeyContent: String? = null,
    
    /**
     * Use default credentials (ADC - Application Default Credentials)
     */
    val useDefaultCredentials: Boolean = true,
    
    /**
     * Enable GCS versioning for buckets
     */
    val enableVersioning: Boolean = true,
    
    /**
     * Enable GCS lifecycle management
     */
    val enableLifecycle: Boolean = true,
    
    /**
     * Default storage class for objects
     * Options: STANDARD, NEARLINE, COLDLINE, ARCHIVE
     */
    val defaultStorageClass: String = "STANDARD",
    
    /**
     * Enable uniform bucket-level access
     */
    val uniformBucketLevelAccess: Boolean = true,
    
    /**
     * Enable public access prevention
     */
    val preventPublicAccess: Boolean = true,
    
    /**
     * Enable audit logging
     */
    val enableAuditLogging: Boolean = true,
    
    /**
     * KMS key name for encryption
     */
    val kmsKeyName: String? = null,
    
    /**
     * Enable customer-managed encryption keys (CMEK)
     */
    val enableCmek: Boolean = false
)