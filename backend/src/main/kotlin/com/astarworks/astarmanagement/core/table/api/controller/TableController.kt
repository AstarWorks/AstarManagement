package com.astarworks.astarmanagement.core.table.api.controller

import com.astarworks.astarmanagement.core.table.api.dto.table.*
import com.astarworks.astarmanagement.core.table.api.dto.property.*
import com.astarworks.astarmanagement.core.table.api.mapper.TableDtoMapper
import com.astarworks.astarmanagement.core.table.domain.model.PropertyDefinition
import com.astarworks.astarmanagement.core.table.domain.model.Table
import com.astarworks.astarmanagement.core.table.domain.service.TableService
import com.astarworks.astarmanagement.core.table.domain.service.RecordService
import com.astarworks.astarmanagement.core.workspace.domain.service.WorkspaceService
import com.astarworks.astarmanagement.shared.domain.value.*
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
import jakarta.servlet.http.HttpServletRequest
import kotlinx.serialization.encodeToString
import java.util.UUID

/**
 * REST controller for managing tables (dynamic tables).
 * Provides endpoints for table CRUD operations, property management, and templates.
 */
@RestController
@RequestMapping("/api/v1/tables")
@Tag(name = "Tables", description = "Manage tables in the flexible table system")
@PreAuthorize("isAuthenticated()")
class TableController(
    private val tableService: TableService,
    private val workspaceService: WorkspaceService,
    private val recordService: RecordService,
    private val dtoMapper: TableDtoMapper,
    private val request: HttpServletRequest
) {
    private val logger = LoggerFactory.getLogger(TableController::class.java)
    
    /**
     * Creates a new table.
     */
    @PostMapping
    @Operation(summary = "Create table", description = "Creates a new table in a workspace")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Table created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Workspace not found"),
        ApiResponse(responseCode = "409", description = "Table name already exists or limit exceeded")
    )
    @PreAuthorize("canCreateTable(#request.workspaceId)")
    @ResponseStatus(HttpStatus.CREATED)
    fun createTable(
        @Valid @RequestBody request: TableCreateRequest
    ): TableResponse {
        logger.info("Creating table '${request.name}' in workspace: ${request.workspaceId}")
        
        val table = if (request.properties.isNotEmpty()) {
            // Create with initial properties
            var db = tableService.createTable(WorkspaceId(request.workspaceId), request.name, request.description)
            request.properties.forEach { propertyDto ->
                val definition = dtoMapper.fromPropertyDefinitionDto(propertyDto)
                db = tableService.addProperty(db.id, propertyDto.key, definition)
            }
            db
        } else {
            tableService.createTable(WorkspaceId(request.workspaceId), request.name, request.description)
        }
        
        val response = dtoMapper.toResponse(table)
        logger.info("Created table with ID: ${table.id}")
        
        return response
    }
    
    /**
     * Creates a table from a template.
     */
    @PostMapping("/from-template")
    @Operation(summary = "Create table from template", description = "Creates a new table using a predefined template")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Table created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid template or request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Workspace not found"),
        ApiResponse(responseCode = "409", description = "Table name already exists or limit exceeded")
    )
    @PreAuthorize("canCreateTable(#request.workspaceId)")
    @ResponseStatus(HttpStatus.CREATED)
    fun createTableFromTemplate(
        @Valid @RequestBody request: TableCreateRequest
    ): TableResponse {
        require(request.templateName != null) { "Template name is required" }
        
        logger.info("Creating table from template '${request.templateName}' in workspace: ${request.workspaceId}")
        
        val table = tableService.createTableFromTemplate(
            workspaceId = WorkspaceId(request.workspaceId), 
            templateId = request.templateName, 
            name = request.name
        )
        
        val response = dtoMapper.toResponse(table)
        logger.info("Created table from template '${request.templateName}' with ID: ${table.id}")
        
        return response
    }
    
    /**
     * Gets all tables in a workspace.
     */
    @GetMapping("/workspace/{workspaceId}")
    @Operation(summary = "List tables in workspace", description = "Retrieves all tables in a specific workspace")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully retrieved tables"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Workspace not found")
    )
    @PreAuthorize("canViewTablesInWorkspace(#workspaceId)")
    fun listTables(
        @Parameter(description = "Workspace ID")
        @PathVariable workspaceId: UUID,
        @Parameter(description = "Include record counts")
        @RequestParam(required = false, defaultValue = "false") includeRecordCounts: Boolean
    ): TableListResponse {
        logger.debug("Listing tables in workspace: $workspaceId")
        
        // Verify workspace exists
        workspaceService.getWorkspaceById(WorkspaceId(workspaceId))
        
        val tables = tableService.getTablesByWorkspace(WorkspaceId(workspaceId))
        
        val responses = tables.map { table ->
            val recordCount = if (includeRecordCounts) {
                recordService.countRecords(table.id.value)
            } else {
                null
            }
            dtoMapper.toResponse(table, recordCount)
        }
        
        val listResponse = TableListResponse.of(responses)
        return listResponse
    }
    
    /**
     * Gets a specific table by ID.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get table", description = "Retrieves a specific table by ID")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully retrieved table"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found")
    )
    @PreAuthorize("canViewTable(#id)")
    fun getTable(
        @Parameter(description = "Table ID")
        @PathVariable id: UUID,
        @Parameter(description = "Include record count")
        @RequestParam(required = false, defaultValue = "false") includeRecordCount: Boolean
    ): TableResponse {
        logger.debug("Getting table: $id")
        
        val table = tableService.getTableById(TableId(id))
        val recordCount = if (includeRecordCount) {
            recordService.countRecords(table.id.value)
        } else {
            null
        }
        
        val response = dtoMapper.toResponse(table, recordCount)
        return response
    }
    
    /**
     * Updates a table.
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update table", description = "Updates an existing table")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Table updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found"),
        ApiResponse(responseCode = "409", description = "Table name already exists")
    )
    @PreAuthorize("canEditTable(#id)")
    fun updateTable(
        @Parameter(description = "Table ID")
        @PathVariable id: UUID,
        @Valid @RequestBody request: TableUpdateRequest
    ): TableResponse {
        logger.info("Updating table: $id")
        
        if (!request.hasUpdates()) {
            logger.warn("Update request has no changes for table: $id")
            val table = tableService.getTableById(TableId(id))
            return dtoMapper.toResponse(table)
        }
        
        var table = tableService.getTableById(TableId(id))
        
        // Update name if provided
        request.name?.let { name ->
            table = tableService.renameTable(TableId(id), name)
        }
        
        // Update description if provided
        request.description?.let { description ->
            table = tableService.updateDescription(TableId(id), description)
        }
        
        // Update property order if provided
        request.propertyOrder?.let { order ->
            table = tableService.reorderProperties(TableId(id), order)
        }
        
        val response = dtoMapper.toResponse(table)
        logger.info("Updated table: $id")
        
        return response
    }
    
    /**
     * Deletes a table and all its records.
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete table", description = "Permanently deletes a table and all its records")
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Table deleted successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found"),
        ApiResponse(responseCode = "409", description = "Table in use or deletion restricted")
    )
    @PreAuthorize("canDeleteTable(#id)")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteTable(
        @Parameter(description = "Table ID")
        @PathVariable id: UUID
    ) {
        logger.info("Deleting table: $id")
        
        tableService.deleteTable(TableId(id))
        logger.info("Deleted table: $id")
    }
    
    /**
     * Adds a property to a table.
     */
    @PostMapping("/{id}/properties")
    @Operation(summary = "Add property", description = "Adds a new property to a table")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Property added successfully"),
        ApiResponse(responseCode = "400", description = "Invalid property definition"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found"),
        ApiResponse(responseCode = "409", description = "Property key already exists or limit exceeded")
    )
    @PreAuthorize("canEditTable(#id)")
    fun addProperty(
        @Parameter(description = "Table ID")
        @PathVariable id: UUID,
        @Valid @RequestBody request: PropertyAddRequest
    ): TableResponse {
        logger.info("Adding property '${request.definition.key}' to table: $id")
        
        val definition = dtoMapper.fromPropertyDefinitionDto(request.definition)
        val table = tableService.addProperty(TableId(id), request.definition.key, definition)
        
        val response = dtoMapper.toResponse(table)
        logger.info("Added property '${request.definition.key}' to table: $id")
        
        return response
    }
    
    /**
     * Updates a property in a table.
     */
    @PutMapping("/{id}/properties/{key}")
    @Operation(summary = "Update property", description = "Updates an existing property in a table")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Property updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid property definition"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table or property not found")
    )
    @PreAuthorize("canEditTable(#id)")
    fun updateProperty(
        @Parameter(description = "Table ID")
        @PathVariable id: UUID,
        @Parameter(description = "Property key")
        @PathVariable key: String,
        @Valid @RequestBody request: PropertyUpdateRequest
    ): TableResponse {
        logger.info("Updating property '$key' in table: $id")
        
        val table = tableService.getTableById(TableId(id))
        val existingProperty = table.properties[key]
            ?: throw com.astarworks.astarmanagement.core.table.api.exception.PropertyNotFoundException.of(key, TableId(id))
        
        // Create updated definition by merging existing with updates
        val updatedConfig = buildJsonObject {
            // 既存のconfig要素を追加
            existingProperty.config.forEach { (key, value) ->
                put(key, value)
            }
            // リクエストのconfig要素を追加（上書き）
            request.config?.forEach { (key, value) ->
                put(key, value)
            }
            // required フラグを追加
            if (request.required != null) {
                put("required", kotlinx.serialization.json.JsonPrimitive(request.required))
            }
        }
        
        val updatedDefinition = PropertyDefinition(
            type = existingProperty.type,
            displayName = request.displayName ?: existingProperty.displayName,
            config = updatedConfig
        )
        
        val updatedTable = tableService.updateProperty(TableId(id), key, updatedDefinition)
        val response = dtoMapper.toResponse(updatedTable)
        
        logger.info("Updated property '$key' in table: $id")
        return response
    }
    
    /**
     * Removes a property from a table.
     */
    @DeleteMapping("/{id}/properties/{key}")
    @Operation(summary = "Remove property", description = "Removes a property from a table")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Property removed successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table or property not found")
    )
    @PreAuthorize("canEditTable(#id)")
    fun removeProperty(
        @Parameter(description = "Table ID")
        @PathVariable id: UUID,
        @Parameter(description = "Property key")
        @PathVariable key: String
    ): TableResponse {
        logger.info("Removing property '$key' from table: $id")
        
        val table = tableService.removeProperty(TableId(id), key)
        val response = dtoMapper.toResponse(table)
        
        logger.info("Removed property '$key' from table: $id")
        return response
    }
    
    /**
     * Reorders properties in a table.
     */
    @PutMapping("/{id}/properties/reorder")
    @Operation(summary = "Reorder properties", description = "Changes the display order of properties in a table")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Properties reordered successfully"),
        ApiResponse(responseCode = "400", description = "Invalid property order"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found")
    )
    @PreAuthorize("canEditTable(#id)")
    fun reorderProperties(
        @Parameter(description = "Table ID")
        @PathVariable id: UUID,
        @Valid @RequestBody request: PropertyReorderRequest
    ): TableResponse {
        logger.info("Reordering properties in table: $id")
        
        val table = tableService.reorderProperties(TableId(id), request.order)
        val response = dtoMapper.toResponse(table)
        
        logger.info("Reordered properties in table: $id")
        return response
    }
    
    /**
     * Gets the schema of a table.
     */
    @GetMapping("/{id}/schema")
    @Operation(summary = "Get table schema", description = "Retrieves the schema definition of a table")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Successfully retrieved schema"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found")
    )
    @PreAuthorize("canViewTable(#id)")
    fun getTableSchema(
        @Parameter(description = "Table ID")
        @PathVariable id: UUID
    ): TableSchemaResponse {
        logger.debug("Getting schema for table: $id")
        
        val table = tableService.getTableById(TableId(id))
        val schema = dtoMapper.toSchemaResponse(table)
        
        return schema
    }
    
    /**
     * Duplicates a table.
     */
    @PostMapping("/{id}/duplicate")
    @Operation(summary = "Duplicate table", description = "Creates a copy of an existing table")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Table duplicated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found"),
        ApiResponse(responseCode = "409", description = "Table name already exists or limit exceeded")
    )
    @PreAuthorize("canDuplicateTable(#id)")
    @ResponseStatus(HttpStatus.CREATED)
    fun duplicateTable(
        @Parameter(description = "Table ID")
        @PathVariable id: UUID,
        @Valid @RequestBody request: TableDuplicateRequest
    ): TableResponse {
        logger.info("Duplicating table: $id")
        
        val sourceTable = tableService.getTableById(TableId(id))
        val targetWorkspaceId = request.targetWorkspaceId ?: sourceTable.workspaceId.value
        
        // Create new table with same structure
        var newTable = tableService.createTable(WorkspaceId(targetWorkspaceId), request.name)
        
        // Copy all properties
        sourceTable.properties.forEach { (key, definition) ->
            newTable = tableService.addProperty(newTable.id, key, definition)
        }
        
        // Copy property order
        if (sourceTable.propertyOrder.isNotEmpty()) {
            newTable = tableService.reorderProperties(newTable.id, sourceTable.propertyOrder)
        }
        
        // Copy records if requested
        if (request.includeRecords) {
            logger.info("Copying records from table $id to ${newTable.id}")
            
            // Get all records from source table
            val sourceRecords = recordService.getRecordsByTableOrdered(sourceTable.id.value)
            
            if (sourceRecords.isNotEmpty()) {
                // Copy all records to the new table
                val recordIds = sourceRecords.map { it.id.value }
                val copiedRecords = recordService.copyRecords(
                    sourceRecordIds = recordIds,
                    targetTableId = newTable.id.value
                )
                
                logger.info("Copied ${copiedRecords.size} records to new table ${newTable.id}")
            }
        }
        
        val response = dtoMapper.toResponse(newTable)
        logger.info("Duplicated table $id to new table: ${newTable.id}")
        
        return response
    }
    
    /**
     * Exports a table's data and schema.
     */
    @GetMapping("/{id}/export")
    @Operation(summary = "Export table", description = "Exports a table's schema and optionally its data")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Table exported successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found")
    )
    @PreAuthorize("canExportTable(#id)")
    fun exportTable(
        @Parameter(description = "Table ID")
        @PathVariable id: UUID,
        @Parameter(description = "Export format (json, csv)")
        @RequestParam(required = false, defaultValue = "json") format: String,
        @Parameter(description = "Include records in export")
        @RequestParam(required = false, defaultValue = "true") includeRecords: Boolean
    ): TableExportResponse {
        logger.info("Exporting table $id in format: $format")
        
        val table = tableService.getTableById(TableId(id))
        val records = if (includeRecords) {
            recordService.getRecordsByTableOrdered(table.id.value)
        } else {
            emptyList()
        }
        
        val exportResponse = when (format.lowercase()) {
            "csv" -> {
                // Generate CSV export
                val csvData = generateCSVData(table, records)
                TableExportResponse(
                    tableId = table.id.value,
                    tableName = table.name,
                    format = "csv",
                    data = csvData,
                    recordCount = records.size.toLong(),
                    exportedAt = java.time.Instant.now()
                )
            }
            else -> {
                // Default to JSON export
                val schema = dtoMapper.toSchemaResponse(table)
                val recordData = records.map { record ->
                    kotlinx.serialization.json.buildJsonObject {
                        put("id", kotlinx.serialization.json.JsonPrimitive(record.id.value.toString()))
                        put("data", kotlinx.serialization.json.Json.parseToJsonElement(record.getDataJson()).jsonObject)
                        put("position", kotlinx.serialization.json.JsonPrimitive(record.position))
                        put("createdAt", kotlinx.serialization.json.JsonPrimitive(record.createdAt.toString()))
                        put("updatedAt", kotlinx.serialization.json.JsonPrimitive(record.updatedAt.toString()))
                    }
                }
                
                TableExportResponse(
                    tableId = id,
                    tableName = table.name,
                    format = "json",
                    schema = schema,
                    records = recordData,
                    recordCount = records.size.toLong(),
                    exportedAt = java.time.Instant.now()
                )
            }
        }
        
        logger.info("Exported table $id with ${records.size} records")
        return exportResponse
    }
    
    /**
     * Imports data into a table.
     */
    @PostMapping("/{id}/import")
    @Operation(summary = "Import data", description = "Imports data into an existing table")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Data imported successfully"),
        ApiResponse(responseCode = "400", description = "Invalid import data"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found")
    )
    @PreAuthorize("canImportTable(#id)")
    fun importData(
        @Parameter(description = "Table ID")
        @PathVariable id: UUID,
        @Valid @RequestBody request: TableImportRequest
    ): TableImportResponse {
        logger.info("Importing data into table $id, format: ${request.format}")
        
        val table = tableService.getTableById(TableId(id))
        
        val importedRecords = when (request.format.lowercase()) {
            "csv" -> {
                // Parse CSV and import
                require(request.csvData != null) { "CSV data is required for CSV import" }
                importCSVData(table, request.csvData, request.skipHeader ?: true)
            }
            else -> {
                // Import from JSON records
                require(request.records != null) { "Records are required for JSON import" }
                request.records.mapNotNull { recordData ->
                    try {
                        val data = recordData["data"] as? kotlinx.serialization.json.JsonObject ?: return@mapNotNull null
                        recordService.createRecord(table.id.value, data)
                    } catch (e: Exception) {
                        logger.warn("Failed to import record: ${e.message}")
                        null
                    }
                }
            }
        }
        
        val response = TableImportResponse(
            tableId = table.id.value,
            tableName = table.name,
            importedCount = importedRecords.size.toLong(),
            failedCount = (request.records?.size ?: 0) - importedRecords.size.toLong(),
            errors = emptyList(), // Could be enhanced to collect actual errors
            importedAt = java.time.Instant.now()
        )
        
        logger.info("Imported ${importedRecords.size} records into table $id")
        return response
    }
    
    /**
     * Gets statistics for a table.
     */
    @GetMapping("/{id}/statistics")
    @Operation(summary = "Get table statistics", description = "Retrieves statistical information about a table")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Statistics retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Access denied"),
        ApiResponse(responseCode = "404", description = "Table not found")
    )
    @PreAuthorize("canViewTable(#id)")
    fun getTableStatistics(
        @Parameter(description = "Table ID")
        @PathVariable id: UUID
    ): TableStatisticsResponse {
        logger.debug("Getting statistics for table: $id")
        
        val table = tableService.getTableById(TableId(id))
        val recordCount = recordService.countRecords(table.id.value)
        val records = recordService.getRecordsByTableOrdered(table.id.value)
        
        // Calculate field statistics
        val fieldStatistics = table.properties.map { (key, definition) ->
            val values = records.mapNotNull { record ->
                kotlinx.serialization.json.Json.parseToJsonElement(record.getDataJson()).jsonObject[key]
            }
            val nonNullCount = values.size
            val nullCount = records.size - nonNullCount
            
            FieldStatistics(
                fieldKey = key,
                fieldType = definition.type.name.lowercase(),
                totalCount = records.size.toLong(),
                nonNullCount = nonNullCount.toLong(),
                nullCount = nullCount.toLong(),
                fillRate = if (records.isNotEmpty()) {
                    (nonNullCount.toDouble() / records.size) * 100
                } else 0.0,
                uniqueCount = values.toSet().size.toLong()
            )
        }
        
        // Calculate storage size (simplified estimation)
        val estimatedSize = records.sumOf { record ->
            record.getDataJson().length
        }
        
        val statistics = TableStatisticsResponse(
            tableId = id,
            tableName = table.name,
            recordCount = recordCount,
            propertyCount = table.properties.size,
            fieldStatistics = fieldStatistics,
            storageSize = estimatedSize.toLong(),
            createdAt = table.createdAt,
            updatedAt = table.updatedAt,
            lastRecordCreatedAt = records.maxByOrNull { it.createdAt }?.createdAt,
            lastRecordUpdatedAt = records.maxByOrNull { it.updatedAt }?.updatedAt
        )
        
        return statistics
    }
    
    /**
     * Helper method to generate CSV data from table records.
     */
    private fun generateCSVData(table: Table, 
                                records: List<com.astarworks.astarmanagement.core.table.domain.model.Record>): String {
        val headers = table.propertyOrder.ifEmpty { table.properties.keys.toList() }
        val csvBuilder = StringBuilder()
        
        // Add headers
        csvBuilder.append(headers.joinToString(",") { "\"$it\"" })
        csvBuilder.append("\n")
        
        // Add data rows
        records.forEach { record ->
            val data = kotlinx.serialization.json.Json.parseToJsonElement(record.getDataJson()).jsonObject
            val row = headers.map { header ->
                val value = data[header]
                when (value) {
                    null -> ""
                    is kotlinx.serialization.json.JsonPrimitive -> {
                        if (value.isString) {
                            "\"${value.content.replace("\"", "\"\"")}\""
                        } else {
                            value.content
                        }
                    }
                    else -> value.toString()
                }
            }
            csvBuilder.append(row.joinToString(","))
            csvBuilder.append("\n")
        }
        
        return csvBuilder.toString()
    }
    
    /**
     * Helper method to import CSV data into a table.
     */
    private fun importCSVData(table: com.astarworks.astarmanagement.core.table.domain.model.Table, 
                              csvData: String, 
                              skipHeader: Boolean): List<com.astarworks.astarmanagement.core.table.domain.model.Record> {
        val lines = csvData.lines().filter { it.isNotBlank() }
        if (lines.isEmpty()) return emptyList()
        
        val dataLines = if (skipHeader && lines.size > 1) {
            lines.drop(1)
        } else {
            lines
        }
        
        val headers = if (skipHeader) {
            // Parse header line
            parseCSVLine(lines.first())
        } else {
            // Use table property order as headers
            table.propertyOrder.ifEmpty { table.properties.keys.toList() }
        }
        
        return dataLines.mapNotNull { line ->
            try {
                val values = parseCSVLine(line)
                val data = buildJsonObject {
                    headers.zip(values).forEach { (header, value) ->
                        put(header, JsonPrimitive(value))
                    }
                }
                recordService.createRecord(table.id.value, data)
            } catch (e: Exception) {
                logger.warn("Failed to import CSV row: ${e.message}")
                null
            }
        }
    }
    
    /**
     * Simple CSV line parser (handles quoted values).
     */
    private fun parseCSVLine(line: String): List<String> {
        val result = mutableListOf<String>()
        var current = StringBuilder()
        var inQuotes = false
        var i = 0
        
        while (i < line.length) {
            when {
                line[i] == '"' -> {
                    if (inQuotes && i + 1 < line.length && line[i + 1] == '"') {
                        // Escaped quote
                        current.append('"')
                        i++
                    } else {
                        // Toggle quote mode
                        inQuotes = !inQuotes
                    }
                }
                line[i] == ',' && !inQuotes -> {
                    // End of field
                    result.add(current.toString())
                    current = StringBuilder()
                }
                else -> {
                    current.append(line[i])
                }
            }
            i++
        }
        
        // Add last field
        result.add(current.toString())
        
        return result
    }
}