package com.astarworks.astarmanagement.core.editor.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.editor.domain.model.DocumentRevision
import com.astarworks.astarmanagement.core.editor.domain.repository.DocumentRevisionRepository
import com.astarworks.astarmanagement.core.editor.infrastructure.persistence.mapper.DocumentRevisionMapper
import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.DocumentRevisionId
import org.springframework.dao.EmptyResultDataAccessException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.RowMapper
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.sql.Timestamp

@Component
class DocumentRevisionRepositoryImpl(
    private val jdbcTemplate: JdbcTemplate,
    private val mapper: DocumentRevisionMapper,
) : DocumentRevisionRepository {

    private val rowMapper: RowMapper<DocumentRevision> = RowMapper { rs, _ -> mapper.mapRow(rs) }

    @Transactional
    override fun save(revision: DocumentRevision): DocumentRevision {
        return if (existsById(revision.id)) {
            update(revision)
        } else {
            insert(revision)
        }
    }

    override fun findById(id: DocumentRevisionId): DocumentRevision? {
        val sql = "SELECT * FROM document_revisions WHERE id = ?"
        return querySingle(sql, arrayOf<Any?>(id.value))
    }

    override fun findLatest(documentId: DocumentNodeId): DocumentRevision? {
        val sql = """
            SELECT * FROM document_revisions
            WHERE document_id = ?
            ORDER BY revision_number DESC
            LIMIT 1
        """.trimIndent()
        return jdbcTemplate.query(sql, rowMapper, documentId.value).firstOrNull()
    }

    override fun findByDocumentId(documentId: DocumentNodeId): List<DocumentRevision> {
        val sql = """
            SELECT * FROM document_revisions
            WHERE document_id = ?
            ORDER BY revision_number DESC
        """.trimIndent()
        return jdbcTemplate.query(sql, rowMapper, documentId.value)
    }

    override fun countByDocumentId(documentId: DocumentNodeId): Long {
        val sql = "SELECT COUNT(*) FROM document_revisions WHERE document_id = ?"
        return jdbcTemplate.queryForObject(sql, Long::class.java, documentId.value) ?: 0L
    }

    private fun existsById(id: DocumentRevisionId): Boolean {
        val sql = "SELECT EXISTS (SELECT 1 FROM document_revisions WHERE id = ?)"
        return jdbcTemplate.queryForObject(sql, Boolean::class.java, id.value) ?: false
    }

    private fun insert(revision: DocumentRevision): DocumentRevision {
        val sql = """
            INSERT INTO document_revisions (
                id,
                tenant_id,
                workspace_id,
                document_id,
                revision_number,
                title_snapshot,
                author_id,
                summary,
                content_plaintext,
                content_type,
                size_bytes,
                checksum,
                ciphertext,
                dek_ciphertext,
                nonce,
                compression,
                created_at,
                version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            RETURNING *
        """.trimIndent()

        val params = arrayOf<Any?>(
            revision.id.value,
            revision.tenantId.value,
            revision.workspaceId.value,
            revision.documentId.value,
            revision.revisionNumber,
            revision.titleSnapshot,
            revision.authorId.value,
            revision.summary,
            revision.contentPlaintext,
            revision.contentType,
            revision.sizeBytes,
            revision.checksum,
            revision.ciphertext,
            revision.dekCiphertext,
            revision.nonce,
            revision.compression,
            Timestamp.from(revision.createdAt)
        )

        return jdbcTemplate.query(sql, rowMapper, *params).firstOrNull()
            ?: throw IllegalStateException("Failed to insert document revision")
    }

    private fun update(revision: DocumentRevision): DocumentRevision {
        val sql = """
            UPDATE document_revisions
            SET summary = ?,
                content_plaintext = ?,
                content_type = ?,
                size_bytes = ?,
                checksum = ?,
                ciphertext = ?,
                dek_ciphertext = ?,
                nonce = ?,
                compression = ?,
                version = version + 1
            WHERE id = ?
            RETURNING *
        """.trimIndent()

        val params = arrayOf<Any?>(
            revision.summary,
            revision.contentPlaintext,
            revision.contentType,
            revision.sizeBytes,
            revision.checksum,
            revision.ciphertext,
            revision.dekCiphertext,
            revision.nonce,
            revision.compression,
            revision.id.value
        )

        return jdbcTemplate.query(sql, rowMapper, *params).firstOrNull()
            ?: throw IllegalStateException("Failed to update document revision ${revision.id}")
    }

    private fun querySingle(sql: String, params: Array<Any?>): DocumentRevision? {
        return try {
            jdbcTemplate.query(sql, rowMapper, *params).firstOrNull()
        } catch (_: EmptyResultDataAccessException) {
            null
        }
    }
}
