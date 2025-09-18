package com.astarworks.astarmanagement.core.editor.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.editor.domain.model.DocumentNode
import com.astarworks.astarmanagement.core.editor.domain.model.DocumentNodeType
import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import java.sql.ResultSet
import java.util.UUID
import org.springframework.stereotype.Component

@Component
class DocumentNodeMapper {

    fun mapRow(rs: ResultSet): DocumentNode {
        val parentId = rs.getString("parent_id")?.let { DocumentNodeId(UUID.fromString(it)) }
        val updatedBy = rs.getString("updated_by")?.let { UserId(UUID.fromString(it)) }

        return DocumentNode(
            id = DocumentNodeId(UUID.fromString(rs.getString("id"))),
            tenantId = TenantId(UUID.fromString(rs.getString("tenant_id"))),
            workspaceId = WorkspaceId(UUID.fromString(rs.getString("workspace_id"))),
            parentId = parentId,
            type = DocumentNodeType.valueOf(rs.getString("type")),
            title = rs.getString("title"),
            slug = rs.getString("slug"),
            materializedPath = rs.getString("materialized_path"),
            depth = rs.getInt("depth"),
            position = rs.getDouble("position"),
            isArchived = rs.getBoolean("is_archived"),
            createdBy = UserId(UUID.fromString(rs.getString("created_by"))),
            updatedBy = updatedBy,
            createdAt = rs.getTimestamp("created_at").toInstant(),
            updatedAt = rs.getTimestamp("updated_at").toInstant(),
            version = rs.getLong("version"),
        )
    }
}
