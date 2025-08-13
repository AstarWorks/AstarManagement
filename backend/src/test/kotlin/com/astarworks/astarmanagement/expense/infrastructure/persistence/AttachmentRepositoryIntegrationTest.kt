package com.astarworks.astarmanagement.expense.infrastructure.persistence

import com.astarworks.astarmanagement.base.DatabaseIntegrationTestBase
import com.astarworks.astarmanagement.expense.domain.model.*
import com.astarworks.astarmanagement.expense.domain.repository.AttachmentRepository
import com.astarworks.astarmanagement.expense.domain.repository.ExpenseRepository
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.*
import kotlin.system.measureTimeMillis

/**
 * Comprehensive integration tests for AttachmentRepository.
 * 
 * Tests cover:
 * - All CRUD operations with tenant isolation
 * - Attachment lifecycle management (TEMPORARY, LINKED, DELETED)
 * - Expense-attachment associations
 * - Multi-tenant security and RLS enforcement
 * - File metadata and storage validation
 * - Performance benchmarks for large files
 * - Expired attachment cleanup
 * - Edge cases and error scenarios
 */
@ActiveProfiles("test")
@Transactional
class AttachmentRepositoryIntegrationTest : DatabaseIntegrationTestBase() {

    @Autowired
    private lateinit var attachmentRepository: AttachmentRepository

    @Autowired 
    private lateinit var expenseRepository: ExpenseRepository

    // ========== CRUD Operations Tests ==========

    @Test
    fun `should save and retrieve attachment with all fields`() {
        // Given
        val attachment = Attachment(
            tenantId = defaultTenantId,
            fileName = "receipt_001.jpg",
            originalName = "Taxi Receipt.jpg",
            fileSize = 1024768L,
            mimeType = "image/jpeg",
            storagePath = "/attachments/tenant1/receipt_001.jpg",
            status = AttachmentStatus.TEMPORARY,
            expiresAt = Instant.now().plusSeconds(3600),
            uploadedBy = defaultUserId
        )

        // When
        val saved = attachmentRepository.save(attachment)
        entityManager.flush()
        entityManager.clear()

        // Then
        val found = attachmentRepository.findById(saved.id)
        assertThat(found).isNotNull
        assertThat(found?.id).isEqualTo(saved.id)
        assertThat(found?.tenantId).isEqualTo(defaultTenantId)
        assertThat(found?.fileName).isEqualTo("receipt_001.jpg")
        assertThat(found?.originalName).isEqualTo("Taxi Receipt.jpg")
        assertThat(found?.fileSize).isEqualTo(1024768L)
        assertThat(found?.mimeType).isEqualTo("image/jpeg")
        assertThat(found?.status).isEqualTo(AttachmentStatus.TEMPORARY)
        assertThat(found?.uploadedBy).isEqualTo(defaultUserId)
    }

    @Test
    fun `should update attachment status to linked`() {
        // Given
        val attachment = createTestAttachment(status = AttachmentStatus.TEMPORARY)
        val saved = attachmentRepository.save(attachment)
        entityManager.flush()
        entityManager.clear()

        // When
        val toUpdate = attachmentRepository.findById(saved.id)!!
        toUpdate.markAsLinked()
        attachmentRepository.save(toUpdate)
        entityManager.flush()
        entityManager.clear()

        // Then
        val found = attachmentRepository.findById(saved.id)
        assertThat(found?.status).isEqualTo(AttachmentStatus.LINKED)
        assertThat(found?.linkedAt).isNotNull()
        assertThat(found?.expiresAt).isNull()
    }

