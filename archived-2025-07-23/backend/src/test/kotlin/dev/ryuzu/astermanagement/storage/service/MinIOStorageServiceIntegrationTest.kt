package dev.ryuzu.astermanagement.storage.service

import dev.ryuzu.astermanagement.config.StorageProperties
import dev.ryuzu.astermanagement.config.StorageProvider
import dev.ryuzu.astermanagement.storage.exception.StorageObjectNotFoundException
import dev.ryuzu.astermanagement.storage.service.impl.MinIOStorageService
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.data.domain.PageRequest
import org.testcontainers.containers.MinIOContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.io.ByteArrayInputStream
import java.time.Duration
import java.util.UUID
import kotlin.random.Random

/**
 * Integration tests for MinIOStorageService using Testcontainers.
 * Tests all storage operations against a real MinIO instance.
 */
@Testcontainers
class MinIOStorageServiceIntegrationTest {
    
    companion object {
        private const val TEST_BUCKET = "test-bucket"
        private const val TEST_CONTENT = "This is test content for storage integration testing"
        
        @Container
        @JvmStatic
        val minioContainer = MinIOContainer("minio/minio:latest")
            .withUserName("testuser")
            .withPassword("testpassword")
    }
    
    private lateinit var storageService: MinIOStorageService
    private lateinit var storageProperties: StorageProperties
    
    @BeforeEach
    fun setUp() {
        storageProperties = StorageProperties(
            provider = StorageProvider.MINIO,
            endpoint = minioContainer.s3URL,
            accessKey = minioContainer.userName,
            secretKey = minioContainer.password,
            region = "us-east-1",
            bucketPrefix = "test",
            connectionTimeout = Duration.ofSeconds(5),
            retryAttempts = 2
        )
        
        storageService = MinIOStorageService(storageProperties)
        
        // Create test bucket
        storageService.createBucketIfNotExists(TEST_BUCKET)
    }
    
    @Test
    fun `should upload and download object successfully`() {
        // Given
        val objectName = "test-object-${UUID.randomUUID()}.txt"
        val inputStream = ByteArrayInputStream(TEST_CONTENT.toByteArray())
        val metadata = mapOf(
            "test-key" to "test-value",
            "upload-test" to "true"
        )
        
        // When - Upload
        val uploadResult = storageService.upload(
            bucketName = TEST_BUCKET,
            objectName = objectName,
            data = inputStream,
            contentType = "text/plain",
            metadata = metadata
        )
        
        // Then - Verify upload
        assertThat(uploadResult).isNotNull
        assertThat(uploadResult.bucketName).isEqualTo(TEST_BUCKET)
        assertThat(uploadResult.objectName).isEqualTo(objectName)
        assertThat(uploadResult.size).isEqualTo(TEST_CONTENT.length.toLong())
        assertThat(uploadResult.contentType).isEqualTo("text/plain")
        
        // When - Download
        val downloadStream = storageService.download(TEST_BUCKET, objectName)
        val downloadedContent = downloadStream.use { it.readBytes().decodeToString() }
        
        // Then - Verify download
        assertThat(downloadedContent).isEqualTo(TEST_CONTENT)
        
        // When - Download with metadata
        val objectWithMetadata = storageService.downloadWithMetadata(TEST_BUCKET, objectName)
        
        // Then - Verify metadata
        assertThat(objectWithMetadata.metadata).containsEntry("test-key", "test-value")
        assertThat(objectWithMetadata.metadata).containsEntry("upload-test", "true")
    }
    
    @Test
    fun `should handle object existence checks correctly`() {
        // Given
        val existingObject = "existing-${UUID.randomUUID()}.txt"
        val nonExistingObject = "non-existing-${UUID.randomUUID()}.txt"
        
        // Upload an object
        storageService.upload(
            bucketName = TEST_BUCKET,
            objectName = existingObject,
            data = ByteArrayInputStream("test".toByteArray())
        )
        
        // When & Then
        assertThat(storageService.exists(TEST_BUCKET, existingObject)).isTrue()
        assertThat(storageService.exists(TEST_BUCKET, nonExistingObject)).isFalse()
    }
    
