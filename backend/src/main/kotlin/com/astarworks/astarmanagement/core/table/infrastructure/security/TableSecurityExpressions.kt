package com.astarworks.astarmanagement.core.table.infrastructure.security

import com.astarworks.astarmanagement.core.auth.domain.model.AuthenticatedUserContext
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import com.astarworks.astarmanagement.core.auth.domain.service.AuthorizationService
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import java.util.UUID

/**
 * Security expression utilities for Table-related operations.
 * Provides standardized permission and resource access checks.
 */
@Component("tableSecurityExpressions")
class TableSecurityExpressions(
    private val authorizationService: AuthorizationService
) {
    
    /**
     * Check table creation permission.
     * Workspace access is implicitly checked via tenant isolation.
     */
    fun canCreateTable(workspaceId: UUID): Boolean {
        return hasPermission("table.create.all")
    }
    
    /**
     * Check table view permission.
     * Table access is implicitly checked via tenant isolation.
     */
    fun canViewTable(tableId: UUID): Boolean {
        return hasPermission("table.view.all")
    }
    
    /**
     * Check tables view permission in workspace.
     * Workspace access is implicitly checked via tenant isolation.
     */
    fun canViewTablesInWorkspace(workspaceId: UUID): Boolean {
        return hasPermission("table.view.all")
    }
    
    /**
     * Check table edit permission.
     * Table access is implicitly checked via tenant isolation.
     */
    fun canEditTable(tableId: UUID): Boolean {
        return hasPermission("table.edit.all")
    }
    
    /**
     * Check table delete permission.
     * Table access is implicitly checked via tenant isolation.
     */
    fun canDeleteTable(tableId: UUID): Boolean {
        return hasPermission("table.delete.all")
    }
    
    /**
     * Check record creation permission.
     * Table access is implicitly checked via tenant isolation.
     */
    fun canCreateRecord(tableId: UUID): Boolean {
        return hasPermission("record.create.all")
    }
    
    /**
     * Check record view permission.
     * Record access is implicitly checked via tenant isolation.
     */
    fun canViewRecord(recordId: UUID): Boolean {
        return hasPermission("record.view.all")
    }
    
    /**
     * Check record edit permission.
     * Record access is implicitly checked via tenant isolation.
     */
    fun canEditRecord(recordId: UUID): Boolean {
        return hasPermission("record.edit.all")
    }
    
    /**
     * Check record delete permission.
     * Record access is implicitly checked via tenant isolation.
     */
    fun canDeleteRecord(recordId: UUID): Boolean {
        return hasPermission("record.delete.all")
    }
    
    /**
     * Check records view permission for a table.
     * Table access is implicitly checked via tenant isolation.
     */
    fun canViewTableRecords(tableId: UUID): Boolean {
        return hasPermission("record.view.all")
    }
    
    /**
     * Check table export permission.
     * Table access is implicitly checked via tenant isolation.
     */
    fun canExportTable(tableId: UUID): Boolean {
        return hasPermission("table.export.all")
    }
    
    /**
     * Check table import permission.
     * Table access is implicitly checked via tenant isolation.
     */
    fun canImportTable(tableId: UUID): Boolean {
        return hasPermission("table.import.all")
    }
    
    /**
     * Check table duplication permission.
     * Source table access is implicitly checked via tenant isolation.
     */
    fun canDuplicateTable(sourceTableId: UUID): Boolean {
        return hasPermission("table.create.all")
    }
    
    /**
     * Check property type management permissions.
     */
    fun canManagePropertyTypes(): Boolean {
        return hasPermission("property_type.create.all") || 
               hasPermission("property_type.edit.all") || 
               hasPermission("property_type.delete.all")
    }
    
    /**
     * Check view custom property types permission.
     */
    fun canViewCustomPropertyTypes(): Boolean {
        return hasPermission("property_type.view.custom")
    }
    
    // Private helper methods
    
    private fun hasPermission(permission: String): Boolean {
        val tenantUserId = getCurrentTenantUserId()
        return tenantUserId?.let { 
            val rule = try {
                PermissionRule.fromDatabaseString(permission)
            } catch (e: IllegalArgumentException) {
                return false
            }
            authorizationService.hasPermission(it, rule)
        } ?: false
    }
    
    private fun getCurrentTenantUserId(): UUID? {
        return try {
            val authentication = SecurityContextHolder.getContext().authentication
            val userContext = authentication?.principal as? AuthenticatedUserContext
            userContext?.tenantUserId
        } catch (e: Exception) {
            null
        }
    }
}