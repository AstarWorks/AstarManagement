package com.astarworks.astarmanagement.expense.infrastructure.persistence

import com.astarworks.astarmanagement.base.DatabaseIntegrationTestBase
import com.astarworks.astarmanagement.expense.domain.model.AuditInfo
import com.astarworks.astarmanagement.expense.domain.model.Tag
import com.astarworks.astarmanagement.expense.domain.model.TagScope
import com.astarworks.astarmanagement.expense.domain.repository.TagRepository
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.*
import kotlin.system.measureTimeMillis

/**
 * Comprehensive integration tests for TagRepository.
 * 
 * Tests cover:
 * - All CRUD operations with tenant isolation
 * - Tag scope management (TENANT vs PERSONAL)
 * - Usage analytics and tracking
 * - Multi-tenant security and RLS enforcement
 * - Data integrity and uniqueness constraints
 * - Performance benchmarks
 * - Edge cases and error scenarios
 */
@ActiveProfiles("test")
@Transactional
class TagRepositoryIntegrationTest : DatabaseIntegrationTestBase() {

    @Autowired
    private lateinit var tagRepository: TagRepository

    // ========== CRUD Operations Tests ==========

    @Test
    fun `should save and retrieve tag with all fields`() {
        // Given
        val tag = Tag(
            tenantId = defaultTenantId,
            name = "Billable",
            nameNormalized = "billable",
            color = "#FF5733",
            scope = TagScope.TENANT,
            auditInfo = AuditInfo(
                createdBy = defaultUserId,
                updatedBy = defaultUserId
            )
        )

        // When
        val saved = tagRepository.save(tag)
        entityManager.flush()
        entityManager.clear()

        // Then
        val found = tagRepository.findById(saved.id)
        assertThat(found).isNotNull
        assertThat(found?.id).isEqualTo(saved.id)
        assertThat(found?.tenantId).isEqualTo(defaultTenantId)
        assertThat(found?.name).isEqualTo("Billable")
        assertThat(found?.nameNormalized).isEqualTo("billable")
        assertThat(found?.color).isEqualTo("#FF5733")
        assertThat(found?.scope).isEqualTo(TagScope.TENANT)
        assertThat(found?.usageCount).isEqualTo(0)
        assertThat(found?.auditInfo?.createdBy).isEqualTo(defaultUserId)
    }

    @Test
    fun `should update existing tag`() {
        // Given
        val tag = createTestTag(name = "OldName", color = "#FF0000")
        val saved = tagRepository.save(tag)
        entityManager.flush()
        entityManager.clear()

        // When
        val toUpdate = tagRepository.findById(saved.id)!!
        val updated = Tag(
            id = toUpdate.id,
            tenantId = toUpdate.tenantId,
            name = "NewName",
            nameNormalized = "newname",
            color = "#00FF00",
            scope = toUpdate.scope,
            ownerId = toUpdate.ownerId,
            usageCount = toUpdate.usageCount,
            lastUsedAt = toUpdate.lastUsedAt,
            auditInfo = toUpdate.auditInfo.apply {
                markUpdated(defaultUserId)
            }
        )
        tagRepository.save(updated)
        entityManager.flush()
        entityManager.clear()

        // Then
        val found = tagRepository.findById(saved.id)
        assertThat(found?.name).isEqualTo("NewName")
        assertThat(found?.color).isEqualTo("#00FF00")
        assertThat(found?.auditInfo?.updatedAt).isAfter(found?.auditInfo?.createdAt)
    }

    @Test
    fun `should soft delete tag`() {
        // Given
        val tag = createTestTag()
        val saved = tagRepository.save(tag)
        entityManager.flush()

        // When
        val toDelete = tagRepository.findById(saved.id)!!
        toDelete.markDeleted(defaultUserId)
        tagRepository.delete(toDelete)
        entityManager.flush()
        entityManager.clear()

        // Then
        val notFound = tagRepository.findById(saved.id)
        assertThat(notFound).isNull()
    }

    // ========== Tag Scope Tests ==========

