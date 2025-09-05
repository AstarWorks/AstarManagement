package com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity

import com.astarworks.astarmanagement.shared.domain.value.UserId
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

/**
 * Spring Data JDBC entity for user table operations.
 * This entity maps directly to the database table structure.
 */
@Table("users")
data class SpringDataJdbcUserTable(
    @Id
    val id: UserId,
    
    @Version
    val version: Long? = null,  // Spring Data JDBC: null = new entity
    
    @Column("auth0_sub")
    val auth0Sub: String,
    
    val email: String,
    
    @Column("created_at")
    val createdAt: Instant,
    
    @Column("updated_at")
    val updatedAt: Instant
)