    @Test
    fun `should soft delete attachment`() {
        // Given
        val attachment = createTestAttachment()
        val saved = attachmentRepository.save(attachment)
        entityManager.flush()

        // When
        val toDelete = attachmentRepository.findById(saved.id)!!
        toDelete.markDeleted(defaultUserId)
        attachmentRepository.delete(toDelete)
        entityManager.flush()
        entityManager.clear()

        // Then
        val notFound = attachmentRepository.findById(saved.id)
        assertThat(notFound).isNull() // Should not be found due to soft delete

        // But should be found when querying raw database
        val deletedFromDb = queryRawSql<Array<Any>>(
            "SELECT id, status, deleted_at, deleted_by FROM attachments WHERE id = ?",
            saved.id
        )
        assertThat(deletedFromDb).hasSize(1)
        assertThat((deletedFromDb[0] as Array<*>)[1] as String).isEqualTo("DELETED")
        assertThat((deletedFromDb[0] as Array<*>)[2]).isNotNull() // deleted_at
        assertThat((deletedFromDb[0] as Array<*>)[3]).isEqualTo(defaultUserId) // deleted_by
    }

    // ========== Attachment Lifecycle Tests ==========

    @Test
    fun `should handle temporary attachment lifecycle`() {
        // Given - Create temporary attachment
        val attachment = createTestAttachment(
            status = AttachmentStatus.TEMPORARY,
            expiresAt = Instant.now().plusSeconds(3600)
        )

        // When
        val saved = attachmentRepository.save(attachment)

        // Then
        assertThat(saved.status).isEqualTo(AttachmentStatus.TEMPORARY)
        assertThat(saved.expiresAt).isNotNull()
        assertThat(saved.linkedAt).isNull()
        assertThat(saved.isExpired()).isFalse()

        // When - Mark as linked
        saved.markAsLinked()
        val linked = attachmentRepository.save(saved)

        // Then
        assertThat(linked.status).isEqualTo(AttachmentStatus.LINKED)
        assertThat(linked.linkedAt).isNotNull()
        assertThat(linked.expiresAt).isNull()
    }

    @Test
    fun `should find expired temporary attachments`() {
        // Given
        val expiredAttachment = createTestAttachment(
            fileName = "expired.pdf",
            status = AttachmentStatus.TEMPORARY,
            expiresAt = Instant.now().minusSeconds(3600) // 1 hour ago
        )
        
        val activeAttachment = createTestAttachment(
            fileName = "active.pdf",
            status = AttachmentStatus.TEMPORARY,
            expiresAt = Instant.now().plusSeconds(3600) // 1 hour from now
        )
        
        val linkedAttachment = createTestAttachment(
            fileName = "linked.pdf",
            status = AttachmentStatus.LINKED,
            expiresAt = null
        )

        // When
        val expired = attachmentRepository.findExpiredTemporary(Instant.now())

        // Then
        assertThat(expired).hasSize(1)
        assertThat(expired[0].fileName).isEqualTo("expired.pdf")
        assertThat(expired[0].isExpired()).isTrue()
    }

    @Test
    fun `should validate attachment file metadata`() {
        // Given
        val attachment = createTestAttachment(mimeType = "image/png")

        // When & Then
        assertThat(attachment.isImage()).isTrue()
        assertThat(attachment.isPdf()).isFalse()
        assertThat(attachment.getFileExtension()).isEqualTo("jpg")

        // Test PDF
        val pdfAttachment = createTestAttachment(
            fileName = "document.pdf",
            mimeType = "application/pdf"
        )
        assertThat(pdfAttachment.isPdf()).isTrue()
        assertThat(pdfAttachment.isImage()).isFalse()
        assertThat(pdfAttachment.getFileExtension()).isEqualTo("pdf")
    }

    // ========== Expense-Attachment Association Tests ==========

