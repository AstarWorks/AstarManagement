package com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.domain.repository.TenantRepository
import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.mapper.SpringDataJdbcTenantMapper
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Repository

/**
 * Implementation of TenantRepository using Spring Data JDBC.
 * Bridges the domain repository interface with Spring Data JDBC operations.
 */
@Repository
class TenantRepositoryImpl(
    private val springDataJdbcTenantRepository: SpringDataJdbcTenantRepository,
    private val mapper: SpringDataJdbcTenantMapper
) : TenantRepository {
    
    override fun save(tenant: Tenant): Tenant {
        // Check if the tenant already exists to handle version properly
        val existingEntity = springDataJdbcTenantRepository.findByIdOrNull(tenant.id)
        
        return if (existingEntity != null) {
            // For updates: preserve version and update fields
            val updatedEntity = existingEntity.copy(
                slug = tenant.slug,
                name = tenant.name,
                auth0OrgId = tenant.auth0OrgId,
                isActive = tenant.isActive,
                createdAt = tenant.createdAt,
                updatedAt = tenant.updatedAt
            )
            val savedEntity = springDataJdbcTenantRepository.save(updatedEntity)
            mapper.toDomain(savedEntity)
        } else {
            // For new entities: create from domain model
            val tableEntity = mapper.toTable(tenant)
            val savedEntity = springDataJdbcTenantRepository.save(tableEntity)
            mapper.toDomain(savedEntity)
        }
    }
    
    override fun findById(id: TenantId): Tenant? {
        return springDataJdbcTenantRepository.findByIdOrNull(id)?.let { mapper.toDomain(it) }
    }
    
    override fun findBySlug(slug: String): Tenant? {
        return springDataJdbcTenantRepository.findBySlug(slug)?.let { mapper.toDomain(it) }
    }
    
    override fun findByAuth0OrgId(auth0OrgId: String): Tenant? {
        return springDataJdbcTenantRepository.findByAuth0OrgId(auth0OrgId)?.let { mapper.toDomain(it) }
    }
    
    override fun findAll(): List<Tenant> {
        return mapper.toDomainList(springDataJdbcTenantRepository.findAll())
    }
    
    override fun findAllActive(): List<Tenant> {
        return mapper.toDomainList(springDataJdbcTenantRepository.findByIsActiveTrue())
    }
    
    override fun existsBySlug(slug: String): Boolean {
        return springDataJdbcTenantRepository.existsBySlug(slug)
    }
    
    override fun existsByAuth0OrgId(auth0OrgId: String): Boolean {
        return springDataJdbcTenantRepository.existsByAuth0OrgId(auth0OrgId)
    }
    
    override fun deleteById(id: TenantId) {
        springDataJdbcTenantRepository.deleteById(id)
    }
    
    override fun count(): Long {
        return springDataJdbcTenantRepository.count()
    }
}