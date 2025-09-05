package com.astarworks.astarmanagement.core.table.api.exception

import com.astarworks.astarmanagement.shared.exception.base.BusinessException
import com.astarworks.astarmanagement.shared.exception.base.ErrorCode
import com.astarworks.astarmanagement.shared.exception.dto.ValidationError
import com.astarworks.astarmanagement.shared.domain.value.RecordId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.JsonPrimitive
import java.util.UUID

/**
 * Base exception class for record-related errors in the flexible table system.
 * All record-specific exceptions should extend this class.
 */
abstract class RecordException(
    message: String,
    errorCode: String,
    httpStatus: Int,
    details: JsonObject? = null,
    cause: Throwable? = null
) : BusinessException(
    message = message,
    errorCode = errorCode,
    httpStatus = httpStatus,
    details = details,
    cause = cause
)

/**
 * Exception thrown when a record is not found.
 */
class RecordNotFoundException(
    val recordId: RecordId
) : RecordException(
    message = "Record not found: $recordId",
    errorCode = "RECORD_NOT_FOUND",
    httpStatus = NOT_FOUND,
    details = buildJsonObject {
        put("recordId", JsonPrimitive(recordId.toString()))
    }
) {
    companion object {
        fun of(recordId: RecordId) = RecordNotFoundException(recordId)
        
        fun multiple(recordIds: List<RecordId>) = object : RecordException(
            message = "Records not found: ${recordIds.joinToString()}",
            errorCode = "RECORDS_NOT_FOUND",
            httpStatus = NOT_FOUND,
            details = buildJsonObject {
                put("recordIds", JsonPrimitive(recordIds.joinToString()))
            }
        ) {}
    }
}

/**
 * Exception thrown when record validation fails.
 */
class RecordValidationException(
    val recordId: RecordId? = null,
    val errors: List<ValidationError>
) : RecordException(
    message = buildMessage(recordId, errors),
    errorCode = "RECORD_VALIDATION_FAILED",
    httpStatus = BAD_REQUEST,
    details = buildJsonObject {
        recordId?.let { put("recordId", JsonPrimitive(it.toString())) }
        put("errors", JsonPrimitive(errors.toString()))
    }
) {
    companion object {
        private fun buildMessage(recordId: RecordId?, errors: List<ValidationError>): String {
            val prefix = recordId?.let { "Record $it validation failed" } ?: "Record validation failed"
            return "$prefix: ${errors.joinToString { "${it.field}: ${it.message}" }}"
        }
        
        fun of(recordId: RecordId?, errors: List<ValidationError>) = 
            RecordValidationException(recordId, errors)
        
        fun singleError(recordId: RecordId?, field: String, message: String, rejectedValue: Any? = null) = 
            RecordValidationException(
                recordId, 
                listOf(ValidationError(field, message, rejectedValue))
            )
        
        fun batchValidationFailed(recordIndex: Int, errors: List<ValidationError>) = 
            RecordValidationException(
                recordId = null,
                errors = listOf(
                    ValidationError(
                        field = "batch", 
                        message = "Batch record at index $recordIndex validation failed: ${errors.joinToString { "${it.field}: ${it.message}" }}"
                    )
                )
            )
    }
}

/**
 * Exception thrown when batch size exceeds the limit.
 */
class BatchSizeExceededException(
    val requestedSize: Int,
    val maxSize: Int
) : RecordException(
    message = "Batch size exceeded. Requested: $requestedSize, Maximum: $maxSize",
    errorCode = "BATCH_SIZE_EXCEEDED",
    httpStatus = BAD_REQUEST,
    details = buildJsonObject {
        put("requestedSize", JsonPrimitive(requestedSize))
        put("maxSize", JsonPrimitive(maxSize))
    }
) {
    companion object {
        fun of(requestedSize: Int, maxSize: Int) = 
            BatchSizeExceededException(requestedSize, maxSize)
    }
}

/**
 * Exception thrown when record data contains invalid type for a field.
 */
