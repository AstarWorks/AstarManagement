package dev.ryuzu.astermanagement.dto.common

import io.swagger.v3.oas.annotations.media.Schema

/**
 * Wrapper for paginated API responses with metadata.
 * 
 * @param T The type of items in the page
 * @property data List of items in the current page
 * @property page Pagination metadata
 */
@Schema(description = "Paginated response wrapper")
data class PagedResponse<T>(
    @Schema(description = "List of items in the current page")
    val data: List<T>,
    
    @Schema(description = "Pagination metadata")
    val page: PageInfo
) {
    /**
     * Pagination metadata containing information about the current page.
     * 
     * @property number Current page number (0-based)
     * @property size Number of items per page
     * @property totalElements Total number of items across all pages
     * @property totalPages Total number of pages available
     * @property first Whether this is the first page
     * @property last Whether this is the last page
     */
    @Schema(description = "Pagination metadata")
    data class PageInfo(
        @Schema(description = "Current page number (0-based)", example = "0")
        val number: Int,
        
        @Schema(description = "Number of items per page", example = "20")
        val size: Int,
        
        @Schema(description = "Total number of items across all pages", example = "150")
        val totalElements: Long,
        
        @Schema(description = "Total number of pages available", example = "8")
        val totalPages: Int,
        
        @Schema(description = "Whether this is the first page", example = "true")
        val first: Boolean,
        
        @Schema(description = "Whether this is the last page", example = "false")
        val last: Boolean
    )
    
    companion object {
        /**
         * Creates a PagedResponse from Spring Data's Page object.
         * 
         * @param page Spring Data Page object
         * @param mapper Function to transform entities to DTOs
         * @return PagedResponse with transformed data
         */
        fun <T, R> fromPage(
            page: org.springframework.data.domain.Page<T>,
            mapper: (T) -> R
        ): PagedResponse<R> {
            return PagedResponse(
                data = page.content.map(mapper),
                page = PageInfo(
                    number = page.number,
                    size = page.size,
                    totalElements = page.totalElements,
                    totalPages = page.totalPages,
                    first = page.isFirst,
                    last = page.isLast
                )
            )
        }
    }
}