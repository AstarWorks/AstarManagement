package com.astarworks.astarmanagement.core.editor.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.editor.domain.model.DocumentRevision
import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.DocumentRevisionId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import java.sql.ResultSet
import java.util.UUID
import org.springframework.stereotype.Component

@Component
class DocumentRevisionMapper {

    fun mapRow(rs: ResultSet): DocumentRevision {
        val sizeBytes = rs.getLong("size_bytes").let { value ->
            if (rs.wasNull()) null else value
        }

        return DocumentRevision(
            id = DocumentRevisionId(UUID.fromString(rs.getString("id"))),
            tenantId = TenantId(UUID.fromString(rs.getString("tenant_id"))),
            workspaceId = WorkspaceId(UUID.fromString(rs.getString("workspace_id"))),
            documentId = DocumentNodeId(UUID.fromString(rs.getString("document_id"))),
            revisionNumber = rs.getInt("revision_number"),
            titleSnapshot = rs.getString("title_snapshot"),
            authorId = UserId(UUID.fromString(rs.getString("author_id"))),
            summary = rs.getString("summary"),
            contentPlaintext = rs.getString("content_plaintext"),
            contentType = rs.getString("content_type"),
            sizeBytes = sizeBytes,
            checksum = rs.getString("checksum"),
            ciphertext = rs.getBytes("ciphertext"),
            dekCiphertext = rs.getBytes("dek_ciphertext"),
            nonce = rs.getBytes("nonce"),
            compression = rs.getString("compression"),
            createdAt = rs.getTimestamp("created_at").toInstant()
        )
    }
}
