package com.astarworks.astarmanagement.core.table.api.controller

import com.astarworks.astarmanagement.core.table.api.dto.record.*
import com.astarworks.astarmanagement.shared.api.dto.PageRequest
import com.astarworks.astarmanagement.shared.api.dto.PageResponse
import com.astarworks.astarmanagement.core.table.api.mapper.RecordDtoMapper
import com.astarworks.astarmanagement.core.table.domain.model.Record
import com.astarworks.astarmanagement.core.table.domain.service.RecordService
import com.astarworks.astarmanagement.core.table.domain.service.TableService
import com.astarworks.astarmanagement.shared.domain.value.*
import com.astarworks.astarmanagement.shared.api.dto.SortRequest
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import kotlinx.serialization.json.*
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * REST controller for managing records (data rows) in tables.
 * Provides endpoints for CRUD operations, batch processing, and filtering.
 */
@RestController
@RequestMapping("/api/v1/records")
@Tag(name = "Records", description = "Manage records in flexible table tables")
@PreAuthorize("isAuthenticated()")
class RecordController(
    private val recordService: RecordService,
    private val tableService: TableService,
    private val dtoMapper: RecordDtoMapper
) {
    private val logger = LoggerFactory.getLogger(RecordController::class.java)
    
    /**
     * Creates a new record.
     */
    @PostMapping
    @Operation(summary = "Create record", description = "Creates a new record in a table")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Record created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid record data"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found")
    )
    @PreAuthorize("canCreateRecord(#request.tableId)")
    @ResponseStatus(HttpStatus.CREATED)
    fun createRecord(
        @Valid @RequestBody request: RecordCreateRequest
    ): RecordResponse {
        logger.info("Creating record in table: ${request.tableId}")
        
        val record = recordService.createRecord(request.tableId, request.data)
        val response = dtoMapper.toResponse(record)
        
        logger.info("Created record with ID: ${record.id}")
        return response
    }
    
    /**
     * Creates multiple records in batch.
     */
    @PostMapping("/batch")
    @Operation(summary = "Create records in batch", description = "Creates multiple records in a single operation")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Records created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid record data or batch size exceeded"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found")
    )
    @PreAuthorize("canCreateRecord(#request.tableId)")
    @ResponseStatus(HttpStatus.CREATED)
    fun createRecordsBatch(
        @Valid @RequestBody request: RecordBatchCreateRequest
    ): RecordListResponse {
        logger.info("Creating ${request.records.size} records in table: ${request.tableId}")
        
        val records = recordService.createRecords(request.tableId, request.records)
        val responses = dtoMapper.toResponseList(records)
        val listResponse = RecordListResponse.of(responses, request.tableId)
        
        logger.info("Created ${records.size} records in batch")
        return listResponse
    }
    
    /**
     * Gets records in a table with pagination.
     */
    @GetMapping("/table/{tableId}")
    @Operation(summary = "List records", description = "Retrieves records from a table with pagination")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully retrieved records"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found")
    )
    @PreAuthorize("canViewTableRecords(#tableId)")
    fun listRecords(
        @Parameter(description = "Table ID")
        @PathVariable tableId: UUID,
        @Parameter(description = "Page number (0-based)")
        @RequestParam(defaultValue = "0") page: Int,
        @Parameter(description = "Page size")
        @RequestParam(defaultValue = "20") size: Int,
        @Parameter(description = "Sort field")
        @RequestParam(required = false) sortBy: String?,
        @Parameter(description = "Sort direction (ASC/DESC)")
        @RequestParam(defaultValue = "ASC") sortDirection: String
    ): PageResponse<RecordResponse> {
        logger.debug("Listing records for table: $tableId (page: $page, size: $size)")
        
        // Verify table exists
        tableService.getTableById(TableId(tableId))
        
        val pageRequest = PageRequest(
            page = page,
            size = size,
            sort = sortBy?.let {
                listOf(
                    SortRequest(
                        field = it,
                        direction = if (sortDirection == "DESC") {
                            com.astarworks.astarmanagement.shared.api.dto.SortDirection.DESC
                        } else {
                            com.astarworks.astarmanagement.shared.api.dto.SortDirection.ASC
                        }
                    )
                )
            }
        )
        
        val pageable = org.springframework.data.domain.PageRequest.of(page, size)
        val recordPage = recordService.getRecordsByTablePaged(tableId, pageable)
        val responses = dtoMapper.toResponseList(recordPage.content)
        val pageResponse = PageResponse.of(responses, pageRequest, recordPage.totalElements)
        
        return pageResponse
    }
    
    /**
     * Gets a specific record by ID.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get record", description = "Retrieves a specific record by ID")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully retrieved record"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Record not found")
    )
    @PreAuthorize("hasPermissionRule('record.view.all') and canAccessResource(#id, 'record', 'view')")
    fun getRecord(
        @Parameter(description = "Record ID")
        @PathVariable id: UUID
    ): RecordResponse {
        logger.debug("Getting record: $id")
        
        val record = recordService.getRecordById(id)
        val response = dtoMapper.toResponse(record)
        
        return response
    }
    
    /**
     * Updates a record.
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update record", description = "Updates an existing record")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Record updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid record data"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Record not found")
    )
    @PreAuthorize("hasPermissionRule('record.edit.all') and canAccessResource(#id, 'record', 'edit')")
    fun updateRecord(
        @Parameter(description = "Record ID")
        @PathVariable id: UUID,
        @Valid @RequestBody request: RecordUpdateRequest
    ): RecordResponse {
        logger.info("Updating record: $id")
        
        val record = recordService.updateRecord(id, request.data)
        val response = dtoMapper.toResponse(record)
        
        logger.info("Updated record: $id")
        return response
    }
    
    /**
     * Updates multiple records in batch.
     */
    @PutMapping("/batch")
    @Operation(summary = "Update records in batch", description = "Updates multiple records in a single operation")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Records updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid record data or batch size exceeded"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "One or more records not found")
    )
    @PreAuthorize("hasPermissionRule('record.edit.all')")
    fun updateRecordsBatch(
        @Valid @RequestBody request: RecordBatchUpdateRequest
    ): RecordListResponse {
        logger.info("Updating ${request.updates.size} records in batch")
        
        val updatedRecords = request.updates.map { (recordId, data) ->
            recordService.updateRecord(recordId, data)
        }
        
        val responses = dtoMapper.toResponseList(updatedRecords)
        val listResponse = RecordListResponse.of(responses)
        
        logger.info("Updated ${updatedRecords.size} records in batch")
        return listResponse
    }
    
    /**
     * Deletes a record.
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete record", description = "Permanently deletes a record")
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Record deleted successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Record not found")
    )
    @PreAuthorize("hasPermissionRule('record.delete.all') and canAccessResource(#id, 'record', 'delete')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteRecord(
        @Parameter(description = "Record ID")
        @PathVariable id: UUID
    ) {
        logger.info("Deleting record: $id")
        
        recordService.deleteRecord(id)
        logger.info("Deleted record: $id")
        
        return
    }
    
    /**
     * Deletes multiple records in batch.
     */
    @DeleteMapping("/batch")
    @Operation(summary = "Delete records in batch", description = "Deletes multiple records in a single operation")
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Records deleted successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request or batch size exceeded"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied")
    )
    @PreAuthorize("hasPermissionRule('record.delete.all')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteRecordsBatch(
        @Valid @RequestBody request: RecordBatchDeleteRequest
    ) {
        logger.info("Deleting ${request.recordIds.size} records in batch")
        
        recordService.deleteRecords(request.recordIds)
        logger.info("Deleted ${request.recordIds.size} records in batch")
        
        return
    }
    
    /**
     * Moves a record to a new position.
     */
    @PutMapping("/{id}/move")
    @Operation(summary = "Move record", description = "Changes the position of a record")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Record moved successfully"),
        ApiResponse(responseCode = "400", description = "Invalid move request"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Record not found")
    )
    @PreAuthorize("hasPermissionRule('record.edit.all') and canAccessResource(#id, 'record', 'edit')")
    fun moveRecord(
        @Parameter(description = "Record ID")
        @PathVariable id: UUID,
        @Valid @RequestBody request: RecordMoveRequest
    ): RecordResponse {
        logger.info("Moving record: $id")
        
        val afterRecordId = request.afterRecordId ?: request.beforeRecordId?.let { beforeId ->
            // If beforeRecordId is specified, find the record before it
            val record = recordService.getRecordById(beforeId)
            val allRecords = recordService.getRecordsByTableOrdered(record.tableId.value)
            val index = allRecords.indexOfFirst { it.id.value == beforeId }
            if (index > 0) allRecords[index - 1].id.value else null
        }
        
        val record = recordService.moveRecord(id, afterRecordId)
        val response = dtoMapper.toResponse(record)
        
        logger.info("Moved record: $id")
        return response
    }
    
    /**
     * Reorders multiple records.
     */
    @PutMapping("/table/{tableId}/reorder")
    @Operation(summary = "Reorder records", description = "Sets a new order for multiple records")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Records reordered successfully"),
        ApiResponse(responseCode = "400", description = "Invalid reorder request"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found")
    )
    @PreAuthorize("hasPermissionRule('record.edit.all') and canAccessResource(#tableId, 'table', 'edit')")
    fun reorderRecords(
        @Parameter(description = "Table ID")
        @PathVariable tableId: UUID,
        @Valid @RequestBody request: RecordReorderRequest
    ): RecordListResponse {
        logger.info("Reordering ${request.recordIds.size} records in table: $tableId")
        
        val records = recordService.reorderRecords(tableId, request.recordIds)
        val responses = dtoMapper.toResponseList(records)
        val listResponse = RecordListResponse.of(responses, tableId)
        
        logger.info("Reordered ${records.size} records")
        return listResponse
    }
    
    /**
     * Filters records in a table.
     */
    @PostMapping("/table/{tableId}/filter")
    @Operation(summary = "Filter records", description = "Searches and filters records based on criteria")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully filtered records"),
        ApiResponse(responseCode = "400", description = "Invalid filter criteria"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found")
    )
    @PreAuthorize("hasPermissionRule('record.view.all') and canAccessResource(#tableId, 'table', 'view')")
    fun filterRecords(
        @Parameter(description = "Table ID")
        @PathVariable tableId: UUID,
        @Valid @RequestBody filterRequest: RecordFilterRequest,
        @Parameter(description = "Page number (0-based)")
        @RequestParam(defaultValue = "0") page: Int,
        @Parameter(description = "Page size")
        @RequestParam(defaultValue = "20") size: Int
    ): PageResponse<RecordResponse> {
        logger.debug("Filtering records in table: $tableId")
        
        // Verify table exists
        val table = tableService.getTableById(TableId(tableId))
        
        // For now, return all records (filtering logic would be implemented in service)
        val pageRequest = PageRequest(page, size)
        val pageable = org.springframework.data.domain.PageRequest.of(page, size)
        val recordPage = recordService.getRecordsByTablePaged(tableId, pageable)
        
        // Apply basic filtering if provided (simplified implementation)
        val filteredRecords = if (filterRequest.hasFilters()) {
            recordPage.content.filter { record ->
                filterRequest.filters?.all { (key, value) ->
                    record.data[key] == value
                } ?: true
            }
        } else {
            recordPage.content
        }
        
        val responses = dtoMapper.toResponseList(filteredRecords)
        val pageResponse = PageResponse.of(responses, pageRequest, filteredRecords.size.toLong())
        
        return pageResponse
    }
    
    /**
     * Clears all records from a table.
     */
    @DeleteMapping("/table/{tableId}/clear")
    @Operation(summary = "Clear table", description = "Removes all records from a table")
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Table cleared successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found")
    )
    @PreAuthorize("hasPermissionRule('record.delete.all') and canAccessResource(#tableId, 'table', 'edit')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun clearTable(
        @Parameter(description = "Table ID")
        @PathVariable tableId: UUID,
        @Parameter(description = "Confirmation flag")
        @RequestParam(required = true) confirm: Boolean
    ) {
        if (!confirm) {
            throw IllegalArgumentException("Confirmation required to clear table")
        }
        
        logger.warn("Clearing all records from table: $tableId")
        
        recordService.clearTable(tableId)
        logger.info("Cleared all records from table: $tableId")
        
        return
    }
    
    /**
     * Gets the count of records in a table.
     */
    @GetMapping("/table/{tableId}/count")
    @Operation(summary = "Count records", description = "Gets the total number of records in a table")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully retrieved count"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found")
    )
    @PreAuthorize("hasPermissionRule('record.view.all') and canAccessResource(#tableId, 'table', 'view')")
    fun countRecords(
        @Parameter(description = "Table ID")
        @PathVariable tableId: UUID
    ): Map<String, Long> {
        logger.debug("Counting records in table: $tableId")
        
        // Verify table exists
        tableService.getTableById(TableId(tableId))
        
        val count = recordService.countRecords(tableId)
        val response = mapOf("count" to count)
        
        return response
    }
    
    /**
     * Copies records within the same table or to a different table.
     */
    @PostMapping("/copy")
    @Operation(summary = "Copy records", description = "Copies one or more records within or across tables")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Records copied successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request or exceeds copy limit"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Record or table not found")
    )
    @PreAuthorize("hasPermissionRule('record.create.all') and hasPermissionRule('record.view.all')")
    fun copyRecords(
        @Valid @RequestBody request: RecordCopyRequest
    ): RecordCopyResponse {
        logger.info("Copying ${request.recordIds.size} records")
        
        // Additional authorization check for target table if different
        if (request.targetTableId != null) {
            // This would ideally be handled by Spring Security but we need to check manually here
            val firstRecord = recordService.getRecordById(request.recordIds.first())
            if (request.targetTableId != firstRecord.tableId.value) {
                // Verify access to target table
                tableService.getTableById(TableId(request.targetTableId))
            }
        }
        
        val copiedRecords = recordService.copyRecords(
            sourceRecordIds = request.recordIds,
            targetTableId = request.targetTableId ?: throw IllegalArgumentException("Target table ID is required")
        )
        
        // Convert to response DTOs
        val recordResponses = dtoMapper.toResponseList(copiedRecords)
        
        // Create mapping of original ID to new ID
        val mapping = request.recordIds.zip(copiedRecords).associate { (originalId, copiedRecord) ->
            originalId to copiedRecord.id.value
        }
        
        val response = RecordCopyResponse(
            originalIds = request.recordIds,
            copiedRecords = recordResponses,
            mapping = mapping
        )
        
        logger.info("Successfully copied ${copiedRecords.size} records")
        return response
    }
    
    /**
     * Updates a specific field across multiple records.
     */
    @PutMapping("/bulk-field-update")
    @Operation(summary = "Bulk update field", description = "Updates a specific field across multiple records")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Field updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request or exceeds batch limit"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Record not found")
    )
    @PreAuthorize("hasPermissionRule('record.edit.all')")
    fun bulkUpdateField(
        @Valid @RequestBody request: RecordBulkFieldUpdateRequest
    ): RecordBatchResponse {
        logger.info("Bulk updating field '${request.field}' for ${request.recordIds.size} records")
        
        // TODO: Implement bulk field update after MVP
        // This requires more complex logic to update specific fields in JSON data
        throw UnsupportedOperationException("Bulk field update is not yet implemented")
    }
    
    /**
     * Validates record data against table schema.
     */
    @PostMapping("/validate")
    @Operation(summary = "Validate record data", description = "Validates record data against table schema without saving")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Validation result"),
        ApiResponse(responseCode = "400", description = "Invalid request"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found")
    )
    @PreAuthorize("hasPermissionRule('record.view.all')")
    fun validateRecordData(
        @Valid @RequestBody request: RecordValidateRequest
    ): RecordValidationResponse {
        logger.info("Validating record data for table: ${request.tableId}")
        
        // Basic validation - ensure JSON is valid
        val errors = try {
            Json.parseToJsonElement(request.data.toString())
            emptyList<String>()
        } catch (e: Exception) {
            listOf("Invalid JSON format: ${e.message}")
        }
        
        val response = if (errors.isEmpty()) {
            RecordValidationResponse.success(request.data)
        } else {
            RecordValidationResponse.failure(
                errors = errors.map { RecordValidationError(field = "", message = it) }
            )
        }
        
        logger.info("Validation completed: ${if (response.valid) "valid" else "invalid with ${errors.size} errors"}")
        return response
    }
    
    /**
     * Gets records with advanced pagination support.
     */
    @GetMapping("/table/{tableId}/paged")
    @Operation(summary = "Get paginated records", description = "Retrieves records with advanced pagination support")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully retrieved records"),
        ApiResponse(responseCode = "400", description = "Invalid pagination parameters"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found")
    )
    @PreAuthorize("hasPermissionRule('record.view.all') and canAccessResource(#tableId, 'table', 'view')")
    fun getRecordsPaged(
        @Parameter(description = "Table ID")
        @PathVariable tableId: UUID,
        @Parameter(description = "Page number (0-based)")
        @RequestParam(defaultValue = "0") page: Int,
        @Parameter(description = "Page size")
        @RequestParam(defaultValue = "20") size: Int,
        @Parameter(description = "Sort field")
        @RequestParam(required = false) sortBy: String?,
        @Parameter(description = "Sort direction (ASC/DESC)")
        @RequestParam(defaultValue = "ASC") sortDirection: String
    ): PageResponse<RecordResponse> {
        logger.debug("Getting paginated records for table: $tableId, page: $page, size: $size")
        
        val pageable = org.springframework.data.domain.PageRequest.of(page, size)
        val pagedRecords = recordService.getRecordsByTablePaged(tableId, pageable)
        val recordResponses = pagedRecords.content.map { dtoMapper.toResponse(it) }
        
        val pageResponse = PageResponse.of(
            content = recordResponses,
            pageRequest = PageRequest(page = page, size = size),
            totalElements = pagedRecords.totalElements
        )
        
        return pageResponse
    }
    
    /**
     * Advanced search for records.
     */
    @PostMapping("/table/{tableId}/search")
    @Operation(summary = "Search records", description = "Advanced search with complex filtering and sorting")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Search results"),
        ApiResponse(responseCode = "400", description = "Invalid search parameters"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found")
    )
    @PreAuthorize("hasPermissionRule('record.view.all') and canAccessResource(#tableId, 'table', 'view')")
    fun searchRecords(
        @Parameter(description = "Table ID")
        @PathVariable tableId: UUID,
        @Valid @RequestBody request: RecordSearchRequest
    ): RecordListResponse {
        logger.info("Searching records in table: $tableId with ${request.filters?.size ?: 0} filters")
        
        // For now, use the existing filter endpoint logic
        // This can be enhanced with more complex search capabilities
        val records = if (request.filters != null && request.filters.isNotEmpty()) {
            // Apply filters
            val allRecords = recordService.findAllByTableId(tableId)
            allRecords.filter { record ->
                request.filters.all { filter ->
                    val recordValue = record.data[filter.field]
                    when (filter.operator) {
                        FilterOperator.EQUALS -> recordValue == filter.value
                        FilterOperator.NOT_EQUALS -> recordValue != filter.value
                        FilterOperator.IN -> filter.values?.contains(recordValue) == true
                        FilterOperator.NOT_IN -> filter.values?.contains(recordValue) != true
                        else -> true // For now, other operators are not implemented
                    }
                }
            }
        } else {
            recordService.findAllByTableId(tableId)
        }
        
        // Apply field selection if specified
        val responses = if (request.fields != null && request.fields.isNotEmpty()) {
            records.map { record ->
                val filteredData = buildJsonObject {
                    record.data.forEach { (key, value) ->
                        if (key in request.fields) {
                            put(key, value)
                        }
                    }
                }
                dtoMapper.toResponse(
                    Record(
                        id = record.id,
                        tableId = record.tableId,
                        data = filteredData,
                        position = record.position,
                        createdAt = record.createdAt,
                        updatedAt = record.updatedAt
                    )
                )
            }
        } else {
            records.map { dtoMapper.toResponse(it) }
        }
        
        val response = RecordListResponse.of(responses, tableId)
        logger.info("Search returned ${responses.size} records")
        
        return response
    }
}