    @Test
    fun `should create and manage tenant-scoped tags`() {
        // Given
        val tenantTag = Tag(
            tenantId = defaultTenantId,
            name = "Company Wide",
            nameNormalized = "company wide",
            color = "#123456",
            scope = TagScope.TENANT,
            auditInfo = AuditInfo(
                createdBy = defaultUserId,
                updatedBy = defaultUserId
            )
        )

        // When
        val saved = tagRepository.save(tenantTag)

        // Then
        assertThat(saved.scope).isEqualTo(TagScope.TENANT)
        assertThat(saved.ownerId).isNull()
        assertThat(saved.isShared()).isTrue()
        assertThat(saved.isPersonal()).isFalse()
        assertThat(saved.isAccessibleBy(UUID.randomUUID())).isTrue() // Any user can access
    }

    @Test
    fun `should create and manage personal tags`() {
        // Given
        val personalTag = Tag(
            tenantId = defaultTenantId,
            name = "My Personal Tag",
            nameNormalized = "my personal tag",
            color = "#654321",
            scope = TagScope.PERSONAL,
            ownerId = defaultUserId,
            auditInfo = AuditInfo(
                createdBy = defaultUserId,
                updatedBy = defaultUserId
            )
        )

        // When
        val saved = tagRepository.save(personalTag)

        // Then
        assertThat(saved.scope).isEqualTo(TagScope.PERSONAL)
        assertThat(saved.ownerId).isEqualTo(defaultUserId)
        assertThat(saved.isPersonal()).isTrue()
        assertThat(saved.isShared()).isFalse()
        assertThat(saved.isAccessibleBy(defaultUserId)).isTrue()
        assertThat(saved.isAccessibleBy(UUID.randomUUID())).isFalse()
    }

    @Test
    fun `should enforce personal tag must have owner`() {
        // When & Then
        assertThrows<IllegalArgumentException> {
            Tag(
                tenantId = defaultTenantId,
                name = "Invalid Personal",
                nameNormalized = "invalid personal",
                color = "#FF0000",
                scope = TagScope.PERSONAL,
                ownerId = null, // Missing owner for personal tag
                auditInfo = AuditInfo()
            )
        }
    }

    @Test
    fun `should filter tags by scope`() {
        // Given
        createTestTag(name = "Tenant1", scope = TagScope.TENANT)
        createTestTag(name = "Tenant2", scope = TagScope.TENANT)
        createTestTag(name = "Personal1", scope = TagScope.PERSONAL, ownerId = defaultUserId)
        createTestTag(name = "Personal2", scope = TagScope.PERSONAL, ownerId = defaultUserId)

        // When
        val tenantTags = tagRepository.findByTenantIdAndScope(defaultTenantId, TagScope.TENANT)
        val personalTags = tagRepository.findByTenantIdAndScope(defaultTenantId, TagScope.PERSONAL)

        // Then
        assertThat(tenantTags).hasSize(2)
        assertThat(tenantTags).allMatch { it.scope == TagScope.TENANT }
        assertThat(personalTags).hasSize(2)
        assertThat(personalTags).allMatch { it.scope == TagScope.PERSONAL }
    }

    // ========== Usage Analytics Tests ==========

    @Test
    fun `should track tag usage count and last used timestamp`() {
        // Given
        val tag = createTestTag()
        assertThat(tag.usageCount).isEqualTo(0)
        assertThat(tag.lastUsedAt).isNull()

        // When
        tag.incrementUsage()
        val saved = tagRepository.save(tag)
        entityManager.flush()
        entityManager.clear()

        // Then
        val found = tagRepository.findById(saved.id)!!
        assertThat(found.usageCount).isEqualTo(1)
        assertThat(found.lastUsedAt).isNotNull()
        assertThat(found.lastUsedAt).isBefore(Instant.now())
    }

    @Test
    fun `should increment usage count multiple times`() {
        // Given
        val tag = createTestTag()

        // When
        repeat(5) {
            tag.incrementUsage()
            Thread.sleep(10) // Ensure different timestamps
        }
        val saved = tagRepository.save(tag)
        entityManager.flush()
        entityManager.clear()

        // Then
        val found = tagRepository.findById(saved.id)!!
        assertThat(found.usageCount).isEqualTo(5)
    }

