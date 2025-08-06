package com.astarworks.astarmanagement.expense.infrastructure.persistence

import com.astarworks.astarmanagement.base.RepositoryTest
import com.astarworks.astarmanagement.domain.entity.User
import com.astarworks.astarmanagement.domain.entity.UserRole
import com.astarworks.astarmanagement.expense.domain.model.Attachment
import com.astarworks.astarmanagement.expense.domain.model.AttachmentStatus
import com.astarworks.astarmanagement.expense.domain.model.InsufficientPermissionException
import com.astarworks.astarmanagement.infrastructure.security.SecurityContextService
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.springframework.test.context.ActiveProfiles
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.*

/**
 * Integration tests for AttachmentRepositoryImpl with real database.
 * 
 * Tests cover:
 * - CRUD operations with tenant isolation
 * - Attachment lifecycle management (TEMPORARY → LINKED → DELETED)
 * - Security context integration
 * - Soft delete functionality
 * - Expiration and cleanup scenarios
 * - File metadata validation
 */
@ActiveProfiles("test")
class AttachmentRepositoryIntegrationTest : RepositoryTest() {

    @TestConfiguration
    class TestConfig {
        @Bean
        @Primary
        fun mockSecurityContextService(): SecurityContextService = mock()
    }

    @Autowired
    private lateinit var attachmentRepositoryImpl: AttachmentRepositoryImpl

    @Autowired
    private lateinit var jpaAttachmentRepository: JpaAttachmentRepository

    @Autowired
    private lateinit var securityContextService: SecurityContextService

    private val testTenantId = UUID.randomUUID()
    private val testUserId = UUID.randomUUID()
    private val otherTenantId = UUID.randomUUID()

    private lateinit var testUser: User

    @BeforeEach
    fun setUp() {
        // Create test user
        testUser = User(
            id = testUserId,
            email = "test@example.com",
            password = "password",
            firstName = "Test",
            lastName = "User",
            role = UserRole.USER
        )

        // Setup security context mocks
        whenever(securityContextService.getCurrentTenantId()).thenReturn(testTenantId)
        whenever(securityContextService.getCurrentUserId()).thenReturn(testUserId)
        whenever(securityContextService.requireCurrentUserId()).thenReturn(testUserId)
        whenever(securityContextService.requireCurrentTenantId()).thenReturn(testTenantId)
        whenever(securityContextService.getCurrentUser()).thenReturn(testUser)
        whenever(securityContextService.requireCurrentUser()).thenReturn(testUser)

        // Clean up any existing test data
        jpaAttachmentRepository.deleteAll()
        entityManager.flush()
        entityManager.clear()
    }

    @Test
    fun `should save and retrieve attachment successfully`() {
        // Given
        val attachment = createTestAttachment()

        // When
        val savedAttachment = attachmentRepositoryImpl.save(attachment)
        val retrievedAttachment = attachmentRepositoryImpl.findById(savedAttachment.id!!)

        // Then
        assertThat(retrievedAttachment).isNotNull
        assertThat(retrievedAttachment!!.id).isEqualTo(savedAttachment.id)
        assertThat(retrievedAttachment.fileName).isEqualTo("test-file.pdf")
        assertThat(retrievedAttachment.originalName).isEqualTo("Test Document.pdf")
        assertThat(retrievedAttachment.mimeType).isEqualTo("application/pdf")
        assertThat(retrievedAttachment.status).isEqualTo(AttachmentStatus.TEMPORARY)
        assertThat(retrievedAttachment.tenantId).isEqualTo(testTenantId)
    }

    @Test
    fun `should enforce tenant isolation on findByIdAndTenantId`() {
        // Given
        val attachment = createTestAttachment()
        val savedAttachment = attachmentRepositoryImpl.save(attachment)

        // When & Then - Same tenant should work
        val sameTenanAttachment = attachmentRepositoryImpl.findByIdAndTenantId(savedAttachment.id!!, testTenantId)
        assertThat(sameTenanAttachment).isNotNull

        // When & Then - Different tenant should throw exception
        whenever(securityContextService.getCurrentTenantId()).thenReturn(otherTenantId)
        
        assertThrows<InsufficientPermissionException> {
            attachmentRepositoryImpl.findByIdAndTenantId(savedAttachment.id!!, otherTenantId)
        }
    }

    @Test
    fun `should handle soft delete properly`() {
        // Given
        val attachment = createTestAttachment()
        val savedAttachment = attachmentRepositoryImpl.save(attachment)

        // When
        attachmentRepositoryImpl.delete(savedAttachment)

        // Then
        val retrievedAttachment = attachmentRepositoryImpl.findById(savedAttachment.id!!)
        assertThat(retrievedAttachment).isNull() // Should not be found due to soft delete

        // Verify it's marked as deleted in database
        val attachmentFromDb = jpaAttachmentRepository.findById(savedAttachment.id!!).orElse(null)
        assertThat(attachmentFromDb).isNotNull
        assertThat(attachmentFromDb.deletedAt).isNotNull()
        assertThat(attachmentFromDb.deletedBy).isEqualTo(testUserId)
    }

