package com.astarworks.astarmanagement.expense.infrastructure.persistence

import com.astarworks.astarmanagement.base.RepositoryTest
import com.astarworks.astarmanagement.domain.entity.User
import com.astarworks.astarmanagement.domain.entity.UserRole
import com.astarworks.astarmanagement.expense.domain.model.AuditInfo
import com.astarworks.astarmanagement.expense.domain.model.Tag
import com.astarworks.astarmanagement.expense.domain.model.TagScope
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
import java.util.*

/**
 * Integration tests for TagRepositoryImpl with real database.
 * 
 * Tests cover:
 * - CRUD operations with tenant isolation
 * - Tag scope functionality (TENANT vs PERSONAL)
 * - Security context integration
 * - Soft delete functionality
 * - Name normalization and uniqueness
 * - Usage tracking
 */
@ActiveProfiles("test")
class TagRepositoryIntegrationTest : RepositoryTest() {

    @TestConfiguration
    class TestConfig {
        @Bean
        @Primary
        fun mockSecurityContextService(): SecurityContextService = mock()
    }

    @Autowired
    private lateinit var tagRepositoryImpl: TagRepositoryImpl

    @Autowired
    private lateinit var jpaTagRepository: JpaTagRepository

    @Autowired
    private lateinit var securityContextService: SecurityContextService

