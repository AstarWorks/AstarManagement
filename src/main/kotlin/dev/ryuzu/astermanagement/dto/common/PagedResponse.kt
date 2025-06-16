package dev.ryuzu.astermanagement.dto.common

/**
 * Wrapper for paginated API responses with metadata.
 * 
 * @param T The type of items in the page
 * @property data List of items in the current page
 * @property page Pagination metadata
 */
data class PagedResponse<T>(
    val data: List<T>,
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
    data class PageInfo(
        val number: Int,
        val size: Int,
        val totalElements: Long,
        val totalPages: Int,
        val first: Boolean,
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