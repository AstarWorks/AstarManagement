package com.astarworks.astarmanagement.core.table.infrastructure.persistence.entity

import kotlinx.serialization.json.JsonObject
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

/**
 * Spring Data JDBC entity for property_type_catalog table.
 * Defines available property types for the flexible table system.
 */
@Table("property_type_catalog")
data class SpringDataJdbcPropertyTypeCatalogTable(
    @Id
    @Column("id")
    val id: String,
    
    @Version
    val version: Long? = null,  // Spring Data JDBC: null = new entity
    
    @Column("category")
    val category: String? = null,
    
    @Column("validation_schema")
    val validationSchema: JsonObject? = null,
    
    @Column("default_config")
    val defaultConfig: JsonObject = JsonObject(emptyMap()),
    
    @Column("ui_component")
    val uiComponent: String? = null,
    
    @Column("icon")
    val icon: String? = null,
    
    @Column("description")
    val description: String? = null,
    
    @Column("is_active")
    val isActive: Boolean = true,
    
    @Column("is_custom")
    val isCustom: Boolean = false,
    
    @Column("created_at")
    val createdAt: Instant = Instant.now()
)