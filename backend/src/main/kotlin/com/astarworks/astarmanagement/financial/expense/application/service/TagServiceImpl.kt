package com.astarworks.astarmanagement.modules.financial.expense.application.service

import com.astarworks.astarmanagement.modules.financial.expense.application.mapper.TagMapper
import com.astarworks.astarmanagement.modules.financial.expense.domain.model.AuditInfo
import com.astarworks.astarmanagement.modules.financial.expense.domain.model.InsufficientPermissionException
import com.astarworks.astarmanagement.modules.financial.expense.domain.model.Tag
import com.astarworks.astarmanagement.modules.financial.expense.domain.model.TagScope
import com.astarworks.astarmanagement.modules.financial.expense.domain.repository.TagRepository
import com.astarworks.astarmanagement.modules.financial.expense.presentation.request.CreateTagRequest
import com.astarworks.astarmanagement.modules.financial.expense.presentation.request.UpdateTagRequest
import com.astarworks.astarmanagement.modules.financial.expense.presentation.response.TagResponse
import com.astarworks.astarmanagement.modules.shared.infrastructure.security.SecurityContextService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Implementation of TagService with business logic and transaction management.
 * 
 * This service handles tag-related operations including:
 * - CRUD operations with scope-based security
 * - Name normalization and duplicate prevention
 * - Usage tracking and statistics
 * - Access control for TENANT vs PERSONAL tags
 */