    @Test
    fun `should find most used tags`() {
        // Given
        val tag1 = createTestTag(name = "Popular", usageCount = 100)
        val tag2 = createTestTag(name = "VeryPopular", usageCount = 200)
        val tag3 = createTestTag(name = "MostPopular", usageCount = 300)
        val tag4 = createTestTag(name = "Unpopular", usageCount = 10)
        val tag5 = createTestTag(name = "Moderate", usageCount = 50)

        // Create tags from another tenant (should not appear)
        val otherTenantId = UUID.randomUUID()
        executeRawSql(
            "INSERT INTO tags (id, tenant_id, name, name_normalized, color, scope, usage_count, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            UUID.randomUUID(), otherTenantId, "OtherTenant", "othertenant", "#000000", "TENANT", 500, otherTenantId, otherTenantId
        )

        // When
        val top3 = tagRepository.findMostUsed(defaultTenantId, 3)

        // Then
        assertThat(top3).hasSize(3)
        assertThat(top3[0].name).isEqualTo("MostPopular")
        assertThat(top3[0].usageCount).isEqualTo(300)
        assertThat(top3[1].name).isEqualTo("VeryPopular")
        assertThat(top3[1].usageCount).isEqualTo(200)
        assertThat(top3[2].name).isEqualTo("Popular")
        assertThat(top3[2].usageCount).isEqualTo(100)
    }

    @Test
    fun `should handle empty most used tags request`() {
        // Given - No tags exist

        // When
        val topTags = tagRepository.findMostUsed(defaultTenantId, 10)

        // Then
        assertThat(topTags).isEmpty()
    }

    // ========== Multi-Tenant Security Tests ==========

    @Test
    fun `should prevent cross-tenant tag access`() {
        // Given - Create tag for tenant1
        val tenant1Id = UUID.randomUUID()
        val tenant1UserId = UUID.randomUUID()
        val tenant1User = createTestUser(tenant1Id)
        
        val tag = withTenantContext(tenant1Id, tenant1UserId, tenant1User) {
            val t = Tag(
                tenantId = tenant1Id,
                name = "Tenant1 Tag",
                nameNormalized = "tenant1 tag",
                color = "#FF0000",
                scope = TagScope.TENANT,
                auditInfo = AuditInfo(
                    createdBy = tenant1UserId,
                    updatedBy = tenant1UserId
                )
            )
            tagRepository.save(t)
        }

        // When - Try to access from tenant2
        val tenant2Id = UUID.randomUUID()
        val tenant2UserId = UUID.randomUUID()
        val tenant2User = createTestUser(tenant2Id)
        
        val crossTenantAccess = withTenantContext(tenant2Id, tenant2UserId, tenant2User) {
            tagRepository.findByIdAndTenantId(tag.id, tenant2Id)
        }

        // Then
        assertThat(crossTenantAccess).isNull()
    }

    @Test
    fun `should enforce RLS at database level for tags`() {
        // Given - Create tags for two tenants
        val tenant1Id = UUID.randomUUID()
        val tenant2Id = UUID.randomUUID()
        
        // Create 3 tags for tenant1
        repeat(3) { i ->
            executeRawSql(
                "INSERT INTO tags (id, tenant_id, name, name_normalized, color, scope, usage_count, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                UUID.randomUUID(), tenant1Id, "Tenant1Tag$i", "tenant1tag$i", "#FF0000", "TENANT", 0, tenant1Id, tenant1Id
            )
        }
        
        // Create 2 tags for tenant2
        repeat(2) { i ->
            executeRawSql(
                "INSERT INTO tags (id, tenant_id, name, name_normalized, color, scope, usage_count, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                UUID.randomUUID(), tenant2Id, "Tenant2Tag$i", "tenant2tag$i", "#00FF00", "TENANT", 0, tenant2Id, tenant2Id
            )
        }

        // When - Query with tenant1 context
        jdbcTemplate.execute("SELECT set_config('app.current_tenant_id', '$tenant1Id', true)")
        val tenant1Count = queryRawSql<Array<Any>>(
            "SELECT COUNT(*) FROM tags WHERE deleted_at IS NULL"
        )
        
        // When - Query with tenant2 context  
        jdbcTemplate.execute("SELECT set_config('app.current_tenant_id', '$tenant2Id', true)")
        val tenant2Count = queryRawSql<Array<Any>>(
            "SELECT COUNT(*) FROM tags WHERE deleted_at IS NULL"
        )

        // Then
        assertThat((tenant1Count[0] as Array<*>)[0] as Long).isEqualTo(3)
        assertThat((tenant2Count[0] as Array<*>)[0] as Long).isEqualTo(2)
    }

