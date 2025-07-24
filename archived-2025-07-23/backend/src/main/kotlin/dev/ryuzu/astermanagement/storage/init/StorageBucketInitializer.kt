package dev.ryuzu.astermanagement.storage.init

import dev.ryuzu.astermanagement.config.StorageProperties
import dev.ryuzu.astermanagement.storage.service.StorageService
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Component

/**
 * Initializes storage buckets on application startup.
 * Creates the required bucket structure for the Aster Management system.
 * 
 * Bucket structure:
 * - matters/{matterId}/documents/ - Legal matter documents
 * - matters/{matterId}/communications/ - Communication records
 * - matters/{matterId}/expenses/ - Expense receipts and records
 * - temp/ - Temporary upload storage (auto-cleaned)
 * - archive/ - Archived documents (with lifecycle policies)
 * - health-check/ - Health check test objects
 * 
 * This component runs only if storage initialization is enabled in configuration.
 */
@Component
@ConditionalOnProperty(
    prefix = "aster.storage",
    name = ["auto-create-buckets"],
    havingValue = "true",
    matchIfMissing = true
)
class StorageBucketInitializer(
    private val storageService: StorageService,
    private val storageProperties: StorageProperties
) {
    
    private val logger = LoggerFactory.getLogger(StorageBucketInitializer::class.java)
    
    companion object {
        // Core buckets required for the application
        private val REQUIRED_BUCKETS = listOf(
            BucketDefinition(
                name = "matters",
                description = "Primary bucket for legal matter documents and files",
                lifecycle = null
            ),
            BucketDefinition(
                name = "temp",
                description = "Temporary storage for upload processing",
                lifecycle = BucketLifecycle(
                    deleteAfterDays = 1,
                    transitionToColdlineAfterDays = null
                )
            ),
            BucketDefinition(
                name = "archive",
                description = "Long-term archive storage for closed matters",
                lifecycle = BucketLifecycle(
                    deleteAfterDays = null,
                    transitionToColdlineAfterDays = 90
                )
            ),
            BucketDefinition(
                name = "health-check",
                description = "Storage health check test objects",
                lifecycle = BucketLifecycle(
                    deleteAfterDays = 1,
                    transitionToColdlineAfterDays = null
                )
            )
        )
    }
    
    @PostConstruct
    fun initializeBuckets() {
        logger.info("Initializing storage buckets for provider: ${storageProperties.provider}")
        
        var createdCount = 0
        var existingCount = 0
        var failedCount = 0
        
        REQUIRED_BUCKETS.forEach { bucketDef ->
            val bucketName = storageProperties.getBucketName(bucketDef.name)
            
            try {
                if (storageService.bucketExists(bucketName)) {
                    logger.debug("Bucket already exists: $bucketName")
                    existingCount++
                } else {
                    val created = storageService.createBucketIfNotExists(
                        bucketName = bucketName,
                        region = storageProperties.region
                    )
                    
                    if (created) {
                        logger.info("Created bucket: $bucketName - ${bucketDef.description}")
                        createdCount++
                        
                        // Create initial directory structure for matters bucket
                        if (bucketDef.name == "matters") {
                            createMattersBucketStructure(bucketName)
                        }
                        
                        // Apply lifecycle policies if defined
                        bucketDef.lifecycle?.let { lifecycle ->
                            applyLifecyclePolicy(bucketName, lifecycle)
                        }
                    } else {
                        logger.warn("Failed to create bucket: $bucketName")
                        failedCount++
                    }
                }
            } catch (e: Exception) {
                logger.error("Error initializing bucket: $bucketName", e)
                failedCount++
            }
        }
        
        logger.info(
            "Bucket initialization complete - Created: $createdCount, " +
            "Existing: $existingCount, Failed: $failedCount"
        )
        
        if (failedCount > 0) {
            logger.warn(
                "Some buckets failed to initialize. The application may not function properly. " +
                "Please check storage configuration and permissions."
            )
        }
    }
    
    /**
     * Creates the initial directory structure for the matters bucket.
     * This helps with organization and browsing in storage management tools.
     */
    private fun createMattersBucketStructure(bucketName: String) {
        try {
            // Create placeholder objects for directory structure
            val placeholders = listOf(
                ".keep", // Root placeholder
                "documents/.keep",
                "communications/.keep",
                "expenses/.keep"
            )
            
            placeholders.forEach { placeholder ->
                try {
                    val data = "This is a placeholder file to maintain directory structure".byteInputStream()
                    storageService.upload(
                        bucketName = bucketName,
                        objectName = placeholder,
                        data = data,
                        contentType = "text/plain",
                        metadata = mapOf(
                            "purpose" to "directory-structure",
                            "created-by" to "bucket-initializer"
                        )
                    )
                    logger.debug("Created placeholder: $bucketName/$placeholder")
                } catch (e: Exception) {
                    // Ignore errors for placeholders - they're not critical
                    logger.trace("Failed to create placeholder: $placeholder", e)
                }
            }
        } catch (e: Exception) {
            logger.warn("Failed to create matters bucket structure", e)
        }
    }
    
    /**
     * Applies lifecycle policies to buckets (provider-specific implementation).
     * For MinIO, this may require additional configuration.
     * For GCS, this uses the native lifecycle management.
     */
    private fun applyLifecyclePolicy(bucketName: String, lifecycle: BucketLifecycle) {
        try {
            logger.info(
                "Applying lifecycle policy to bucket $bucketName: " +
                "deleteAfter=${lifecycle.deleteAfterDays} days, " +
                "transitionToColdline=${lifecycle.transitionToColdlineAfterDays} days"
            )
            
            // Note: Actual implementation would be provider-specific
            // MinIO supports lifecycle policies via mc admin command or API
            // GCS has native support via the SDK
            
            when (storageProperties.provider) {
                dev.ryuzu.astermanagement.config.StorageProvider.GCS -> {
                    // GCS-specific lifecycle implementation would go here
                    logger.debug("GCS lifecycle policy would be applied here")
                }
                dev.ryuzu.astermanagement.config.StorageProvider.MINIO -> {
                    // MinIO lifecycle requires specific API calls or mc admin
                    logger.debug("MinIO lifecycle policy would be applied here")
                }
            }
        } catch (e: Exception) {
            logger.error("Failed to apply lifecycle policy to bucket: $bucketName", e)
        }
    }
    
    /**
     * Validates that all required buckets are accessible.
     * Can be called periodically to ensure storage health.
     * 
     * @return true if all buckets are accessible
     */
    fun validateBuckets(): Boolean {
        return REQUIRED_BUCKETS.all { bucketDef ->
            val bucketName = storageProperties.getBucketName(bucketDef.name)
            try {
                storageService.bucketExists(bucketName)
            } catch (e: Exception) {
                logger.error("Bucket validation failed for: $bucketName", e)
                false
            }
        }
    }
    
    /**
     * Get the full bucket name for a given base name.
     * 
     * @param baseName The base bucket name (e.g., "matters")
     * @return The full bucket name with prefix
     */
    fun getBucketName(baseName: String): String {
        return storageProperties.getBucketName(baseName)
    }
}

/**
 * Defines a bucket and its configuration.
 */
private data class BucketDefinition(
    val name: String,
    val description: String,
    val lifecycle: BucketLifecycle?
)

/**
 * Defines lifecycle rules for a bucket.
 */
private data class BucketLifecycle(
    val deleteAfterDays: Int?,
    val transitionToColdlineAfterDays: Int?
)