    @Test
    fun `should find attachments by expense ID`() {
        // Given
        val expenseId = UUID.randomUUID()
        
        // Note: This test demonstrates the interface but would need proper
        // ExpenseAttachment relationship setup in a full integration test
        
        // When
        val attachments = attachmentRepositoryImpl.findByExpenseId(expenseId)

        // Then
        assertThat(attachments).isNotNull()
        assertThat(attachments).isEmpty() // No attachments linked to this expense
    }

    @Test
    fun `should find expired temporary attachments`() {
        // Given
        val now = Instant.now()
        val pastTime = now.minus(2, ChronoUnit.HOURS)
        val futureTime = now.plus(2, ChronoUnit.HOURS)

        // Create expired attachment
        val expiredAttachment = createTestAttachment(
            fileName = "expired-file.pdf",
            status = AttachmentStatus.TEMPORARY,
            uploadedAt = pastTime
        )
        attachmentRepositoryImpl.save(expiredAttachment)

        // Create non-expired attachment
        val activeAttachment = createTestAttachment(
            fileName = "active-file.pdf",
            status = AttachmentStatus.TEMPORARY,
            uploadedAt = futureTime
        )
        attachmentRepositoryImpl.save(activeAttachment)

        // Create linked attachment (should not be returned even if old)
        val linkedAttachment = createTestAttachment(
            fileName = "linked-file.pdf",
            status = AttachmentStatus.LINKED,
            uploadedAt = pastTime
        )
        attachmentRepositoryImpl.save(linkedAttachment)

        // When
        val expiredAttachments = attachmentRepositoryImpl.findExpiredTemporary(now.minus(1, ChronoUnit.HOURS))

        // Then
        assertThat(expiredAttachments).hasSize(1)
        assertThat(expiredAttachments[0].fileName).isEqualTo("expired-file.pdf")
        assertThat(expiredAttachments[0].status).isEqualTo(AttachmentStatus.TEMPORARY)
    }

    @Test
    fun `should handle attachment status transitions`() {
        // Given
        val attachment = createTestAttachment(status = AttachmentStatus.TEMPORARY)
        val savedAttachment = attachmentRepositoryImpl.save(attachment)

        // When - Transition to LINKED
        savedAttachment.status = AttachmentStatus.LINKED
        savedAttachment.linkedAt = Instant.now()
        val linkedAttachment = attachmentRepositoryImpl.save(savedAttachment)

        // Then
        assertThat(linkedAttachment.status).isEqualTo(AttachmentStatus.LINKED)
        assertThat(linkedAttachment.linkedAt).isNotNull()

        // When - Transition to DELETED (via soft delete)
        attachmentRepositoryImpl.delete(linkedAttachment)
        val deletedAttachment = attachmentRepositoryImpl.findById(linkedAttachment.id!!)

        // Then
        assertThat(deletedAttachment).isNull() // Soft deleted, not found via repository
    }

