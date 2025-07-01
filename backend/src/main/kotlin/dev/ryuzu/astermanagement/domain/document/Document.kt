package dev.ryuzu.astermanagement.domain.document

import dev.ryuzu.astermanagement.domain.common.BaseEntity
import dev.ryuzu.astermanagement.domain.matter.Matter
import dev.ryuzu.astermanagement.domain.user.User
import jakarta.persistence.*
import java.time.OffsetDateTime
import java.util.*

/**
 * Document entity representing uploaded files in the system
 * Tracks file metadata, status, virus scanning results, and relationships to matters/users
 */
@Entity
@Table(name = "documents", indexes = [
    Index(name = "idx_documents_file_id", columnList = "file_id"),
    Index(name = "idx_documents_matter_id", columnList = "matter_id"),
    Index(name = "idx_documents_status", columnList = "status"),
    Index(name = "idx_documents_uploaded_by", columnList = "uploaded_by"),
    Index(name = "idx_documents_category_id", columnList = "category_id"),
    Index(name = "idx_documents_created_at", columnList = "created_at"),
    Index(name = "idx_documents_content_type", columnList = "content_type")
])
class Document : BaseEntity() {
    
    @Column(nullable = false, unique = true)
    var fileId: String = UUID.randomUUID().toString()
    
    @Column(nullable = false)
    var fileName: String = ""
    
    @Column(nullable = false)
    var originalFileName: String = ""
    
    @Column(nullable = false)
    var contentType: String = ""
    
    @Column(nullable = false)
    var fileSize: Long = 0
    
    @Column(nullable = false)
    var storagePath: String = ""
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: DocumentStatus = DocumentStatus.PENDING
    
    @Column(length = 255)
    var virusScanResult: String? = null
    
    @Column
    var virusScanDate: OffsetDateTime? = null
    
    @Column(columnDefinition = "TEXT")
    var description: String? = null
    
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
        name = "document_tags",
        joinColumns = [JoinColumn(name = "document_id")]
    )
    @Column(name = "tag", length = 50)
    var tags: MutableSet<String> = mutableSetOf()
    
    /**
     * Enhanced tags with metadata (preferred over simple string tags)
     */
    @ManyToMany(fetch = FetchType.LAZY, cascade = [CascadeType.PERSIST, CascadeType.MERGE])
    @JoinTable(
        name = "document_tag_associations",
        joinColumns = [JoinColumn(name = "document_id")],
        inverseJoinColumns = [JoinColumn(name = "tag_id")]
    )
    var tagEntities: MutableSet<DocumentTag> = mutableSetOf()
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matter_id")
    var matter: Matter? = null
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    var uploadedBy: User? = null
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    var category: DocumentCategory? = null
    
    @Column(length = 64)
    var checksum: String? = null
    
    @Column(name = "is_public", nullable = false)
    var isPublic: Boolean = false
    
    @Column(name = "expires_at")
    var expiresAt: OffsetDateTime? = null
    
    /**
     * Extracted text content from OCR or document parsing
     */
    @Column(columnDefinition = "TEXT")
    var extractedText: String? = null
    
    /**
     * Number of pages in the document (for PDFs and images)
     */
    @Column(name = "page_count")
    var pageCount: Int? = null
    
    /**
     * Approximate word count in the document
     */
    @Column(name = "word_count")
    var wordCount: Int? = null
    
    /**
     * Whether this document contains confidential information
     */
    @Column(name = "is_confidential", nullable = false)
    var isConfidential: Boolean = false
    
    /**
     * Document title for display and search
     */
    @Column(length = 500)
    var title: String? = null
    
    /**
     * Version number for tracking document revisions
     */
    @Column(name = "version_number", nullable = false)
    var versionNumber: Int = 1
    
    /**
     * Reference to parent document for versioning
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_document_id")
    var parentDocument: Document? = null
    
    /**
     * Child versions of this document
     */
    @OneToMany(mappedBy = "parentDocument", fetch = FetchType.LAZY)
    var versions: MutableSet<Document> = mutableSetOf()
    
    /**
     * Add enhanced tag to document
     */
    fun addTag(tag: DocumentTag) {
        tagEntities.add(tag)
        tag.documents.add(this)
    }
    
    /**
     * Remove enhanced tag from document
     */
    fun removeTag(tag: DocumentTag) {
        tagEntities.remove(tag)
        tag.documents.remove(this)
    }
    
    /**
     * Add simple string tag (for backward compatibility)
     */
    fun addSimpleTag(tagName: String) {
        tags.add(tagName.trim().lowercase())
    }
    
    /**
     * Get all tag names (both simple and enhanced)
     */
    fun getAllTagNames(): Set<String> {
        val allTags = mutableSetOf<String>()
        allTags.addAll(tags)
        allTags.addAll(tagEntities.map { it.name })
        return allTags
    }
    
    /**
     * Check if document has a specific tag
     */
    fun hasTag(tagName: String): Boolean {
        val normalizedName = tagName.trim().lowercase()
        return tags.contains(normalizedName) || 
               tagEntities.any { it.name.lowercase() == normalizedName }
    }
    
    /**
     * Get document display title (title if available, otherwise filename)
     */
    fun getDisplayTitle(): String {
        return title?.takeIf { it.isNotBlank() } ?: originalFileName
    }
    
    /**
     * Check if document is confidential (based on flag or tags)
     */
    fun isConfidentialDocument(): Boolean {
        return isConfidential || hasTag("confidential") || hasTag("privileged")
    }
    
    /**
     * Get category path as string
     */
    fun getCategoryPath(): String? {
        return category?.getPath()
    }
    
    /**
     * Check if document is a specific version (not the root document)
     */
    fun isVersionedDocument(): Boolean = parentDocument != null
    
    /**
     * Check if this is the latest version
     */
    fun isLatestVersion(): Boolean {
        if (parentDocument == null) return true
        return parentDocument!!.versions.none { it.versionNumber > this.versionNumber }
    }
    
    /**
     * Get file extension from filename
     */
    fun getFileExtension(): String? {
        return originalFileName.substringAfterLast('.', "").takeIf { it.isNotBlank() }
    }
    
    /**
     * Check if document is searchable (has content that can be indexed)
     */
    fun isSearchable(): Boolean {
        return status == DocumentStatus.AVAILABLE && 
               (extractedText?.isNotBlank() == true || 
                title?.isNotBlank() == true || 
                description?.isNotBlank() == true)
    }
}

/**
 * Document lifecycle status
 */
enum class DocumentStatus {
    /**
     * Document upload initiated but not completed
     */
    PENDING,
    
    /**
     * Document is being uploaded
     */
    UPLOADING,
    
    /**
     * Document uploaded, awaiting virus scan
     */
    SCANNING,
    
    /**
     * Document available for use
     */
    AVAILABLE,
    
    /**
     * Document quarantined due to virus detection
     */
    QUARANTINED,
    
    /**
     * Document marked as deleted (soft delete)
     */
    DELETED,
    
    /**
     * Document upload or processing failed
     */
    FAILED
}