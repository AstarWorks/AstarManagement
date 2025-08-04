package com.astarworks.astarmanagement.expense.presentation.response

/**
 * Generic paged response wrapper for list endpoints.
 * Supports offset-based pagination with metadata.
 */
data class PagedResponse<T>(
    val data: List<T>,
    val offset: Int,
    val limit: Int,
    val total: Long,
    val hasNext: Boolean,
    val hasPrevious: Boolean
) {
    val pageCount: Int = if (limit > 0) ((total + limit - 1) / limit).toInt() else 0
    val currentPage: Int = if (limit > 0) (offset / limit) + 1 else 1
    
    companion object {
        /**
         * Creates a paged response from a list of items.
         */
        fun <T> of(items: List<T>, offset: Int, limit: Int, total: Long): PagedResponse<T> {
            return PagedResponse(
                data = items,
                offset = offset,
                limit = limit,
                total = total,
                hasNext = offset + items.size < total,
                hasPrevious = offset > 0
            )
        }
    }
}