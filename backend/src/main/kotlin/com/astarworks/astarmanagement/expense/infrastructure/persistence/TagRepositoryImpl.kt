package com.astarworks.astarmanagement.expense.infrastructure.persistence

import com.astarworks.astarmanagement.expense.domain.model.Tag
import com.astarworks.astarmanagement.expense.domain.model.TagScope
import com.astarworks.astarmanagement.expense.domain.repository.TagRepository
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
    private val jpaTagRepository: JpaTagRepository
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
        // Soft delete is handled by marking deleted in the audit info
        // Note: In a real implementation, userId would come from security context
        val userId = UUID.randomUUID() // TODO: Get from security context
        tag.auditInfo.markDeleted(userId)
        jpaTagRepository.save(tag)
    }
}