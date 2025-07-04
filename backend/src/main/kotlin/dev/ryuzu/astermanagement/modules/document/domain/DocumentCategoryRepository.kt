package dev.ryuzu.astermanagement.modules.document.domain

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

/**
 * Repository interface for DocumentCategory entity operations
 * Provides hierarchical query support and category management
 */
@Repository
interface DocumentCategoryRepository : JpaRepository<DocumentCategory, UUID> {

    /**
     * Find category by unique code
     */
    fun findByCode(code: String): DocumentCategory?

    /**
     * Find categories by name (case-insensitive)
     */
    @Query("""
        SELECT dc FROM DocumentCategory dc 
        WHERE LOWER(dc.name) LIKE LOWER(CONCAT('%', :name, '%'))
        OR LOWER(dc.nameJa) LIKE LOWER(CONCAT('%', :name, '%'))
        ORDER BY dc.sortOrder, dc.name
    """)
    fun findByNameContainingIgnoreCase(@Param("name") name: String): List<DocumentCategory>

    /**
     * Find all root categories (no parent)
     */
    @Query("""
        SELECT dc FROM DocumentCategory dc 
        WHERE dc.parentCategory IS NULL 
        AND dc.active = true
        ORDER BY dc.sortOrder, dc.name
    """)
    fun findRootCategories(): List<DocumentCategory>

    /**
     * Find child categories by parent
     */
    fun findByParentCategoryAndActiveTrue(parentCategory: DocumentCategory): List<DocumentCategory>

    /**
     * Find categories by type
     */
    fun findByCategoryTypeAndActiveTrue(categoryType: DocumentCategoryType): List<DocumentCategory>

    /**
     * Find active categories with pagination
     */
    fun findByActiveTrueOrderBySortOrderAscNameAsc(pageable: Pageable): Page<DocumentCategory>

    /**
     * Get category hierarchy starting from root
     */
    @Query("""
        WITH RECURSIVE category_hierarchy AS (
            -- Base case: root categories
            SELECT dc.*, 0 as level, CAST(dc.name AS VARCHAR(1000)) as path
            FROM document_categories dc 
            WHERE dc.parent_category_id IS NULL AND dc.active = true
            
            UNION ALL
            
            -- Recursive case: child categories
            SELECT child.*, parent.level + 1, 
                   CAST(parent.path || ' > ' || child.name AS VARCHAR(1000))
            FROM document_categories child
            INNER JOIN category_hierarchy parent ON child.parent_category_id = parent.id
            WHERE child.active = true
        )
        SELECT * FROM category_hierarchy 
        ORDER BY path
    """, nativeQuery = true)
    fun getCategoryHierarchy(): List<Map<String, Any>>

    /**
     * Find categories with document count
     */
    @Query("""
        SELECT dc, COUNT(d.id) as documentCount
        FROM DocumentCategory dc 
        LEFT JOIN dc.documents d
        WHERE dc.active = true
        GROUP BY dc.id
        ORDER BY dc.sortOrder, dc.name
    """)
    fun findCategoriesWithDocumentCount(): List<Array<Any>>

    /**
     * Find categories by parent with document count
     */
    @Query("""
        SELECT dc, COUNT(d.id) as documentCount
        FROM DocumentCategory dc 
        LEFT JOIN dc.documents d
        WHERE dc.parentCategory = :parentCategory 
        AND dc.active = true
        GROUP BY dc.id
        ORDER BY dc.sortOrder, dc.name
    """)
    fun findByParentWithDocumentCount(@Param("parentCategory") parentCategory: DocumentCategory?): List<Array<Any>>

    /**
     * Search categories by name or description
     */
    @Query("""
        SELECT dc FROM DocumentCategory dc 
        WHERE dc.active = true
        AND (LOWER(dc.name) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
             OR LOWER(dc.nameJa) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
             OR LOWER(dc.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
             OR LOWER(dc.code) LIKE LOWER(CONCAT('%', :searchTerm, '%')))
        ORDER BY dc.sortOrder, dc.name
    """)
    fun searchCategories(@Param("searchTerm") searchTerm: String): List<DocumentCategory>

    /**
     * Get category statistics
     */
    @Query("""
        SELECT dc.categoryType, COUNT(dc.id), 
               COALESCE(SUM(docCount.cnt), 0) as totalDocuments
        FROM DocumentCategory dc 
        LEFT JOIN (
            SELECT d.category.id as catId, COUNT(d.id) as cnt
            FROM Document d 
            WHERE d.status != 'DELETED'
            GROUP BY d.category.id
        ) docCount ON dc.id = docCount.catId
        WHERE dc.active = true
        GROUP BY dc.categoryType
    """)
    fun getCategoryStatistics(): List<Array<Any>>

    /**
     * Find categories used by documents
     */
    @Query("""
        SELECT DISTINCT dc FROM DocumentCategory dc 
        INNER JOIN dc.documents d
        WHERE dc.active = true 
        AND d.status != 'DELETED'
        ORDER BY dc.sortOrder, dc.name
    """)
    fun findCategoriesInUse(): List<DocumentCategory>

    /**
     * Get maximum sort order for siblings
     */
    @Query("""
        SELECT COALESCE(MAX(dc.sortOrder), 0)
        FROM DocumentCategory dc 
        WHERE dc.parentCategory = :parentCategory
    """)
    fun getMaxSortOrderByParent(@Param("parentCategory") parentCategory: DocumentCategory?): Int

    /**
     * Count categories by parent
     */
    fun countByParentCategoryAndActiveTrue(parentCategory: DocumentCategory?): Long

    /**
     * Check if code exists (excluding specific category)
     */
    @Query("""
        SELECT COUNT(dc) > 0 
        FROM DocumentCategory dc 
        WHERE dc.code = :code 
        AND (:excludeId IS NULL OR dc.id != :excludeId)
    """)
    fun existsByCodeExcluding(@Param("code") code: String, @Param("excludeId") excludeId: UUID?): Boolean

    /**
     * Find path to root for a category
     */
    @Query("""
        WITH RECURSIVE category_path AS (
            -- Base case: target category
            SELECT dc.*, 0 as depth
            FROM document_categories dc 
            WHERE dc.id = :categoryId
            
            UNION ALL
            
            -- Recursive case: parent categories
            SELECT parent.*, child.depth + 1
            FROM document_categories parent
            INNER JOIN category_path child ON parent.id = child.parent_category_id
        )
        SELECT * FROM category_path 
        ORDER BY depth DESC
    """, nativeQuery = true)
    fun findPathToRoot(@Param("categoryId") categoryId: UUID): List<Map<String, Any>>

    /**
     * Soft delete category and move documents to parent or uncategorized
     */
    @Query("""
        UPDATE DocumentCategory dc 
        SET dc.active = false, dc.updatedAt = CURRENT_TIMESTAMP 
        WHERE dc.id = :categoryId
    """)
    fun softDeleteCategory(@Param("categoryId") categoryId: UUID): Int
}