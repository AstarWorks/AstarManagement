package com.astarworks.astarmanagement.core.table.domain.repository

import com.astarworks.astarmanagement.core.table.domain.model.PropertyTypeCatalog
import com.astarworks.astarmanagement.core.table.domain.model.PropertyTypeCategory

/**
 * Repository interface for PropertyTypeCatalog domain entity.
 * Manages available property types for the flexible table system.
 */
interface PropertyTypeCatalogRepository {
    
    /**
     * Save or update a property type catalog entry.
     */
    fun save(catalog: PropertyTypeCatalog): PropertyTypeCatalog
    
    /**
     * Find a property type catalog by its ID.
     */
    fun findById(id: String): PropertyTypeCatalog?
    
    /**
     * Find all property types by category.
     */
    fun findByCategory(category: PropertyTypeCategory): List<PropertyTypeCatalog>
    
    /**
     * Find all active property types.
     */
    fun findAllActive(): List<PropertyTypeCatalog>
    
    /**
     * Find all property types (active and inactive).
     */
    fun findAll(): List<PropertyTypeCatalog>
    
    /**
     * Check if a property type exists by ID.
     */
    fun existsById(id: String): Boolean
    
    /**
     * Delete a property type by ID.
     */
    fun deleteById(id: String)
    
    /**
     * Count all property types.
     */
    fun count(): Long
    
    /**
     * Count active property types.
     */
    fun countActive(): Long
}