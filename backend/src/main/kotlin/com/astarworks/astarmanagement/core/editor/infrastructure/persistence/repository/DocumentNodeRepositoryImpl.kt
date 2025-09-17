package com.astarworks.astarmanagement.core.editor.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.editor.domain.model.DocumentNode
import com.astarworks.astarmanagement.core.editor.domain.repository.DocumentNodeRepository
import com.astarworks.astarmanagement.core.editor.infrastructure.persistence.mapper.DocumentNodeMapper
import com.astarworks.astarmanagement.shared.domain.value.DocumentNodeId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import java.sql.Timestamp
import org.springframework.dao.EmptyResultDataAccessException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.RowMapper
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
class DocumentNodeRepositoryImpl(
    private val jdbcTemplate: JdbcTemplate,
    private val namedParameterJdbcTemplate: NamedParameterJdbcTemplate,
    private val mapper: DocumentNodeMapper,
) : DocumentNodeRepository {

    private val rowMapper: RowMapper<DocumentNode> = RowMapper { rs, _ -> mapper.mapRow(rs) }

    @Transactional
    override fun save(node: DocumentNode): DocumentNode {
        return if (existsById(node.id)) {
            update(node)
        } else {
            insert(node)
        }
    }

    override fun findById(id: DocumentNodeId): DocumentNode? {
        val sql = "SELECT * FROM document_nodes WHERE id = ?"
        return querySingle(sql, arrayOf<Any?>(id.value))
    }

    override fun findByTenantAndPath(tenantId: TenantId, workspaceId: WorkspaceId, path: String): DocumentNode? {
        val sql = """
            SELECT * FROM document_nodes
            WHERE tenant_id = ? AND workspace_id = ? AND materialized_path = ?
        """.trimIndent()
        return querySingle(sql, arrayOf<Any?>(tenantId.value, workspaceId.value, path))
    }

    override fun findByTenantAndSlug(
        tenantId: TenantId,
        workspaceId: WorkspaceId,
        parentId: DocumentNodeId?,
        slug: String,
    ): DocumentNode? {
        val baseSql = StringBuilder(
            "SELECT * FROM document_nodes WHERE tenant_id = ? AND workspace_id = ? AND slug = ?"
        )
        val params = mutableListOf<Any?>(tenantId.value, workspaceId.value, slug)

        if (parentId == null) {
            baseSql.append(" AND parent_id IS NULL")
        } else {
            baseSql.append(" AND parent_id = ?")
            params.add(parentId.value)
        }

        return querySingle(baseSql.toString(), params.toTypedArray())
    }

    override fun findChildren(
        tenantId: TenantId,
        workspaceId: WorkspaceId,
        parentId: DocumentNodeId?,
        includeArchived: Boolean,
    ): List<DocumentNode> {
        val sql = StringBuilder(
            "SELECT * FROM document_nodes WHERE tenant_id = ? AND workspace_id = ?"
        )
        val params = mutableListOf<Any?>(tenantId.value, workspaceId.value)

        if (parentId == null) {
            sql.append(" AND parent_id IS NULL")
        } else {
            sql.append(" AND parent_id = ?")
            params.add(parentId.value)
        }

        if (!includeArchived) {
            sql.append(" AND is_archived = false")
        }

        sql.append(" ORDER BY position ASC, created_at ASC")

        val arrayParams = params.toTypedArray()
        return jdbcTemplate.query(sql.toString(), rowMapper, *arrayParams)
    }

    override fun findByIds(ids: Collection<DocumentNodeId>): List<DocumentNode> {
        if (ids.isEmpty()) {
            return emptyList()
        }
        val uuidList = ids.map(DocumentNodeId::value)
        val sql = "SELECT * FROM document_nodes WHERE id IN (:ids)"
        val map = MapSqlParameterSource("ids", uuidList)
        return namedParameterJdbcTemplate.query(sql, map) { rs, _ -> mapper.mapRow(rs) }
    }

    override fun existsById(id: DocumentNodeId): Boolean {
        val sql = "SELECT EXISTS (SELECT 1 FROM document_nodes WHERE id = ?)"
        return jdbcTemplate.queryForObject(sql, Boolean::class.java, id.value) ?: false
    }

    @Transactional
    override fun deleteById(id: DocumentNodeId) {
        val sql = "DELETE FROM document_nodes WHERE id = ?"
        jdbcTemplate.update(sql, id.value)
    }

    private fun insert(node: DocumentNode): DocumentNode {
        val sql = """
            INSERT INTO document_nodes (
                id,
                tenant_id,
                workspace_id,
                parent_id,
                type,
                title,
                slug,
                materialized_path,
                depth,
                position,
                is_archived,
                created_by,
                updated_by,
                created_at,
                updated_at,
                version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            RETURNING *
        """.trimIndent()

        val params = arrayOf<Any?>(
            node.id.value,
            node.tenantId.value,
            node.workspaceId.value,
            node.parentId?.value,
            node.type.name,
            node.title,
            node.slug,
            node.materializedPath,
            node.depth,
            node.position,
            node.isArchived,
            node.createdBy.value,
            node.updatedBy?.value,
            Timestamp.from(node.createdAt),
            Timestamp.from(node.updatedAt)
        )

        return jdbcTemplate.query(sql, rowMapper, *params).firstOrNull()
            ?: throw IllegalStateException("Failed to insert document node")
    }

    private fun update(node: DocumentNode): DocumentNode {
        val sql = """
            UPDATE document_nodes
            SET title = ?,
                slug = ?,
                materialized_path = ?,
                depth = ?,
                position = ?,
                is_archived = ?,
                parent_id = ?,
                updated_by = ?,
                updated_at = ?,
                version = version + 1
            WHERE id = ?
            RETURNING *
        """.trimIndent()

        val params = arrayOf<Any?>(
            node.title,
            node.slug,
            node.materializedPath,
            node.depth,
            node.position,
            node.isArchived,
            node.parentId?.value,
            node.updatedBy?.value,
            Timestamp.from(node.updatedAt),
            node.id.value
        )

        return jdbcTemplate.query(sql, rowMapper, *params).firstOrNull()
            ?: throw IllegalStateException("Failed to update document node ${node.id}")
    }

    private fun querySingle(sql: String, params: Array<Any?>): DocumentNode? {
        return try {
            jdbcTemplate.query(sql, rowMapper, *params).firstOrNull()
        } catch (_: EmptyResultDataAccessException) {
            null
        }
    }
}
