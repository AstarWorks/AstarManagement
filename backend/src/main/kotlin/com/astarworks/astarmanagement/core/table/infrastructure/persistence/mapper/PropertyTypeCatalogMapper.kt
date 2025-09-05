package com.astarworks.astarmanagement.core.table.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.core.table.domain.model.PropertyTypeCatalog
import com.astarworks.astarmanagement.core.table.domain.model.PropertyTypeCategory
import com.astarworks.astarmanagement.core.table.infrastructure.persistence.entity.SpringDataJdbcPropertyTypeCatalogTable
import kotlinx.serialization.json.JsonObject
import org.springframework.stereotype.Component

/**
 * Mapper between PropertyTypeCatalog domain model and Spring Data JDBC entity
 */
@Component
class PropertyTypeCatalogMapper {
    
    fun toDomain(entity: SpringDataJdbcPropertyTypeCatalogTable): PropertyTypeCatalog {
        return PropertyTypeCatalog(
            id = entity.id,
            category = entity.category?.let { 
                PropertyTypeCategory.valueOf(it.uppercase()) 
            } ?: PropertyTypeCategory.BASIC,
            validationSchema = entity.validationSchema,
            defaultConfig = entity.defaultConfig,
            uiComponent = entity.uiComponent,
            icon = entity.icon,
            description = entity.description,
            isActive = entity.isActive,
            isCustom = entity.isCustom
        )
    }
    
    fun toEntity(domain: PropertyTypeCatalog): SpringDataJdbcPropertyTypeCatalogTable {
        return SpringDataJdbcPropertyTypeCatalogTable(
            id = domain.id,
            category = domain.category.name.lowercase(),
            validationSchema = domain.validationSchema,
            defaultConfig = domain.defaultConfig,
            uiComponent = domain.uiComponent,
            icon = domain.icon,
            description = domain.description,
            isActive = domain.isActive,
            isCustom = domain.isCustom
        )
    }
    
    fun toDomainList(entities: List<SpringDataJdbcPropertyTypeCatalogTable>): List<PropertyTypeCatalog> {
        return entities.map { toDomain(it) }
    }
}