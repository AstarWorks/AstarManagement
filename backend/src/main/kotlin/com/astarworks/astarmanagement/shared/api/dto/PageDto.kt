package com.astarworks.astarmanagement.shared.api.dto

import kotlinx.serialization.Serializable
import kotlinx.serialization.Contextual

import kotlinx.serialization.SerialName
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.PositiveOrZero

/**
 * Request DTO for pagination parameters.
 */
@Serializable
data class PageRequest(
    @field:PositiveOrZero
    val page: Int = 0,
    
    @field:Positive
    @field:Max(100)
    val size: Int = 20,
    
    val sort: List<SortRequest>? = null
) {
    /**
     * Calculates the offset for database queries.
     */
    fun getOffset(): Int {
        return page * size
    }
    
    /**
     * Checks if sorting is requested.
     */
    fun hasSorting(): Boolean {
        return !sort.isNullOrEmpty()
    }
    
    /**
     * Gets the first sort field if available.
     */
    fun getFirstSort(): SortRequest? {
        return sort?.firstOrNull()
    }
}

/**
 * Sort configuration for pagination.
 */
@Serializable
data class SortRequest(
    val field: String,
    
    val direction: SortDirection = SortDirection.ASC
)

/**
 * Sort direction enumeration.
 */
enum class SortDirection {
    @SerialName("asc")
    ASC,
    
    @SerialName("desc")
    DESC
}

/**
 * Response DTO for paginated results.
 */
@Serializable
data class PageResponse<T>(
    val content: List<T>,
    
    val page: Int,
    
    val size: Int,
    
    val totalElements: Long,
    
    val totalPages: Int,
    
    val first: Boolean,
    
    val last: Boolean,
    
    val numberOfElements: Int
) {
    companion object {
        /**
         * Creates a PageResponse from content and pagination parameters.
         */
        fun <T> of(
            content: List<T>,
            pageRequest: PageRequest,
            totalElements: Long
        ): PageResponse<T> {
            val totalPages = if (pageRequest.size > 0) {
                ((totalElements + pageRequest.size - 1) / pageRequest.size).toInt()
            } else {
                0
            }
            
            return PageResponse(
                content = content,
                page = pageRequest.page,
                size = pageRequest.size,
                totalElements = totalElements,
                totalPages = totalPages,
                first = pageRequest.page == 0,
                last = pageRequest.page >= totalPages - 1,
                numberOfElements = content.size
            )
        }
        
        /**
         * Creates an empty PageResponse.
         */
        fun <T> empty(pageRequest: PageRequest): PageResponse<T> {
            return PageResponse(
                content = emptyList(),
                page = pageRequest.page,
                size = pageRequest.size,
                totalElements = 0,
                totalPages = 0,
                first = true,
                last = true,
                numberOfElements = 0
            )
        }
    }
}

/**
 * Metadata for pagination responses.
 */
@Serializable
data class PageMetadata(
    val page: Int,
    
    val size: Int,
    
    val totalElements: Long,
    
    val totalPages: Int,
    
    val hasNext: Boolean,
    
    val hasPrevious: Boolean
) {
    companion object {
        /**
         * Creates PageMetadata from pagination parameters.
         */
        fun of(
            pageRequest: PageRequest,
            totalElements: Long
        ): PageMetadata {
            val totalPages = if (pageRequest.size > 0) {
                ((totalElements + pageRequest.size - 1) / pageRequest.size).toInt()
            } else {
                0
            }
            
            return PageMetadata(
                page = pageRequest.page,
                size = pageRequest.size,
                totalElements = totalElements,
                totalPages = totalPages,
                hasNext = pageRequest.page < totalPages - 1,
                hasPrevious = pageRequest.page > 0
            )
        }
    }
}