@Service
class TagServiceImpl(
    private val tagRepository: TagRepository,
    private val tagMapper: TagMapper,
    private val securityContextService: SecurityContextService
) : TagService {
    
    @Transactional
    override fun create(request: CreateTagRequest): TagResponse {
        val tenantId = securityContextService.requireCurrentTenantId()
        val userId = securityContextService.requireCurrentUserId()
        
        // Normalize the tag name for uniqueness checking
        val normalizedName = Tag.normalizeName(request.name)
        
        // Check for duplicate within the same scope and tenant
        val existingTag = tagRepository.findByNameNormalized(tenantId, normalizedName)
        if (existingTag != null) {
            throw IllegalArgumentException("Tag with name '${request.name}' already exists")
        }
        
        // Determine ownership based on scope
        val ownerId = if (request.scope == TagScope.PERSONAL) userId else null
        
        // Create tag entity
        val tag = Tag(
            tenantId = tenantId,
            name = request.name,
            nameNormalized = normalizedName,
            color = request.color,
            scope = request.scope,
            ownerId = ownerId,
            usageCount = 0,
            lastUsedAt = null,
            auditInfo = AuditInfo(
                createdBy = userId,
                updatedBy = userId
            )
        )
        
        val savedTag = tagRepository.save(tag)
        return tagMapper.toResponse(savedTag)
    }
    
    @Transactional(readOnly = true)
    override fun listAccessibleTags(scope: TagScope?, search: String?): List<TagResponse> {
        val tenantId = securityContextService.requireCurrentTenantId()
        val userId = securityContextService.requireCurrentUserId()
        
        val tags = when (scope) {
            TagScope.TENANT -> {
                tagRepository.findByTenantIdAndScope(tenantId, TagScope.TENANT)
            }
            TagScope.PERSONAL -> {
                tagRepository.findByTenantIdAndScope(tenantId, TagScope.PERSONAL)
                    .filter { it.ownerId == userId }
            }
            null -> {
                // Return all accessible tags (tenant tags + user's personal tags)
                val tenantTags = tagRepository.findByTenantIdAndScope(tenantId, TagScope.TENANT)
                val personalTags = tagRepository.findByTenantIdAndScope(tenantId, TagScope.PERSONAL)
                    .filter { it.ownerId == userId }
                tenantTags + personalTags
            }
        }
        
        // Apply search filter if provided
        val filteredTags = if (search.isNullOrBlank()) {
            tags
        } else {
            val searchLower = search.lowercase()
            tags.filter { 
                it.name.lowercase().contains(searchLower) || 
                it.nameNormalized.contains(searchLower)
            }
        }
        
        return filteredTags.map { tagMapper.toResponse(it) }
    }
    
    @Transactional(readOnly = true)
    override fun getSuggestions(limit: Int): List<TagResponse> {
        val tenantId = securityContextService.requireCurrentTenantId()
        val userId = securityContextService.requireCurrentUserId()
        
        // Get most used tags that are accessible to the user
        val suggestedTags = tagRepository.findMostUsed(tenantId, limit)
            .filter { tag ->
                when (tag.scope) {
                    TagScope.TENANT -> true
                    TagScope.PERSONAL -> tag.ownerId == userId
                }
            }
        
        return suggestedTags.map { tagMapper.toResponse(it) }
    }
    
    @Transactional
    override fun update(id: UUID, request: UpdateTagRequest): TagResponse {
        val tenantId = securityContextService.requireCurrentTenantId()
        val userId = securityContextService.requireCurrentUserId()
        
        // Find existing tag with security check
        val existingTag = tagRepository.findByIdAndTenantId(id, tenantId)
            ?: throw IllegalArgumentException("Tag not found with id: $id")
        
        // Check permissions - user can only update tags they own or tenant tags
        if (existingTag.scope == TagScope.PERSONAL && existingTag.ownerId != userId) {
            throw InsufficientPermissionException("Cannot update personal tag owned by another user")
        }
        
        // Use existing values if not provided in update request
        val newName = request.name ?: existingTag.name
        val newColor = request.color ?: existingTag.color
        
        // Check for name conflicts if name is being changed
        val normalizedName = Tag.normalizeName(newName)
        if (normalizedName != existingTag.nameNormalized) {
            val duplicateTag = tagRepository.findByNameNormalized(tenantId, normalizedName)
            if (duplicateTag != null && duplicateTag.id != id) {
                throw IllegalArgumentException("Tag with name '$newName' already exists")
            }
        }
        
        // Create updated tag (immutable approach)
        val updatedTag = Tag(
            id = existingTag.id,
            tenantId = existingTag.tenantId,
            name = newName,
            nameNormalized = normalizedName,
            color = newColor,
            scope = existingTag.scope, // Scope cannot be changed after creation
            ownerId = existingTag.ownerId, // Ownership cannot be changed
            usageCount = existingTag.usageCount, // Preserve usage statistics
            lastUsedAt = existingTag.lastUsedAt,
            auditInfo = existingTag.auditInfo.copy(
                updatedBy = userId
            )
        )
        
        val savedTag = tagRepository.save(updatedTag)
        return tagMapper.toResponse(savedTag)
    }
    
    @Transactional
    override fun delete(id: UUID) {
        val tenantId = securityContextService.requireCurrentTenantId()
        val userId = securityContextService.requireCurrentUserId()
        
        // Find tag with security check
        val tag = tagRepository.findByIdAndTenantId(id, tenantId)
            ?: throw IllegalArgumentException("Tag not found with id: $id")
        
        // Check permissions
        if (tag.scope == TagScope.PERSONAL && tag.ownerId != userId) {
            throw InsufficientPermissionException("Cannot delete personal tag owned by another user")
        }
        
        // Check if tag can be deleted (business rules)
        if (!canDelete(id)) {
            throw IllegalStateException("Tag cannot be deleted as it is currently in use")
        }
        
        // Perform soft delete with business logic
        tag.auditInfo.markDeleted(userId)
        
        // Save the soft-deleted tag
        tagRepository.save(tag)
    }
    
    @Transactional(readOnly = true)
    override fun findByNormalizedName(normalizedName: String): TagResponse? {
        val tenantId = securityContextService.requireCurrentTenantId()
        val tag = tagRepository.findByNameNormalized(tenantId, normalizedName)
        return tag?.let { tagMapper.toResponse(it) }
    }
    
    @Transactional(readOnly = true)
    override fun canDelete(id: UUID): Boolean {
        val tenantId = securityContextService.requireCurrentTenantId()
        val userId = securityContextService.requireCurrentUserId()
        
        val tag = tagRepository.findByIdAndTenantId(id, tenantId) ?: return false
        
        // Check permissions
        if (tag.scope == TagScope.PERSONAL && tag.ownerId != userId) {
            return false
        }
        
        // Check if tag is in use - for now, allow deletion even if in use
        // In a more complex system, you might want to check for active references
        // and prevent deletion of heavily used tags
        
        return true
    }
    
    @Transactional
    override fun findOrCreateTags(tagNames: List<String>, scope: TagScope): List<TagResponse> {
        if (tagNames.isEmpty()) {
            return emptyList()
        }
        
        val tenantId = securityContextService.requireCurrentTenantId()
        val userId = securityContextService.requireCurrentUserId()
        
        return tagNames.map { tagName ->
            val normalizedName = Tag.normalizeName(tagName)
            
            // Try to find existing tag
            var existingTag = tagRepository.findByNameNormalized(tenantId, normalizedName)
            
            if (existingTag != null) {
                // Use existing tag
                tagMapper.toResponse(existingTag)
            } else {
                // Create new tag
                val ownerId = if (scope == TagScope.PERSONAL) userId else null
                
                val newTag = Tag(
                    tenantId = tenantId,
                    name = tagName,
                    nameNormalized = normalizedName,
                    color = generateTagColor(), // Generate a default color
                    scope = scope,
                    ownerId = ownerId,
                    usageCount = 0,
                    lastUsedAt = null,
                    auditInfo = AuditInfo(
                        createdBy = userId,
                        updatedBy = userId
                    )
                )
                
                val savedTag = tagRepository.save(newTag)
                tagMapper.toResponse(savedTag)
            }
        }
    }
    
    /**
     * Generates a default color for new tags.
     * This is a simple implementation - could be enhanced with better color selection logic.
     */
    private fun generateTagColor(): String {
        val colors = listOf(
            "#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#A133FF",
            "#33FFF5", "#F5FF33", "#FF8C33", "#33FF8C", "#8C33FF"
        )
        return colors.random()
    }
}