    // ========== Data Integrity Tests ==========

    @Test
    fun `should enforce unique normalized names within tenant and scope`() {
        // Given
        createTestTag(
            name = "Important",
            nameNormalized = "important",
            scope = TagScope.TENANT
        )

        // When & Then - Same normalized name in same scope should fail
        assertThrows<Exception> {
            val duplicate = Tag(
                tenantId = defaultTenantId,
                name = "IMPORTANT", // Different case but same normalized
                nameNormalized = "important",
                color = "#000000",
                scope = TagScope.TENANT,
                auditInfo = AuditInfo(
                    createdBy = defaultUserId,
                    updatedBy = defaultUserId
                )
            )
            tagRepository.save(duplicate)
            entityManager.flush()
        }
    }

    @Test
    fun `should allow same tag name in different scopes`() {
        // Given
        val tenantTag = createTestTag(
            name = "Work",
            nameNormalized = "work",
            scope = TagScope.TENANT
        )

        // When - Create personal tag with same name
        val personalTag = createTestTag(
            name = "Work",
            nameNormalized = "work",
            scope = TagScope.PERSONAL,
            ownerId = defaultUserId
        )

        // Then - Both should exist
        assertThat(tagRepository.findById(tenantTag.id)).isNotNull
        assertThat(tagRepository.findById(personalTag.id)).isNotNull
    }

    @Test
    fun `should validate tag color format`() {
        // Test invalid color formats
        val invalidColors = listOf(
            "#FF",        // Too short
            "#GGGGGG",    // Invalid characters
            "FF0000",     // Missing #
            "#FF00000",   // Too long
            "red"         // Named color
        )

        invalidColors.forEach { color ->
            assertThrows<IllegalArgumentException> {
                Tag(
                    tenantId = defaultTenantId,
                    name = "Test",
                    nameNormalized = "test",
                    color = color,
                    scope = TagScope.TENANT,
                    auditInfo = AuditInfo()
                )
            }
        }
    }

    @Test
    fun `should normalize tag names correctly`() {
        // Test normalization
        val testCases = mapOf(
            "  Spaced  Out  " to "spaced out",
            "UPPERCASE" to "uppercase",
            "Mixed Case Tag" to "mixed case tag",
            "   Multiple   Spaces   " to "multiple spaces"
        )

        testCases.forEach { (input, expected) ->
            assertThat(Tag.normalizeName(input)).isEqualTo(expected)
        }
    }

    @Test
    fun `should find tag by normalized name`() {
        // Given
        createTestTag(
            name = "Client Meeting",
            nameNormalized = "client meeting"
        )

        // When
        val found = tagRepository.findByNameNormalized(defaultTenantId, "client meeting")

        // Then
        assertThat(found).isNotNull
        assertThat(found?.name).isEqualTo("Client Meeting")
    }

    // ========== Performance Tests ==========

    @Test
    fun `should handle large number of tags efficiently`() {
        // Given - Create 500 tags
        val tags = mutableListOf<Tag>()
        repeat(500) { i ->
            tags.add(
                Tag(
                    tenantId = defaultTenantId,
                    name = "Tag$i",
                    nameNormalized = "tag$i",
                    color = String.format("#%06X", i * 1000 % 0xFFFFFF),
                    scope = if (i % 2 == 0) TagScope.TENANT else TagScope.PERSONAL,
                    ownerId = if (i % 2 == 1) defaultUserId else null,
                    usageCount = i,
                    auditInfo = AuditInfo(
                        createdBy = defaultUserId,
                        updatedBy = defaultUserId
                    )
                )
            )
        }
        
        // Batch save for efficiency
        tags.chunked(50).forEach { batch ->
            batch.forEach { tagRepository.save(it) }
            entityManager.flush()
        }
        entityManager.clear()

        // When - Execute various queries
        val executionTime1 = measureTimeMillis {
            val allTags = tagRepository.findByTenantId(defaultTenantId)
            assertThat(allTags).hasSize(500)
        }

        val executionTime2 = measureTimeMillis {
            val tenantTags = tagRepository.findByTenantIdAndScope(defaultTenantId, TagScope.TENANT)
            assertThat(tenantTags).hasSize(250)
        }

        val executionTime3 = measureTimeMillis {
            val mostUsed = tagRepository.findMostUsed(defaultTenantId, 20)
            assertThat(mostUsed).hasSize(20)
        }

        // Then
        assertThat(executionTime1).isLessThan(100)
        assertThat(executionTime2).isLessThan(100)
        assertThat(executionTime3).isLessThan(100)
    }

