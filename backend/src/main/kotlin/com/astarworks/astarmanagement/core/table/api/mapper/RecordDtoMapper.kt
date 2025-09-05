package com.astarworks.astarmanagement.core.table.api.mapper

import com.astarworks.astarmanagement.core.table.api.dto.common.PageMetadata
import com.astarworks.astarmanagement.core.table.api.dto.common.PageResponse
import com.astarworks.astarmanagement.core.table.api.dto.record.*
import com.astarworks.astarmanagement.core.table.domain.model.Record
import kotlinx.serialization.json.*
import org.springframework.data.domain.Page
import org.springframework.stereotype.Component
import java.util.UUID

/**
 * Mapper for converting between Record domain models and DTOs.
 * Handles transformations for API layer communication.
 */
@Component
class RecordDtoMapper {
    
    /**
     * Converts a Record domain model to RecordResponse DTO.
     * 
     * @param record The Record domain model
     * @return The corresponding RecordResponse DTO
     */
    fun toResponse(record: Record): RecordResponse {
        return RecordResponse(
            id = record.id.value,
            tableId = record.tableId.value,
            data = record.data,
            position = record.position,
            createdAt = record.createdAt,
            updatedAt = record.updatedAt
        )
    }
    
    /**
     * Converts a list of Record domain models to RecordResponse DTOs.
     * 
     * @param records List of Record domain models
     * @return List of corresponding RecordResponse DTOs
     */
    fun toResponseList(records: List<Record>): List<RecordResponse> {
        return records.map { toResponse(it) }
    }
    
    /**
     * Converts a Record to RecordSummaryResponse.
     * 
     * @param record The Record domain model
     * @return The corresponding RecordSummaryResponse DTO
     */
    fun toSummaryResponse(record: Record): RecordSummaryResponse {
        val primaryField = record.data.entries.firstOrNull()?.value
        return RecordSummaryResponse(
            id = record.id.value,
            primaryField = primaryField,
            updatedAt = record.updatedAt
        )
    }
    
    /**
     * Converts a list of Records to RecordSummaryResponse DTOs.
     * 
     * @param records List of Record domain models
     * @return List of corresponding RecordSummaryResponse DTOs
     */
    fun toSummaryResponseList(records: List<Record>): List<RecordSummaryResponse> {
        return records.map { toSummaryResponse(it) }
    }
    
    /**
     * Converts a Record to RecordMinimalResponse with selected fields.
     * 
     * @param record The Record domain model
     * @param fields Set of field names to include
     * @return The corresponding RecordMinimalResponse DTO
     */
    fun toMinimalResponse(record: Record, fields: Set<String>): RecordMinimalResponse {
        val filteredData = buildJsonObject {
            record.data.forEach { (key, value) ->
                if (key in fields) {
                    put(key, value)
                }
            }
        }
        return RecordMinimalResponse(
            id = record.id.value,
            data = filteredData,
            updatedAt = record.updatedAt
        )
    }
    
    /**
     * Converts a Page of Records to PageResponse of RecordResponse DTOs.
     * 
     * @param page Page of Record domain models
     * @return PageResponse of RecordResponse DTOs
     */
    fun toPageResponse(page: Page<Record>): PageResponse<RecordResponse> {
        val content = toResponseList(page.content)
        return PageResponse(
            content = content,
            metadata = PageMetadata(
                page = page.number,
                size = page.size,
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                first = page.isFirst,
                last = page.isLast,
                numberOfElements = page.numberOfElements
            )
        )
    }
    
    /**
     * Creates a RecordListResponse from a list of Records.
     * 
     * @param records List of Record domain models
     * @param tableId Optional table ID
     * @return RecordListResponse DTO
     */
    fun toListResponse(records: List<Record>, tableId: UUID? = null): RecordListResponse {
        val responses = toResponseList(records)
        return RecordListResponse.of(responses, tableId)
    }
    
    /**
     * Extracts data from RecordCreateRequest.
     * 
     * @param request The RecordCreateRequest DTO
     * @return JsonObject of field values
     */
    fun extractCreateData(request: RecordCreateRequest): JsonObject {
        return request.data
    }
    
    /**
     * Extracts data from RecordUpdateRequest.
     * 
     * @param request The RecordUpdateRequest DTO
     * @return JsonObject of field values
     */
    fun extractUpdateData(request: RecordUpdateRequest): JsonObject {
        return request.data
    }
    
    /**
     * Creates a RecordBatchResponse for successful operations.
     * 
     * @param succeeded List of successfully processed records
     * @return RecordBatchResponse DTO
     */
    fun toBatchSuccessResponse(succeeded: List<Record>): RecordBatchResponse {
        val responses = toResponseList(succeeded)
        return RecordBatchResponse.success(responses)
    }
    