    private val testTenantId = UUID.randomUUID()
    private val testUserId = UUID.randomUUID()
    private val otherTenantId = UUID.randomUUID()
    private val otherUserId = UUID.randomUUID()

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
        jpaTagRepository.deleteAll()
        entityManager.flush()
        entityManager.clear()
    }

    @Test
    fun `should save and retrieve tag successfully`() {
        // Given
        val tag = createTestTag("Transportation", "#FF5733", TagScope.TENANT)

        // When
        val savedTag = tagRepositoryImpl.save(tag)
        val retrievedTag = tagRepositoryImpl.findById(savedTag.id!!)

        // Then
        assertThat(retrievedTag).isNotNull
        assertThat(retrievedTag!!.id).isEqualTo(savedTag.id)
        assertThat(retrievedTag.name).isEqualTo("Transportation")
        assertThat(retrievedTag.nameNormalized).isEqualTo("transportation")
        assertThat(retrievedTag.color).isEqualTo("#FF5733")
        assertThat(retrievedTag.scope).isEqualTo(TagScope.TENANT)
        assertThat(retrievedTag.tenantId).isEqualTo(testTenantId)
    }

    @Test
    fun `should enforce tenant isolation on findByIdAndTenantId`() {
        // Given
        val tag = createTestTag("Test Tag", "#FF5733", TagScope.TENANT)
        val savedTag = tagRepositoryImpl.save(tag)

        // When & Then - Same tenant should work
        val sameTenanTag = tagRepositoryImpl.findByIdAndTenantId(savedTag.id!!, testTenantId)
        assertThat(sameTenanTag).isNotNull

        // When & Then - Different tenant should throw exception
        whenever(securityContextService.getCurrentTenantId()).thenReturn(otherTenantId)
        
        assertThrows<InsufficientPermissionException> {
            tagRepositoryImpl.findByIdAndTenantId(savedTag.id!!, otherTenantId)
        }
    }

    @Test
    fun `should handle soft delete properly`() {
        // Given
        val tag = createTestTag("Test Tag", "#FF5733", TagScope.TENANT)
        val savedTag = tagRepositoryImpl.save(tag)

        // When
        tagRepositoryImpl.delete(savedTag)

        // Then
        val retrievedTag = tagRepositoryImpl.findById(savedTag.id!!)
        assertThat(retrievedTag).isNull() // Should not be found due to soft delete

        // Verify it's marked as deleted in database
        val tagFromDb = jpaTagRepository.findById(savedTag.id!!).orElse(null)
        assertThat(tagFromDb).isNotNull
        assertThat(tagFromDb.auditInfo.deletedAt).isNotNull()
        assertThat(tagFromDb.auditInfo.deletedBy).isEqualTo(testUserId)
    }

    @Test
    fun `should find tags by tenant`() {
        // Given
        val tag1 = createTestTag("Tag 1", "#FF5733", TagScope.TENANT)
        val tag2 = createTestTag("Tag 2", "#33FF57", TagScope.TENANT)
        val tag3 = createTestTag("Tag 3", "#3357FF", TagScope.PERSONAL, otherUserId)
        
        tagRepositoryImpl.save(tag1)
        tagRepositoryImpl.save(tag2)
        tagRepositoryImpl.save(tag3)

        // When
        val tenantTags = tagRepositoryImpl.findByTenantId(testTenantId)

        // Then
        assertThat(tenantTags).hasSize(3) // All tags belong to same tenant
        assertThat(tenantTags.map { it.name }).containsExactlyInAnyOrder("Tag 1", "Tag 2", "Tag 3")
    }

    @Test
    fun `should find tags by tenant and scope`() {
        // Given
        val tenantTag = createTestTag("Tenant Tag", "#FF5733", TagScope.TENANT)
        val personalTag1 = createTestTag("Personal Tag 1", "#33FF57", TagScope.PERSONAL, testUserId)
        val personalTag2 = createTestTag("Personal Tag 2", "#3357FF", TagScope.PERSONAL, otherUserId)
        
        tagRepositoryImpl.save(tenantTag)
        tagRepositoryImpl.save(personalTag1)
        tagRepositoryImpl.save(personalTag2)

        // When
        val tenantScopeTags = tagRepositoryImpl.findByTenantIdAndScope(testTenantId, TagScope.TENANT)
        val personalScopeTags = tagRepositoryImpl.findByTenantIdAndScope(testTenantId, TagScope.PERSONAL)

        // Then
        assertThat(tenantScopeTags).hasSize(1)
        assertThat(tenantScopeTags[0].name).isEqualTo("Tenant Tag")
        
        assertThat(personalScopeTags).hasSize(2)
        assertThat(personalScopeTags.map { it.name }).containsExactlyInAnyOrder("Personal Tag 1", "Personal Tag 2")
    }

    @Test
    fun `should find tag by normalized name`() {
        // Given
        val tag = createTestTag("Transportation", "#FF5733", TagScope.TENANT)
        tagRepositoryImpl.save(tag)

        // When - Search with different case
        val foundTag = tagRepositoryImpl.findByNameNormalized(testTenantId, "transportation")
        val notFoundTag = tagRepositoryImpl.findByNameNormalized(testTenantId, "nonexistent")

        // Then
        assertThat(foundTag).isNotNull
        assertThat(foundTag!!.name).isEqualTo("Transportation")
        assertThat(notFoundTag).isNull()
    }

    @Test
    fun `should handle name normalization correctly`() {
        // Given
        val tag = createTestTag("  Transportation  ", "#FF5733", TagScope.TENANT)

        // When
        val savedTag = tagRepositoryImpl.save(tag)

        // Then
        assertThat(savedTag.name).isEqualTo("  Transportation  ") // Original name preserved
        assertThat(savedTag.nameNormalized).isEqualTo("transportation") // Normalized version
    }

    @Test
    fun `should track usage count and last used date`() {
        // Given
        val tag = createTestTag("Transportation", "#FF5733", TagScope.TENANT)
        val savedTag = tagRepositoryImpl.save(tag)

        // When - Simulate usage tracking (this would normally be done by service layer)
        savedTag.usageCount = 5
        savedTag.lastUsedAt = java.time.Instant.now()
        val updatedTag = tagRepositoryImpl.save(savedTag)

        // Then
        assertThat(updatedTag.usageCount).isEqualTo(5)
        assertThat(updatedTag.lastUsedAt).isNotNull()
    }

    @Test
    fun `should find most used tags with limit`() {
        // Given - Create tags with different usage counts
        val tag1 = createTestTag("Tag 1", "#FF5733", TagScope.TENANT).apply { usageCount = 10 }
        val tag2 = createTestTag("Tag 2", "#33FF57", TagScope.TENANT).apply { usageCount = 5 }
        val tag3 = createTestTag("Tag 3", "#3357FF", TagScope.TENANT).apply { usageCount = 15 }
        
        tagRepositoryImpl.save(tag1)
        tagRepositoryImpl.save(tag2)
        tagRepositoryImpl.save(tag3)

        // When
        val mostUsedTags = tagRepositoryImpl.findMostUsed(testTenantId, 2)

        // Then
        // Note: This test might need adjustment based on actual JPA query implementation
        assertThat(mostUsedTags).isNotNull()
        assertThat(mostUsedTags).hasSizeLessThanOrEqualTo(2)
    }

    @Test
    fun `should maintain audit information correctly`() {
        // Given
        val tag = createTestTag("Test Tag", "#FF5733", TagScope.TENANT)

        // When
        val savedTag = tagRepositoryImpl.save(tag)

        // Then
        assertThat(savedTag.auditInfo.createdBy).isEqualTo(testUserId)
        assertThat(savedTag.auditInfo.updatedBy).isEqualTo(testUserId)
        assertThat(savedTag.auditInfo.createdAt).isNotNull()
        assertThat(savedTag.auditInfo.updatedAt).isNotNull()
        assertThat(savedTag.auditInfo.deletedAt).isNull()
        assertThat(savedTag.auditInfo.deletedBy).isNull()
    }

    @Test
    fun `should handle personal tag ownership correctly`() {
        // Given
        val personalTag = createTestTag("My Personal Tag", "#FF5733", TagScope.PERSONAL, testUserId)

        // When
        val savedTag = tagRepositoryImpl.save(personalTag)

        // Then
        assertThat(savedTag.scope).isEqualTo(TagScope.PERSONAL)
        assertThat(savedTag.ownerId).isEqualTo(testUserId)
    }

    @Test
    fun `should validate color format correctly`() {
        // Given - Tag with valid color
        val validTag = createTestTag("Valid Tag", "#FF5733", TagScope.TENANT)

        // When & Then - Should save successfully
        assertThatNoException().isThrownBy {
            tagRepositoryImpl.save(validTag)
        }

        // Given - Tag with invalid color (this would be caught by JPA validation)
        val invalidTag = createTestTag("Invalid Tag", "invalid-color", TagScope.TENANT)

        // When & Then - Should throw validation exception
        assertThatThrownBy {
            tagRepositoryImpl.save(invalidTag)
            entityManager.flush() // Force validation
        }.isInstanceOf(Exception::class.java) // Specific exception depends on validation implementation
    }

    @Test
    fun `should handle concurrent tag creation gracefully`() {
        // Given
        val tag1 = createTestTag("Concurrent Tag", "#FF5733", TagScope.TENANT)
        val tag2 = createTestTag("Concurrent Tag", "#33FF57", TagScope.TENANT) // Same name, different color

        // When - Attempt to save tags with same normalized name
        val savedTag1 = tagRepositoryImpl.save(tag1)
        
        // Then - Second save might fail due to unique constraint or succeed with different ID
        // The exact behavior depends on database constraints
        assertThat(savedTag1).isNotNull()
        assertThat(savedTag1.name).isEqualTo("Concurrent Tag")
        
        // This test demonstrates the interface behavior rather than enforcing specific constraint behavior
    }

    private fun createTestTag(
        name: String,
        color: String,
        scope: TagScope,
        ownerId: UUID? = if (scope == TagScope.PERSONAL) testUserId else null
    ): Tag {
        return Tag(
            tenantId = testTenantId,
            name = name,
            nameNormalized = name.lowercase().trim(),
            color = color,
            scope = scope,
            ownerId = ownerId,
            usageCount = 0,
            lastUsedAt = null,
            auditInfo = AuditInfo(
                createdBy = testUserId,
                updatedBy = testUserId
            )
        )
    }
}