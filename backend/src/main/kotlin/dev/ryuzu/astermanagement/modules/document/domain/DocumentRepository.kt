package dev.ryuzu.astermanagement.modules.document.domain

import dev.ryuzu.astermanagement.domain.matter.Matter
import dev.ryuzu.astermanagement.domain.user.User
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.OffsetDateTime
import java.util.*

/**
 * Repository interface for Document entity operations
 * Provides standard CRUD operations and custom queries for document management
 */
@Repository
interface DocumentRepository : JpaRepository<Document, UUID> {

    /**
     * Find document by unique file ID
     */
    fun findByFileId(fileId: String): Document?

    /**
     * Find documents by matter
     */
    fun findByMatter(matter: Matter): List<Document>

    /**
     * Find documents by matter with pagination
     */
    fun findByMatter(matter: Matter, pageable: Pageable): Page<Document>

    /**
     * Find documents by status
     */
    fun findByStatus(status: DocumentStatus): List<Document>

    /**
     * Find documents by status with pagination
     */
    fun findByStatus(status: DocumentStatus, pageable: Pageable): Page<Document>

    /**
     * Find documents uploaded by user
     */
    fun findByUploadedBy(user: User): List<Document>

    /**
     * Find documents uploaded by user with pagination
     */
    fun findByUploadedBy(user: User, pageable: Pageable): Page<Document>

    /**
     * Find documents by content type
     */
    fun findByContentType(contentType: String): List<Document>

    /**
     * Find public documents
     */
    fun findByIsPublicTrue(): List<Document>

    /**
     * Find expired documents
     */
    @Query("""
        SELECT d FROM Document d 
        WHERE d.expiresAt IS NOT NULL 
        AND d.expiresAt < :currentTime
        AND d.status != 'DELETED'
    """)
    fun findExpiredDocuments(@Param("currentTime") currentTime: OffsetDateTime = OffsetDateTime.now()): List<Document>

    /**
     * Find documents pending virus scan
     */
    @Query("""
        SELECT d FROM Document d 
        WHERE d.status = 'SCANNING' 
        AND d.virusScanDate IS NULL
        ORDER BY d.createdAt ASC
    """)
    fun findDocumentsPendingScan(): List<Document>

    /**
     * Find documents by tag
     */
    @Query("""
        SELECT d FROM Document d 
        JOIN d.tags t 
        WHERE t = :tag
        ORDER BY d.createdAt DESC
    """)
    fun findByTag(@Param("tag") tag: String): List<Document>

    /**
     * Find documents by multiple tags (any match)
     */
    @Query("""
        SELECT DISTINCT d FROM Document d 
        JOIN d.tags t 
        WHERE t IN :tags
        ORDER BY d.createdAt DESC
    """)
    fun findByTagsIn(@Param("tags") tags: Collection<String>): List<Document>

    /**
     * Search documents by filename
     */
    @Query("""
        SELECT d FROM Document d 
        WHERE LOWER(d.fileName) LIKE LOWER(CONCAT('%', :fileName, '%'))
        OR LOWER(d.originalFileName) LIKE LOWER(CONCAT('%', :fileName, '%'))
        ORDER BY d.createdAt DESC
    """)
    fun searchByFileName(@Param("fileName") fileName: String, pageable: Pageable): Page<Document>

    /**
     * Search documents with multiple criteria
     */
    @Query("""
        SELECT DISTINCT d FROM Document d 
        LEFT JOIN d.tags t
        WHERE (:fileName IS NULL OR LOWER(d.fileName) LIKE LOWER(CONCAT('%', :fileName, '%')) 
               OR LOWER(d.originalFileName) LIKE LOWER(CONCAT('%', :fileName, '%')))
        AND (:contentType IS NULL OR d.contentType = :contentType)
        AND (:status IS NULL OR d.status = :status)
        AND (:matterId IS NULL OR d.matter.id = :matterId)
        AND (:uploadedBy IS NULL OR d.uploadedBy.id = :uploadedBy)
        AND (:tag IS NULL OR t = :tag)
        AND (:fromDate IS NULL OR d.createdAt >= :fromDate)
        AND (:toDate IS NULL OR d.createdAt <= :toDate)
        ORDER BY d.createdAt DESC
    """)
    fun searchDocuments(
        @Param("fileName") fileName: String?,
        @Param("contentType") contentType: String?,
        @Param("status") status: DocumentStatus?,
        @Param("matterId") matterId: UUID?,
        @Param("uploadedBy") uploadedBy: UUID?,
        @Param("tag") tag: String?,
        @Param("fromDate") fromDate: OffsetDateTime?,
        @Param("toDate") toDate: OffsetDateTime?,
        pageable: Pageable
    ): Page<Document>