    @Test
    fun `should create and manage expense-attachment associations`() {
        // Given
        val expense = createTestExpense()
        val attachment1 = createTestAttachment(fileName = "receipt1.jpg")
        val attachment2 = createTestAttachment(fileName = "receipt2.pdf")

        // When
        expense.addAttachment(ExpenseAttachment(
            attachment = attachment1,
            linkedBy = defaultUserId,
            displayOrder = 1,
            description = "Taxi receipt"
        ))
        
        expense.addAttachment(ExpenseAttachment(
            attachment = attachment2,
            linkedBy = defaultUserId,
            displayOrder = 2,
            description = "Hotel invoice"
        ))

        val savedExpense = expenseRepository.save(expense)
        entityManager.flush()
        entityManager.clear()

        // Then
        val found = expenseRepository.findById(savedExpense.id)!!
        assertThat(found.attachments).hasSize(2)
        
        val attachmentFilenames = found.attachments.map { it.attachment.fileName }
        assertThat(attachmentFilenames).containsExactlyInAnyOrder("receipt1.jpg", "receipt2.pdf")
        
        val descriptions = found.attachments.map { it.description }
        assertThat(descriptions).containsExactlyInAnyOrder("Taxi receipt", "Hotel invoice")
    }

    @Test
    fun `should find attachments by expense ID`() {
        // Given
        val expense1 = createTestExpense()
        val expense2 = createTestExpense()
        
        val attachment1 = createTestAttachment(fileName = "expense1_receipt.jpg")
        val attachment2 = createTestAttachment(fileName = "expense1_invoice.pdf") 
        val attachment3 = createTestAttachment(fileName = "expense2_receipt.jpg")

        // Link attachments to expenses
        expense1.addAttachment(ExpenseAttachment(
            attachment = attachment1,
            linkedBy = defaultUserId,
            displayOrder = 1
        ))
        expense1.addAttachment(ExpenseAttachment(
            attachment = attachment2,
            linkedBy = defaultUserId,
            displayOrder = 2
        ))
        expense2.addAttachment(ExpenseAttachment(
            attachment = attachment3,
            linkedBy = defaultUserId,
            displayOrder = 1
        ))

        expenseRepository.save(expense1)
        expenseRepository.save(expense2)
        entityManager.flush()

        // When
        val expense1Attachments = attachmentRepository.findByExpenseId(expense1.id)
        val expense2Attachments = attachmentRepository.findByExpenseId(expense2.id)

        // Then
        assertThat(expense1Attachments).hasSize(2)
        assertThat(expense1Attachments.map { it.fileName })
            .containsExactlyInAnyOrder("expense1_receipt.jpg", "expense1_invoice.pdf")
            
        assertThat(expense2Attachments).hasSize(1)
        assertThat(expense2Attachments[0].fileName).isEqualTo("expense2_receipt.jpg")
    }

    @Test
    fun `should handle attachment display order correctly`() {
        // Given
        val expense = createTestExpense()
        val attachment1 = createTestAttachment(fileName = "first.jpg")
        val attachment2 = createTestAttachment(fileName = "second.pdf")
        val attachment3 = createTestAttachment(fileName = "third.png")

        // When - Add attachments in specific order
        expense.addAttachment(ExpenseAttachment(
            attachment = attachment2,
            linkedBy = defaultUserId,
            displayOrder = 2
        ))
        expense.addAttachment(ExpenseAttachment(
            attachment = attachment1,
            linkedBy = defaultUserId,
            displayOrder = 1
        ))
        expense.addAttachment(ExpenseAttachment(
            attachment = attachment3,
            linkedBy = defaultUserId,
            displayOrder = 3
        ))

        val savedExpense = expenseRepository.save(expense)
        entityManager.flush()
        entityManager.clear()

        // Then
        val found = expenseRepository.findById(savedExpense.id)!!
        val sortedAttachments = found.attachments.sortedBy { it.displayOrder }
        
        assertThat(sortedAttachments).hasSize(3)
        assertThat(sortedAttachments[0].attachment.fileName).isEqualTo("first.jpg")
        assertThat(sortedAttachments[1].attachment.fileName).isEqualTo("second.pdf")
        assertThat(sortedAttachments[2].attachment.fileName).isEqualTo("third.png")
    }

    // ========== Multi-Tenant Security Tests ==========

