package com.astarworks.astarmanagement.expense.application.mapper

import com.astarworks.astarmanagement.expense.domain.model.Tag
import com.astarworks.astarmanagement.expense.presentation.response.TagResponse
import org.springframework.stereotype.Component

/**
 * Mapper for converting between Tag domain models and DTOs.
 */
@Component
class TagMapper {
    /**
     * Converts a Tag domain model to TagResponse DTO.
     * @param tag The domain model to convert
     * @return The response DTO
     */
    fun toResponse(tag: Tag): TagResponse {
        return TagResponse(
            id = tag.id,
            name = tag.name,
            color = tag.color,
            scope = tag.scope,
            ownerId = tag.ownerId,
            usageCount = tag.usageCount,
            lastUsedAt = tag.lastUsedAt,
            createdAt = tag.auditInfo.createdAt,
            updatedAt = tag.auditInfo.updatedAt,
            isPersonal = tag.isPersonal(),
            isShared = tag.isShared()
        )
    }
    
    /**
     * Converts a list of Tag domain models to response DTOs.
     * @param tags The list of domain models
     * @return The list of response DTOs
     */
    fun toResponseList(tags: List<Tag>): List<TagResponse> {
        return tags.map { toResponse(it) }
    }
}