    /**
     * Get document statistics by status
     */
    @Query("""
        SELECT d.status, COUNT(d), SUM(d.fileSize)
        FROM Document d 
        GROUP BY d.status
    """)
    fun getDocumentStatistics(): List<Array<Any>>

    /**
     * Get storage usage by matter
     */
    @Query("""
        SELECT d.matter.id, COUNT(d), SUM(d.fileSize)
        FROM Document d 
        WHERE d.matter IS NOT NULL
        GROUP BY d.matter.id
    """)
    fun getStorageUsageByMatter(): List<Array<Any>>

    /**
     * Count documents by status
     */
    fun countByStatus(status: DocumentStatus): Long

    /**
     * Count documents by matter
     */
    fun countByMatter(matter: Matter): Long

    /**
     * Check if file ID exists
     */
    fun existsByFileId(fileId: String): Boolean

    /**
     * Find document versions
     */
    @Query("""
        SELECT d FROM Document d 
        WHERE d.parentDocument = :parentDocument
        ORDER BY d.versionNumber DESC
    """)
    fun findVersions(@Param("parentDocument") parentDocument: Document): List<Document>

    /**
     * Find latest version of a document
     */
    @Query("""
        SELECT d FROM Document d 
        WHERE d.parentDocument = :parentDocument
        AND d.versionNumber = (
            SELECT MAX(d2.versionNumber) 
            FROM Document d2 
            WHERE d2.parentDocument = :parentDocument
        )
    """)
    fun findLatestVersion(@Param("parentDocument") parentDocument: Document): Document?

    /**
     * Get total storage used
     */
    @Query("SELECT COALESCE(SUM(d.fileSize), 0) FROM Document d WHERE d.status != 'DELETED'")
    fun getTotalStorageUsed(): Long

    /**
     * Get storage used by user
     */
    @Query("""
        SELECT COALESCE(SUM(d.fileSize), 0) 
        FROM Document d 
        WHERE d.uploadedBy = :user 
        AND d.status != 'DELETED'
    """)
    fun getStorageUsedByUser(@Param("user") user: User): Long

    /**
     * Delete documents by matter (soft delete)
     */
    @Query("""
        UPDATE Document d 
        SET d.status = 'DELETED', d.updatedAt = CURRENT_TIMESTAMP 
        WHERE d.matter = :matter
    """)
    fun softDeleteByMatter(@Param("matter") matter: Matter): Int

    /**
     * Find documents by category
     */
    fun findByCategory(category: DocumentCategory): List<Document>

    /**
     * Find documents by category with pagination
     */
    fun findByCategory(category: DocumentCategory, pageable: Pageable): Page<Document>

    /**
     * Find documents by enhanced tag
     */
    @Query("""
        SELECT DISTINCT d FROM Document d 
        JOIN d.tagEntities t 
        WHERE t = :tag
        AND d.status != 'DELETED'
        ORDER BY d.createdAt DESC
    """)
    fun findByEnhancedTag(@Param("tag") tag: DocumentTag): List<Document>

    /**
     * Find documents by multiple enhanced tags (any match)
     */
    @Query("""
        SELECT DISTINCT d FROM Document d 
        JOIN d.tagEntities t 
        WHERE t IN :tags
        AND d.status != 'DELETED'
        ORDER BY d.createdAt DESC
    """)
    fun findByEnhancedTagsIn(@Param("tags") tags: Collection<DocumentTag>): List<Document>

    /**
     * Full-text search with multi-language support
     */
    @Query(value = """
        SELECT * FROM documents d 
        WHERE d.status != 'DELETED'
        AND (d.search_vector @@ plainto_tsquery('simple', :searchTerm)
             OR d.search_vector_ja @@ plainto_tsquery('japanese', :searchTerm)
             OR d.search_vector_en @@ plainto_tsquery('english', :searchTerm))
        ORDER BY 
            GREATEST(
                ts_rank(d.search_vector, plainto_tsquery('simple', :searchTerm)),
                ts_rank(d.search_vector_ja, plainto_tsquery('japanese', :searchTerm)),
                ts_rank(d.search_vector_en, plainto_tsquery('english', :searchTerm))
            ) DESC
    """, nativeQuery = true)
    fun fullTextSearch(@Param("searchTerm") searchTerm: String, pageable: Pageable): Page<Document>

