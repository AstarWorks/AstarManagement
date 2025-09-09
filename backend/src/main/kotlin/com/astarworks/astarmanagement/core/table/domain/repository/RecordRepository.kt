package com.astarworks.astarmanagement.core.table.domain.repository

import com.astarworks.astarmanagement.core.table.domain.model.Record
import com.astarworks.astarmanagement.shared.domain.value.RecordId
import com.astarworks.astarmanagement.shared.domain.value.TableId
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.UUID

/**
 * Repository interface for Record domain entity.
 * Manages actual data rows for dynamic tables.
 */
interface RecordRepository {
    
    /**
     * Save or update a record.
     */
    fun save(record: Record): Record
    
    /**
     * Save or update multiple records.
     * Optimized for batch operations.
     */
    fun saveAll(records: List<Record>): List<Record>
    
    /**
     * Find a record by its ID.
     */
    fun findById(id: RecordId): Record?
    
    /**
     * Find all records in a table.
     */
    fun findByTableId(tableId: TableId): List<Record>
    
    /**
     * Find all records in a table, ordered by position.
     * Used for manual sorting/ordering.
     */
    fun findByTableIdOrderByPosition(tableId: TableId): List<Record>
    
    /**
     * Find all records in a table, ordered by position, with pagination support.
     * More efficient for large tables using Spring Data Page objects.
     */
    fun findByTableIdOrderByPosition(tableId: TableId, pageable: Pageable): Page<Record>
    
    /**
     * Find records by table ID with pagination.
     */
    fun findByTableIdWithPagination(
        tableId: TableId,
        offset: Int,
        limit: Int
    ): List<Record>
    
    /**
     * Find records between two positions in a table.
     * Useful for reordering operations.
     */
    fun findByTableIdAndPositionBetween(
        tableId: TableId,
        startPosition: Float,
        endPosition: Float
    ): List<Record>
    
    /**
     * Check if a record exists by ID.
     */
    fun existsById(id: RecordId): Boolean
    
    /**
     * Delete a record by ID.
     */
    fun deleteById(id: RecordId)
    
    /**
     * Delete multiple records by IDs.
     * Optimized for batch deletion.
     */
    fun deleteAllById(ids: List<RecordId>)
    
    /**
     * Delete all records in a table.
     * @return The number of deleted records
     */
    fun deleteByTableId(tableId: TableId): Int
    
    /**
     * Count all records.
     */
    fun count(): Long
    
    /**
     * Count records in a specific table.
     */
    fun countByTableId(tableId: TableId): Long
    
    /**
     * Get the maximum position value in a table.
     * Used for adding new records at the end.
     */
    fun findMaxPositionByTableId(tableId: TableId): Float?
    
    /**
     * Find the last record in a table ordered by position.
     * Used for calculating position for new records.
     */
    fun findTopByTableIdOrderByPositionDesc(tableId: TableId): Record?
    
    /**
     * Delete multiple records by IDs.
     * Alias for deleteAllById for compatibility.
     */
    fun deleteByIdIn(ids: List<RecordId>) = deleteAllById(ids)
}