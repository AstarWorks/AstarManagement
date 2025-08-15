package com.astarworks.astarmanagement.modules.financial.expense.infrastructure.persistence

import com.astarworks.astarmanagement.modules.financial.expense.domain.model.Tag
import com.astarworks.astarmanagement.modules.financial.expense.domain.model.TagScope
import com.astarworks.astarmanagement.modules.financial.expense.domain.model.TagNotFoundException
import com.astarworks.astarmanagement.modules.financial.expense.domain.model.InsufficientPermissionException
import com.astarworks.astarmanagement.modules.financial.expense.domain.repository.TagRepository
import com.astarworks.astarmanagement.modules.shared.infrastructure.security.SecurityContextService
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Component
import java.util.UUID

/**
 * Implementation of TagRepository using Spring Data JPA.
 * 
 * This class bridges the domain repository interface with the JPA repository,
 * handling the translation between domain operations and persistence operations.
 */
@Component
class TagRepositoryImpl(
    private val jpaTagRepository: JpaTagRepository,
    private val securityContextService: SecurityContextService
) : TagRepository {
    
    override fun save(tag: Tag): Tag {
        return jpaTagRepository.save(tag)
    }
    
    override fun findById(id: UUID): Tag? {
        return jpaTagRepository.findById(id)
            .filter { it.auditInfo.deletedAt == null }
            .orElse(null)
    }
    
    override fun findByIdAndTenantId(id: UUID, tenantId: UUID): Tag? {
        val currentTenantId = securityContextService.getCurrentTenantId()
        if (currentTenantId != null && currentTenantId != tenantId) {
            throw InsufficientPermissionException("access tag from different tenant")
        }
        return jpaTagRepository.findByIdAndTenantId(id, tenantId)
    }
    
    override fun findByTenantId(tenantId: UUID): List<Tag> {
        return jpaTagRepository.findByTenantId(tenantId)
    }
    
    override fun findByTenantIdAndScope(
        tenantId: UUID,
        scope: TagScope
    ): List<Tag> {
        return jpaTagRepository.findByTenantIdAndScope(tenantId, scope)
    }
    
    override fun findByNameNormalized(
        tenantId: UUID,
        nameNormalized: String
    ): Tag? {
        return jpaTagRepository.findByTenantIdAndNameNormalized(tenantId, nameNormalized)
    }
    
    override fun findMostUsed(
        tenantId: UUID,
        limit: Int
    ): List<Tag> {
        val pageable = PageRequest.of(0, limit)
        return jpaTagRepository.findMostUsedTags(tenantId, pageable)
    }
    
    override fun delete(tag: Tag) {
        // Business logic for soft delete is now handled in the service layer
        jpaTagRepository.save(tag)
    }
}