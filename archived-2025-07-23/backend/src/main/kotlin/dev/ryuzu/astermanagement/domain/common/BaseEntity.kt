package dev.ryuzu.astermanagement.domain.common

import jakarta.persistence.*
import org.springframework.data.annotation.CreatedBy
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedBy
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime
import java.util.*

/**
 * Base entity class providing common auditing fields for all entities
 * Automatically tracks creation and modification timestamps and users
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener::class)
abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    open var id: UUID? = null

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    open var createdAt: LocalDateTime? = null

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    open var updatedAt: LocalDateTime? = null

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    open var createdBy: UUID? = null

    @LastModifiedBy
    @Column(name = "updated_by")
    open var updatedBy: UUID? = null

    /**
     * Entity equality based on ID
     */
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other == null || this::class != other::class) return false
        
        other as BaseEntity
        
        return id != null && id == other.id
    }

    override fun hashCode(): Int {
        return id?.hashCode() ?: 0
    }

    override fun toString(): String {
        return "${this::class.simpleName}(id=$id, createdAt=$createdAt, updatedAt=$updatedAt)"
    }
}