package com.astarworks.astarmanagement.core.table.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.table.domain.model.Table
import com.astarworks.astarmanagement.core.table.domain.repository.TableRepository
import com.astarworks.astarmanagement.core.table.infrastructure.persistence.mapper.TableMapper
import com.astarworks.astarmanagement.shared.domain.value.TableId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import com.astarworks.astarmanagement.shared.infrastructure.persistence.BaseJsonbRepository
import org.springframework.dao.EmptyResultDataAccessException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.sql.ResultSet
import java.sql.Timestamp
import java.time.Instant

/**
 * Implementation of TableRepository using BaseJsonbRepository pattern.
 * Manages table (dynamic table definition) persistence operations.
 * 
 * Extends BaseJsonbRepository to leverage common JSONB handling and optimistic locking.
 */
@Component
class TableRepositoryImpl(
    jdbcTemplate: JdbcTemplate,
    private val mapper: TableMapper
) : BaseJsonbRepository<Table, TableId>(jdbcTemplate), TableRepository {
    
    override val tableName = "tables"
    override val idColumn = "id"
    override val jsonbColumns = listOf("properties")
    // arrayColumns not needed - using java.sql.Array directly
    override val allColumns = listOf(
        "id",
        "workspace_id",
        "name",
        "description",
        "properties",
        "property_order",
        "created_at",
        "updated_at"
    )
    
    override fun mapRow(rs: ResultSet): Table {
        return mapper.mapRowToTable(rs)
    }
    
    override fun getId(entity: Table): TableId {
        return entity.id
    }
    
    override fun getVersion(entity: Table): Long? {
        // Table entity doesn't have version field yet, return null
        // This will use COALESCE(version, 0) in SQL
        return null
    }
    
    override fun getInsertParams(entity: Table): Array<Any?> {
        // Create proper PostgreSQL array for property_order
        val propertyOrderArray: java.sql.Array = jdbcTemplate.dataSource?.connection?.use { conn ->
            conn.createArrayOf("text", entity.propertyOrder.toTypedArray())
        } ?: throw IllegalStateException("Failed to create property_order array")
        
        return arrayOf(
            entity.id.value,
            entity.workspaceId.value,
            entity.name,
            entity.description,
            mapper.propertiesToJson(entity.properties),
            propertyOrderArray,
            Timestamp.from(entity.createdAt),
            Timestamp.from(entity.updatedAt)
        )
    }
    
    override fun getUpdateParams(entity: Table): Array<Any?> {
        // Create proper PostgreSQL array for property_order
        val propertyOrderArray: java.sql.Array = jdbcTemplate.dataSource?.connection?.use { conn ->
            conn.createArrayOf("text", entity.propertyOrder.toTypedArray())
        } ?: throw IllegalStateException("Failed to create property_order array")
        
        // Parameters for SET clause (excluding id column)
        return arrayOf(
            entity.workspaceId.value,
            entity.name,
            entity.description,
            mapper.propertiesToJson(entity.properties),
            propertyOrderArray,
            Timestamp.from(entity.createdAt),
            Timestamp.from(Instant.now()) // updated_at
        )
    }
    
    // Override update to handle workspace_id in WHERE clause
    override fun update(entity: Table): Table {
        val sql = """
            UPDATE $tableName 
            SET workspace_id = ?,
                name = ?,
                description = ?, 
                properties = ?::jsonb, 
                property_order = ?, 
                created_at = ?,
                updated_at = ?,
                version = COALESCE(version, 0) + 1
            WHERE id = ?
            RETURNING *
        """.trimIndent()
        
        val updateParams = getUpdateParams(entity)
        val allParams = updateParams.plus(entity.id.value)
        
        val result = try {
            jdbcTemplate.queryForObject(sql, rowMapper, *allParams)
        } catch (e: EmptyResultDataAccessException) {
            null
        }
        
        return result ?: throw IllegalStateException("Failed to update table with id: ${entity.id}")
    }
    
    // TableRepository specific methods
    
    @Transactional(readOnly = true)
    override fun findByWorkspaceId(workspaceId: WorkspaceId): List<Table> {
        val sql = "SELECT * FROM $tableName WHERE workspace_id = ? ORDER BY created_at DESC"
        return jdbcTemplate.query(sql, rowMapper, workspaceId.value)
    }
    
    @Transactional(readOnly = true)
    override fun findByWorkspaceIdAndName(workspaceId: WorkspaceId, name: String): Table? {
        val sql = "SELECT * FROM $tableName WHERE workspace_id = ? AND name = ?"
        
        return try {
            jdbcTemplate.queryForObject(sql, rowMapper, workspaceId.value, name)
        } catch (e: EmptyResultDataAccessException) {
            null
        }
    }
    
    @Transactional(readOnly = true)
    override fun findByName(name: String): List<Table> {
        val sql = "SELECT * FROM $tableName WHERE name = ? ORDER BY created_at DESC"
        return jdbcTemplate.query(sql, rowMapper, name)
    }
    
    @Transactional(readOnly = true)
    override fun existsByWorkspaceIdAndName(workspaceId: WorkspaceId, name: String): Boolean {
        val sql = "SELECT EXISTS(SELECT 1 FROM $tableName WHERE workspace_id = ? AND name = ?)"
        return jdbcTemplate.queryForObject(sql, Boolean::class.java, workspaceId.value, name) ?: false
    }
    
    @Transactional
    override fun deleteByWorkspaceId(workspaceId: WorkspaceId) {
        val sql = "DELETE FROM $tableName WHERE workspace_id = ?"
        jdbcTemplate.update(sql, workspaceId.value)
    }
    
    @Transactional(readOnly = true)
    override fun countByWorkspaceId(workspaceId: WorkspaceId): Long {
        val sql = "SELECT COUNT(*) FROM $tableName WHERE workspace_id = ?"
        return jdbcTemplate.queryForObject(sql, Long::class.java, workspaceId.value) ?: 0L
    }
}