    @Test
    fun `should delete objects successfully`() {
        // Given
        val objectName = "delete-test-${UUID.randomUUID()}.txt"
        storageService.upload(
            bucketName = TEST_BUCKET,
            objectName = objectName,
            data = ByteArrayInputStream("delete me".toByteArray())
        )
        
        // Verify object exists
        assertThat(storageService.exists(TEST_BUCKET, objectName)).isTrue()
        
        // When
        val deleted = storageService.delete(TEST_BUCKET, objectName)
        
        // Then
        assertThat(deleted).isTrue()
        assertThat(storageService.exists(TEST_BUCKET, objectName)).isFalse()
        
        // Deleting non-existent object should return false
        val deleteNonExistent = storageService.delete(TEST_BUCKET, "non-existent.txt")
        assertThat(deleteNonExistent).isFalse()
    }
    
    @Test
    fun `should list objects with pagination`() {
        // Given - Upload multiple objects
        val prefix = "list-test-${UUID.randomUUID()}/"
        val objectCount = 15
        
        repeat(objectCount) { i ->
            storageService.upload(
                bucketName = TEST_BUCKET,
                objectName = "$prefix/object-$i.txt",
                data = ByteArrayInputStream("content-$i".toByteArray())
            )
        }
        
        // When - List first page
        val firstPage = storageService.list(
            bucketName = TEST_BUCKET,
            prefix = prefix,
            pageable = PageRequest.of(0, 10)
        )
        
        // Then
        assertThat(firstPage.content).hasSize(10)
        assertThat(firstPage.totalElements).isEqualTo(objectCount.toLong())
        assertThat(firstPage.totalPages).isEqualTo(2)
        assertThat(firstPage.hasNext()).isTrue()
        
        // When - List second page
        val secondPage = storageService.list(
            bucketName = TEST_BUCKET,
            prefix = prefix,
            pageable = PageRequest.of(1, 10)
        )
        
        // Then
        assertThat(secondPage.content).hasSize(5)
        assertThat(secondPage.hasNext()).isFalse()
    }
    
    @Test
    fun `should generate presigned URLs`() {
        // Given
        val objectName = "presigned-test-${UUID.randomUUID()}.txt"
        
        // When - Generate upload URL
        val uploadUrl = storageService.generatePresignedUrl(
            bucketName = TEST_BUCKET,
            objectName = objectName,
            expiry = Duration.ofMinutes(5),
            forUpload = true
        )
        
        // Then
        assertThat(uploadUrl).isNotBlank()
        assertThat(uploadUrl).contains(TEST_BUCKET)
        assertThat(uploadUrl).contains(objectName)
        assertThat(uploadUrl).contains("X-Amz-Expires")
        
        // Upload some content first
        storageService.upload(
            bucketName = TEST_BUCKET,
            objectName = objectName,
            data = ByteArrayInputStream("presigned content".toByteArray())
        )
        
        // When - Generate download URL
        val downloadUrl = storageService.generatePresignedUrl(
            bucketName = TEST_BUCKET,
            objectName = objectName,
            expiry = Duration.ofMinutes(5),
            forUpload = false
        )
        
        // Then
        assertThat(downloadUrl).isNotBlank()
        assertThat(downloadUrl).contains(TEST_BUCKET)
        assertThat(downloadUrl).contains(objectName)
    }
    
    @Test
    fun `should copy objects successfully`() {
        // Given
        val sourceObject = "copy-source-${UUID.randomUUID()}.txt"
        val destObject = "copy-dest-${UUID.randomUUID()}.txt"
        val content = "content to be copied"
        val metadata = mapOf("original" to "true")
        
        storageService.upload(
            bucketName = TEST_BUCKET,
            objectName = sourceObject,
            data = ByteArrayInputStream(content.toByteArray()),
            metadata = metadata
        )
        
        // When
        val copiedObject = storageService.copy(
            sourceBucket = TEST_BUCKET,
            sourceObject = sourceObject,
            destinationBucket = TEST_BUCKET,
            destinationObject = destObject,
            preserveMetadata = true
        )
        
        // Then
        assertThat(copiedObject.objectName).isEqualTo(destObject)
        assertThat(storageService.exists(TEST_BUCKET, sourceObject)).isTrue()
        assertThat(storageService.exists(TEST_BUCKET, destObject)).isTrue()
        
        // Verify content
        val copiedContent = storageService.download(TEST_BUCKET, destObject)
            .use { it.readBytes().decodeToString() }
        assertThat(copiedContent).isEqualTo(content)
    }
    
