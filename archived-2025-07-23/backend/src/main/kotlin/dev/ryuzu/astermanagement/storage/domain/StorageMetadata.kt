package dev.ryuzu.astermanagement.storage.domain

import java.time.LocalDateTime
import java.util.*

/**
 * Metadata associated with storage objects.
 * Provides structured access to both system and custom metadata.
 * 
 * This class separates system-managed metadata from user-defined metadata
 * while providing convenient access methods for common use cases.
 */
data class StorageMetadata(
    /**
     * Bucket/container name
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
     * Content type/MIME type
     */
    val contentType: String,
    
    /**
     * ETag or content hash
     */
    val etag: String,
    
    /**
     * Last modification timestamp
     */
    val lastModified: LocalDateTime,
    
    /**
     * Creation timestamp (if available)
     */
    val createdAt: LocalDateTime? = null,
    
    /**
     * User-defined custom metadata
     */
    val customMetadata: Map<String, String> = emptyMap(),
    
    /**
     * System metadata (read-only, provider-specific)
     */
    val systemMetadata: Map<String, Any> = emptyMap(),
    
    /**
     * Storage class (STANDARD, NEARLINE, etc.)
     */
    val storageClass: String? = null,
    
    /**
     * Version ID (if versioning is enabled)
     */
    val versionId: String? = null,
    
    /**
     * Encryption information
     */
    val encryption: EncryptionInfo? = null,
    
    /**
     * Content encoding (gzip, deflate, etc.)
     */
    val contentEncoding: String? = null,
    
    /**
     * Content language
     */
    val contentLanguage: String? = null,
    
    /**
     * Cache control headers
     */
    val cacheControl: String? = null,
    
    /**
     * Content disposition
     */
    val contentDisposition: String? = null,
    
    /**
     * Expires header
     */
    val expires: LocalDateTime? = null
) {
    
    /**
     * Get the file extension
     */
    val fileExtension: String
        get() = objectName.substringAfterLast('.', "")
    
    /**
     * Get the file name without path
     */
    val fileName: String
        get() = objectName.substringAfterLast('/')
    
    /**
     * Get human-readable size
     */
    val humanReadableSize: String
        get() = formatFileSize(size)
    
    /**
     * Check if this is a directory
     */
    val isDirectory: Boolean
        get() = objectName.endsWith("/") || contentType == "application/x-directory"
    
    /**
     * Get all metadata as a single map (custom + flattened system)
     */
    fun getAllMetadata(): Map<String, String> {
        val flattened = systemMetadata.mapValues { it.value.toString() }
        return customMetadata + flattened
    }
    
    /**
     * Get metadata value by key (case-insensitive, searches both custom and system)
     */
    fun getMetadata(key: String): String? {
        // Try custom metadata first
        customMetadata.entries.find { it.key.equals(key, ignoreCase = true) }?.let {
            return it.value
        }
        
        // Then try system metadata
        systemMetadata.entries.find { it.key.equals(key, ignoreCase = true) }?.let {
            return it.value.toString()
        }
        
        return null
    }
    
    /**
     * Check if metadata contains a specific key
     */
    fun hasMetadata(key: String): Boolean {
        return customMetadata.keys.any { it.equals(key, ignoreCase = true) } ||
               systemMetadata.keys.any { it.equals(key, ignoreCase = true) }
    }
    
    /**
     * Get custom metadata value by key (case-insensitive)
     */
    fun getCustomMetadata(key: String): String? {
        return customMetadata.entries.find { it.key.equals(key, ignoreCase = true) }?.value
    }
    
    /**
     * Get system metadata value by key (case-insensitive)
     */
    fun getSystemMetadata(key: String): Any? {
        return systemMetadata.entries.find { it.key.equals(key, ignoreCase = true) }?.value
    }
    
    /**
     * Create a copy with updated custom metadata
     */
    fun withCustomMetadata(metadata: Map<String, String>): StorageMetadata {
        return copy(customMetadata = metadata)
    }
    
    /**
     * Create a copy with additional custom metadata
     */
    fun addCustomMetadata(key: String, value: String): StorageMetadata {
        return copy(customMetadata = customMetadata + (key to value))
    }
    
    /**
     * Create a copy with removed custom metadata key
     */
    fun removeCustomMetadata(key: String): StorageMetadata {
        val filtered = customMetadata.filterKeys { !it.equals(key, ignoreCase = true) }
        return copy(customMetadata = filtered)
    }
    
    /**
     * Convert to map for storage service operations
     */
    fun toMap(): Map<String, String> {
        val map = mutableMapOf<String, String>()
        
        // Add custom metadata
        map.putAll(customMetadata)
        
        // Add optional fields if present
        contentEncoding?.let { map["Content-Encoding"] = it }
        contentLanguage?.let { map["Content-Language"] = it }
        cacheControl?.let { map["Cache-Control"] = it }
        contentDisposition?.let { map["Content-Disposition"] = it }
        
        return map
    }
    
    /**
     * Check if object is encrypted
     */
    val isEncrypted: Boolean
        get() = encryption != null
    
    /**
     * Check if object has versioning
     */
    val isVersioned: Boolean
        get() = versionId != null
    
    /**
     * Get document metadata (if this is a document)
     */
    fun getDocumentMetadata(): DocumentMetadata? {
        if (!isDocument()) return null
        
        return DocumentMetadata(
            title = getCustomMetadata("title") ?: fileName,
            author = getCustomMetadata("author"),
            subject = getCustomMetadata("subject"),
            keywords = getCustomMetadata("keywords")?.split(",")?.map { it.trim() } ?: emptyList(),
            createdBy = getCustomMetadata("created-by"),
            description = getCustomMetadata("description"),
            category = getCustomMetadata("category"),
            tags = getCustomMetadata("tags")?.split(",")?.map { it.trim() } ?: emptyList()
        )
    }
    
    /**
     * Check if this represents a document
     */
    fun isDocument(): Boolean {
        return contentType.startsWith("application/pdf") ||
               contentType.startsWith("application/msword") ||
               contentType.startsWith("application/vnd.openxmlformats") ||
               contentType.startsWith("text/")
    }
    
    /**
     * Check if this represents an image
     */
    fun isImage(): Boolean {
        return contentType.startsWith("image/")
    }
    
    companion object {
        /**
         * Create metadata from a storage object
         */
        fun from(storageObject: StorageObject): StorageMetadata {
            return StorageMetadata(
                bucketName = storageObject.bucketName,
                objectName = storageObject.objectName,
                size = storageObject.size,
                contentType = storageObject.contentType,
                etag = storageObject.etag,
                lastModified = storageObject.lastModified,
                customMetadata = storageObject.metadata,
                systemMetadata = storageObject.providerMetadata,
                storageClass = storageObject.storageClass,
                versionId = storageObject.versionId,
                encryption = storageObject.encryption
            )
        }
        
        /**
         * Create minimal metadata for basic operations
         */
        fun minimal(bucketName: String, objectName: String): StorageMetadata {
            return StorageMetadata(
                bucketName = bucketName,
                objectName = objectName,
                size = 0,
                contentType = "application/octet-stream",
                etag = "",
                lastModified = LocalDateTime.now()
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
 * Document-specific metadata
 */
data class DocumentMetadata(
    val title: String,
    val author: String? = null,
    val subject: String? = null,
    val keywords: List<String> = emptyList(),
    val createdBy: String? = null,
    val description: String? = null,
    val category: String? = null,
    val tags: List<String> = emptyList()
) {
    /**
     * Convert to custom metadata map
     */
    fun toCustomMetadata(): Map<String, String> {
        val map = mutableMapOf("title" to title)
        
        author?.let { map["author"] = it }
        subject?.let { map["subject"] = it }
        if (keywords.isNotEmpty()) map["keywords"] = keywords.joinToString(",")
        createdBy?.let { map["created-by"] = it }
        description?.let { map["description"] = it }
        category?.let { map["category"] = it }
        if (tags.isNotEmpty()) map["tags"] = tags.joinToString(",")
        
        return map
    }
}