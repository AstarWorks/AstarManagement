package com.astarworks.astarmanagement.core.editor.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.editor.domain.model.DocumentMetadata
import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import java.sql.ResultSet
import java.sql.Timestamp
import java.util.UUID
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import org.springframework.stereotype.Component

@Component
class DocumentMetadataMapper(
    private val json: Json,
) {

    fun mapRow(rs: ResultSet): DocumentMetadata {
        val metadataJson = rs.getString("metadata")
        val metadata = if (metadataJson.isNullOrBlank() || metadataJson == "{}") {
            JsonObject(emptyMap())
        } else {
            runCatching { json.parseToJsonElement(metadataJson).jsonObject }
                .getOrElse { JsonObject(emptyMap()) }
        }

        val tagsArray = rs.getArray("tags")
        val tags = tagsArray?.array
            ?.let { array -> (array as Array<*>).mapNotNull { it?.toString() } }
            ?: emptyList()

        val createdAt = rs.getTimestamp("created_at")?.toInstant() ?: Timestamp(0).toInstant()
        val updatedAt = rs.getTimestamp("updated_at")?.toInstant() ?: createdAt

        return DocumentMetadata(
            documentId = DocumentNodeId(UUID.fromString(rs.getString("document_id"))),
            tenantId = TenantId(UUID.fromString(rs.getString("tenant_id"))),
            workspaceId = WorkspaceId(UUID.fromString(rs.getString("workspace_id"))),
            metadata = metadata,
            tags = tags,
            isPublished = rs.getBoolean("is_published"),
            isFavorited = rs.getBoolean("is_favorited"),
            lastViewedAt = rs.getTimestamp("last_viewed_at")?.toInstant(),
            lastIndexedAt = rs.getTimestamp("last_indexed_at")?.toInstant(),
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }

    fun metadataToJson(metadata: JsonObject): String {
        return json.encodeToString(JsonObject.serializer(), metadata)
    }
}
