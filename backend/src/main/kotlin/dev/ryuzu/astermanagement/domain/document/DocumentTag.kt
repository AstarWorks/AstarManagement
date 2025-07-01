package dev.ryuzu.astermanagement.domain.document

import dev.ryuzu.astermanagement.domain.common.BaseEntity
import jakarta.persistence.*
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.OffsetDateTime

/**
 * Document tag entity for enhanced document categorization and labeling
 * Provides color coding, usage statistics, and category organization
 */
@Entity
@Table(
    name = "document_tags_enhanced",
    indexes = [
        Index(name = "idx_document_tags_name", columnList = "name"),
        Index(name = "idx_document_tags_category", columnList = "tag_category"),
        Index(name = "idx_document_tags_usage", columnList = "usage_count"),
        Index(name = "idx_document_tags_active", columnList = "active")
    ]
)
class DocumentTag : BaseEntity() {
    
    /**
     * Tag name (unique identifier)
     */
    @Column(nullable = false, unique = true, length = 50)
    @field:NotBlank(message = "Tag name is required")
    @field:Size(max = 50, message = "Tag name must not exceed 50 characters")
    var name: String = ""
    
    /**
     * Display label for the tag (can be different from name)
     */
    @Column(name = "display_label", length = 100)
    @field:Size(max = 100, message = "Display label must not exceed 100 characters")
    var displayLabel: String? = null
    
    /**
     * Japanese translation of the tag
     */
    @Column(name = "name_ja", length = 50)
    @field:Size(max = 50, message = "Japanese name must not exceed 50 characters")
    var nameJa: String? = null
    
    /**
     * Tag description
     */
    @Column(columnDefinition = "TEXT")
    var description: String? = null
    
    /**
     * Color code for visual representation (hex format)
     */
    @Column(name = "color_hex", nullable = false, length = 7)
    @field:Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Color must be a valid hex code")
    var colorHex: String = "#808080"
    
    /**
     * Usage count for popularity tracking
     */
    @Column(name = "usage_count", nullable = false)
    var usageCount: Long = 0
    
    /**
     * Tag category for organization
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "tag_category", nullable = false, length = 20)
    var tagCategory: TagCategory = TagCategory.USER_DEFINED
    
    /**
     * Last time this tag was used
     */
    @Column(name = "last_used_at")
    var lastUsedAt: OffsetDateTime? = null
    
    /**
     * Whether this tag is active and should be displayed
     */
    @Column(nullable = false)
    var active: Boolean = true
    
    /**
     * Icon identifier for UI display
     */
    @Column(name = "icon_name", length = 50)
    var iconName: String? = null
    
    /**
     * Sort order for display
     */
    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0
    
    /**
     * Documents associated with this tag (reverse relationship)
     */
    @ManyToMany(mappedBy = "tagEntities", fetch = FetchType.LAZY)
    var documents: MutableSet<Document> = mutableSetOf()
    
    /**
     * Increment usage count and update last used timestamp
     */
    fun incrementUsage() {
        usageCount++
        lastUsedAt = OffsetDateTime.now()
    }
    
    /**
     * Get the display name (label if available, otherwise name)
     */
    fun getDisplayName(): String = displayLabel ?: name
    
    /**
     * Check if this is a system-defined tag
     */
    fun isSystemTag(): Boolean = tagCategory == TagCategory.SYSTEM
    
    /**
     * Get localized name (Japanese if available and requested, otherwise English)
     */
    fun getLocalizedName(useJapanese: Boolean = false): String {
        return if (useJapanese && !nameJa.isNullOrBlank()) nameJa!! else name
    }
}

/**
 * Tag category enumeration for organizing tags
 */
enum class TagCategory {
    /**
     * System-defined tags that cannot be deleted
     */
    SYSTEM,
    
    /**
     * User-defined tags that can be modified
     */
    USER_DEFINED,
    
    /**
     * Legal terminology tags
     */
    LEGAL_TERM,
    
    /**
     * Court-specific tags
     */
    COURT_SPECIFIC,
    
    /**
     * Client-related tags
     */
    CLIENT_RELATED,
    
    /**
     * Priority or urgency tags
     */
    PRIORITY,
    
    /**
     * Status or workflow tags
     */
    STATUS,
    
    /**
     * Document type classification tags
     */
    DOCUMENT_TYPE
}