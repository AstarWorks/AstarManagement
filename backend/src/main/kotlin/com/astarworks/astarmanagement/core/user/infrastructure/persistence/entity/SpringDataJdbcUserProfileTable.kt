package com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity

import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.UserProfileId
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

/**
 * Spring Data JDBC entity for user_profiles table.
 * Stores display information for users (display name, avatar).
 * One-to-one relationship with users table via user_id.
 */
@Table("user_profiles")
data class SpringDataJdbcUserProfileTable(
    @Id
    val id: UserProfileId,
    
    @Version
    val version: Long? = null,  // Spring Data JDBC: null = new entity
    
    @Column("user_id")
    val userId: UserId,
    
    @Column("display_name")
    val displayName: String? = null,
    
    @Column("avatar_url")
    val avatarUrl: String? = null,
    
    @Column("created_at")
    val createdAt: Instant,
    
    @Column("updated_at")
    val updatedAt: Instant
)