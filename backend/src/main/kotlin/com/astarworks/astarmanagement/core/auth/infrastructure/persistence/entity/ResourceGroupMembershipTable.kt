package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant
import java.util.UUID

/**
 * Spring Data JDBC entity for resource_group_memberships table.
 * Represents the many-to-many relationship between resource groups and actual resources.
 * 
 * リソースグループとリソースのM:N関係を管理。
 * 例: "プロジェクトAグループ" に複数のテーブルIDが所属
 * 
 * Note: Spring Data JDBC doesn't support composite keys the same way as JPA.
 * We use a surrogate key and enforce uniqueness at database level.
 */
@Table("resource_group_memberships")
data class SpringDataJdbcResourceGroupMembershipTable(
    @Id
    val id: UUID = UUID.randomUUID(),
    
    @Column("group_id")
    val groupId: UUID,
    
    @Column("resource_id")
    val resourceId: UUID, // The actual resource ID (table ID, document ID, etc.)
    
    @Column("added_at")
    val addedAt: Instant = Instant.now(),
    
    @Column("added_by")
    val addedBy: UUID
)