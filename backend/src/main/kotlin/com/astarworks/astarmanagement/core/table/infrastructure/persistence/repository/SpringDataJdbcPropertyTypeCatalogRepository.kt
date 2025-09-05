package com.astarworks.astarmanagement.core.table.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.table.infrastructure.persistence.entity.SpringDataJdbcPropertyTypeCatalogTable
import org.springframework.data.jdbc.repository.query.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

/**
 * Spring Data JDBC repository for PropertyTypeCatalog
 */
@Repository
interface SpringDataJdbcPropertyTypeCatalogRepository : CrudRepository<SpringDataJdbcPropertyTypeCatalogTable, String> {
    
    @Query("SELECT * FROM property_type_catalog WHERE is_active = true ORDER BY category, id")
    fun findAllActive(): List<SpringDataJdbcPropertyTypeCatalogTable>
    
    @Query("SELECT * FROM property_type_catalog WHERE category = :category AND is_active = true ORDER BY id")
    fun findByCategory(category: String): List<SpringDataJdbcPropertyTypeCatalogTable>
    
    @Query("SELECT * FROM property_type_catalog WHERE is_custom = true AND is_active = true ORDER BY id")
    fun findAllCustom(): List<SpringDataJdbcPropertyTypeCatalogTable>
}