package dev.ryuzu.astermanagement.storage.domain

import java.io.InputStream
import java.time.LocalDateTime

/**
 * Represents an object stored in the storage system.
 * Contains both metadata and optional data stream for comprehensive object handling.
 * 
 * This class provides a unified representation across different storage providers
 * (MinIO, Google Cloud Storage) while maintaining provider-specific information.
 */
data class StorageObject(
    /**
     * Bucket/container name where the object is stored
     */
    val bucketName: String,
    
    /**
     * Object key/path within the bucket
     */
    val objectName: String,
    
    /**
     * Object size in bytes
     */
    val size: Long,
    
    /**
     * Content type/MIME type of the object
     */
    val contentType: String,
    
    /**
     * ETag or hash of the object content (for integrity checking)
     */
    val etag: String,
    
    /**
     * Last modification timestamp
     */
    val lastModified: LocalDateTime,
    
    /**
     * Custom metadata associated with the object
     */
    val metadata: Map<String, String> = emptyMap(),
    
    /**
     * Optional data stream (only populated for download operations)
     * Note: Stream should be closed after use
     */
    val dataStream: InputStream? = null,
    
    /**
     * Storage provider specific information
     */
    val providerMetadata: Map<String, Any> = emptyMap(),
    
    /**
     * Whether this object is a directory/folder marker
     */
    val isDirectory: Boolean = false,
    
    /**
     * Storage class information (STANDARD, NEARLINE, etc.)
     */
    val storageClass: String? = null,
    
    /**
     * Object version ID (if versioning is enabled)
     */
    val versionId: String? = null,
    
    /**
     * Encryption information
     */
    val encryption: EncryptionInfo? = null
) {
    
    /**
     * Get the file extension from the object name
     */
    val fileExtension: String
        get() = objectName.substringAfterLast('.', "")
    
    /**
     * Get the file name without path
     */
    val fileName: String
        get() = objectName.substringAfterLast('/')
    
    /**
     * Get the directory path without file name
     */
    val directoryPath: String
        get() = if (objectName.contains('/')) {
            objectName.substringBeforeLast('/')
        } else {
            ""
        }
    
    /**
     * Check if this is a valid object (has required fields)
     */
    val isValid: Boolean
        get() = bucketName.isNotEmpty() && objectName.isNotEmpty() && size >= 0
    
    /**
     * Get human-readable size
     */
    val humanReadableSize: String
        get() = formatFileSize(size)
    
    /**
     * Check if object has custom metadata
     */
    val hasMetadata: Boolean
        get() = metadata.isNotEmpty()
    
    /**
     * Get metadata value by key (case-insensitive)
     */
    fun getMetadata(key: String): String? {
        return metadata.entries.find { it.key.equals(key, ignoreCase = true) }?.value
    }
    
    /**
     * Check if object has specific metadata key
     */
    fun hasMetadata(key: String): Boolean {
        return metadata.keys.any { it.equals(key, ignoreCase = true) }
    }
    
    /**
     * Create a copy with updated metadata
     */
    fun withMetadata(newMetadata: Map<String, String>): StorageObject {
        return copy(metadata = newMetadata)
    }
    
    /**
     * Create a copy with additional metadata
     */
    fun addMetadata(key: String, value: String): StorageObject {
        return copy(metadata = metadata + (key to value))
    }
    
    /**
     * Create a copy without data stream (for listing operations)
     */
    fun withoutDataStream(): StorageObject {
        return copy(dataStream = null)
    }
    
    /**
     * Get URL-safe object name
     */
    val urlSafeObjectName: String
        get() = objectName.replace(" ", "%20")
    
    companion object {
        /**
         * Create a minimal StorageObject for basic operations
         */
        fun minimal(bucketName: String, objectName: String): StorageObject {
            return StorageObject(
                bucketName = bucketName,
                objectName = objectName,
                size = 0,
                contentType = "application/octet-stream",
                etag = "",
                lastModified = LocalDateTime.now()
            )
        }
        
        /**
         * Create a directory marker object
         */
        fun directory(bucketName: String, directoryPath: String): StorageObject {
            val path = if (directoryPath.endsWith("/")) directoryPath else "$directoryPath/"
            return StorageObject(
                bucketName = bucketName,
                objectName = path,
                size = 0,
                contentType = "application/x-directory",
                etag = "",
                lastModified = LocalDateTime.now(),
                isDirectory = true
            )
        }
        
        /**
         * Format file size in human-readable format
         */
        private fun formatFileSize(bytes: Long): String {
            if (bytes < 1024) return "$bytes B"
            
            val units = arrayOf("KB", "MB", "GB", "TB")
            var size = bytes.toDouble()
            var unitIndex = -1
            
            while (size >= 1024 && unitIndex < units.size - 1) {
                size /= 1024
                unitIndex++
            }
            
            return "%.1f %s".format(size, units[unitIndex])
        }
    }
}

/**
 * Encryption information for stored objects
 */
data class EncryptionInfo(
    /**
     * Encryption algorithm used
     */
    val algorithm: String,
    
    /**
     * Key ID or reference (not the actual key)
     */
    val keyId: String? = null,
    
    /**
     * Whether encryption is server-side or client-side
     */
    val serverSide: Boolean = true,
    
    /**
     * Additional encryption metadata
     */
    val metadata: Map<String, String> = emptyMap()
)