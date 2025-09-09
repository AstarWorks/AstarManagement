package com.astarworks.astarmanagement.core.table.domain.service

import com.astarworks.astarmanagement.core.table.domain.model.Record
import com.astarworks.astarmanagement.core.table.domain.repository.RecordRepository
import com.astarworks.astarmanagement.core.table.api.exception.*
import com.astarworks.astarmanagement.shared.domain.value.*
import kotlinx.serialization.json.JsonObject
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for managing records (data rows) in the flexible table system.
 * 
 * Simplified service focused on basic CRUD operations.
 * Data validation and business logic are handled at the controller level
 * or will be implemented in future iterations.
 */
@Service
@Transactional
class RecordService(
    private val recordRepository: RecordRepository,
    private val tableService: TableService
) {
    private val logger = LoggerFactory.getLogger(RecordService::class.java)
    
    companion object {
        const val MAX_BATCH_SIZE = 1000
        const val DEFAULT_PAGE_SIZE = 50
    }
    
    /**
     * Creates a new record in a table.
     * 
     * @param tableId The table ID
     * @param dataJson The record data as JSON string
     * @param position Optional position for manual sorting
     * @return The created record
     */
    fun createRecord(
        tableId: UUID,
        data: JsonObject,
        position: Float? = null
    ): Record {
        logger.debug("Creating record in table: $tableId")
        
        // Ensure table exists (basic validation)
        val table = tableService.getTableById(TableId(tableId))
        
        // Calculate position if not provided
        val recordPosition = position ?: run {
            val lastRecord = recordRepository.findTopByTableIdOrderByPositionDesc(TableId(tableId))
            if (lastRecord != null) {
                Record.nextPosition(lastRecord.position)
            } else {
                Record.firstPosition()
            }
        }
        
        val record = Record.create(
            tableId = TableId(tableId),
            data = data,
            position = recordPosition
        )
        
        val savedRecord = recordRepository.save(record)
        logger.info("Created record with ID: ${savedRecord.id}")
        
        return savedRecord
    }
    
    /**
     * Creates multiple records in a table (batch operation).
     */
    fun createRecords(
        tableId: UUID,
        recordsData: List<JsonObject>
    ): List<Record> {
        if (recordsData.size > MAX_BATCH_SIZE) {
            throw IllegalArgumentException("Batch size cannot exceed $MAX_BATCH_SIZE")
        }
        
        logger.debug("Creating ${recordsData.size} records in table: $tableId")
        
        // Ensure table exists
        val table = tableService.getTableById(TableId(tableId))
        val tableIdValue = TableId(tableId)
        
        // Generate positions for all records
        val lastRecord = recordRepository.findTopByTableIdOrderByPositionDesc(tableIdValue)
        var currentPosition = lastRecord?.position ?: Record.DEFAULT_POSITION
        
        val records = recordsData.map { data ->
            currentPosition += Record.POSITION_INCREMENT
            Record.create(
                tableId = tableIdValue,
                data = data,
                position = currentPosition
            )
        }
        
        val savedRecords = recordRepository.saveAll(records)
        logger.info("Created ${savedRecords.size} records in table: $tableId")
        
        return savedRecords
    }
    
    /**
     * Updates an existing record.
     */
    fun updateRecord(
        recordId: UUID,
        data: JsonObject
    ): Record {
        logger.debug("Updating record: $recordId")
        
        val record = recordRepository.findById(RecordId(recordId))
            ?: throw RecordNotFoundException.of(RecordId(recordId))
        
        val updatedRecord = record.updateData(data)
        val savedRecord = recordRepository.save(updatedRecord)
        
        logger.info("Updated record: $recordId")
        return savedRecord
    }
    
    /**
     * Updates record position for manual sorting.
     */
    fun updateRecordPosition(
        recordId: UUID,
        position: Float
    ): Record {
        logger.debug("Updating record position: $recordId to $position")
        
        val record = recordRepository.findById(RecordId(recordId))
            ?: throw RecordNotFoundException.of(RecordId(recordId))
        
        val updatedRecord = record.updatePosition(position)
        val savedRecord = recordRepository.save(updatedRecord)
        
        logger.info("Updated record position: $recordId")
        return savedRecord
    }
    
    /**
     * Deletes a record.
     */
    fun deleteRecord(recordId: UUID) {
        logger.debug("Deleting record: $recordId")
        
        val recordIdValue = RecordId(recordId)
        if (!recordRepository.existsById(recordIdValue)) {
            throw RecordNotFoundException.of(recordIdValue)
        }
        
        recordRepository.deleteById(recordIdValue)
        logger.info("Deleted record: $recordId")
    }
    
    /**
     * Deletes multiple records (batch operation).
     */
    fun deleteRecords(recordIds: List<UUID>) {
        if (recordIds.size > MAX_BATCH_SIZE) {
            throw IllegalArgumentException("Batch size cannot exceed $MAX_BATCH_SIZE")
        }
        
        logger.debug("Deleting ${recordIds.size} records")
        
        val recordIdValues = recordIds.map { RecordId(it) }
        recordRepository.deleteByIdIn(recordIdValues)
        
        logger.info("Deleted ${recordIds.size} records")
    }
    
    /**
     * Finds a record by ID.
     */
    @Transactional(readOnly = true)
    fun findById(recordId: UUID): Record {
        return recordRepository.findById(RecordId(recordId))
            ?: throw RecordNotFoundException.of(RecordId(recordId))
    }
    
    /**
     * Finds all records in a table with pagination.
     */
    @Transactional(readOnly = true)
    fun findByTableId(
        tableId: UUID,
        pageable: Pageable = PageRequest.of(0, DEFAULT_PAGE_SIZE)
    ): Page<Record> {
        logger.debug("Finding records in table: $tableId")
        
        // Ensure table exists
        val table = tableService.getTableById(TableId(tableId))
        
        return recordRepository.findByTableIdOrderByPosition(TableId(tableId), pageable)
    }
    
    /**
     * Finds all records in a table (without pagination).
     */
    @Transactional(readOnly = true)
    fun findAllByTableId(tableId: UUID): List<Record> {
        logger.debug("Finding all records in table: $tableId")
        
        // Ensure table exists
        val table = tableService.getTableById(TableId(tableId))
        
        return recordRepository.findByTableIdOrderByPosition(TableId(tableId))
    }
    
    /**
     * Counts records in a table.
     */
    @Transactional(readOnly = true)
    fun countByTableId(tableId: UUID): Long {
        return recordRepository.countByTableId(TableId(tableId))
    }
    
    /**
     * Checks if a record exists.
     */
    @Transactional(readOnly = true)
    fun existsById(recordId: UUID): Boolean {
        return recordRepository.existsById(RecordId(recordId))
    }
    
    /**
     * Deletes all records in a table.
     */
    fun deleteAllByTableId(tableId: UUID) {
        logger.debug("Deleting all records in table: $tableId")
        
        val deletedCount = recordRepository.deleteByTableId(TableId(tableId))
        logger.info("Deleted $deletedCount records from table: $tableId")
    }
    
    // ===== Compatibility methods for controllers =====
    
    /**
     * Alias for countByTableId for compatibility.
     */
    fun countRecords(tableId: UUID): Long = countByTableId(tableId)
    
    /**
     * Alias for deleteAllByTableId for compatibility.
     */
    fun clearTable(tableId: UUID) = deleteAllByTableId(tableId)
    
    /**
     * Alias for findByTableId for compatibility.
     */
    fun getRecordsByTablePaged(tableId: UUID, pageable: Pageable): Page<Record> = 
        findByTableId(tableId, pageable)
    
    /**
     * Alias for findById for compatibility.
     */
    fun getRecordById(recordId: UUID): Record = findById(recordId)
    
    /**
     * Alias for findAllByTableId for compatibility.
     */
    fun getRecordsByTableOrdered(tableId: UUID): List<Record> = findAllByTableId(tableId)
    
    /**
     * Copies records to create duplicates.
     */
    fun copyRecords(
        sourceRecordIds: List<UUID>,
        targetTableId: UUID,
        position: Float? = null
    ): List<Record> {
        logger.debug("Copying ${sourceRecordIds.size} records to table: $targetTableId")
        
        val sourceRecords = sourceRecordIds.map { id ->
            findById(id)
        }
        
        val targetTableIdValue = TableId(targetTableId)
        var currentPosition = position ?: run {
            val lastRecord = recordRepository.findTopByTableIdOrderByPositionDesc(targetTableIdValue)
            lastRecord?.position ?: Record.DEFAULT_POSITION
        }
        
        val copiedRecords = sourceRecords.map { source ->
            currentPosition += Record.POSITION_INCREMENT
            Record.create(
                tableId = targetTableIdValue,
                data = source.data,
                position = currentPosition
            )
        }
        
        return recordRepository.saveAll(copiedRecords)
    }
    
    /**
     * Moves a record to a new position.
     */
    fun moveRecord(
        recordId: UUID,
        afterRecordId: UUID?
    ): Record {
        logger.debug("Moving record $recordId after $afterRecordId")
        
        val record = findById(recordId)
        val tableRecords = findAllByTableId(record.tableId.value)
        
        val afterRecord = afterRecordId?.let { id ->
            tableRecords.find { it.id.value == id }
        }
        
        val beforeRecord = if (afterRecord != null) {
            val index = tableRecords.indexOf(afterRecord)
            if (index < tableRecords.size - 1) tableRecords[index + 1] else null
        } else {
            tableRecords.firstOrNull { it.id.value != recordId }
        }
        
        val newPosition = Record.positionBetween(
            afterRecord?.position,
            beforeRecord?.position
        )
        
        return updateRecordPosition(recordId, newPosition)
    }
    
    /**
     * Reorders multiple records.
     */
    fun reorderRecords(
        tableId: UUID,
        recordIds: List<UUID>
    ): List<Record> {
        logger.debug("Reordering ${recordIds.size} records in table: $tableId")
        
        var position = Record.DEFAULT_POSITION
        val reorderedRecords = recordIds.map { id ->
            val record = findById(id)
            position += Record.POSITION_INCREMENT
            record.updatePosition(position)
        }
        
        return recordRepository.saveAll(reorderedRecords)
    }
}