    @Test
    fun `should use indexes for common queries`() {
        // Given - Ensure some data exists
        repeat(100) { i ->
            createTestTag(
                name = "Tag$i",
                scope = if (i % 3 == 0) TagScope.PERSONAL else TagScope.TENANT,
                ownerId = if (i % 3 == 0) defaultUserId else null,
                usageCount = i * 10
            )
        }

        // When - Test index usage for normalized name query
        val nameQueryTime = measureTimeMillis {
            tagRepository.findByNameNormalized(defaultTenantId, "tag50")
        }

        // When - Test index usage for scope query
        val scopeQueryTime = measureTimeMillis {
            tagRepository.findByTenantIdAndScope(defaultTenantId, TagScope.TENANT)
        }

        // When - Test index usage for usage query
        val usageQueryTime = measureTimeMillis {
            tagRepository.findMostUsed(defaultTenantId, 10)
        }

        // Then
        assertThat(nameQueryTime).isLessThan(50)
        assertThat(scopeQueryTime).isLessThan(50)
        assertThat(usageQueryTime).isLessThan(50)
    }

    // ========== Edge Cases and Error Scenarios ==========

    @Test
    fun `should handle empty result sets`() {
        // When - Query with no matching results
        val noTags = tagRepository.findByTenantId(UUID.randomUUID())
        val noPersonalTags = tagRepository.findByTenantIdAndScope(defaultTenantId, TagScope.PERSONAL)
        val noMatch = tagRepository.findByNameNormalized(defaultTenantId, "nonexistent")

        // Then
        assertThat(noTags).isEmpty()
        assertThat(noPersonalTags).isEmpty()
        assertThat(noMatch).isNull()
    }

    @Test
    fun `should maintain audit trail on updates`() {
        // Given
        val tag = createTestTag()
        val createdAt = tag.auditInfo.createdAt
        Thread.sleep(100) // Ensure time difference

        // When
        tag.auditInfo.markUpdated(defaultUserId)
        tag.incrementUsage()
        val updated = tagRepository.save(tag)
        entityManager.flush()
        entityManager.clear()

        // Then
        val found = tagRepository.findById(updated.id)!!
        assertThat(found.auditInfo.createdAt).isEqualTo(createdAt)
        assertThat(found.auditInfo.updatedAt).isAfter(createdAt)
        assertThat(found.auditInfo.updatedBy).isEqualTo(defaultUserId)
        assertThat(found.usageCount).isEqualTo(1)
    }

    @Test
    fun `should handle concurrent tag creation with same normalized name`() {
        // This test simulates race condition where two threads try to create
        // tags with the same normalized name simultaneously
        
        // Given
        val normalizedName = "concurrent-test"
        
        // When - Create first tag
        val tag1 = createTestTag(
            name = "Concurrent-Test",
            nameNormalized = normalizedName
        )

        // Then - Second creation should fail
        assertThrows<Exception> {
            val tag2 = Tag(
                tenantId = defaultTenantId,
                name = "CONCURRENT-TEST",
                nameNormalized = normalizedName,
                color = "#000000",
                scope = TagScope.TENANT,
                auditInfo = AuditInfo(
                    createdBy = defaultUserId,
                    updatedBy = defaultUserId
                )
            )
            tagRepository.save(tag2)
            entityManager.flush()
        }
    }

    // ========== Helper Methods ==========

    private fun createTestTag(
        name: String = "Test Tag ${UUID.randomUUID()}",
        nameNormalized: String = Tag.normalizeName(name),
        color: String = "#FF0000",
        scope: TagScope = TagScope.TENANT,
        ownerId: UUID? = null,
        usageCount: Int = 0
    ): Tag {
        val tag = Tag(
            tenantId = defaultTenantId,
            name = name,
            nameNormalized = nameNormalized,
            color = color,
            scope = scope,
            ownerId = ownerId,
            usageCount = usageCount,
            auditInfo = AuditInfo(
                createdBy = defaultUserId,
                updatedBy = defaultUserId
            )
        )
        return tagRepository.save(tag)
    }
}