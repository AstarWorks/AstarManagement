package dev.ryuzu.astermanagement.domain.document

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.OffsetDateTime
import java.util.*

/**
 * Repository interface for DocumentTag entity operations
 * Provides tag management, statistics, and search capabilities
 */
@Repository
interface DocumentTagRepository : JpaRepository<DocumentTag, UUID> {

    /**
     * Find tag by name (case-insensitive)
     */
    @Query("SELECT dt FROM DocumentTag dt WHERE LOWER(dt.name) = LOWER(:name)")
    fun findByNameIgnoreCase(@Param("name") name: String): DocumentTag?

    /**
     * Find tags by category
     */
    fun findByTagCategoryAndActiveTrue(category: TagCategory): List<DocumentTag>

    /**
     * Find active tags ordered by usage count
     */
    fun findByActiveTrueOrderByUsageCountDescNameAsc(): List<DocumentTag>

    /**
     * Find active tags with pagination
     */
    fun findByActiveTrueOrderByUsageCountDescNameAsc(pageable: Pageable): Page<DocumentTag>

    /**
     * Search tags by name or description
     */
    @Query("""
        SELECT dt FROM DocumentTag dt 
        WHERE dt.active = true
        AND (LOWER(dt.name) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
             OR LOWER(dt.displayLabel) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
             OR LOWER(dt.nameJa) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
             OR LOWER(dt.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))
        ORDER BY dt.usageCount DESC, dt.name
    """)
    fun searchTags(@Param("searchTerm") searchTerm: String): List<DocumentTag>

    /**
     * Find most popular tags
     */
    @Query("""
        SELECT dt FROM DocumentTag dt 
        WHERE dt.active = true 
        AND dt.usageCount > 0
        ORDER BY dt.usageCount DESC
    """)
    fun findMostPopularTags(pageable: Pageable): Page<DocumentTag>

    /**
     * Find recently used tags
     */
    @Query("""
        SELECT dt FROM DocumentTag dt 
        WHERE dt.active = true 
        AND dt.lastUsedAt IS NOT NULL
        ORDER BY dt.lastUsedAt DESC
    """)
    fun findRecentlyUsedTags(pageable: Pageable): Page<DocumentTag>

    /**
     * Find unused tags
     */
    @Query("""
        SELECT dt FROM DocumentTag dt 
        WHERE dt.active = true 
        AND dt.usageCount = 0
        ORDER BY dt.createdAt DESC
    """)
    fun findUnusedTags(): List<DocumentTag>

    /**
     * Find tags by color
     */
    fun findByColorHexAndActiveTrue(colorHex: String): List<DocumentTag>

    /**
     * Get tag statistics by category
     */
    @Query("""
        SELECT dt.tagCategory, COUNT(dt.id), SUM(dt.usageCount), AVG(dt.usageCount)
        FROM DocumentTag dt 
        WHERE dt.active = true
        GROUP BY dt.tagCategory
        ORDER BY SUM(dt.usageCount) DESC
    """)
    fun getTagStatisticsByCategory(): List<Array<Any>>

    /**
     * Get tag usage summary
     */
    @Query("""
        SELECT 
            COUNT(dt.id) as totalTags,
            COUNT(CASE WHEN dt.usageCount > 0 THEN 1 END) as usedTags,
            COUNT(CASE WHEN dt.usageCount = 0 THEN 1 END) as unusedTags,
            COALESCE(MAX(dt.usageCount), 0) as maxUsage,
            COALESCE(AVG(dt.usageCount), 0) as avgUsage
        FROM DocumentTag dt 
        WHERE dt.active = true
    """)
    fun getTagUsageSummary(): List<Array<Any>>

