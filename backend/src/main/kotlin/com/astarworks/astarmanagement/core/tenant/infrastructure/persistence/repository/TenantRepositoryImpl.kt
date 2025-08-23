package com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.domain.repository.TenantRepository
import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.mapper.TenantMapper
import org.springframework.stereotype.Repository
import java.util.UUID

/**
 * Implementation of TenantRepository using Spring Data JPA.
 * Bridges the domain repository interface with JPA operations.
 */
@Repository
class TenantRepositoryImpl(
    private val jpaTenantRepository: JpaTenantRepository,
    private val tenantMapper: TenantMapper
) : TenantRepository {
    
    override fun save(tenant: Tenant): Tenant {
        val entity = jpaTenantRepository.findById(tenant.id)
            .map { existingEntity ->
                tenantMapper.updateEntity(existingEntity, tenant)
            }
            .orElseGet {
                tenantMapper.toEntity(tenant)
            }
        
        val savedEntity = jpaTenantRepository.save(entity)
        return tenantMapper.toDomain(savedEntity)
    }
    
    override fun findById(id: UUID): Tenant? {
        return jpaTenantRepository.findById(id)
            .map { tenantMapper.toDomain(it) }
            .orElse(null)
    }
    
    override fun findBySlug(slug: String): Tenant? {
        return jpaTenantRepository.findBySlug(slug)
            ?.let { tenantMapper.toDomain(it) }
    }
    
    override fun findByAuth0OrgId(auth0OrgId: String): Tenant? {
        return jpaTenantRepository.findByAuth0OrgId(auth0OrgId)
            ?.let { tenantMapper.toDomain(it) }
    }
    
    override fun findAll(): List<Tenant> {
        return tenantMapper.toDomainList(jpaTenantRepository.findAll())
    }
    
    override fun findAllActive(): List<Tenant> {
        return tenantMapper.toDomainList(jpaTenantRepository.findByIsActiveTrue())
    }
    
    override fun existsBySlug(slug: String): Boolean {
        return jpaTenantRepository.existsBySlug(slug)
    }
    
    override fun existsByAuth0OrgId(auth0OrgId: String): Boolean {
        return jpaTenantRepository.existsByAuth0OrgId(auth0OrgId)
    }
    
    override fun deleteById(id: UUID) {
        jpaTenantRepository.deleteById(id)
    }
    
    override fun count(): Long {
        return jpaTenantRepository.count()
    }
}