    /**
     * Find documents by category hierarchy (including subcategories)
     */
    @Query("""
        SELECT DISTINCT d FROM Document d 
        JOIN d.category c
        WHERE d.status != 'DELETED'
        AND (c = :category OR c.parentCategory = :category)
        ORDER BY d.createdAt DESC
    """)
    fun findByCategoryHierarchy(@Param("category") category: DocumentCategory): List<Document>

    /**
     * Find confidential documents
     */
    @Query("""
        SELECT d FROM Document d 
        LEFT JOIN d.tagEntities t
        WHERE d.status != 'DELETED'
        AND (d.isConfidential = true 
             OR t.name IN ('confidential', 'privileged'))
        ORDER BY d.createdAt DESC
    """)
    fun findConfidentialDocuments(): List<Document>

    /**
     * Find documents requiring OCR processing
     */
    @Query("""
        SELECT d FROM Document d 
        WHERE d.status = 'AVAILABLE'
        AND d.extractedText IS NULL
        AND d.contentType IN ('application/pdf', 'image/jpeg', 'image/png', 'image/tiff')
        ORDER BY d.createdAt ASC
    """)
    fun findDocumentsNeedingOCR(): List<Document>

    /**
     * Get storage statistics by category
     */
    @Query("""
        SELECT c.name, COUNT(d.id), SUM(d.fileSize), AVG(d.fileSize)
        FROM Document d 
        JOIN d.category c
        WHERE d.status != 'DELETED'
        GROUP BY c.id, c.name
        ORDER BY SUM(d.fileSize) DESC
    """)
    fun getStorageStatisticsByCategory(): List<Array<Any>>

    /**
     * Find documents with missing metadata
     */
    @Query("""
        SELECT d FROM Document d 
        WHERE d.status = 'AVAILABLE'
        AND (d.title IS NULL OR d.title = ''
             OR d.description IS NULL OR d.description = ''
             OR d.category IS NULL)
        ORDER BY d.createdAt DESC
    """)
    fun findDocumentsWithMissingMetadata(): List<Document>

    /**
     * Advanced search with category and tag filters
     */
    @Query("""
        SELECT DISTINCT d FROM Document d 
        LEFT JOIN d.category c
        LEFT JOIN d.tagEntities t
        WHERE d.status != 'DELETED'
        AND (:title IS NULL OR LOWER(d.title) LIKE LOWER(CONCAT('%', :title, '%')))
        AND (:fileName IS NULL OR LOWER(d.fileName) LIKE LOWER(CONCAT('%', :fileName, '%')) 
             OR LOWER(d.originalFileName) LIKE LOWER(CONCAT('%', :fileName, '%')))
        AND (:contentType IS NULL OR d.contentType = :contentType)
        AND (:categoryId IS NULL OR c.id = :categoryId)
        AND (:matterId IS NULL OR d.matter.id = :matterId)
        AND (:uploadedBy IS NULL OR d.uploadedBy.id = :uploadedBy)
        AND (:tagName IS NULL OR :tagName MEMBER OF d.tags OR t.name = :tagName)
        AND (:fromDate IS NULL OR d.createdAt >= :fromDate)
        AND (:toDate IS NULL OR d.createdAt <= :toDate)
        AND (:confidentialOnly IS NULL OR :confidentialOnly = false OR 
             d.isConfidential = true OR t.name IN ('confidential', 'privileged'))
        ORDER BY d.createdAt DESC
    """)
    fun advancedSearchDocuments(
        @Param("title") title: String?,
        @Param("fileName") fileName: String?,
        @Param("contentType") contentType: String?,
        @Param("categoryId") categoryId: UUID?,
        @Param("matterId") matterId: UUID?,
        @Param("uploadedBy") uploadedBy: UUID?,
        @Param("tagName") tagName: String?,
        @Param("fromDate") fromDate: OffsetDateTime?,
        @Param("toDate") toDate: OffsetDateTime?,
        @Param("confidentialOnly") confidentialOnly: Boolean?,
        pageable: Pageable
    ): Page<Document>
    
    /**
     * Find all accessible document IDs for a user (for permission checking)
     */
    @Query("""
        SELECT d.id FROM Document d 
        WHERE d.status = 'AVAILABLE'
        AND (d.isPublic = true 
             OR d.uploadedBy.id = :userId
             OR d.matter.id IN (
                 SELECT m.id FROM Matter m 
                 WHERE m.assignedUser.id = :userId
                 OR m.client.id = :userId
             ))
    """)
    fun findAllAccessibleDocumentIds(
        @Param("userId") userId: UUID,
        @Param("roleNames") roleNames: Set<String>
    ): List<UUID>
}