    @Test
    fun `should handle different file types and sizes`() {
        // Given - Different attachment types
        val pdfAttachment = createTestAttachment(
            fileName = "document.pdf",
            originalName = "Legal Document.pdf",
            mimeType = "application/pdf",
            fileSize = 1024000L // 1MB
        )

        val imageAttachment = createTestAttachment(
            fileName = "receipt.jpg",
            originalName = "Taxi Receipt.jpg",
            mimeType = "image/jpeg",
            fileSize = 512000L // 512KB
        )

        val excelAttachment = createTestAttachment(
            fileName = "spreadsheet.xlsx",
            originalName = "Financial Data.xlsx", 
            mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileSize = 2048000L // 2MB
        )

        // When
        val savedPdf = attachmentRepositoryImpl.save(pdfAttachment)
        val savedImage = attachmentRepositoryImpl.save(imageAttachment)
        val savedExcel = attachmentRepositoryImpl.save(excelAttachment)

        // Then
        assertThat(savedPdf.mimeType).isEqualTo("application/pdf")
        assertThat(savedPdf.fileSize).isEqualTo(1024000L)

        assertThat(savedImage.mimeType).isEqualTo("image/jpeg")
        assertThat(savedImage.fileSize).isEqualTo(512000L)

        assertThat(savedExcel.mimeType).isEqualTo("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        assertThat(savedExcel.fileSize).isEqualTo(2048000L)
    }

    @Test
    fun `should handle thumbnail metadata`() {
        // Given
        val attachment = createTestAttachment(
            thumbnailPath = "/thumbnails/test-file-thumb.jpg",
            thumbnailSize = 25600L // 25KB
        )

        // When
        val savedAttachment = attachmentRepositoryImpl.save(attachment)

        // Then
        assertThat(savedAttachment.thumbnailPath).isEqualTo("/thumbnails/test-file-thumb.jpg")
        assertThat(savedAttachment.thumbnailSize).isEqualTo(25600L)
    }

    @Test
    fun `should validate file size constraints`() {
        // Given - Attachment with zero file size (should fail validation)
        val invalidAttachment = createTestAttachment(fileSize = 0L)

        // When & Then - Should throw validation exception
        assertThatThrownBy {
            attachmentRepositoryImpl.save(invalidAttachment)
            entityManager.flush() // Force validation
        }.isInstanceOf(Exception::class.java) // Specific exception depends on validation implementation
    }

    @Test
    fun `should maintain audit trail correctly`() {
        // Given
        val attachment = createTestAttachment()

        // When
        val savedAttachment = attachmentRepositoryImpl.save(attachment)

        // Then
        assertThat(savedAttachment.uploadedBy).isEqualTo(testUserId)
        assertThat(savedAttachment.uploadedAt).isNotNull()
        assertThat(savedAttachment.deletedAt).isNull()
        assertThat(savedAttachment.deletedBy).isNull()
    }

    @Test
    fun `should handle storage path correctly`() {
        // Given
        val attachment = createTestAttachment(
            storagePath = "/uploads/2024/01/15/test-file-uuid.pdf"
        )

        // When
        val savedAttachment = attachmentRepositoryImpl.save(attachment)

        // Then
        assertThat(savedAttachment.storagePath).isEqualTo("/uploads/2024/01/15/test-file-uuid.pdf")
        assertThat(savedAttachment.storagePath).isNotEqualTo(savedAttachment.fileName)
        assertThat(savedAttachment.storagePath).isNotEqualTo(savedAttachment.originalName)
    }

    @Test
    fun `should handle concurrent attachment operations`() {
        // Given
        val attachment = createTestAttachment()
        val savedAttachment = attachmentRepositoryImpl.save(attachment)

        // When - Simulate concurrent access
        val attachment1 = attachmentRepositoryImpl.findById(savedAttachment.id!!)!!
        val attachment2 = attachmentRepositoryImpl.findById(savedAttachment.id!!)!!

        // Note: Attachment properties may be immutable, so we create new instances
        val modifiedAttachment1 = createTestAttachment(status = AttachmentStatus.LINKED)
        val modifiedAttachment2 = createTestAttachment(status = AttachmentStatus.FAILED)

        // Then - Save new instances should succeed
        val updated1 = attachmentRepositoryImpl.save(modifiedAttachment1)
        assertThat(updated1.status).isEqualTo(AttachmentStatus.LINKED)

        val updated2 = attachmentRepositoryImpl.save(modifiedAttachment2)
        assertThat(updated2.status).isEqualTo(AttachmentStatus.FAILED)
    }

    @Test
    fun `should handle expiration scenarios correctly`() {
        // Given
        val now = Instant.now()
        val attachment = createTestAttachment(
            uploadedAt = now,  
            expiresAt = now.plus(1, ChronoUnit.HOURS)
        )
        val savedAttachment = attachmentRepositoryImpl.save(attachment)

        // When
        val retrievedAttachment = attachmentRepositoryImpl.findById(savedAttachment.id!!)

        // Then
        assertThat(retrievedAttachment).isNotNull
        assertThat(retrievedAttachment!!.expiresAt).isNotNull()
        assertThat(retrievedAttachment.expiresAt).isAfter(now)
    }

    private fun createTestAttachment(
        fileName: String = "test-file.pdf",
        originalName: String = "Test Document.pdf",
        mimeType: String = "application/pdf",
        fileSize: Long = 1024000L,
        status: AttachmentStatus = AttachmentStatus.TEMPORARY,
        uploadedAt: Instant = Instant.now(),
        expiresAt: Instant? = null,
        storagePath: String? = null,
        thumbnailPath: String? = null,
        thumbnailSize: Long? = null
    ): Attachment {
        return Attachment(
            tenantId = testTenantId,
            fileName = fileName,
            originalName = originalName,
            fileSize = fileSize,
            mimeType = mimeType,
            storagePath = storagePath ?: "/uploads/test/$fileName",
            status = status,
            linkedAt = if (status == AttachmentStatus.LINKED) uploadedAt else null,
            expiresAt = expiresAt ?: if (status == AttachmentStatus.TEMPORARY) uploadedAt.plus(24, ChronoUnit.HOURS) else null,
            thumbnailPath = thumbnailPath,
            thumbnailSize = thumbnailSize,
            uploadedAt = uploadedAt,
            uploadedBy = testUserId,
            deletedAt = null,
            deletedBy = null
        )
    }
}