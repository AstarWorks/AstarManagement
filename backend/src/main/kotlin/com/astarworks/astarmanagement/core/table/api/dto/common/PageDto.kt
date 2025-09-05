package com.astarworks.astarmanagement.core.table.api.dto.common

import kotlinx.serialization.Serializable
import kotlinx.serialization.Contextual

import kotlinx.serialization.SerialName
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull

/**
 * Request DTO for pagination parameters.
 * Compatible with Spring Data's Pageable interface.
 */
@Serializable
data class PageRequest(
    @field:Min(0)
    val page: Int = 0,
    
    @field:Min(1)
    @field:Max(100)
    val size: Int = 20,
    
    val sort: List<SortOrder> = emptyList()
) {
    /**
     * Calculates the offset for table queries.
     */
    fun getOffset(): Long = (page * size).toLong()
    
    /**
     * Validates the page request parameters.
     */
    fun isValid(): Boolean {
        return page >= 0 && size > 0 && size <= 100
    }
}

/**
 * Response wrapper for paginated data.
 * Contains the actual content and metadata about the page.
 */
@Serializable
data class PageResponse<T>(
    val content: List<T>,
    
    val metadata: PageMetadata
) {
    companion object {
        /**
         * Creates a PageResponse from a list and page request.
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
                metadata = PageMetadata(
                    page = pageRequest.page,
                    size = pageRequest.size,
                    totalElements = totalElements,
                    totalPages = totalPages,
                    first = pageRequest.page == 0,
                    last = pageRequest.page >= totalPages - 1,
                    numberOfElements = content.size
                )
            )
        }
        
        /**
         * Creates an empty PageResponse.
         */
        fun <T> empty(): PageResponse<T> {
            return PageResponse(
                content = emptyList(),
                metadata = PageMetadata(
                    page = 0,
                    size = 0,
                    totalElements = 0,
                    totalPages = 0,
                    first = true,
                    last = true,
                    numberOfElements = 0
                )
            )
        }
    }
}

/**
 * Metadata about a page of results.
 * Provides information for pagination controls.
 */
@Serializable
data class PageMetadata(
    val page: Int,
    
    val size: Int,
    
    val totalElements: Long,
    
    val totalPages: Int,
    
    val first: Boolean,
    
    val last: Boolean,
    
    val numberOfElements: Int
) {
    /**
     * Checks if there is a next page.
     */
    fun hasNext(): Boolean = !last
    
    /**
     * Checks if there is a previous page.
     */
    fun hasPrevious(): Boolean = !first
    
    /**
     * Gets the next page number, or null if on last page.
     */
    fun getNextPage(): Int? = if (hasNext()) page + 1 else null
    
    /**
     * Gets the previous page number, or null if on first page.
     */
    fun getPreviousPage(): Int? = if (hasPrevious()) page - 1 else null
}

/**
 * Represents a sort order for a specific property.
 */
@Serializable
data class SortOrder(
    @field:NotNull
    val property: String,
    
    val direction: SortDirection = SortDirection.ASC
) {
    /**
     * Creates a SQL ORDER BY clause fragment.
     */
    fun toSqlOrderBy(): String {
        return "$property ${direction.name}"
    }
    
    companion object {
        /**
         * Creates an ascending sort order.
         */
        fun asc(property: String): SortOrder {
            return SortOrder(property, SortDirection.ASC)
        }
        
        /**
         * Creates a descending sort order.
         */
        fun desc(property: String): SortOrder {
            return SortOrder(property, SortDirection.DESC)
        }
    }
}

/**
 * Sort direction enumeration.
 */
enum class SortDirection {
    @SerialName("asc")
    ASC,
    
    @SerialName("desc")
    DESC;
    
    /**
     * Returns the opposite direction.
     */
    fun opposite(): SortDirection {
        return if (this == ASC) DESC else ASC
    }
}