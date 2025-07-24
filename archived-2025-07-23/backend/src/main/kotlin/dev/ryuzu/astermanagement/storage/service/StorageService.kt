package dev.ryuzu.astermanagement.storage.service

import dev.ryuzu.astermanagement.storage.domain.StorageObject
import dev.ryuzu.astermanagement.storage.domain.StorageMetadata
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.io.InputStream
import java.time.Duration

/**
 * Storage service interface providing unified abstraction over different storage providers.
 * Follows the established MatterService pattern for consistency with existing codebase.
 * 
 * Supports both MinIO and Google Cloud Storage with identical API surface.
 * All operations include proper error handling and return structured results.
 * 
 * Usage example:
 * ```kotlin
 * @Service
 * class DocumentService(private val storageService: StorageService) {
 *     fun uploadDocument(data: InputStream, metadata: StorageMetadata): StorageObject {
 *         return storageService.upload("documents", "matter-123/doc.pdf", data, metadata.toMap())
 *     }
 * }
 * ```
 */
interface StorageService {

    /**
     * Upload an object to storage with metadata
     * 
     * @param bucketName The bucket/container name
     * @param objectName The object key/path within the bucket
     * @param data The input stream containing the object data
     * @param metadata Additional metadata to store with the object
     * @return StorageObject containing upload results and metadata
     * @throws StorageException If upload fails
     */
    fun upload(
        bucketName: String, 
        objectName: String, 
        data: InputStream, 
        metadata: Map<String, String> = emptyMap()
    ): StorageObject

    /**
     * Upload an object with content type detection
     * 
     * @param bucketName The bucket/container name
     * @param objectName The object key/path within the bucket
     * @param data The input stream containing the object data
     * @param contentType The MIME type of the content
     * @param metadata Additional metadata to store with the object
     * @return StorageObject containing upload results and metadata
     * @throws StorageException If upload fails
     */
    fun upload(
        bucketName: String,
        objectName: String,
        data: InputStream,
        contentType: String,
        metadata: Map<String, String> = emptyMap()
    ): StorageObject

    /**
     * Download an object from storage
     * 
     * @param bucketName The bucket/container name
     * @param objectName The object key/path within the bucket
     * @return InputStream containing the object data
     * @throws StorageObjectNotFoundException If object doesn't exist
     * @throws StorageException If download fails
     */
    fun download(bucketName: String, objectName: String): InputStream

    /**
     * Download an object with metadata
     * 
     * @param bucketName The bucket/container name
     * @param objectName The object key/path within the bucket
     * @return StorageObject containing both data stream and metadata
     * @throws StorageObjectNotFoundException If object doesn't exist
     * @throws StorageException If download fails
     */
    fun downloadWithMetadata(bucketName: String, objectName: String): StorageObject

    /**
     * Delete an object from storage
     * 
     * @param bucketName The bucket/container name
     * @param objectName The object key/path within the bucket
     * @return true if object was deleted, false if it didn't exist
     * @throws StorageException If deletion fails
     */
    fun delete(bucketName: String, objectName: String): Boolean

    /**
     * Delete multiple objects from storage (batch operation)
     * 
     * @param bucketName The bucket/container name
     * @param objectNames List of object keys/paths to delete
     * @return Map of object names to deletion success status
     * @throws StorageException If batch deletion fails
     */
    fun deleteMultiple(bucketName: String, objectNames: List<String>): Map<String, Boolean>

    /**
     * Check if an object exists in storage
     * 
     * @param bucketName The bucket/container name
     * @param objectName The object key/path within the bucket
     * @return true if object exists, false otherwise
     * @throws StorageException If existence check fails
     */
    fun exists(bucketName: String, objectName: String): Boolean

    /**
     * List objects in a bucket with optional prefix filtering and pagination
     * 
     * @param bucketName The bucket/container name
     * @param prefix Optional prefix to filter objects (e.g., "matter-123/")
     * @param pageable Pagination parameters
     * @return Page of StorageObject containing object metadata
     * @throws StorageException If listing fails
     */
    fun list(
        bucketName: String, 
        prefix: String? = null, 
        pageable: Pageable
    ): Page<StorageObject>

