package com.astarworks.astarmanagement.core.table.infrastructure.validation

import com.astarworks.astarmanagement.core.table.infrastructure.validation.ValidRecordData
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import kotlinx.serialization.json.*
import org.springframework.stereotype.Component

/**
 * Validator for record data maps.
 * Ensures record data doesn't contain dangerous content or exceed limits.
 */
@Component
class RecordDataValidator : ConstraintValidator<ValidRecordData, JsonObject> {
    
    companion object {
        const val MAX_FIELD_COUNT = 100
        const val MAX_STRING_LENGTH = 10000
        const val MAX_NESTED_DEPTH = 5
    }
    
    override fun isValid(value: JsonObject?, context: ConstraintValidatorContext): Boolean {
        if (value == null) {
            return true // Let @NotNull handle null validation
        }
        
        // Check field count limit
        if (value.size > MAX_FIELD_COUNT) {
            context.disableDefaultConstraintViolation()
            context.buildConstraintViolationWithTemplate(
                "Record cannot have more than $MAX_FIELD_COUNT fields"
            ).addConstraintViolation()
            return false
        }
        
        // Validate each field
        for ((key, fieldValue) in value) {
            if (!isValidFieldKey(key, context)) {
                return false
            }
            
            if (!isValidFieldValue(key, fieldValue, context, 0)) {
                return false
            }
        }
        
        return true
    }
    
    private fun isValidFieldKey(key: String, context: ConstraintValidatorContext): Boolean {
        // Check for suspicious field names
        val suspiciousPatterns = listOf(
            "__proto__", "constructor", "prototype",
            "script", "javascript", "vbscript",
            "onload", "onerror", "onclick"
        )
        
        if (suspiciousPatterns.any { pattern -> key.contains(pattern, ignoreCase = true) }) {
            context.disableDefaultConstraintViolation()
            context.buildConstraintViolationWithTemplate(
                "Field key '$key' contains suspicious content"
            ).addConstraintViolation()
            return false
        }
        
        return true
    }
    
    private fun isValidFieldValue(
        key: String, 
        value: JsonElement, 
        context: ConstraintValidatorContext,
        depth: Int
    ): Boolean {
        // Check nesting depth
        if (depth > MAX_NESTED_DEPTH) {
            context.disableDefaultConstraintViolation()
            context.buildConstraintViolationWithTemplate(
                "Field '$key' exceeds maximum nesting depth of $MAX_NESTED_DEPTH"
            ).addConstraintViolation()
            return false
        }
        
        when (value) {
            is JsonPrimitive -> {
                if (value.isString) {
                    val stringValue = value.content
                    if (stringValue.length > MAX_STRING_LENGTH) {
                        context.disableDefaultConstraintViolation()
                        context.buildConstraintViolationWithTemplate(
                            "Field '$key' string value exceeds maximum length of $MAX_STRING_LENGTH"
                        ).addConstraintViolation()
                        return false
                    }
                    
                    // Check for script injection attempts
                    if (containsSuspiciousScript(stringValue)) {
                        context.disableDefaultConstraintViolation()
                        context.buildConstraintViolationWithTemplate(
                            "Field '$key' contains suspicious script content"
                        ).addConstraintViolation()
                        return false
                    }
                }
            }
            is JsonObject -> {
                // Recursively validate nested objects
                for ((nestedKey, nestedValue) in value) {
                    if (!isValidFieldValue("$key.$nestedKey", nestedValue, context, depth + 1)) {
                        return false
                    }
                }
            }
            is JsonArray -> {
                // Validate list elements
                value.forEachIndexed { index, item ->
                    if (!isValidFieldValue("$key[$index]", item, context, depth + 1)) {
                        return false
                    }
                }
            }
            is JsonNull -> {
                // JsonNull is valid
            }
        }
        
        return true
    }
    
    private fun containsSuspiciousScript(value: String): Boolean {
        val suspiciousPatterns = listOf(
            "<script", "javascript:", "vbscript:", "onload=", "onerror=", "onclick=",
            "eval\\s*\\(", "setTimeout\\s*\\(", "setInterval\\s*\\(",
            "document\\s*\\.", "window\\s*\\.", "alert\\s*\\("
        )
        
        return suspiciousPatterns.any { pattern ->
            pattern.toRegex(RegexOption.IGNORE_CASE).containsMatchIn(value)
        }
    }
}