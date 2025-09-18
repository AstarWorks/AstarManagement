package com.astarworks.astarmanagement.core.editor.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.editor.domain.model.DocumentMetadata
import com.astarworks.astarmanagement.core.editor.domain.repository.DocumentMetadataRepository
import com.astarworks.astarmanagement.core.editor.infrastructure.persistence.mapper.DocumentMetadataMapper
import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import java.sql.Timestamp
import java.sql.Array as SqlArray
import com.astarworks.astarmanagement.shared.exception.OptimisticLockException
import org.springframework.dao.EmptyResultDataAccessException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.RowMapper
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
class DocumentMetadataRepositoryImpl(
    private val jdbcTemplate: JdbcTemplate,
    private val mapper: DocumentMetadataMapper,
) : DocumentMetadataRepository {

    private val rowMapper: RowMapper<DocumentMetadata> = RowMapper { rs, _ -> mapper.mapRow(rs) }

    @Transactional
    override fun save(metadata: DocumentMetadata): DocumentMetadata {
        return if (exists(metadata.documentId)) {
            update(metadata)
        } else {
            insert(metadata)
        }
    }

    override fun findByDocumentId(documentId: DocumentNodeId): DocumentMetadata? {
        val sql = "SELECT * FROM document_metadata WHERE document_id = ?"
        return querySingle(sql, arrayOf<Any?>(documentId.value))
    }

    override fun findByTenant(
        tenantId: TenantId,
        workspaceId: WorkspaceId,
        includeUnpublished: Boolean,
    ): List<DocumentMetadata> {
        val sql = StringBuilder(
            "SELECT * FROM document_metadata WHERE tenant_id = ? AND workspace_id = ?"
        )
        val params = mutableListOf<Any?>(tenantId.value, workspaceId.value)

        if (!includeUnpublished) {
            sql.append(" AND is_published = true")
        }

        sql.append(" ORDER BY updated_at DESC")

        val arrayParams = params.toTypedArray()
        return jdbcTemplate.query(sql.toString(), rowMapper, *arrayParams)
    }

    @Transactional
    override fun deleteByDocumentId(documentId: DocumentNodeId) {
        val sql = "DELETE FROM document_metadata WHERE document_id = ?"
        jdbcTemplate.update(sql, documentId.value)
    }

    private fun exists(documentId: DocumentNodeId): Boolean {
        val sql = "SELECT EXISTS (SELECT 1 FROM document_metadata WHERE document_id = ?)"
        return jdbcTemplate.queryForObject(sql, Boolean::class.java, documentId.value) ?: false
    }

    private fun insert(metadata: DocumentMetadata): DocumentMetadata {
        val sql = """
            INSERT INTO document_metadata (
                document_id,
                tenant_id,
                workspace_id,
                metadata,
                tags,
                is_published,
                is_favorited,
                last_viewed_at,
                last_indexed_at,
                created_at,
                updated_at,
                version
            ) VALUES (?, ?, ?, ?::jsonb, ?::text[], ?, ?, ?, ?, ?, ?, 0)
            RETURNING *
        """.trimIndent()

        val tagsArray = createTagsArray(metadata.tags)
        val params = arrayOf<Any?>(
            metadata.documentId.value,
            metadata.tenantId.value,
            metadata.workspaceId.value,
            mapper.metadataToJson(metadata.metadata),
            tagsArray,
            metadata.isPublished,
            metadata.isFavorited,
            metadata.lastViewedAt?.let { Timestamp.from(it) },
            metadata.lastIndexedAt?.let { Timestamp.from(it) },
            Timestamp.from(metadata.createdAt),
            Timestamp.from(metadata.updatedAt)
        )

        val result = jdbcTemplate.query(sql, rowMapper, *params).firstOrNull()
        tagsArray?.free()
        return result ?: throw IllegalStateException("Failed to insert document metadata")
    }

    private fun update(metadata: DocumentMetadata): DocumentMetadata {
        val sql = """
            UPDATE document_metadata
            SET metadata = ?::jsonb,
                tags = ?::text[],
                is_published = ?,
                is_favorited = ?,
                last_viewed_at = ?,
                last_indexed_at = ?,
                updated_at = ?,
                version = version + 1
            WHERE document_id = ? AND version = ?
            RETURNING *
        """.trimIndent()

        val tagsArray = createTagsArray(metadata.tags)
        val params = arrayOf<Any?>(
            mapper.metadataToJson(metadata.metadata),
            tagsArray,
            metadata.isPublished,
            metadata.isFavorited,
            metadata.lastViewedAt?.let { Timestamp.from(it) },
            metadata.lastIndexedAt?.let { Timestamp.from(it) },
            Timestamp.from(metadata.updatedAt),
            metadata.documentId.value,
            metadata.version,
        )

        val result = jdbcTemplate.query(sql, rowMapper, *params).firstOrNull()
        tagsArray?.free()
        return result ?: throw OptimisticLockException("Document metadata for ${metadata.documentId.value} was modified by another transaction")
    }

    private fun querySingle(sql: String, params: Array<Any?>): DocumentMetadata? {
        return try {
            jdbcTemplate.query(sql, rowMapper, *params).firstOrNull()
        } catch (_: EmptyResultDataAccessException) {
            null
        }
    }

    private fun createTagsArray(tags: List<String>): SqlArray? {
        val dataSource = jdbcTemplate.dataSource ?: return null
        return dataSource.connection.use { connection ->
            connection.createArrayOf("text", tags.toTypedArray())
        }
    }
}
