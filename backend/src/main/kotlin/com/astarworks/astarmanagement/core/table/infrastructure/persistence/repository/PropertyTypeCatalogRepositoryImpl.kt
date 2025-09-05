package com.astarworks.astarmanagement.core.table.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.table.domain.model.PropertyTypeCatalog
import com.astarworks.astarmanagement.core.table.domain.model.PropertyTypeCategory
import com.astarworks.astarmanagement.core.table.domain.repository.PropertyTypeCatalogRepository
import com.astarworks.astarmanagement.core.table.infrastructure.persistence.mapper.PropertyTypeCatalogMapper
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * Implementation of PropertyTypeCatalogRepository using Spring Data JDBC.
 * Manages property type catalog persistence operations.
 */
@Component
class PropertyTypeCatalogRepositoryImpl(
    private val jdbcRepository: SpringDataJdbcPropertyTypeCatalogRepository,
    private val mapper: PropertyTypeCatalogMapper
) : PropertyTypeCatalogRepository {
    
    @Transactional
    override fun save(catalog: PropertyTypeCatalog): PropertyTypeCatalog {
        val entity = mapper.toEntity(catalog)
        val savedEntity = jdbcRepository.save(entity)
        return mapper.toDomain(savedEntity)
    }
    
    @Transactional(readOnly = true)
    override fun findById(id: String): PropertyTypeCatalog? {
        return jdbcRepository.findById(id)
            .map { mapper.toDomain(it) }
            .orElse(null)
    }
    
    @Transactional(readOnly = true)
    override fun findByCategory(category: PropertyTypeCategory): List<PropertyTypeCatalog> {
        val entities = jdbcRepository.findByCategory(category.name.lowercase())
        return mapper.toDomainList(entities)
    }
    
    @Transactional(readOnly = true)
    override fun findAllActive(): List<PropertyTypeCatalog> {
        val entities = jdbcRepository.findAllActive()
        return mapper.toDomainList(entities)
    }
    
    @Transactional(readOnly = true)
    override fun findAll(): List<PropertyTypeCatalog> {
        val entities = jdbcRepository.findAll().toList()
        return mapper.toDomainList(entities)
    }
    
    override fun existsById(id: String): Boolean {
        return jdbcRepository.existsById(id)
    }
    
    @Transactional
    override fun deleteById(id: String) {
        jdbcRepository.deleteById(id)
    }
    
    override fun count(): Long {
        return jdbcRepository.count()
    }
    
    override fun countActive(): Long {
        return jdbcRepository.findAllActive().size.toLong()
    }
}