package com.astarworks.astarmanagement.core.table.domain.service

import com.astarworks.astarmanagement.core.table.domain.model.Record
import com.astarworks.astarmanagement.core.table.domain.model.PropertyValue
import com.astarworks.astarmanagement.core.table.domain.model.PropertyTypeCatalog
import com.astarworks.astarmanagement.core.table.domain.model.PropertyDefinition
import com.astarworks.astarmanagement.core.table.domain.model.SelectOption
import com.astarworks.astarmanagement.core.table.domain.repository.RecordRepository
import com.astarworks.astarmanagement.core.table.api.exception.*
import com.astarworks.astarmanagement.shared.domain.value.*
import com.astarworks.astarmanagement.shared.exception.dto.ValidationError
import kotlinx.serialization.json.*
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for managing records (data rows) in the flexible table system.
 * 
 * Handles record operations including:
 * - Record CRUD operations
 * - Batch processing for bulk operations
 * - Position management for manual sorting
 * - Data validation against table schema
 * - Pagination for large datasets
 */
@Service
@Transactional
class RecordService(
    private val recordRepository: RecordRepository,
    private val tableService: TableService,
    private val propertyTypeCatalogService: PropertyTypeCatalogService
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
     * @param data The record data
     * @return The created record
     * @throws TableNotFoundException if table not found
     * @throws RecordValidationException if validation fails
     */
    fun createRecord(tableId: UUID, data: JsonObject): Record {
        logger.info("Creating record in table: $tableId")
        
        // Validate table exists
        val table = tableService.getTableById(TableId(tableId))
        
        // Validate record data against table schema
        val errors = validateRecordData(table, data)
        if (errors.isNotEmpty()) {
            val validationErrors = errors.map { ValidationError(it.substringBefore(":").trim(), it.substringAfter(":").trim()) }
            throw RecordValidationException.of(null, validationErrors)
        }
        
        // Calculate position for new record (at the end)
        val maxPosition = recordRepository.findMaxPositionByTableId(TableId(tableId))
        val position = if (maxPosition != null) {
            Record.nextPosition(maxPosition)
        } else {
            Record.firstPosition()
        }
        
        val record = Record.create(
            tableId = TableId(tableId),
            data = data,
            position = position
        )
        
        val savedRecord = recordRepository.save(record)
        logger.info("Created record with ID: ${savedRecord.id}")
        
        return savedRecord
    }
    
    /**
     * Creates multiple records in a table (batch operation).
     * 
     * @param tableId The table ID
     * @param dataList List of record data
     * @return List of created records
     * @throws TableNotFoundException if table not found
     * @throws RecordValidationException if validation fails
     * @throws BatchSizeExceededException if batch size exceeds limit
     */
    fun createRecords(tableId: UUID, dataList: List<JsonObject>): List<Record> {
        if (dataList.isEmpty()) {
            return emptyList()
        }
        
        if (dataList.size > MAX_BATCH_SIZE) {
            throw BatchSizeExceededException.of(dataList.size, MAX_BATCH_SIZE)
        }
        
        logger.info("Creating ${dataList.size} records in table: $tableId")
        
        // Validate table exists
        val table = tableService.getTableById(TableId(tableId))
        
        // Validate all records
        dataList.forEachIndexed { index, data ->
            val errors = validateRecordData(table, data)
            if (errors.isNotEmpty()) {
                val validationErrors = errors.map { ValidationError(it.substringBefore(":").trim(), it.substringAfter(":").trim()) }
                throw RecordValidationException.batchValidationFailed(index, validationErrors)
            }
        }
        
        // Calculate starting position
        val maxPosition = recordRepository.findMaxPositionByTableId(TableId(tableId))
        var currentPosition = maxPosition ?: 0f
        
        // Create records with incremental positions
        val records = dataList.map { data ->
            currentPosition = Record.nextPosition(currentPosition)
            Record.create(
                tableId = TableId(tableId),
                data = data,
                position = currentPosition
            )
        }
        
        val savedRecords = recordRepository.saveAll(records)
        logger.info("Created ${savedRecords.size} records in table $tableId")
        
        return savedRecords
    }
    
    /**
     * Updates a record.
     * 
     * @param id The record ID
     * @param data The new data
     * @return The updated record
     * @throws RecordNotFoundException if record not found
     * @throws RecordValidationException if validation fails
     */
    fun updateRecord(id: UUID, data: JsonObject): Record {
        logger.info("Updating record: $id")
        
        val record = getRecordById(id)
        val table = tableService.getTableById(record.tableId)
        
        // Validate new data
        val errors = validateRecordData(table, data)
        if (errors.isNotEmpty()) {
            val validationErrors = errors.map { ValidationError(it.substringBefore(":").trim(), it.substringAfter(":").trim()) }
            throw RecordValidationException.of(RecordId(id), validationErrors)
        }
        
        val updatedRecord = record.setValues(data)
        val savedRecord = recordRepository.save(updatedRecord)
        
        logger.info("Updated record $id")
        return savedRecord
    }
    
    /**
     * Gets a record by ID.
     * Enforces tenant isolation by verifying the record's table is accessible.
     * 
     * @param id The record ID
     * @return The record
     * @throws RecordNotFoundException if record not found or not accessible by current tenant
     */
    @Transactional(readOnly = true)
    fun getRecordById(id: UUID): Record {
        val record = recordRepository.findById(RecordId(id))
            ?: throw RecordNotFoundException.of(RecordId(id))
        
        // Verify table access (which will check tenant access)
        try {
            tableService.getTableById(record.tableId)
            // If getTableById doesn't throw, we have access
        } catch (e: TableNotFoundException) {
            // Table not accessible means record is not accessible
            throw RecordNotFoundException.of(RecordId(id))
        }
        
        return record
    }
    
    /**
     * Deletes a record.
     * 
     * @param id The record ID
     * @throws RecordNotFoundException if record not found
     */
    fun deleteRecord(id: UUID) {
        logger.info("Deleting record: $id")
        
        if (!recordRepository.existsById(RecordId(id))) {
            throw RecordNotFoundException.of(RecordId(id))
        }
        
        recordRepository.deleteById(RecordId(id))
        logger.info("Deleted record $id")
    }
    
    /**
     * Deletes multiple records (batch operation).
     * 
     * @param ids List of record IDs
     */
    fun deleteRecords(ids: List<UUID>) {
        if (ids.isEmpty()) {
            return
        }
        
        logger.info("Deleting ${ids.size} records")
        recordRepository.deleteAllById(ids.map { RecordId(it) })
        logger.info("Deleted ${ids.size} records")
    }
    
    /**
     * Gets all records in a table.
     * 
     * @param tableId The table ID
     * @return List of records
     */
    @Transactional(readOnly = true)
    fun getRecordsByTable(tableId: UUID): List<Record> {
        return recordRepository.findByTableId(TableId(tableId))
    }
    
    /**
     * Gets records in a table with pagination, ordered by position.
     * 
     * @param tableId The table ID
     * @param pageable Pagination parameters
     * @return Page of records
     */
    @Transactional(readOnly = true)
    fun getRecordsByTablePaged(tableId: UUID, pageable: Pageable): Page<Record> {
        // Validate table exists
        tableService.getTableById(TableId(tableId))
        
        // Repository already returns domain objects, no mapping needed
        return recordRepository.findByTableIdOrderByPosition(TableId(tableId), pageable)
    }
    
    /**
     * Gets records in a table ordered by position.
     * 
     * @param tableId The table ID
     * @return List of ordered records
     */
    @Transactional(readOnly = true)
    fun getRecordsByTableOrdered(tableId: UUID): List<Record> {
        return recordRepository.findByTableIdOrderByPosition(TableId(tableId))
    }
    
    /**
     * Moves a record to a new position.
     * 
     * @param id The record ID
     * @param afterRecordId The ID of the record to position after (null for first position)
     * @return The updated record
     * @throws IllegalArgumentException if record not found
     */
    fun moveRecord(id: UUID, afterRecordId: UUID?): Record {
        logger.info("Moving record $id after record: $afterRecordId")
        
        val record = getRecordById(id)
        
        val newPosition = if (afterRecordId == null) {
            // Move to first position
            val firstRecord = recordRepository.findByTableIdOrderByPosition(record.tableId).firstOrNull()
            if (firstRecord != null && firstRecord.id.value != id) {
                firstRecord.position / 2
            } else {
                Record.firstPosition()
            }
        } else {
            // Move after specified record
            val afterRecord = getRecordById(afterRecordId)
            if (afterRecord.tableId != record.tableId) {
                throw InvalidFilterException.of("Records must be in the same table")
            }
            
            // Find the next record after the target position
            val records = recordRepository.findByTableIdOrderByPosition(record.tableId)
            val afterIndex = records.indexOfFirst { it.id == RecordId(afterRecordId) }
            
            if (afterIndex == -1) {
                throw RecordNotFoundException.of(RecordId(afterRecordId))
            }
            
            val nextRecord = if (afterIndex < records.size - 1) {
                records[afterIndex + 1]
            } else {
                null
            }
            
            if (nextRecord != null && nextRecord.id.value != id) {
                // Position between afterRecord and nextRecord
                (afterRecord.position + nextRecord.position) / 2
            } else {
                // Position at the end
                Record.nextPosition(afterRecord.position)
            }
        }
        
        val updatedRecord = record.updatePosition(newPosition)
        val savedRecord = recordRepository.save(updatedRecord)
        
        logger.info("Moved record $id to position $newPosition")
        return savedRecord
    }
    
    /**
     * Reorders multiple records.
     * 
     * @param tableId The table ID
     * @param orderedIds List of record IDs in desired order
     * @return List of reordered records
     * @throws IllegalArgumentException if any record not found or not in table
     */
    fun reorderRecords(tableId: UUID, orderedIds: List<UUID>): List<Record> {
        logger.info("Reordering ${orderedIds.size} records in table: $tableId")
        
        // Validate all records exist and belong to the table
        val records = orderedIds.map { id ->
            val record = getRecordById(id)
            if (record.tableId.value != tableId) {
                throw InvalidFilterException.of("Record $id does not belong to table $tableId")
            }
            record
        }
        
        // Assign new positions
        var position = Record.firstPosition()
        val updatedRecords = records.map { record ->
            val updated = record.updatePosition(position)
            position = Record.nextPosition(position)
            updated
        }
        
        val savedRecords = recordRepository.saveAll(updatedRecords)
        logger.info("Reordered ${savedRecords.size} records")
        
        return savedRecords
    }
    
    /**
     * Validates record data against table schema.
     * 
     * @param table The table
     * @param data The record data
     * @return List of validation errors (empty if valid)
     */
    @Transactional(readOnly = true)
    fun validateRecordData(table: com.astarworks.astarmanagement.core.table.domain.model.Table, data: JsonObject): List<String> {
        val errors = mutableListOf<String>()
        
        // Check required fields and validate types
        table.properties.forEach { (key, definition) ->
            val value = data[key]
            
            // Check required fields
            if (definition.isRequired) {
                if (!data.containsKey(key) || value == null) {
                    errors.add("Required field '$key' is missing")
                    return@forEach // Skip further validation if required field is missing
                }
            }
            
            // Validate type and value if field is present and not null
            if (data.containsKey(key) && value != null) {
                // Type validation
                if (!validateFieldType(definition.typeId, value)) {
                    errors.add("Field '$key': Invalid type for ${definition.typeId}")
                } else {
                    // Value validation (format, range, etc.) - only if type is correct
                    val valueErrors = validateFieldValue(definition, value)
                    if (valueErrors.isNotEmpty()) {
                        errors.addAll(valueErrors.map { "Field '$key': $it" })
                    }
                }
            }
        }
        
        // Check for unknown fields
        data.keys.forEach { key ->
            if (!table.properties.containsKey(key)) {
                errors.add("Unknown field '$key'")
            }
        }
        
        return errors
    }
    
    /**
     * Validates field type.
     * 
     * @param typeId The property type ID
     * @param value The value to validate
     * @return true if type is valid, false otherwise
     */
    private fun validateFieldType(typeId: String, value: Any): Boolean {
        return when (typeId) {
            PropertyTypeCatalog.TEXT, PropertyTypeCatalog.LONG_TEXT -> {
                value is String || (value is JsonPrimitive && value.isString)
            }
            PropertyTypeCatalog.NUMBER, PropertyTypeCatalog.CURRENCY, PropertyTypeCatalog.PERCENT -> {
                value is Number || (value is JsonPrimitive && !value.isString)
            }
            PropertyTypeCatalog.CHECKBOX -> {
                value is Boolean || (value is JsonPrimitive && value.booleanOrNull != null)
            }
            PropertyTypeCatalog.DATE, PropertyTypeCatalog.DATETIME -> {
                value is String || (value is JsonPrimitive && value.isString)
            }
            PropertyTypeCatalog.SELECT -> {
                value is String || (value is JsonPrimitive && value.isString)
            }
            PropertyTypeCatalog.MULTI_SELECT -> {
                value is String || value is List<*> || 
                (value is JsonPrimitive && value.isString) ||
                (value is JsonArray)
            }
            PropertyTypeCatalog.EMAIL -> {
                value is String || (value is JsonPrimitive && value.isString)
            }
            PropertyTypeCatalog.URL -> {
                value is String || (value is JsonPrimitive && value.isString)
            }
            PropertyTypeCatalog.PHONE -> {
                value is String || (value is JsonPrimitive && value.isString)
            }
            PropertyTypeCatalog.USER -> {
                value is String || value is UUID || 
                (value is JsonPrimitive && value.isString)
            }
            PropertyTypeCatalog.FILE -> {
                value is String || value is Map<*, *> || 
                (value is JsonPrimitive && value.isString) ||
                (value is JsonObject)
            }
            else -> true // Unknown types pass type validation
        }
    }
    
    /**
     * Validates field value based on property definition.
     * 
     * @param definition The property definition
     * @param value The value to validate
     * @return List of validation errors (empty if valid)
     */
    private fun validateFieldValue(definition: PropertyDefinition, value: Any): List<String> {
        val errors = mutableListOf<String>()
        val typeId = definition.typeId
        
        when (typeId) {
            PropertyTypeCatalog.TEXT, PropertyTypeCatalog.LONG_TEXT -> {
                val textValue = extractStringValue(value)
                if (textValue != null) {
                    val maxLength = definition.maxLength
                    if (maxLength != null && textValue.length > maxLength) {
                        errors.add("Text exceeds maximum length of $maxLength")
                    }
                }
            }
            PropertyTypeCatalog.EMAIL -> {
                val emailValue = extractStringValue(value)
                if (emailValue != null && !isValidEmail(emailValue)) {
                    errors.add("Invalid email format")
                }
            }
            PropertyTypeCatalog.URL -> {
                val urlValue = extractStringValue(value)
                if (urlValue != null && !isValidUrl(urlValue)) {
                    errors.add("Invalid URL format")
                }
            }
            PropertyTypeCatalog.PHONE -> {
                val phoneValue = extractStringValue(value)
                if (phoneValue != null && !isValidPhone(phoneValue)) {
                    errors.add("Invalid phone number format")
                }
            }
            PropertyTypeCatalog.SELECT -> {
                val selectValue = extractStringValue(value)
                if (selectValue != null) {
                    val validationError = validateSelectOption(definition, selectValue)
                    if (validationError != null) {
                        errors.add(validationError)
                    }
                }
            }
            PropertyTypeCatalog.MULTI_SELECT -> {
                val validationError = when (value) {
                    is String -> validateSelectOption(definition, value)
                    is JsonPrimitive -> {
                        val stringValue = extractStringValue(value)
                        if (stringValue != null) validateSelectOption(definition, stringValue) else null
                    }
                    is JsonArray -> validateMultiSelectOptionsFromJson(definition, value)
                    is List<*> -> validateMultiSelectOptions(definition, value)
                    else -> "Invalid value type for multi-select"
                }
                if (validationError != null) {
                    errors.add(validationError)
                }
            }
            PropertyTypeCatalog.NUMBER, PropertyTypeCatalog.CURRENCY, PropertyTypeCatalog.PERCENT -> {
                val numberValue = extractNumberValue(value)
                if (numberValue != null) {
                    val rangeError = validateNumberRange(definition, numberValue)
                    if (rangeError != null) {
                        errors.add(rangeError)
                    }
                }
            }
        }
        
        return errors
    }
    
    /**
     * Extracts string value from Any or JsonPrimitive
     */
    private fun extractStringValue(value: Any): String? {
        return when (value) {
            is String -> value
            is JsonPrimitive -> if (value.isString) value.content else null
            else -> null
        }
    }
    
    /**
     * Extracts number value from Any or JsonPrimitive
     */
    private fun extractNumberValue(value: Any): Number? {
        return when (value) {
            is Number -> value
            is JsonPrimitive -> value.doubleOrNull ?: value.longOrNull ?: value.intOrNull
            else -> null
        }
    }
    
    /**
     * Validates multi-select options from JsonArray
     */
    private fun validateMultiSelectOptionsFromJson(definition: PropertyDefinition, value: JsonArray): String? {
        val stringValues = value.mapNotNull { element ->
            if (element is JsonPrimitive && element.isString) element.content else null
        }
        return validateMultiSelectOptions(definition, stringValues)
    }
    
    /**
     * Validates SELECT option.
     * 
     * @param definition The property definition
     * @param value The selected value
     * @return Error message if invalid, null otherwise
     */
    private fun validateSelectOption(definition: PropertyDefinition, value: String): String? {
        // Try to get options using options property first
        val selectOptions = definition.options
        if (selectOptions != null && selectOptions.isNotEmpty()) {
            val validValues = selectOptions.map { it.value }
            if (value !in validValues) {
                return "Invalid option: '$value' is not in allowed values"
            }
        } else {
            // Fall back to raw options if getOptions() returns null/empty
            val rawOptions = definition.config["options"] as? List<*>
            if (rawOptions != null && rawOptions.isNotEmpty()) {
                val validValues = when (val firstOption = rawOptions.firstOrNull()) {
                    is SelectOption -> rawOptions.filterIsInstance<SelectOption>().map { it.value }
                    is Map<*, *> -> rawOptions.filterIsInstance<Map<*, *>>().mapNotNull { it["value"] as? String }
                    else -> emptyList()
                }
                if (validValues.isNotEmpty() && value !in validValues) {
                    return "Invalid option: '$value' is not in allowed values"
                }
            }
        }
        return null
    }
    
    /**
     * Validates MULTI_SELECT options.
     * 
     * @param definition The property definition
     * @param values The selected values
     * @return Error message if invalid, null otherwise
     */
    private fun validateMultiSelectOptions(definition: PropertyDefinition, values: List<*>): String? {
        // Try to get options using options property first
        val selectOptions = definition.options
        if (selectOptions != null && selectOptions.isNotEmpty()) {
            val validValues = selectOptions.map { it.value }
            val invalidValues = values.filter { 
                it !is String || it !in validValues
            }
            if (invalidValues.isNotEmpty()) {
                return "Invalid options: $invalidValues are not in allowed values"
            }
        } else {
            // Fall back to raw options if getOptions() returns null/empty
            val rawOptions = definition.config["options"] as? List<*>
            if (rawOptions != null && rawOptions.isNotEmpty()) {
                val validValues = when (val firstOption = rawOptions.firstOrNull()) {
                    is SelectOption -> rawOptions.filterIsInstance<SelectOption>().map { it.value }
                    is Map<*, *> -> rawOptions.filterIsInstance<Map<*, *>>().mapNotNull { it["value"] as? String }
                    else -> emptyList()
                }
                if (validValues.isNotEmpty()) {
                    val invalidValues = values.filter {
                        it !is String || it !in validValues
                    }
                    if (invalidValues.isNotEmpty()) {
                        return "Invalid options: $invalidValues are not in allowed values"
                    }
                }
            }
        }
        return null
    }
    
    /**
     * Validates number range.
     * 
     * @param definition The property definition
     * @param value The number value
     * @return Error message if out of range, null otherwise
     */
    private fun validateNumberRange(definition: PropertyDefinition, value: Number): String? {
        val min = definition.minValue
        val max = definition.maxValue
        
        val doubleValue = value.toDouble()
        
        if (min != null && doubleValue < min.toDouble()) {
            return "Value $value is less than minimum $min"
        }
        if (max != null && doubleValue > max.toDouble()) {
            return "Value $value is greater than maximum $max"
        }
        
        return null
    }
    
    /**
     * Validates email format.
     */
    private fun isValidEmail(email: String): Boolean {
        return email.contains("@") && 
               email.matches(Regex("^[\\w._%+-]+@[\\w.-]+\\.[A-Za-z]{2,}$"))
    }
    
    /**
     * Validates URL format.
     */
    private fun isValidUrl(url: String): Boolean {
        return url.startsWith("http://") || 
               url.startsWith("https://") || 
               url.startsWith("ftp://")
    }
    
    /**
     * Validates phone number format.
     */
    private fun isValidPhone(phone: String): Boolean {
        return phone.matches(Regex("^[+]?[\\d\\s()-]{7,}$"))
    }
    
    /**
     * Counts records in a table.
     * 
     * @param tableId The table ID
     * @return The number of records
     */
    @Transactional(readOnly = true)
    fun countRecords(tableId: UUID): Long {
        return recordRepository.countByTableId(TableId(tableId))
    }
    
    /**
     * Deletes all records in a table.
     * 
     * @param tableId The table ID
     */
    fun clearTable(tableId: UUID) {
        logger.info("Clearing all records from table: $tableId")
        
        // Validate table exists
        tableService.getTableById(TableId(tableId))
        
        recordRepository.deleteByTableId(TableId(tableId))
        logger.info("Cleared all records from table $tableId")
    }
    
    /**
     * Copies records within the same table or to a different table.
     * 
     * @param recordIds List of record IDs to copy
     * @param targetTableId Target table ID (null for same table)
     * @param includeData Whether to include data in the copy
     * @param fieldMapping Field name mapping for cross-table copy
     * @return List of copied records
     * @throws IllegalArgumentException if records not found or validation fails
     */
    fun copyRecords(
        recordIds: List<UUID>,
        targetTableId: UUID? = null,
        includeData: Boolean = true,
        fieldMapping: Map<String, String>? = null
    ): List<Record> {
        if (recordIds.isEmpty()) {
            return emptyList()
        }
        
        if (recordIds.size > 100) {
            throw BatchSizeExceededException.of(recordIds.size, 100)
        }
        
        logger.info("Copying ${recordIds.size} records to table: ${targetTableId ?: "same"}")
        
        // Get source records
        val sourceRecords = recordIds.map { id ->
            recordRepository.findById(RecordId(id)) 
                ?: throw RecordNotFoundException.of(RecordId(id))
        }
        
        // Determine target table
        val firstRecord = sourceRecords.first()
        val targetDbId = targetTableId?.let { TableId(it) } ?: firstRecord.tableId
        val targetTable = tableService.getTableById(targetDbId)
        
        // Validate cross-table copy if applicable
        if (targetTableId != null && TableId(targetTableId) != firstRecord.tableId) {
            // Ensure all source records are from the same table
            if (sourceRecords.any { it.tableId != firstRecord.tableId }) {
                throw InvalidFilterException.of("All source records must be from the same table for cross-table copy")
            }
        }
        
        // Calculate starting position in target table
        val maxPosition = recordRepository.findMaxPositionByTableId(targetDbId)
        var currentPosition = maxPosition ?: 0f
        
        // Create copied records
        val copiedRecords = sourceRecords.map { sourceRecord ->
            currentPosition = Record.nextPosition(currentPosition)
            
            val copiedData = if (includeData) {
                if (fieldMapping != null) {
                    // Apply field mapping for cross-table copy
                    buildJsonObject {
                        sourceRecord.data.forEach { (key, value) ->
                            val mappedKey = fieldMapping[key] ?: key
                            if (targetTable.properties.containsKey(mappedKey)) {
                                put(mappedKey, value)
                            }
                        }
                    }
                } else {
                    // Copy data as-is for same table
                    sourceRecord.data
                }
            } else {
                JsonObject(emptyMap())
            }
            
            // Validate copied data against target table schema (skip validation if no data is included)
            if (includeData) {
                val errors = validateRecordData(targetTable, copiedData)
                if (errors.isNotEmpty()) {
                    val validationErrors = errors.map { ValidationError(it.substringBefore(":").trim(), it.substringAfter(":").trim()) }
                    throw RecordValidationException.of(null, validationErrors)
                }
            }
            
            Record.create(
                tableId = targetDbId,
                data = copiedData,
                position = currentPosition
            )
        }
        
        val savedRecords = recordRepository.saveAll(copiedRecords)
        logger.info("Successfully copied ${savedRecords.size} records")
        
        return savedRecords
    }
    
    /**
     * Updates a specific field across multiple records.
     * 
     * @param recordIds List of record IDs to update
     * @param field The field name to update
     * @param value The new value (null to clear the field)
     * @return RecordBatchResponse with success and failure details
     */
    fun bulkUpdateField(
        recordIds: List<UUID>,
        field: String,
        value: JsonElement?
    ): com.astarworks.astarmanagement.core.table.api.dto.record.RecordBatchResponse {
        if (recordIds.isEmpty()) {
            return com.astarworks.astarmanagement.core.table.api.dto.record.RecordBatchResponse.success(emptyList())
        }
        
        if (recordIds.size > MAX_BATCH_SIZE) {
            throw BatchSizeExceededException.of(recordIds.size, MAX_BATCH_SIZE)
        }
        
        logger.info("Bulk updating field '$field' for ${recordIds.size} records")
        
        val succeeded = mutableListOf<com.astarworks.astarmanagement.core.table.api.dto.record.RecordResponse>()
        val failed = mutableListOf<com.astarworks.astarmanagement.core.table.api.dto.record.RecordBatchError>()
        
        recordIds.forEachIndexed { index, recordId ->
            try {
                // Get the record
                val record = recordRepository.findById(RecordId(recordId))
                if (record == null) {
                    failed.add(
                        com.astarworks.astarmanagement.core.table.api.dto.record.RecordBatchError.forRecord(
                            recordId,
                            "Record not found"
                        )
                    )
                    return@forEachIndexed
                }
                
                // Get the table schema
                val table = tableService.getTableById(record.tableId)
                
                // Check if field exists in table schema
                if (!table.properties.containsKey(field)) {
                    failed.add(
                        com.astarworks.astarmanagement.core.table.api.dto.record.RecordBatchError.forRecord(
                            recordId,
                            "Field '$field' does not exist in table schema"
                        )
                    )
                    return@forEachIndexed
                }
                
                // Create updated data
                val updatedData = buildJsonObject {
                    record.data.forEach { (key, existingValue) ->
                        if (key != field) {
                            put(key, existingValue)
                        }
                    }
                    if (value != null && value !is JsonNull) {
                        put(field, value)
                    }
                }
                
                // Validate the updated data
                val errors = validateRecordData(table, updatedData)
                if (errors.isNotEmpty()) {
                    val validationErrors = errors.map { error ->
                        com.astarworks.astarmanagement.core.table.api.dto.record.RecordValidationError(
                            field = error.substringBefore(":").trim(),
                            message = error.substringAfter(":").trim()
                        )
                    }
                    failed.add(
                        com.astarworks.astarmanagement.core.table.api.dto.record.RecordBatchError.validation(
                            index = index,
                            recordId = recordId,
                            validationErrors = validationErrors
                        )
                    )
                    return@forEachIndexed
                }
                
                // Update and save the record
                val updatedRecord = record.setValues(updatedData)
                val savedRecord = recordRepository.save(updatedRecord)
                
                // Convert to response DTO
                val recordResponse = com.astarworks.astarmanagement.core.table.api.dto.record.RecordResponse(
                    id = savedRecord.id.value,
                    tableId = savedRecord.tableId.value,
                    data = savedRecord.data,
                    position = savedRecord.position,
                    createdAt = savedRecord.createdAt,
                    updatedAt = savedRecord.updatedAt
                )
                succeeded.add(recordResponse)
                
            } catch (e: Exception) {
                logger.error("Failed to update field '$field' for record $recordId", e)
                failed.add(
                    com.astarworks.astarmanagement.core.table.api.dto.record.RecordBatchError.forRecord(
                        recordId,
                        e.message ?: "Unknown error"
                    )
                )
            }
        }
        
        logger.info("Bulk field update completed: ${succeeded.size} succeeded, ${failed.size} failed")
        
        return if (failed.isEmpty()) {
            com.astarworks.astarmanagement.core.table.api.dto.record.RecordBatchResponse.success(succeeded)
        } else if (succeeded.isEmpty()) {
            com.astarworks.astarmanagement.core.table.api.dto.record.RecordBatchResponse.failure(failed)
        } else {
            com.astarworks.astarmanagement.core.table.api.dto.record.RecordBatchResponse.partial(succeeded, failed)
        }
    }
}