    /**
     * Creates a RecordBatchResponse for failed operations.
     * 
     * @param errors List of batch errors
     * @return RecordBatchResponse DTO
     */
    fun toBatchFailureResponse(errors: List<RecordBatchError>): RecordBatchResponse {
        return RecordBatchResponse.failure(errors)
    }
    
    /**
     * Creates a RecordBatchResponse for partial success operations.
     * 
     * @param succeeded List of successfully processed records
     * @param failed List of batch errors
     * @return RecordBatchResponse DTO
     */
    fun toBatchResponse(
        succeeded: List<Record>,
        failed: List<RecordBatchError>
    ): RecordBatchResponse {
        val responses = toResponseList(succeeded)
        return RecordBatchResponse.partial(responses, failed)
    }
    
    /**
     * Creates a RecordCopyResponse from original and copied records.
     * 
     * @param originalIds List of original record IDs
     * @param copiedRecords List of copied records
     * @return RecordCopyResponse DTO
     */
    fun toCopyResponse(
        originalIds: List<UUID>,
        copiedRecords: List<Record>
    ): RecordCopyResponse {
        val copiedResponses = toResponseList(copiedRecords)
        val mapping = originalIds.zip(copiedRecords.map { it.id.value }).toMap()
        
        return RecordCopyResponse(
            originalIds = originalIds,
            copiedRecords = copiedResponses,
            mapping = mapping
        )
    }
    
    /**
     * Creates a RecordError from an exception.
     * 
     * @param recordId Optional record ID
     * @param index Optional record index
     * @param exception The exception that occurred
     * @return RecordError DTO
     */
    fun toError(
        recordId: UUID? = null,
        index: Int? = null,
        exception: Exception
    ): RecordError {
        return RecordError(
            recordId = recordId,
            index = index,
            message = exception.message ?: "Unknown error occurred"
        )
    }
    
    /**
     * Creates a RecordBatchError from an exception.
     * 
     * @param recordId Optional record ID
     * @param index Optional record index
     * @param data Optional record data
     * @param exception The exception that occurred
     * @return RecordBatchError DTO
     */
    fun toBatchError(
        recordId: UUID? = null,
        index: Int? = null,
        data: Map<String, Any?>? = null,
        exception: Exception
    ): RecordBatchError {
        return RecordBatchError(
            recordId = recordId,
            index = index,
            data = data?.let { mapToJsonObject(it) },
            error = exception.message ?: "Unknown error occurred"
        )
    }
    
    /**
     * Creates validation errors from a list of error messages.
     * 
     * @param errors List of validation error messages
     * @return List of RecordValidationError DTOs
     */
    fun toValidationErrors(errors: Map<String, String>): List<RecordValidationError> {
        return errors.map { (field, message) ->
            RecordValidationError(
                field = field,
                message = message
            )
        }
    }
    
    /**
     * Filters records based on RecordFilterRequest.
     * Note: This is a simple implementation. In production, consider using table queries.
     * 
     * @param records List of records to filter
     * @param filter The filter request
     * @return Filtered list of records
     */
    fun applyFilter(
        records: List<Record>,
        filter: RecordFilterRequest
    ): List<Record> {
        var result = records
        
        // Apply filters
        if (filter.hasFilters()) {
            filter.filters?.forEach { (field, value) ->
                result = result.filter { record ->
                    record.data[field] == value
                }
            }
        }
        
        // Apply sorting
        filter.sort?.let { sort ->
            result = when (sort.direction) {
                SortDirection.ASC -> result.sortedBy { 
                    it.data[sort.field]?.toString() 
                }
                SortDirection.DESC -> result.sortedByDescending { 
                    it.data[sort.field]?.toString() 
                }
            }
        }
        
        return result
    }
    
    /**
     * Converts filtered records to appropriate response based on field selection.
     * 
     * @param records List of records
     * @param filter The filter request
     * @return List of appropriate response DTOs
     */
    fun toFilteredResponse(
        records: List<Record>,
        filter: RecordFilterRequest
    ): List<Any> {
        return if (filter.hasFieldSelection()) {
            records.map { record ->
                toMinimalResponse(record, filter.fields!!)
            }
        } else {
            toResponseList(records)
        }
    }
    
    /**
     * Converts a Map<String, Any?> to JsonObject.
     * 
     * @param map The map to convert
     * @return JsonObject representation of the map
     */
    private fun mapToJsonObject(map: Map<String, Any?>): JsonObject {
        return buildJsonObject {
            map.forEach { (key, value) ->
                when (value) {
                    null -> put(key, JsonNull)
                    is String -> put(key, JsonPrimitive(value))
                    is Number -> put(key, JsonPrimitive(value))
                    is Boolean -> put(key, JsonPrimitive(value))
                    else -> put(key, JsonPrimitive(value.toString()))
                }
            }
        }
    }
}