    /**
     * List objects with detailed metadata (slower but more comprehensive)
     * 
     * @param bucketName The bucket/container name
     * @param prefix Optional prefix to filter objects
     * @param pageable Pagination parameters
     * @param includeMetadata Whether to include custom metadata (slower)
     * @return Page of StorageObject with full metadata
     * @throws StorageException If listing fails
     */
    fun listDetailed(
        bucketName: String,
        prefix: String? = null,
        pageable: Pageable,
        includeMetadata: Boolean = false
    ): Page<StorageObject>

    /**
     * Generate a presigned URL for direct client access
     * 
     * @param bucketName The bucket/container name
     * @param objectName The object key/path within the bucket
     * @param expiry How long the URL should remain valid
     * @param forUpload true for upload URL, false for download URL
     * @return Presigned URL string
     * @throws StorageException If URL generation fails
     */
    fun generatePresignedUrl(
        bucketName: String, 
        objectName: String, 
        expiry: Duration,
        forUpload: Boolean = false
    ): String

    /**
     * Copy an object within the same storage system
     * 
     * @param sourceBucket Source bucket name
     * @param sourceObject Source object key
     * @param destinationBucket Destination bucket name
     * @param destinationObject Destination object key
     * @param preserveMetadata Whether to copy metadata from source
     * @return StorageObject representing the copied object
     * @throws StorageException If copy operation fails
     */
    fun copy(
        sourceBucket: String,
        sourceObject: String,
        destinationBucket: String,
        destinationObject: String,
        preserveMetadata: Boolean = true
    ): StorageObject

    /**
     * Move an object within the same storage system (copy + delete)
     * 
     * @param sourceBucket Source bucket name
     * @param sourceObject Source object key
     * @param destinationBucket Destination bucket name
     * @param destinationObject Destination object key
     * @return StorageObject representing the moved object
     * @throws StorageException If move operation fails
     */
    fun move(
        sourceBucket: String,
        sourceObject: String,
        destinationBucket: String,
        destinationObject: String
    ): StorageObject

    /**
     * Get metadata for an object without downloading content
     * 
     * @param bucketName The bucket/container name
     * @param objectName The object key/path within the bucket
     * @return StorageMetadata containing object information
     * @throws StorageObjectNotFoundException If object doesn't exist
     * @throws StorageException If metadata retrieval fails
     */
    fun getMetadata(bucketName: String, objectName: String): StorageMetadata

    /**
     * Update metadata for an existing object
     * 
     * @param bucketName The bucket/container name
     * @param objectName The object key/path within the bucket
     * @param metadata New metadata to set
     * @param merge Whether to merge with existing metadata or replace it
     * @return Updated StorageMetadata
     * @throws StorageObjectNotFoundException If object doesn't exist
     * @throws StorageException If metadata update fails
     */
    fun updateMetadata(
        bucketName: String,
        objectName: String,
        metadata: Map<String, String>,
        merge: Boolean = true
    ): StorageMetadata

    /**
     * Create a bucket if it doesn't exist
     * 
     * @param bucketName The bucket name to create
     * @param region Optional region for bucket creation
     * @return true if bucket was created, false if it already existed
     * @throws StorageException If bucket creation fails
     */
    fun createBucketIfNotExists(bucketName: String, region: String? = null): Boolean

    /**
     * Check if a bucket exists
     * 
     * @param bucketName The bucket name to check
     * @return true if bucket exists, false otherwise
     * @throws StorageException If bucket existence check fails
     */
    fun bucketExists(bucketName: String): Boolean

    /**
     * Get storage provider information and health status
     * 
     * @return Map containing provider info, connectivity status, and health metrics
     */
    fun getStorageInfo(): Map<String, Any>

    /**
     * Test storage connectivity and permissions
     * 
     * @return true if storage is accessible and writable, false otherwise
     */
    fun testConnection(): Boolean
}