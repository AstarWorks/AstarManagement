package com.astarworks.astarmanagement.expense.domain.model

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

/**
 * Domain entity representing a tag for categorizing expenses.
 * Supports both tenant-wide and personal tags with usage tracking.
 */
@Entity
@Table(name = "tags", indexes = [
    Index(name = "idx_tags_tenant_scope", columnList = "tenant_id, scope"),
    Index(name = "idx_tags_normalized", columnList = "name_normalized"),
    Index(name = "idx_tags_usage", columnList = "usage_count DESC")
], uniqueConstraints = [
    UniqueConstraint(columnNames = ["tenant_id", "name_normalized", "scope", "owner_id"])
])
class Tag(
    @Id
    @Column(name = "id", nullable = false)
    val id: UUID = UUID.randomUUID(),
    
    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,
    
    @Column(name = "name", nullable = false, length = 50)
    val name: String,
    
    @Column(name = "name_normalized", nullable = false, length = 50)
    val nameNormalized: String,
    
    @Column(name = "color", nullable = false, length = 7)
    val color: String,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "scope", nullable = false, length = 20)
    val scope: TagScope = TagScope.TENANT,
    
    @Column(name = "owner_id")
    val ownerId: UUID? = null,
    
    @Column(name = "usage_count", nullable = false)
    var usageCount: Int = 0,
    
    @Column(name = "last_used_at")
    var lastUsedAt: Instant? = null,
    
    @ManyToMany(mappedBy = "tags", fetch = FetchType.LAZY)
    val expenses: MutableSet<Expense> = mutableSetOf(),
    
    @Embedded
    val auditInfo: AuditInfo = AuditInfo()
) {
    init {
        require(name.isNotBlank()) { "Tag name cannot be blank" }
        require(nameNormalized.isNotBlank()) { "Normalized name cannot be blank" }
        require(color.matches(Regex("^#[0-9A-Fa-f]{6}$"))) { "Color must be a valid hex code (e.g., #FF5733)" }
        require(scope == TagScope.TENANT || ownerId != null) { "Personal tags must have an owner" }
    }
    
    /**
     * Increments the usage count and updates last used timestamp.
     */
    fun incrementUsage() {
        usageCount++
        lastUsedAt = Instant.now()
    }
    
    /**
     * Checks if this tag is accessible by the given user.
     * @param userId The user attempting to access the tag
     * @return true if the tag is accessible
     */
    fun isAccessibleBy(userId: UUID): Boolean {
        return when (scope) {
            TagScope.TENANT -> true
            TagScope.PERSONAL -> ownerId == userId
        }
    }
    
    /**
     * Checks if this is a personal tag.
     * @return true if the tag scope is PERSONAL
     */
    fun isPersonal(): Boolean = scope == TagScope.PERSONAL
    
    /**
     * Checks if this is a shared tenant tag.
     * @return true if the tag scope is TENANT
     */
    fun isShared(): Boolean = scope == TagScope.TENANT
    
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Tag) return false
        return id == other.id
    }
    
    override fun hashCode(): Int = id.hashCode()
    
    override fun toString(): String {
        return "Tag(id=$id, name='$name', scope=$scope, usageCount=$usageCount)"
    }
    
    companion object {
        /**
         * Normalizes a tag name for search and uniqueness.
         * @param name The tag name to normalize
         * @return The normalized tag name
         */
        fun normalizeName(name: String): String {
            return name.trim().lowercase().replace(Regex("\\s+"), " ")
        }
    }
}

/**
 * Enum representing the scope of a tag.
 */
enum class TagScope {
    /** Tag is visible to all users in the tenant */
    TENANT,
    
    /** Tag is visible only to the owner */
    PERSONAL
}