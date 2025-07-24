package dev.ryuzu.astermanagement.storage.service.impl

import dev.ryuzu.astermanagement.config.StorageProperties
import dev.ryuzu.astermanagement.storage.domain.StorageObject
import dev.ryuzu.astermanagement.storage.domain.StorageMetadata
import dev.ryuzu.astermanagement.storage.exception.*
import dev.ryuzu.astermanagement.storage.service.StorageService
import com.google.cloud.storage.*
import com.google.cloud.storage.Storage.BlobListOption
import com.google.cloud.storage.Storage.BucketListOption
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.time.Duration
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.util.concurrent.TimeUnit

/**
 * Google Cloud Storage implementation of the StorageService interface.
 * Provides object storage capabilities using Google Cloud Storage API.
 * 
 * This is a basic implementation that will be enhanced as needed.
 * Focus is on feature parity with MinIO implementation.
 * 
 * Configuration via StorageProperties with prefix "aster.storage"
 */
@Service
@ConditionalOnProperty(prefix = "aster.storage", name = ["provider"], havingValue = "GCS")
class GCSStorageService(
    private val storageProperties: StorageProperties
) : StorageService {

    private val logger = LoggerFactory.getLogger(GCSStorageService::class.java)
    
    private val storage: Storage by lazy {
        try {
            val builder = StorageOptions.newBuilder()
            
            // Configure project ID
            if (storageProperties.gcs.projectId.isNotEmpty()) {
                builder.setProjectId(storageProperties.gcs.projectId)
            }
            
            // Configure credentials
            when {
                storageProperties.gcs.serviceAccountKeyPath != null -> {
                    // Use service account key file
                    logger.info("Using GCS service account key file: {}", storageProperties.gcs.serviceAccountKeyPath)
                }
                storageProperties.gcs.serviceAccountKeyContent != null -> {
                    // Use service account key content
                    logger.info("Using GCS service account key content")
                }
                storageProperties.gcs.useDefaultCredentials -> {
                    // Use Application Default Credentials
                    logger.info("Using GCS Application Default Credentials")
                }
                else -> {
                    logger.warn("No GCS credentials configured, relying on environment")
                }
            }
            
            val storage = builder.build().service
            logger.info("GCS client initialized for project: {}", storageProperties.gcs.projectId)
            storage
        } catch (e: Exception) {
            logger.error("Failed to initialize GCS client", e)
            throw StorageConfigurationException("Failed to initialize GCS client: ${e.message}", e)
        }
    }

    override fun upload(
        bucketName: String,
        objectName: String,
        data: InputStream,
        metadata: Map<String, String>
    ): StorageObject {
        return upload(bucketName, objectName, data, "application/octet-stream", metadata)
    }

    override fun upload(
        bucketName: String,
        objectName: String,
        data: InputStream,
        contentType: String,
        metadata: Map<String, String>
    ): StorageObject {
        validateBucketName(bucketName)
        validateObjectName(objectName)
        
        try {
            // Read data
            val dataBytes = data.readAllBytes()
            
            // Validate file size
            if (dataBytes.size > storageProperties.maxFileSize) {
                throw StorageFileSizeExceededException(
                    objectName, 
                    dataBytes.size.toLong(), 
                    storageProperties.maxFileSize
                )
            }
            
            // Create blob info
            val blobInfoBuilder = BlobInfo.newBuilder(bucketName, objectName)
                .setContentType(contentType)
            
            // Add metadata
            if (metadata.isNotEmpty()) {
                blobInfoBuilder.setMetadata(metadata)
            }
            
            // Configure storage class
            if (storageProperties.gcs.defaultStorageClass.isNotEmpty()) {
                blobInfoBuilder.setStorageClass(StorageClass.valueOf(storageProperties.gcs.defaultStorageClass))
            }
            
            val blobInfo = blobInfoBuilder.build()
            
            // Upload
            val blob = storage.create(blobInfo, dataBytes)
            
            logger.debug("Successfully uploaded object to GCS: {}/{}", bucketName, objectName)
            
            return StorageObject(
                bucketName = bucketName,
                objectName = objectName,
                size = blob.size ?: dataBytes.size.toLong(),
                contentType = blob.contentType ?: contentType,
                etag = blob.etag ?: "",
                lastModified = blob.updateTimeOffsetDateTime?.toLocalDateTime() 
                    ?: blob.createTimeOffsetDateTime?.toLocalDateTime() 
                    ?: LocalDateTime.now(),
                metadata = blob.metadata?.filterValues { it != null }?.mapValues { it.value!! } ?: metadata,
                providerMetadata = mapOf(
                    "provider" to "GCS",
                    "generation" to (blob.generation?.toString() ?: ""),
                    "storageClass" to (blob.storageClass?.toString() ?: ""),
                    "kmsKeyName" to (blob.kmsKeyName ?: "")
                )
            )
            
        } catch (e: com.google.cloud.storage.StorageException) {
            throw handleGCSException(e, "upload", "$bucketName/$objectName")
        } catch (e: Exception) {
            logger.error("Unexpected error during GCS upload for {}/{}", bucketName, objectName, e)
            throw StorageGenericException("upload", e.message ?: "Unknown error", e)
        }
    }

    override fun download(bucketName: String, objectName: String): InputStream {
        validateBucketName(bucketName)
        validateObjectName(objectName)
        
        try {
            val blob = storage.get(bucketName, objectName)
                ?: throw StorageObjectNotFoundException(bucketName, objectName)
            
            val content = blob.getContent()
            logger.debug("Successfully downloaded object from GCS: {}/{}", bucketName, objectName)
            return ByteArrayInputStream(content)
            
        } catch (e: com.google.cloud.storage.StorageException) {
            throw e
        } catch (e: Exception) {
            logger.error("Unexpected error during GCS download for {}/{}", bucketName, objectName, e)
            throw StorageGenericException("download", e.message ?: "Unknown error", e)
        }
    }

    override fun downloadWithMetadata(bucketName: String, objectName: String): StorageObject {
        validateBucketName(bucketName)
        validateObjectName(objectName)
        
        try {
            val blob = storage.get(bucketName, objectName)
                ?: throw StorageObjectNotFoundException(bucketName, objectName)
            
            val content = blob.getContent()
            val stream = ByteArrayInputStream(content)
            
            return StorageObject(
                bucketName = bucketName,
                objectName = objectName,
                size = blob.size ?: content.size.toLong(),
                contentType = blob.contentType ?: "application/octet-stream",
                etag = blob.etag ?: "",
                lastModified = blob.updateTimeOffsetDateTime?.toLocalDateTime() 
                    ?: blob.createTimeOffsetDateTime?.toLocalDateTime() 
                    ?: LocalDateTime.now(),
                metadata = blob.metadata?.filterValues { it != null }?.mapValues { it.value!! } ?: emptyMap(),
                dataStream = stream,
                providerMetadata = mapOf(
                    "provider" to "GCS",
                    "generation" to (blob.generation?.toString() ?: ""),
                    "storageClass" to (blob.storageClass?.toString() ?: "")
                )
            )
            
        } catch (e: com.google.cloud.storage.StorageException) {
            throw e
        } catch (e: Exception) {
            logger.error("Unexpected error during GCS download with metadata for {}/{}", bucketName, objectName, e)
            throw StorageGenericException("downloadWithMetadata", e.message ?: "Unknown error", e)
        }
    }

    override fun delete(bucketName: String, objectName: String): Boolean {
        validateBucketName(bucketName)
        validateObjectName(objectName)
        
        try {
            val deleted = storage.delete(bucketName, objectName)
            if (deleted) {
                logger.debug("Successfully deleted object from GCS: {}/{}", bucketName, objectName)
            } else {
                logger.debug("Object not found for deletion in GCS: {}/{}", bucketName, objectName)
            }
            return deleted
            
        } catch (e: Exception) {
            logger.error("Unexpected error during GCS delete for {}/{}", bucketName, objectName, e)
            throw StorageGenericException("delete", e.message ?: "Unknown error", e)
        }
    }

    override fun deleteMultiple(bucketName: String, objectNames: List<String>): Map<String, Boolean> {
        validateBucketName(bucketName)
        
        if (objectNames.isEmpty()) {
            return emptyMap()
        }
        
        val results = mutableMapOf<String, Boolean>()
        
        objectNames.forEach { objectName ->
            results[objectName] = try {
                delete(bucketName, objectName)
            } catch (e: com.google.cloud.storage.StorageException) {
                logger.warn("Failed to delete object from GCS {}/{}: {}", bucketName, objectName, e.message)
                false
            }
        }
        
        logger.debug("Batch delete completed for GCS bucket {} with {} objects", bucketName, objectNames.size)
        return results
    }

    override fun exists(bucketName: String, objectName: String): Boolean {
        validateBucketName(bucketName)
        validateObjectName(objectName)
        
        try {
            val blob = storage.get(bucketName, objectName)
            return blob != null
        } catch (e: Exception) {
            logger.error("Unexpected error during GCS exists check for {}/{}", bucketName, objectName, e)
            return false
        }
    }

    override fun list(bucketName: String, prefix: String?, pageable: Pageable): Page<StorageObject> {
        return listDetailed(bucketName, prefix, pageable, false)
    }

    override fun listDetailed(
        bucketName: String,
        prefix: String?,
        pageable: Pageable,
        includeMetadata: Boolean
    ): Page<StorageObject> {
        validateBucketName(bucketName)
        
        try {
            val options = mutableListOf<BlobListOption>()
            prefix?.let { options.add(BlobListOption.prefix(it)) }
            
            val blobs = storage.list(bucketName, *options.toTypedArray())
            val objects = mutableListOf<StorageObject>()
            
            for (blob in blobs.iterateAll()) {
                if (blob.isDirectory) continue
                
                val storageObject = convertBlobToStorageObject(blob)
                objects.add(storageObject)
            }
            
            // Apply pagination manually
            val startIndex = pageable.offset.toInt()
            val endIndex = minOf(startIndex + pageable.pageSize, objects.size)
            
            val pageContent = if (startIndex < objects.size) {
                objects.subList(startIndex, endIndex)
            } else {
                emptyList()
            }
            
            logger.debug("Listed {} objects from GCS bucket {} with prefix '{}'", objects.size, bucketName, prefix ?: "")
            return PageImpl(pageContent, pageable, objects.size.toLong())
            
        } catch (e: Exception) {
            logger.error("Unexpected error during GCS list for bucket {} with prefix '{}'", bucketName, prefix ?: "", e)
            throw StorageGenericException("list", e.message ?: "Unknown error", e)
        }
    }

    override fun generatePresignedUrl(
        bucketName: String,
        objectName: String,
        expiry: Duration,
        forUpload: Boolean
    ): String {
        if (!storageProperties.enablePresignedUrls) {
            throw StorageUnsupportedOperationException("generatePresignedUrl", "GCS (disabled in config)")
        }
        
        try {
            val method = if (forUpload) HttpMethod.PUT else HttpMethod.GET
            val url = storage.signUrl(
                BlobInfo.newBuilder(bucketName, objectName).build(),
                expiry.toSeconds(),
                TimeUnit.SECONDS,
                Storage.SignUrlOption.httpMethod(method)
            )
            
            logger.debug("Generated presigned URL for GCS {}/{} ({})", bucketName, objectName, if (forUpload) "upload" else "download")
            return url.toString()
            
        } catch (e: Exception) {
            logger.error("Unexpected error during GCS presigned URL generation for {}/{}", bucketName, objectName, e)
            throw StorageGenericException("generatePresignedUrl", e.message ?: "Unknown error", e)
        }
    }

    override fun copy(
        sourceBucket: String,
        sourceObject: String,
        destinationBucket: String,
        destinationObject: String,
        preserveMetadata: Boolean
    ): StorageObject {
        // Basic implementation - GCS supports native copy operations
        throw StorageUnsupportedOperationException("copy", "GCS (not yet implemented)")
    }

    override fun move(
        sourceBucket: String,
        sourceObject: String,
        destinationBucket: String,
        destinationObject: String
    ): StorageObject {
        val copiedObject = copy(sourceBucket, sourceObject, destinationBucket, destinationObject, true)
        delete(sourceBucket, sourceObject)
        return copiedObject
    }

    override fun getMetadata(bucketName: String, objectName: String): StorageMetadata {
        validateBucketName(bucketName)
        validateObjectName(objectName)
        
        try {
            val blob = storage.get(bucketName, objectName)
                ?: throw StorageObjectNotFoundException(bucketName, objectName)
            
            return StorageMetadata(
                bucketName = bucketName,
                objectName = objectName,
                size = blob.size ?: 0,
                contentType = blob.contentType ?: "application/octet-stream",
                etag = blob.etag ?: "",
                lastModified = blob.updateTimeOffsetDateTime?.toLocalDateTime() 
                    ?: blob.createTimeOffsetDateTime?.toLocalDateTime() 
                    ?: LocalDateTime.now(),
                createdAt = blob.createTimeOffsetDateTime?.toLocalDateTime(),
                customMetadata = blob.metadata?.filterValues { it != null }?.mapValues { it.value!! } ?: emptyMap(),
                systemMetadata = mapOf(
                    "provider" to "GCS",
                    "generation" to (blob.generation?.toString() ?: ""),
                    "storageClass" to (blob.storageClass?.toString() ?: "")
                )
            )
            
        } catch (e: com.google.cloud.storage.StorageException) {
            throw e
        } catch (e: Exception) {
            logger.error("Unexpected error during GCS get metadata for {}/{}", bucketName, objectName, e)
            throw StorageGenericException("getMetadata", e.message ?: "Unknown error", e)
        }
    }

    override fun updateMetadata(
        bucketName: String,
        objectName: String,
        metadata: Map<String, String>,
        merge: Boolean
    ): StorageMetadata {
        // GCS supports metadata updates
        throw StorageUnsupportedOperationException("updateMetadata", "GCS (not yet implemented)")
    }

    override fun createBucketIfNotExists(bucketName: String, region: String?): Boolean {
        validateBucketName(bucketName)
        
        try {
            val bucket = storage.get(bucketName)
            if (bucket != null) {
                return false
            }
            
            val bucketInfoBuilder = BucketInfo.newBuilder(bucketName)
            region?.let { bucketInfoBuilder.setLocation(it) }
            
            storage.create(bucketInfoBuilder.build())
            logger.info("Created GCS bucket: {}", bucketName)
            return true
            
        } catch (e: Exception) {
            logger.error("Unexpected error during GCS create bucket for {}", bucketName, e)
            throw StorageGenericException("createBucket", e.message ?: "Unknown error", e)
        }
    }

    override fun bucketExists(bucketName: String): Boolean {
        validateBucketName(bucketName)
        
        try {
            val bucket = storage.get(bucketName)
            return bucket != null
        } catch (e: Exception) {
            logger.error("Unexpected error during GCS bucket exists check for {}", bucketName, e)
            return false
        }
    }

    override fun getStorageInfo(): Map<String, Any> {
        return mapOf(
            "provider" to "GCS",
            "projectId" to storageProperties.gcs.projectId,
            "defaultStorageClass" to storageProperties.gcs.defaultStorageClass,
            "versioningEnabled" to storageProperties.gcs.enableVersioning,
            "lifecycleEnabled" to storageProperties.gcs.enableLifecycle,
            "maxFileSize" to storageProperties.maxFileSize,
            "allowedMimeTypes" to storageProperties.allowedMimeTypes,
            "presignedUrlsEnabled" to storageProperties.enablePresignedUrls,
            "healthCheckEnabled" to storageProperties.enableHealthCheck
        )
    }

    override fun testConnection(): Boolean {
        return try {
            // Try to list buckets as a connectivity test
            storage.list().iterateAll().count()
            true
        } catch (e: Exception) {
            logger.warn("GCS connectivity test failed: {}", e.message)
            false
        }
    }

    /**
     * Convert GCS Blob to StorageObject
     */
    private fun convertBlobToStorageObject(blob: Blob): StorageObject {
        return StorageObject(
            bucketName = blob.bucket,
            objectName = blob.name,
            size = blob.size ?: 0,
            contentType = blob.contentType ?: "application/octet-stream",
            etag = blob.etag ?: "",
            lastModified = blob.updateTimeOffsetDateTime?.toLocalDateTime() 
                ?: blob.createTimeOffsetDateTime?.toLocalDateTime() 
                ?: LocalDateTime.now(),
            metadata = blob.metadata?.filterValues { it != null }?.mapValues { it.value!! } ?: emptyMap(),
            isDirectory = blob.isDirectory,
            storageClass = blob.storageClass?.toString(),
            versionId = blob.generation?.toString(),
            providerMetadata = mapOf(
                "provider" to "GCS",
                "generation" to (blob.generation?.toString() ?: ""),
                "metageneration" to (blob.metageneration?.toString() ?: ""),
                "kmsKeyName" to (blob.kmsKeyName ?: "")
            )
        )
    }

    /**
     * Handle GCS-specific exceptions
     */
    private fun handleGCSException(e: Exception, operation: String, resource: String): dev.ryuzu.astermanagement.storage.exception.StorageException {
        return StorageGenericException(operation, "GCS error: ${e.message}", e)
    }

    /**
     * Validate bucket name according to GCS naming rules
     */
    private fun validateBucketName(bucketName: String) {
        if (bucketName.isBlank()) {
            throw StorageInvalidNameException("bucket", bucketName, "Bucket name cannot be empty")
        }
        if (bucketName.length < 3 || bucketName.length > 63) {
            throw StorageInvalidNameException("bucket", bucketName, "Bucket name must be between 3 and 63 characters")
        }
    }

    /**
     * Validate object name
     */
    private fun validateObjectName(objectName: String) {
        if (objectName.isBlank()) {
            throw StorageInvalidNameException("object", objectName, "Object name cannot be empty")
        }
        if (objectName.length > 1024) {
            throw StorageInvalidNameException("object", objectName, "Object name cannot exceed 1024 characters")
        }
    }
}