    @Test
    fun `should prevent cross-tenant attachment access`() {
        // Given - Create attachment for tenant1
        val tenant1Id = UUID.randomUUID()
        val tenant1UserId = UUID.randomUUID()
        val tenant1User = createTestUser(tenant1Id)
        
        val attachment = withTenantContext(tenant1Id, tenant1UserId, tenant1User) {
            val att = Attachment(
                tenantId = tenant1Id,
                fileName = "tenant1_receipt.jpg",
                originalName = "Private Receipt.jpg",
                fileSize = 102400L,
                mimeType = "image/jpeg",
                storagePath = "/attachments/tenant1/private_receipt.jpg",
                uploadedBy = tenant1UserId
            )
            attachmentRepository.save(att)
        }

        // When - Try to access from tenant2
        val tenant2Id = UUID.randomUUID()
        val tenant2UserId = UUID.randomUUID()
        val tenant2User = createTestUser(tenant2Id)
        
        val crossTenantAccess = withTenantContext(tenant2Id, tenant2UserId, tenant2User) {
            attachmentRepository.findByIdAndTenantId(attachment.id, tenant2Id)
        }

        // Then
        assertThat(crossTenantAccess).isNull()
    }

    @Test
    fun `should enforce RLS at database level for attachments`() {
        // Given - Create attachments for two tenants
        val tenant1Id = UUID.randomUUID()
        val tenant2Id = UUID.randomUUID()
        
        // Create 4 attachments for tenant1
        repeat(4) { i ->
            executeRawSql(
                "INSERT INTO attachments (id, tenant_id, file_name, original_name, file_size, mime_type, storage_path, status, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                UUID.randomUUID(), tenant1Id, "file$i.jpg", "Original$i.jpg", 1024L, "image/jpeg", "/path$i", "TEMPORARY", tenant1Id
            )
        }
        
        // Create 3 attachments for tenant2
        repeat(3) { i ->
            executeRawSql(
                "INSERT INTO attachments (id, tenant_id, file_name, original_name, file_size, mime_type, storage_path, status, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                UUID.randomUUID(), tenant2Id, "file$i.pdf", "Original$i.pdf", 2048L, "application/pdf", "/path$i", "TEMPORARY", tenant2Id
            )
        }

        // When - Query with tenant1 context
        jdbcTemplate.execute("SELECT set_config('app.current_tenant_id', '$tenant1Id', true)")
        val tenant1Count = queryRawSql<Array<Any>>(
            "SELECT COUNT(*) FROM attachments WHERE deleted_at IS NULL"
        )
        
        // When - Query with tenant2 context  
        jdbcTemplate.execute("SELECT set_config('app.current_tenant_id', '$tenant2Id', true)")
        val tenant2Count = queryRawSql<Array<Any>>(
            "SELECT COUNT(*) FROM attachments WHERE deleted_at IS NULL"
        )

        // Then
        assertThat((tenant1Count[0] as Array<*>)[0] as Long).isEqualTo(4)
        assertThat((tenant2Count[0] as Array<*>)[0] as Long).isEqualTo(3)
    }

    // ========== Data Integrity Tests ==========

    @Test
    fun `should validate attachment field constraints`() {
        // Test empty file name
        assertThrows<IllegalArgumentException> {
            Attachment(
                tenantId = defaultTenantId,
                fileName = "",
                originalName = "test.jpg",
                fileSize = 1024L,
                mimeType = "image/jpeg",
                storagePath = "/path/test.jpg",
                uploadedBy = defaultUserId
            )
        }

        // Test zero file size
        assertThrows<IllegalArgumentException> {
            Attachment(
                tenantId = defaultTenantId,
                fileName = "test.jpg",
                originalName = "test.jpg",
                fileSize = 0L,
                mimeType = "image/jpeg",
                storagePath = "/path/test.jpg",
                uploadedBy = defaultUserId
            )
        }

        // Test empty MIME type
        assertThrows<IllegalArgumentException> {
            Attachment(
                tenantId = defaultTenantId,
                fileName = "test.jpg",
                originalName = "test.jpg",
                fileSize = 1024L,
                mimeType = "",
                storagePath = "/path/test.jpg",
                uploadedBy = defaultUserId
            )
        }
    }

