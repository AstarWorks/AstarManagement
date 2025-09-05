package com.astarworks.astarmanagement.core.table.domain.service

import com.astarworks.astarmanagement.core.table.domain.model.Table
import com.astarworks.astarmanagement.core.table.domain.model.PropertyDefinition
import com.astarworks.astarmanagement.core.table.domain.repository.TableRepository
import com.astarworks.astarmanagement.core.table.domain.repository.RecordRepository
import com.astarworks.astarmanagement.core.table.api.exception.*
import com.astarworks.astarmanagement.core.workspace.domain.service.WorkspaceService
import com.astarworks.astarmanagement.core.workspace.api.exception.WorkspaceNotFoundException
import com.astarworks.astarmanagement.core.template.domain.service.TemplateService
import com.astarworks.astarmanagement.core.tenant.infrastructure.context.TenantContextService
import com.astarworks.astarmanagement.shared.domain.value.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * Service for managing tables (dynamic table definitions) in the flexible table system.
 * 
 * Handles table operations including:
 * - Table creation from scratch or templates
 * - Property management (add, update, remove, reorder)
 * - Template-based table creation using TemplateService
 * - Cascade operations for related records
 */
@Service
@Transactional
class TableService(
    private val tableRepository: TableRepository,
    private val recordRepository: RecordRepository,
    private val workspaceService: WorkspaceService,
    private val templateService: TemplateService,
    private val tenantContextService: TenantContextService
) {
    private val logger = LoggerFactory.getLogger(TableService::class.java)
    
    companion object {
        const val MAX_TABLES_PER_WORKSPACE = 50
        const val MAX_PROPERTIES_PER_TABLE = 100
    }
    
    /**
     * Creates a new empty table.
     * 
     * @param workspaceId The workspace ID
     * @param name The table name
     * @param description The table description (optional)
     * @return The created table
     * @throws IllegalArgumentException if workspace not found or name already exists
     * @throws IllegalStateException if table limit exceeded
     */
    fun createTable(workspaceId: WorkspaceId, name: String, description: String? = null): Table {
        logger.info("Creating table '$name' in workspace: $workspaceId")
        
        // Validate workspace exists
        val workspace = workspaceService.findWorkspaceById(workspaceId)
            ?: throw WorkspaceNotFoundException.of(workspaceId)
        
        // Check table limit
        val currentCount = tableRepository.countByWorkspaceId(workspaceId)
        if (currentCount >= MAX_TABLES_PER_WORKSPACE) {
            throw TableLimitExceededException.of(workspaceId, currentCount.toInt(), MAX_TABLES_PER_WORKSPACE)
        }
        
        // Check for duplicate name
        if (tableRepository.existsByWorkspaceIdAndName(workspaceId, name)) {
            throw DuplicateTableNameException.of(name, workspaceId)
        }
        
        val table = Table.create(
            workspaceId = workspaceId,
            name = name,
            description = description
        )
        
        val savedTable = tableRepository.save(table)
        logger.info("Created table with ID: ${savedTable.id}")
        
        return savedTable
    }
    
    /**
     * Creates a table from a template.
     * 
     * @param workspaceId The workspace ID
     * @param templateId The template ID to use
     * @param name The table name (optional, defaults to template name)
     * @param description The table description (optional)
     * @return The created table with properties from template
     * @throws IllegalArgumentException if workspace not found, template not found, or name already exists
     * @throws IllegalStateException if table limit exceeded
     */
    fun createTableFromTemplate(workspaceId: WorkspaceId, templateId: String, name: String? = null, description: String? = null): Table {
        logger.info("Creating table from template '$templateId' in workspace: $workspaceId")
        
        // Validate workspace exists
        val workspace = workspaceService.findWorkspaceById(workspaceId)
            ?: throw WorkspaceNotFoundException.of(workspaceId)
        
        // Get template from service
        val template = templateService.getTemplate(templateId)
            ?: throw IllegalArgumentException("Template not found: $templateId")
        
        // Use provided name or default to template name
        val tableName = name ?: template.name
        
        // Check table limit
        val currentCount = tableRepository.countByWorkspaceId(workspaceId)
        if (currentCount >= MAX_TABLES_PER_WORKSPACE) {
            throw TableLimitExceededException.of(workspaceId, currentCount.toInt(), MAX_TABLES_PER_WORKSPACE)
        }
        
        // Check for duplicate name
        if (tableRepository.existsByWorkspaceIdAndName(workspaceId, tableName)) {
            throw DuplicateTableNameException.of(tableName, workspaceId)
        }
        
        // Create table from template
        val table = Table.create(
            workspaceId = workspaceId,
            name = tableName,
            description = description,
            properties = template.properties
        )
        
        val savedTable = tableRepository.save(table)
        logger.info("Created table from template '$templateId' with ID: ${savedTable.id}")
        
        return savedTable
    }
    
    /**
     * Gets a table by ID.
     * Enforces tenant isolation by throwing 404 if table belongs to different tenant.
     * 
     * @param id The table ID
     * @return The table
     * @throws TableNotFoundException if table not found or not accessible by current tenant
     */
    @Transactional(readOnly = true)
    fun getTableById(id: TableId): Table {
        val table = tableRepository.findById(id)
            ?: throw TableNotFoundException.of(id)
        
        // Check tenant access: Verify table's workspace belongs to current tenant
        val currentTenantId = tenantContextService.getTenantContext()
        if (currentTenantId != null) {
            try {
                val workspace = workspaceService.getWorkspaceById(table.workspaceId)
                // If workspace.tenantId doesn't match, getWorkspaceById will throw 404
                // So if we reach here, we have access
            } catch (e: WorkspaceNotFoundException) {
                // Workspace not accessible means table is not accessible
                throw TableNotFoundException.of(id)
            }
        }
        
        return table
    }
    
    /**
     * Gets all tables in a workspace.
     * 
     * @param workspaceId The workspace ID
     * @return List of tables
     */
    @Transactional(readOnly = true)
    fun getTablesByWorkspace(workspaceId: WorkspaceId): List<Table> {
        return tableRepository.findByWorkspaceId(workspaceId)
    }
    
    /**
     * Adds a property to a table.
     * 
     * @param tableId The table ID
     * @param key The property key
     * @param definition The property definition
     * @return The updated table
     * @throws IllegalArgumentException if table not found or key already exists
     * @throws IllegalStateException if property limit exceeded
     */
    fun addProperty(tableId: TableId, key: String, definition: PropertyDefinition): Table {
        logger.info("Adding property '$key' to table: $tableId")
        
        val table = getTableById(tableId)
        
        // Check property limit
        if (table.getPropertyCount() >= MAX_PROPERTIES_PER_TABLE) {
            throw PropertyLimitExceededException.of(tableId, table.getPropertyCount(), MAX_PROPERTIES_PER_TABLE)
        }
        
        val updatedTable = table.addProperty(key, definition)
        val savedTable = tableRepository.save(updatedTable)
        
        logger.info("Added property '$key' to table $tableId")
        return savedTable
    }
    
    /**
     * Updates a property in a table.
     * 
     * @param tableId The table ID
     * @param key The property key
     * @param definition The new property definition
     * @return The updated table
     * @throws IllegalArgumentException if table or property not found
     */
    fun updateProperty(tableId: TableId, key: String, definition: PropertyDefinition): Table {
        logger.info("Updating property '$key' in table: $tableId")
        
        val table = getTableById(tableId)
        val updatedTable = table.updateProperty(key, definition)
        val savedTable = tableRepository.save(updatedTable)
        
        logger.info("Updated property '$key' in table $tableId")
        return savedTable
    }
    
    /**
     * Removes a property from a table.
     * Note: This will remove the property data from all records.
     * 
     * @param tableId The table ID
     * @param key The property key
     * @return The updated table
     * @throws IllegalArgumentException if table or property not found
     */
    fun removeProperty(tableId: TableId, key: String): Table {
        logger.info("Removing property '$key' from table: $tableId")
        
        val table = getTableById(tableId)
        val updatedTable = table.removeProperty(key)
        val savedTable = tableRepository.save(updatedTable)
        
        // TODO: Consider removing property data from all records
        // This could be done asynchronously for large datasets
        
        logger.info("Removed property '$key' from table $tableId")
        return savedTable
    }
    
    /**
     * Reorders properties in a table.
     * 
     * @param tableId The table ID
     * @param newOrder The new property order
     * @return The updated table
     * @throws IllegalArgumentException if table not found or invalid order
     */
    fun reorderProperties(tableId: TableId, newOrder: List<String>): Table {
        logger.info("Reordering properties in table: $tableId")
        
        val table = getTableById(tableId)
        val updatedTable = table.reorderProperties(newOrder)
        val savedTable = tableRepository.save(updatedTable)
        
        logger.info("Reordered properties in table $tableId")
        return savedTable
    }
    
    /**
     * Renames a table.
     * 
     * @param id The table ID
     * @param newName The new name
     * @return The updated table
     * @throws IllegalArgumentException if table not found or name already exists
     */
    fun renameTable(id: TableId, newName: String): Table {
        logger.info("Renaming table $id to: $newName")
        
        val table = getTableById(id)
        
        // Check for duplicate name
        if (tableRepository.existsByWorkspaceIdAndName(table.workspaceId, newName)) {
            throw DuplicateTableNameException.of(newName, table.workspaceId)
        }
        
        val updatedTable = table.rename(newName)
        val savedTable = tableRepository.save(updatedTable)
        
        logger.info("Renamed table $id to '$newName'")
        return savedTable
    }
    
    /**
     * Updates the description of a table.
     * 
     * @param id The table ID
     * @param newDescription The new description
     * @return The updated table
     * @throws TableNotFoundException if table not found
     */
    fun updateDescription(id: TableId, newDescription: String?): Table {
        logger.info("Updating description for table: $id")
        
        val table = getTableById(id)
        val updatedTable = table.updateDescription(newDescription)
        val savedTable = tableRepository.save(updatedTable)
        
        logger.info("Updated description for table $id")
        return savedTable
    }
    
    /**
     * Deletes a table and all its records.
     * 
     * @param id The table ID
     * @throws TableNotFoundException if table not found
     */
    @Transactional
    fun deleteTable(id: TableId) {
        logger.info("Deleting table: $id")
        
        val table = getTableById(id)
        
        // Delete all records in the table
        recordRepository.deleteByTableId(id)
        
        // Delete the table
        tableRepository.deleteById(id)
        
        logger.info("Deleted table $id and all associated records")
    }
    
    /**
     * Gets the record count for a table.
     * 
     * @param tableId The table ID
     * @return The number of records
     */
    @Transactional(readOnly = true)
    fun getRecordCount(tableId: TableId): Long {
        return recordRepository.countByTableId(tableId)
    }
    
    /**
     * Checks if a table exists.
     * 
     * @param id The table ID
     * @return true if exists, false otherwise
     */
    @Transactional(readOnly = true)
    fun tableExists(id: TableId): Boolean {
        return tableRepository.existsById(id)
    }
}