class InvalidRecordDataException(
    val field: String,
    val expectedType: String,
    val actualType: String?,
    val actualValue: Any? = null
) : RecordException(
    message = "Invalid data for field '$field'. Expected: $expectedType, Got: ${actualType ?: "null"}",
    errorCode = "INVALID_RECORD_DATA",
    httpStatus = BAD_REQUEST,
    details = buildJsonObject {
        put("field", JsonPrimitive(field))
        put("expectedType", JsonPrimitive(expectedType))
        actualType?.let { put("actualType", JsonPrimitive(it)) }
        actualValue?.let { put("actualValue", JsonPrimitive(it.toString())) }
    }
) {
    companion object {
        fun of(field: String, expectedType: String, actualType: String?, actualValue: Any? = null) = 
            InvalidRecordDataException(field, expectedType, actualType, actualValue)
        
        fun typeMismatch(field: String, expectedType: String, actualValue: Any) = 
            InvalidRecordDataException(
                field, 
                expectedType, 
                actualValue::class.simpleName, 
                actualValue
            )
    }
}

/**
 * Exception thrown when filter configuration is invalid.
 */
class InvalidFilterException(
    val reason: String,
    val field: String? = null,
    val operation: String? = null
) : RecordException(
    message = "Invalid filter: $reason",
    errorCode = "INVALID_FILTER",
    httpStatus = BAD_REQUEST,
    details = buildJsonObject {
        put("reason", JsonPrimitive(reason))
        field?.let { put("field", JsonPrimitive(it)) }
        operation?.let { put("operation", JsonPrimitive(it)) }
    }
) {
    companion object {
        fun of(reason: String, field: String? = null, operation: String? = null) = 
            InvalidFilterException(reason, field, operation)
        
        fun unknownField(field: String) = 
            InvalidFilterException("Unknown field: $field", field)
        
        fun incompatibleOperation(field: String, operation: String, fieldType: String) = 
            InvalidFilterException(
                "Operation '$operation' is not compatible with field type '$fieldType'",
                field,
                operation
            )
        
        fun invalidValue(field: String, operation: String, value: Any?) = 
            InvalidFilterException(
                "Invalid value for filter operation '$operation': $value",
                field,
                operation
            )
    }
}

/**
 * Exception thrown when sort configuration is invalid.
 */
class InvalidSortException(
    val field: String,
    val reason: String
) : RecordException(
    message = "Cannot sort by '$field': $reason",
    errorCode = "INVALID_SORT",
    httpStatus = BAD_REQUEST,
    details = buildJsonObject {
        put("field", JsonPrimitive(field))
        put("reason", JsonPrimitive(reason))
    }
) {
    companion object {
        fun of(field: String, reason: String) = InvalidSortException(field, reason)
        
        fun unknownField(field: String) = 
            InvalidSortException(field, "Unknown field")
        
        fun unsortableField(field: String, fieldType: String) = 
            InvalidSortException(field, "Field type '$fieldType' is not sortable")
    }
}

/**
 * Exception thrown when record access is denied.
 */
class RecordAccessDeniedException(
    val recordId: RecordId,
    val userId: UserId,
    val action: String
) : RecordException(
    message = "Access denied to record for action: $action",
    errorCode = "RECORD_ACCESS_DENIED",
    httpStatus = FORBIDDEN,
    details = buildJsonObject {
        put("recordId", JsonPrimitive(recordId.toString()))
        put("userId", JsonPrimitive(userId.toString()))
        put("action", JsonPrimitive(action))
    }
) {
    companion object {
        fun of(recordId: RecordId, userId: UserId, action: String) = 
            RecordAccessDeniedException(recordId, userId, action)
    }
}

/**
 * Exception thrown when record operation would violate table constraints.
 */
class RecordConstraintViolationException(
    val constraintType: String,
    val constraintName: String? = null,
    val violatingValue: Any? = null
) : RecordException(
    message = buildConstraintMessage(constraintType, constraintName, violatingValue),
    errorCode = "RECORD_CONSTRAINT_VIOLATION",
    httpStatus = CONFLICT,
    details = buildJsonObject {
        put("constraintType", JsonPrimitive(constraintType))
        constraintName?.let { put("constraintName", JsonPrimitive(it)) }
        violatingValue?.let { put("violatingValue", JsonPrimitive(it.toString())) }
    }
) {
    companion object {
        private fun buildConstraintMessage(type: String, name: String?, value: Any?): String {
            val base = "Record constraint violation: $type"
            val withName = name?.let { "$base ($it)" } ?: base
            return value?.let { "$withName - value: $it" } ?: withName
        }
        
        fun uniqueViolation(field: String, value: Any) = RecordConstraintViolationException(
            constraintType = "UNIQUE",
            constraintName = field,
            violatingValue = value
        )
        
        fun referenceViolation(field: String, referencedId: UUID) = RecordConstraintViolationException(
            constraintType = "REFERENCE",
            constraintName = field,
            violatingValue = referencedId
        )
    }
}