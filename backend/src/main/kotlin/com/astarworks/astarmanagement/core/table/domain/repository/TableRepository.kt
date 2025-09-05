package com.astarworks.astarmanagement.core.table.domain.repository

import com.astarworks.astarmanagement.core.table.domain.model.Table
import com.astarworks.astarmanagement.shared.domain.value.TableId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import java.util.UUID

/**
 * Repository interface for Table domain entity.
 * Manages Notion-like dynamic table definitions.
 */
interface TableRepository {
    
    /**
     * Save or update a table.
     */
    fun save(table: Table): Table
    
    /**
     * Find a table by its ID.
     */
    fun findById(id: TableId): Table?
    
    /**
     * Find all tables in a workspace.
     */
    fun findByWorkspaceId(workspaceId: WorkspaceId): List<Table>
    
    /**
     * Find a table by workspace ID and name.
     */
    fun findByWorkspaceIdAndName(workspaceId: WorkspaceId, name: String): Table?
    
    /**
     * Find tables by name (across all workspaces).
     * Note: Name is not unique across workspaces.
     */
    fun findByName(name: String): List<Table>
    
    /**
     * Find all tables.
     */
    fun findAll(): List<Table>
    
    /**
     * Check if a table exists by ID.
     */
    fun existsById(id: TableId): Boolean
    
    /**
     * Check if a table exists in a workspace with a specific name.
     */
    fun existsByWorkspaceIdAndName(workspaceId: WorkspaceId, name: String): Boolean
    
    /**
     * Delete a table by ID.
     */
    fun deleteById(id: TableId)
    
    /**
     * Delete all tables in a workspace.
     */
    fun deleteByWorkspaceId(workspaceId: WorkspaceId)
    
    /**
     * Count all tables.
     */
    fun count(): Long
    
    /**
     * Count tables in a specific workspace.
     */
    fun countByWorkspaceId(workspaceId: WorkspaceId): Long
}