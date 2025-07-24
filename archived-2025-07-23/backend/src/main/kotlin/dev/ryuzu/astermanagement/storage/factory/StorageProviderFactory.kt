package dev.ryuzu.astermanagement.storage.factory

import dev.ryuzu.astermanagement.config.StorageProperties
import dev.ryuzu.astermanagement.config.StorageProvider
import dev.ryuzu.astermanagement.storage.service.StorageService
import dev.ryuzu.astermanagement.storage.service.impl.MinIOStorageService
import dev.ryuzu.astermanagement.storage.service.impl.GCSStorageService
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary

/**
 * Factory configuration for creating storage service instances based on configuration.
 * This factory determines which storage provider to use based on the application properties
 * and instantiates the appropriate implementation.
 * 
 * The factory supports:
 * - MinIO for on-premise and development environments
 * - Google Cloud Storage for cloud deployments
 * - Easy extension for additional providers
 * 
 * The factory validates configuration on startup and provides clear error messages
 * if misconfigured.
 */
@Configuration
class StorageProviderFactory(
    private val storageProperties: StorageProperties
) {
    
    private val logger = LoggerFactory.getLogger(StorageProviderFactory::class.java)
    
    /**
     * Create the primary StorageService bean based on configuration.
     * The @Primary annotation ensures this is the default when multiple implementations exist.
     * 
     * @return Configured StorageService implementation
     * @throws IllegalStateException if provider configuration is invalid
     */
    @Bean
    @Primary
    fun storageService(): StorageService {
        logger.info("Initializing storage service with provider: ${storageProperties.provider}")
        
        // Validate configuration before creating service
        storageProperties.validate()
        
        return when (storageProperties.provider) {
            StorageProvider.MINIO -> {
                logger.info("Creating MinIO storage service with endpoint: ${storageProperties.endpoint}")
                MinIOStorageService(storageProperties)
            }
            
            StorageProvider.GCS -> {
                logger.info("Creating Google Cloud Storage service for project: ${storageProperties.gcs.projectId}")
                GCSStorageService(storageProperties)
            }
        }.also { service ->
            // Test connection on startup
            try {
                if (service.testConnection()) {
                    logger.info("Successfully connected to ${storageProperties.provider} storage service")
                } else {
                    logger.warn("Storage service connection test failed - service may not be fully operational")
                }
            } catch (e: Exception) {
                logger.error("Failed to connect to storage service during startup", e)
                // Don't fail startup, but log the error prominently
            }
        }
    }
}