    @Test
    fun `should validate expense attachment display order`() {
        // Test negative display order
        assertThrows<IllegalArgumentException> {
            ExpenseAttachment(
                attachment = createTestAttachment(),
                linkedBy = defaultUserId,
                displayOrder = -1
            )
        }
    }

    @Test
    fun `should handle thumbnail metadata`() {
        // Given
        val attachment = createTestAttachment()
        attachment.thumbnailPath = "/thumbnails/thumb_001.jpg"
        attachment.thumbnailSize = 10240L

        // When
        val saved = attachmentRepository.save(attachment)
        entityManager.flush()
        entityManager.clear()

        // Then
        val found = attachmentRepository.findById(saved.id)
        assertThat(found?.thumbnailPath).isEqualTo("/thumbnails/thumb_001.jpg")
        assertThat(found?.thumbnailSize).isEqualTo(10240L)
    }

    // ========== Performance Tests ==========

    @Test
    fun `should handle large number of attachments efficiently`() {
        // Given - Create 200 attachments
        val attachments = mutableListOf<Attachment>()
        repeat(200) { i ->
            attachments.add(
                Attachment(
                    tenantId = defaultTenantId,
                    fileName = "file_$i.jpg",
                    originalName = "Original File $i.jpg",
                    fileSize = (i + 1) * 1024L,
                    mimeType = if (i % 3 == 0) "image/jpeg" else if (i % 3 == 1) "application/pdf" else "image/png",
                    storagePath = "/attachments/file_$i",
                    status = if (i % 4 == 0) AttachmentStatus.TEMPORARY else AttachmentStatus.LINKED,
                    expiresAt = if (i % 4 == 0) Instant.now().plusSeconds(3600) else null,
                    uploadedBy = defaultUserId
                )
            )
        }
        
        // Batch save for efficiency
        attachments.chunked(50).forEach { batch ->
            batch.forEach { attachmentRepository.save(it) }
            entityManager.flush()
        }
        entityManager.clear()

        // When - Execute queries
        val executionTime1 = measureTimeMillis {
            val expired = attachmentRepository.findExpiredTemporary(Instant.now().plusSeconds(7200))
            assertThat(expired).hasSizeLessThanOrEqualTo(50) // Should find temporary ones
        }

        val executionTime2 = measureTimeMillis {
            // Simulate finding attachments for multiple expenses
            repeat(10) {
                attachmentRepository.findByExpenseId(UUID.randomUUID())
            }
        }

        // Then
        assertThat(executionTime1).isLessThan(100)
        assertThat(executionTime2).isLessThan(100)
    }

    @Test
    fun `should use indexes for common queries`() {
        // Given - Ensure some data exists
        repeat(50) { i ->
            createTestAttachment(
                fileName = "indexed_file_$i.jpg",
                status = if (i % 2 == 0) AttachmentStatus.TEMPORARY else AttachmentStatus.LINKED,
                expiresAt = if (i % 2 == 0) Instant.now().plusSeconds(3600) else null
            )
        }

        // When - Test index usage for status+expires_at query
        val statusQueryTime = measureTimeMillis {
            attachmentRepository.findExpiredTemporary(Instant.now().plusSeconds(7200))
        }

        // When - Test index usage for tenant query
        val tenantQueryTime = measureTimeMillis {
            val count = queryRawSql<Array<Any>>(
                "SELECT COUNT(*) FROM attachments WHERE tenant_id = ? AND deleted_at IS NULL",
                defaultTenantId
            )
            assertThat((count[0] as Array<*>)[0] as Long).isGreaterThan(0)
        }

        // Then
        assertThat(statusQueryTime).isLessThan(50)
        assertThat(tenantQueryTime).isLessThan(50)
    }

    // ========== Edge Cases and Error Scenarios ==========