    /**
     * Find tags similar to the given name (for suggestions)
     */
    @Query("""
        SELECT dt FROM DocumentTag dt 
        WHERE dt.active = true
        AND (LOWER(dt.name) LIKE LOWER(CONCAT(:name, '%'))
             OR LOWER(dt.displayLabel) LIKE LOWER(CONCAT(:name, '%'))
             OR LOWER(dt.nameJa) LIKE LOWER(CONCAT(:name, '%')))
        ORDER BY 
            CASE 
                WHEN LOWER(dt.name) = LOWER(:name) THEN 1
                WHEN LOWER(dt.name) LIKE LOWER(CONCAT(:name, '%')) THEN 2
                WHEN LOWER(dt.displayLabel) LIKE LOWER(CONCAT(:name, '%')) THEN 3
                ELSE 4
            END,
            dt.usageCount DESC,
            dt.name
    """)
    fun findSimilarTags(@Param("name") name: String, pageable: Pageable): Page<DocumentTag>

    /**
     * Increment usage count for a tag
     */
    @Modifying
    @Query("""
        UPDATE DocumentTag dt 
        SET dt.usageCount = dt.usageCount + 1, 
            dt.lastUsedAt = CURRENT_TIMESTAMP,
            dt.updatedAt = CURRENT_TIMESTAMP
        WHERE dt.id = :tagId
    """)
    fun incrementUsageCount(@Param("tagId") tagId: UUID): Int

    /**
     * Increment usage count for multiple tags
     */
    @Modifying
    @Query("""
        UPDATE DocumentTag dt 
        SET dt.usageCount = dt.usageCount + 1, 
            dt.lastUsedAt = CURRENT_TIMESTAMP,
            dt.updatedAt = CURRENT_TIMESTAMP
        WHERE dt.name IN :tagNames
    """)
    fun incrementUsageCountByNames(@Param("tagNames") tagNames: Collection<String>): Int

    /**
     * Find or create tag by name
     */
    @Query("""
        SELECT dt FROM DocumentTag dt 
        WHERE LOWER(dt.name) = LOWER(:name)
        AND dt.active = true
    """)
    fun findActiveByNameIgnoreCase(@Param("name") name: String): DocumentTag?

    /**
     * Get tags used in a specific time period
     */
    @Query("""
        SELECT dt FROM DocumentTag dt 
        WHERE dt.active = true
        AND dt.lastUsedAt BETWEEN :startDate AND :endDate
        ORDER BY dt.lastUsedAt DESC
    """)
    fun findTagsUsedBetween(
        @Param("startDate") startDate: OffsetDateTime,
        @Param("endDate") endDate: OffsetDateTime
    ): List<DocumentTag>

    /**
     * Find tags that haven't been used for a specific period
     */
    @Query("""
        SELECT dt FROM DocumentTag dt 
        WHERE dt.active = true
        AND (dt.lastUsedAt IS NULL OR dt.lastUsedAt < :cutoffDate)
        AND dt.tagCategory != 'SYSTEM'
        ORDER BY dt.lastUsedAt ASC
    """)
    fun findInactiveTags(@Param("cutoffDate") cutoffDate: OffsetDateTime): List<DocumentTag>

    /**
     * Count tags by category
     */
    fun countByTagCategoryAndActiveTrue(category: TagCategory): Long

    /**
     * Check if tag name exists (case-insensitive, excluding specific tag)
     */
    @Query("""
        SELECT COUNT(dt) > 0 
        FROM DocumentTag dt 
        WHERE LOWER(dt.name) = LOWER(:name) 
        AND dt.active = true
        AND (:excludeId IS NULL OR dt.id != :excludeId)
    """)
    fun existsByNameIgnoreCaseExcluding(@Param("name") name: String, @Param("excludeId") excludeId: UUID?): Boolean

    /**
     * Soft delete tag (set active = false)
     */
    @Modifying
    @Query("""
        UPDATE DocumentTag dt 
        SET dt.active = false, dt.updatedAt = CURRENT_TIMESTAMP 
        WHERE dt.id = :tagId
    """)
    fun softDeleteTag(@Param("tagId") tagId: UUID): Int

    /**
     * Get auto-complete suggestions for tag names
     */
    @Query("""
        SELECT DISTINCT dt.name
        FROM DocumentTag dt 
        WHERE dt.active = true
        AND LOWER(dt.name) LIKE LOWER(CONCAT(:prefix, '%'))
        ORDER BY dt.usageCount DESC, dt.name
    """)
    fun getAutoCompleteSuggestions(@Param("prefix") prefix: String, pageable: Pageable): List<String>
}