    @Test
    fun `should move objects successfully`() {
        // Given
        val sourceObject = "move-source-${UUID.randomUUID()}.txt"
        val destObject = "move-dest-${UUID.randomUUID()}.txt"
        val content = "content to be moved"
        
        storageService.upload(
            bucketName = TEST_BUCKET,
            objectName = sourceObject,
            data = ByteArrayInputStream(content.toByteArray())
        )
        
        // When
        val movedObject = storageService.move(
            sourceBucket = TEST_BUCKET,
            sourceObject = sourceObject,
            destinationBucket = TEST_BUCKET,
            destinationObject = destObject
        )
        
        // Then
        assertThat(movedObject.objectName).isEqualTo(destObject)
        assertThat(storageService.exists(TEST_BUCKET, sourceObject)).isFalse()
        assertThat(storageService.exists(TEST_BUCKET, destObject)).isTrue()
        
        // Verify content
        val movedContent = storageService.download(TEST_BUCKET, destObject)
            .use { it.readBytes().decodeToString() }
        assertThat(movedContent).isEqualTo(content)
    }
    
    @Test
    fun `should handle large file uploads`() {
        // Given - Create a 10MB file
        val largeObjectName = "large-file-${UUID.randomUUID()}.bin"
        val size = 10 * 1024 * 1024 // 10MB
        val largeContent = ByteArray(size) { Random.nextBytes(1)[0] }
        
        // When
        val uploadResult = storageService.upload(
            bucketName = TEST_BUCKET,
            objectName = largeObjectName,
            data = ByteArrayInputStream(largeContent),
            contentType = "application/octet-stream"
        )
        
        // Then
        assertThat(uploadResult.size).isEqualTo(size.toLong())
        assertThat(storageService.exists(TEST_BUCKET, largeObjectName)).isTrue()
        
        // Verify we can download it
        val downloadedContent = storageService.download(TEST_BUCKET, largeObjectName)
            .use { it.readBytes() }
        assertThat(downloadedContent).isEqualTo(largeContent)
    }
    
    @Test
    fun `should throw exception when downloading non-existent object`() {
        // Given
        val nonExistentObject = "non-existent-${UUID.randomUUID()}.txt"
        
        // When & Then
        assertThrows<StorageObjectNotFoundException> {
            storageService.download(TEST_BUCKET, nonExistentObject)
        }
    }
    
    @Test
    fun `should handle bucket operations`() {
        // Given
        val newBucket = "new-test-bucket-${UUID.randomUUID()}"
        
        // When - Create bucket
        val created = storageService.createBucketIfNotExists(newBucket)
        
        // Then
        assertThat(created).isTrue()
        assertThat(storageService.bucketExists(newBucket)).isTrue()
        
        // When - Try to create again
        val createdAgain = storageService.createBucketIfNotExists(newBucket)
        
        // Then
        assertThat(createdAgain).isFalse() // Already exists
    }
    
    @Test
    fun `should update object metadata`() {
        // Given
        val objectName = "metadata-test-${UUID.randomUUID()}.txt"
        storageService.upload(
            bucketName = TEST_BUCKET,
            objectName = objectName,
            data = ByteArrayInputStream("metadata test".toByteArray()),
            metadata = mapOf("initial" to "value")
        )
        
        // When
        val updatedMetadata = storageService.updateMetadata(
            bucketName = TEST_BUCKET,
            objectName = objectName,
            metadata = mapOf("updated" to "new-value"),
            merge = true
        )
        
        // Then
        assertThat(updatedMetadata.customMetadata).containsEntry("updated", "new-value")
        
        // Verify the metadata persisted
        val retrieved = storageService.getMetadata(TEST_BUCKET, objectName)
        assertThat(retrieved.customMetadata).containsEntry("updated", "new-value")
    }
    
    @Test
    fun `should handle connection test`() {
        // When
        val connected = storageService.testConnection()
        
        // Then
        assertThat(connected).isTrue()
    }
    
    @Test
    fun `should get storage info`() {
        // When
        val info = storageService.getStorageInfo()
        
        // Then
        assertThat(info).containsKey("provider")
        assertThat(info).containsKey("endpoint")
        assertThat(info).containsKey("connected")
        assertThat(info["provider"]).isEqualTo("MINIO")
        assertThat(info["connected"]).isEqualTo(true)
    }
}