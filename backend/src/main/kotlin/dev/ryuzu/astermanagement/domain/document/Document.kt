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
    Index(name = "idx_documents_uploaded_by", columnList = "uploaded_by")
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
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matter_id")
    var matter: Matter? = null
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    var uploadedBy: User? = null
    
    @Column(length = 64)
    var checksum: String? = null
    
    @Column(name = "is_public", nullable = false)
    var isPublic: Boolean = false
    
    @Column(name = "expires_at")
    var expiresAt: OffsetDateTime? = null
    
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