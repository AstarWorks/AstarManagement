package com.astarworks.astarmanagement.core.workspace.infrastructure.persistence.entity

import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.TeamId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

/**
 * Spring Data JDBC entity for workspace table operations.
 * This entity maps directly to the database table structure.
 */
@Table("workspaces")
data class SpringDataJdbcWorkspaceTable(
    @Id
    val id: WorkspaceId,
    
    @Version
    val version: Long? = null,  // Spring Data JDBC: null = new entity
    
    @Column("tenant_id")
    val tenantId: TenantId? = null,
    
    val name: String,
    
    @Column("created_by")
    val createdBy: UserId? = null,
    
    @Column("team_id")
    val teamId: TeamId? = null,
    
    @Column("created_at")
    val createdAt: Instant,
    
    @Column("updated_at")
    val updatedAt: Instant
)