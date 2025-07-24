package dev.ryuzu.astermanagement.modules.document.domain

import dev.ryuzu.astermanagement.domain.common.BaseEntity
import jakarta.persistence.*
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

/**
 * Document category entity for hierarchical organization of legal documents
 * Supports self-referencing structure for nested categories
 */
@Entity
@Table(
    name = "document_categories",
    indexes = [
        Index(name = "idx_document_categories_parent", columnList = "parent_category_id"),
        Index(name = "idx_document_categories_name", columnList = "name"),
        Index(name = "idx_document_categories_code", columnList = "code"),
        Index(name = "idx_document_categories_active", columnList = "active")
    ]
)
class DocumentCategory : BaseEntity() {
    
    /**
     * Unique code identifier for the category
     */
    @Column(nullable = false, unique = true, length = 50)
    @field:NotBlank(message = "Category code is required")
    @field:Size(max = 50, message = "Category code must not exceed 50 characters")
    var code: String = ""
    
    /**
     * Display name of the category
     */
    @Column(nullable = false, length = 100)
    @field:NotBlank(message = "Category name is required")
    @field:Size(max = 100, message = "Category name must not exceed 100 characters")
    var name: String = ""
    
    /**
     * Japanese translation of the category name
     */
    @Column(name = "name_ja", length = 100)
    @field:Size(max = 100, message = "Japanese name must not exceed 100 characters")
    var nameJa: String? = null
    
    /**
     * Optional description of the category
     */
    @Column(columnDefinition = "TEXT")
    var description: String? = null
    
    /**
     * Parent category for hierarchical structure
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_category_id")
    var parentCategory: DocumentCategory? = null
    
    /**
     * Child categories
     */
    @OneToMany(mappedBy = "parentCategory", fetch = FetchType.LAZY)
    var childCategories: MutableSet<DocumentCategory> = mutableSetOf()
    
    /**
     * Documents in this category
     */
    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    var documents: MutableSet<Document> = mutableSetOf()
    
    /**
     * Display order for sorting categories
     */
    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0
    
    /**
     * Color code for visual representation (hex format)
     */
    @Column(name = "color_hex", length = 7)
    @field:Size(max = 7, message = "Color hex must not exceed 7 characters")
    var colorHex: String? = "#808080"
    
    /**
     * Whether this category is active and should be displayed
     */
    @Column(nullable = false)
    var active: Boolean = true
    
    /**
     * Category type for system vs user-defined distinction
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "category_type", nullable = false, length = 20)
    var categoryType: DocumentCategoryType = DocumentCategoryType.USER_DEFINED
    
    /**
     * Icon identifier for UI display
     */
    @Column(name = "icon_name", length = 50)
    var iconName: String? = null
    
    /**
     * Get the full category path from root to this category
     */
    fun getPath(): String {
        val path = mutableListOf<String>()
        var current: DocumentCategory? = this
        
        while (current != null) {
            path.add(0, current.name)
            current = current.parentCategory
        }
        
        return path.joinToString(" > ")
    }
    
    /**
     * Check if this category is a root category
     */
    fun isRootCategory(): Boolean = parentCategory == null
    
    /**
     * Get all descendant categories recursively
     */
    fun getAllDescendants(): Set<DocumentCategory> {
        val descendants = mutableSetOf<DocumentCategory>()
        
        fun collectDescendants(category: DocumentCategory) {
            for (child in category.childCategories) {
                descendants.add(child)
                collectDescendants(child)
            }
        }
        
        collectDescendants(this)
        return descendants
    }
    
    /**
     * Get document count in this category (direct documents only)
     */
    fun getDocumentCount(): Int = documents.size
    
    /**
     * Get total document count including all subcategories
     */
    fun getTotalDocumentCount(): Int {
        var count = getDocumentCount()
        for (child in childCategories) {
            count += child.getTotalDocumentCount()
        }
        return count
    }
}

/**
 * Category type enumeration
 */
enum class DocumentCategoryType {
    /**
     * System-defined categories that cannot be deleted
     */
    SYSTEM,
    
    /**
     * User-defined categories that can be modified
     */
    USER_DEFINED,
    
    /**
     * Legal-specific categories for court documents
     */
    LEGAL_SPECIFIC,
    
    /**
     * Template categories for document generation
     */
    TEMPLATE
}