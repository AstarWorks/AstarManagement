package com.astarworks.astarmanagement.shared.exception.common

import com.astarworks.astarmanagement.shared.exception.base.BusinessException
import com.astarworks.astarmanagement.shared.exception.base.ErrorCode
import com.astarworks.astarmanagement.shared.exception.dto.ValidationError
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.JsonPrimitive

/**
 * Exception thrown when validation fails.
 * This is typically mapped to HTTP 400 status code.
 * 
 * @property field The specific field that failed validation (optional)
 * @property violations List of validation errors (optional)
 * @property validationType The type of validation that failed (optional)
 */
class ValidationException(
    val field: String? = null,
    val violations: List<ValidationError>? = null,
    val validationType: String? = null,
    message: String = "Validation failed",
    cause: Throwable? = null
) : BusinessException(
    message = message,
    errorCode = ErrorCode.VALIDATION_ERROR,
    httpStatus = BAD_REQUEST,
    details = if (field != null || violations != null || validationType != null) {
        buildJsonObject {
            field?.let { put("field", JsonPrimitive(it)) }
            violations?.let { put("violations", JsonPrimitive(it.toString())) }
            validationType?.let { put("validationType", JsonPrimitive(it)) }
        }
    } else null,
    cause = cause
) {
    /**
     * Checks if this exception has field violations.
     */
    fun hasViolations(): Boolean = !violations.isNullOrEmpty()
    
    /**
     * Gets the number of violations.
     */
    fun violationCount(): Int = violations?.size ?: 0
    
    /**
     * Gets violations for a specific field.
     */
    fun getViolationsForField(fieldName: String): List<ValidationError> {
        return violations?.filter { it.field == fieldName } ?: emptyList()
    }
    
    companion object {
        /**
         * Creates a ValidationException for a single field.
         */
        fun forField(
            field: String,
            message: String,
            rejectedValue: Any? = null
        ): ValidationException {
            return ValidationException(
                field = field,
                violations = listOf(
                    ValidationError(
                        field = field,
                        message = message,
                        rejectedValue = rejectedValue
                    )
                ),
                message = "Validation failed for field: $field"
            )
        }
        
        /**
         * Creates a ValidationException for multiple fields.
         */
        fun forFields(violations: List<ValidationError>): ValidationException {
            val fieldsWithErrors = violations.map { it.field }.distinct()
            val message = when (fieldsWithErrors.size) {
                0 -> "Validation failed"
                1 -> "Validation failed for field: ${fieldsWithErrors.first()}"
                else -> "Validation failed for fields: ${fieldsWithErrors.joinToString(", ")}"
            }
            
            return ValidationException(
                violations = violations,
                message = message
            )
        }
        
        /**
         * Creates a ValidationException for required field missing.
         */
        fun requiredField(field: String): ValidationException {
            return forField(
                field = field,
                message = "Required field is missing"
            )
        }
        
        /**
         * Creates a ValidationException for invalid format.
         */
        fun invalidFormat(
            field: String,
            expectedFormat: String,
            actualValue: Any? = null
        ): ValidationException {
            return forField(
                field = field,
                message = "Invalid format. Expected: $expectedFormat",
                rejectedValue = actualValue
            )
        }
        
        /**
         * Creates a ValidationException for value out of range.
         */
        fun outOfRange(
            field: String,
            min: Any? = null,
            max: Any? = null,
            actualValue: Any? = null
        ): ValidationException {
            val message = when {
                min != null && max != null -> "Value must be between $min and $max"
                min != null -> "Value must be at least $min"
                max != null -> "Value must be at most $max"
                else -> "Value is out of range"
            }
            
            return forField(
                field = field,
                message = message,
                rejectedValue = actualValue
            )
        }
        
        /**
         * Creates a ValidationException for duplicate value.
         */
        fun duplicateValue(
            field: String,
            value: Any
        ): ValidationException {
            return forField(
                field = field,
                message = "Duplicate value not allowed",
                rejectedValue = value
            )
        }
        
        /**
         * Creates a ValidationException for invalid enum value.
         */
        fun invalidEnumValue(
            field: String,
            value: Any,
            allowedValues: List<String>
        ): ValidationException {
            return forField(
                field = field,
                message = "Invalid value. Allowed values: ${allowedValues.joinToString(", ")}",
                rejectedValue = value
            )
        }
        
        /**
         * Creates a ValidationException for string length violation.
         */
        fun invalidLength(
            field: String,
            minLength: Int? = null,
            maxLength: Int? = null,
            actualLength: Int
        ): ValidationException {
            val message = when {
                minLength != null && maxLength != null -> 
                    "Length must be between $minLength and $maxLength characters (actual: $actualLength)"
                minLength != null -> 
                    "Length must be at least $minLength characters (actual: $actualLength)"
                maxLength != null -> 
                    "Length must be at most $maxLength characters (actual: $actualLength)"
                else -> "Invalid length: $actualLength"
            }
            
            return forField(
                field = field,
                message = message
            )
        }
    }
}