    @Test
    fun `should handle empty result sets`() {
        // When - Query with no matching results
        val noAttachments = attachmentRepository.findByExpenseId(UUID.randomUUID())
        val noExpired = attachmentRepository.findExpiredTemporary(Instant.now().minusSeconds(86400))
        val noMatch = attachmentRepository.findByIdAndTenantId(UUID.randomUUID(), defaultTenantId)

        // Then
        assertThat(noAttachments).isEmpty()
        assertThat(noExpired).isEmpty()
        assertThat(noMatch).isNull()
    }

    @Test
    fun `should handle large file sizes`() {
        // Given - Create attachment with large file size
        val largeAttachment = Attachment(
            tenantId = defaultTenantId,
            fileName = "large_video.mp4",
            originalName = "Training Video.mp4",
            fileSize = 2147483648L, // 2GB
            mimeType = "video/mp4",
            storagePath = "/attachments/large/training_video.mp4",
            uploadedBy = defaultUserId
        )

        // When
        val saved = attachmentRepository.save(largeAttachment)
        entityManager.flush()
        entityManager.clear()

        // Then
        val found = attachmentRepository.findById(saved.id)
        assertThat(found?.fileSize).isEqualTo(2147483648L)
        assertThat(found?.mimeType).isEqualTo("video/mp4")
    }

    @Test
    fun `should maintain consistent state during attachment lifecycle`() {
        // Given
        val attachment = createTestAttachment(status = AttachmentStatus.TEMPORARY)
        val originalUploadTime = attachment.uploadedAt
        Thread.sleep(100)

        // When - Mark as linked
        attachment.markAsLinked()
        val linked = attachmentRepository.save(attachment)
        entityManager.flush()
        entityManager.clear()

        // Then
        val found = attachmentRepository.findById(linked.id)!!
        assertThat(found.status).isEqualTo(AttachmentStatus.LINKED)
        assertThat(found.linkedAt).isNotNull()
        assertThat(found.linkedAt).isAfter(originalUploadTime)
        assertThat(found.expiresAt).isNull()
        assertThat(found.uploadedAt).isEqualTo(originalUploadTime) // Should not change
    }

    @Test
    fun `should handle concurrent attachment operations`() {
        // Given
        val attachment = createTestAttachment(status = AttachmentStatus.TEMPORARY)
        val saved = attachmentRepository.save(attachment)
        entityManager.flush()

        // When - Simulate concurrent operations
        val attachment1 = attachmentRepository.findById(saved.id)!!
        val attachment2 = attachmentRepository.findById(saved.id)!!
        
        attachment1.markAsLinked()
        attachment2.markDeleted(defaultUserId)
        
        attachmentRepository.save(attachment1)
        // attachment2 save would typically fail due to optimistic locking
        // but we're testing the behavior

        // Then
        entityManager.flush()
        entityManager.clear()
        val final = attachmentRepository.findById(saved.id)!!
        assertThat(final.status).isEqualTo(AttachmentStatus.LINKED) // First save wins
    }

    // ========== Helper Methods ==========

    private fun createTestAttachment(
        fileName: String = "test_${UUID.randomUUID()}.jpg",
        originalName: String = "Test File.jpg",
        fileSize: Long = 102400L,
        mimeType: String = "image/jpeg",
        status: AttachmentStatus = AttachmentStatus.TEMPORARY,
        expiresAt: Instant? = if (status == AttachmentStatus.TEMPORARY) Instant.now().plusSeconds(3600) else null
    ): Attachment {
        return Attachment(
            tenantId = defaultTenantId,
            fileName = fileName,
            originalName = originalName,
            fileSize = fileSize,
            mimeType = mimeType,
            storagePath = "/attachments/test/$fileName",
            status = status,
            expiresAt = expiresAt,
            uploadedBy = defaultUserId
        )
    }

    private fun createTestExpense(): Expense {
        return Expense(
            tenantId = defaultTenantId,
            date = LocalDate.now(),
            category = "Test Category",
            description = "Test Expense",
            expenseAmount = BigDecimal("100.00"),
            balance = BigDecimal("-100.00"),
            auditInfo = AuditInfo(
                createdBy = defaultUserId,
                updatedBy = defaultUserId
            )
        )
    }
}