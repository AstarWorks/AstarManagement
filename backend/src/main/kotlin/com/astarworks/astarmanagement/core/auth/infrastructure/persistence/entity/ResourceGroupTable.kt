package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity

import com.astarworks.astarmanagement.core.auth.domain.model.ResourceType
import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant
import java.util.UUID

/**
 * Spring Data JDBC entity for resource_groups table.
 * Represents groups of resources that can be managed together for permission purposes.
 * 
 * リソースをグループ化して権限管理を簡素化するためのエンティティ。
 * 例: "プロジェクトA関連テーブル", "営業部門ドキュメント" など
 * 
 * Note: Indexes are managed at database level through migrations.
 * Relationships are handled through repository queries in Spring Data JDBC.
 */
@Table("resource_groups")
data class SpringDataJdbcResourceGroupTable(
    @Id
    val id: UUID = UUID.randomUUID(),
    
    @Column("tenant_id")
    val tenantId: UUID,
    
    @Column("name")
    val name: String,
    
    @Column("description")
    val description: String? = null,
    
    @Column("resource_type")
    val resourceType: ResourceType, // Resource type enum
    
    @Column("created_at")
    val createdAt: Instant = Instant.now(),
    
    @Column("created_by")
    val createdBy: UUID,
    
    @Column("updated_at")
    val updatedAt: Instant = Instant.now(),
    
    @Column("is_active")
    val isActive: Boolean = true
)