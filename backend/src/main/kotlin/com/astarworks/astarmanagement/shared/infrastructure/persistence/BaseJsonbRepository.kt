package com.astarworks.astarmanagement.shared.infrastructure.persistence

import com.astarworks.astarmanagement.shared.domain.value.EntityId
import com.astarworks.astarmanagement.shared.exception.OptimisticLockException
import kotlinx.serialization.KSerializer
import kotlinx.serialization.json.Json
import org.springframework.dao.EmptyResultDataAccessException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.RowMapper
import java.sql.ResultSet
import java.sql.Timestamp
import java.time.Instant
import java.util.UUID

/**
 * Base repository for entities with JSONB columns.
 * Provides common CRUD operations with optimistic locking support.
 *
 * @param T The domain entity type
 * @param ID The EntityId type for the entity
 */
abstract class BaseJsonbRepository<T : Any, ID : EntityId<*>>(
    protected val jdbcTemplate: JdbcTemplate,
    protected val json: Json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
        encodeDefaults = false
    }
) {
    
    /**
     * The name of the database table.
     */
    protected abstract val tableName: String
    
    /**
     * The name of the ID column.
     */
    protected abstract val idColumn: String
    
    /**
     * The names of columns containing JSONB data.
     * These will be cast with ::jsonb in INSERT/UPDATE queries.
     */
    protected abstract val jsonbColumns: List<String>
    
    /**
     * All column names for the table (excluding version).
     */
    protected abstract val allColumns: List<String>
    
    /**
     * Maps a ResultSet row to the domain entity.
     */
    protected abstract fun mapRow(rs: ResultSet): T
    
    /**
     * Extracts the ID from a domain entity.
     */
    protected abstract fun getId(entity: T): ID
    
    /**
     * Extracts the version from a domain entity (for optimistic locking).
     * Return null if the entity doesn't support versioning.
     */
    protected open fun getVersion(entity: T): Long? = null
    
    /**
     * Creates the parameters array for an INSERT statement.
     * Should match the order of columns in allColumns.
     */
    protected abstract fun getInsertParams(entity: T): Array<Any?>
    
    /**
     * Creates the parameters array for an UPDATE statement.
     * Should exclude the ID column but include version check if applicable.
     */
    protected abstract fun getUpdateParams(entity: T): Array<Any?>
    
    /**
     * RowMapper implementation using the abstract mapRow method.
     */
    protected val rowMapper = RowMapper { rs, _ -> mapRow(rs) }
    
    /**
     * Saves an entity (insert or update based on existence).
     */
    open fun save(entity: T): T {
        return if (existsById(getId(entity))) {
            update(entity)
        } else {
            insert(entity)
        }
    }
    
    /**
     * The names of columns containing PostgreSQL array data.
     * These will be cast with appropriate array type in INSERT/UPDATE queries.
     */
    protected open val arrayColumns: Map<String, String> = emptyMap()
    
    /**
     * Inserts a new entity.
     */
    protected open fun insert(entity: T): T {
        val columnsStr = allColumns.joinToString(", ")
        val placeholders = allColumns.map { column ->
            when {
                column in jsonbColumns -> "?::jsonb"
                column in arrayColumns -> "?::${arrayColumns[column]}"
                else -> "?"
            }
        }.joinToString(", ")
        
        val sql = """
            INSERT INTO $tableName ($columnsStr, version)
            VALUES ($placeholders, 0)
            RETURNING *
        """.trimIndent()
        
        return jdbcTemplate.queryForObject(sql, rowMapper, *getInsertParams(entity))
            ?: throw IllegalStateException("Failed to insert entity")
    }
    
    /**
     * Updates an existing entity with optimistic locking.
     */
    protected open fun update(entity: T): T {
        val currentVersion = getVersion(entity)
        val setClause = allColumns
            .filter { it != idColumn }
            .map { column ->
                val cast = when {
                    column in jsonbColumns -> "::jsonb"
                    column in arrayColumns -> "::${arrayColumns[column]}"
                    else -> ""
                }
                "$column = ?$cast"
            }
            .joinToString(", ")
        
        val versionClause = if (currentVersion != null) {
            ", version = ? + 1"
        } else {
            ", version = COALESCE(version, 0) + 1"
        }
        
        val whereClause = if (currentVersion != null) {
            "WHERE $idColumn = ? AND version = ?"
        } else {
            "WHERE $idColumn = ?"
        }
        
        val sql = """
            UPDATE $tableName 
            SET $setClause$versionClause
            $whereClause
            RETURNING *
        """.trimIndent()
        
        val params = mutableListOf<Any?>()
        params.addAll(getUpdateParams(entity))
        
        if (currentVersion != null) {
            params.add(currentVersion)
            params.add(getId(entity).value)
            params.add(currentVersion)
        } else {
            params.add(getId(entity).value)
        }
        
        val updated = try {
            jdbcTemplate.queryForObject(sql, rowMapper, *params.toTypedArray())
        } catch (e: EmptyResultDataAccessException) {
            if (currentVersion != null) {
                throw OptimisticLockException("Entity was modified by another transaction")
            }
            null
        }
        
        return updated ?: throw IllegalStateException("Failed to update entity with id: ${getId(entity)}")
    }
    
    /**
     * Finds an entity by ID.
     */
    open fun findById(id: ID): T? {
        val sql = "SELECT * FROM $tableName WHERE $idColumn = ?"
        
        return try {
            jdbcTemplate.queryForObject(sql, rowMapper, id.value)
        } catch (e: EmptyResultDataAccessException) {
            null
        }
    }
    
    /**
     * Finds all entities.
     */
    open fun findAll(): List<T> {
        val sql = "SELECT * FROM $tableName ORDER BY created_at DESC"
        return jdbcTemplate.query(sql, rowMapper)
    }
    
    /**
     * Checks if an entity exists by ID.
     */
    open fun existsById(id: ID): Boolean {
        val sql = "SELECT EXISTS(SELECT 1 FROM $tableName WHERE $idColumn = ?)"
        return jdbcTemplate.queryForObject(sql, Boolean::class.java, id.value) ?: false
    }
    
    /**
     * Deletes an entity by ID.
     */
    open fun deleteById(id: ID) {
        val sql = "DELETE FROM $tableName WHERE $idColumn = ?"
        jdbcTemplate.update(sql, id.value)
    }
    
    /**
     * Counts all entities.
     */
    open fun count(): Long {
        val sql = "SELECT COUNT(*) FROM $tableName"
        return jdbcTemplate.queryForObject(sql, Long::class.java) ?: 0L
    }
    
    /**
     * Helper method to serialize an object to JSON string.
     */
    protected inline fun <reified T> toJson(value: T, serializer: KSerializer<T>): String {
        return json.encodeToString(serializer, value)
    }
    
    /**
     * Helper method to deserialize JSON string to an object.
     */
    protected inline fun <reified T> fromJson(jsonStr: String, serializer: KSerializer<T>): T {
        return json.decodeFromString(serializer, jsonStr)
    }
    
    /**
     * Helper method to convert a List to PostgreSQL array string.
     */
    protected fun listToPostgresArray(list: List<String>): String {
        return "{${list.joinToString(",") { "\"$it\"" }}}"
    }
    
    /**
     * Helper method to convert PostgreSQL array string to List.
     */
    protected fun postgresArrayToList(array: String?): List<String> {
        if (array == null || array == "{}") return emptyList()
        return array
            .removeSurrounding("{", "}")
            .split(",")
            .map { it.trim().removeSurrounding("\"") }
            .filter { it.isNotEmpty() }
    }
    
    /**
     * Helper method to get UUID from ResultSet.
     */
    protected fun ResultSet.getUUID(columnName: String): UUID {
        return UUID.fromString(getString(columnName))
    }
    
    /**
     * Helper method to get Instant from ResultSet.
     */
    protected fun ResultSet.getInstant(columnName: String): Instant {
        return getTimestamp(columnName).toInstant()
    }
}