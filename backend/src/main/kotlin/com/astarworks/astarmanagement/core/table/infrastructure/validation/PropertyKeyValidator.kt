package com.astarworks.astarmanagement.core.table.infrastructure.validation

import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import org.springframework.stereotype.Component

/**
 * Validator for property keys.
 * Ensures property keys are valid identifiers that can be used in JSON and table queries.
 */
@Component
class PropertyKeyValidator : ConstraintValidator<ValidPropertyKey, String> {
    
    private val validKeyRegex = Regex("^[a-zA-Z][a-zA-Z0-9_]{0,63}$")
    
    private val reservedKeys = setOf(
        // System fields
        "id", "created_at", "updated_at", "version", "tenant_id", "workspace_id",
        "table_id", "position", "data", "metadata",
        // JavaScript/JSON reserved words
        "constructor", "prototype", "toString", "valueOf", "hasOwnProperty",
        // Common field names that might conflict
        "type", "class", "function", "return", "if", "else", "for", "while",
        "try", "catch", "throw", "new", "delete", "var", "let", "const"
    )
    
    override fun isValid(value: String?, context: ConstraintValidatorContext): Boolean {
        if (value.isNullOrBlank()) {
            return false
        }
        
        // Check format - must be valid identifier
        if (!validKeyRegex.matches(value)) {
            context.disableDefaultConstraintViolation()
            context.buildConstraintViolationWithTemplate(
                "Property key must start with a letter and contain only letters, numbers, and underscores (max 64 chars)"
            ).addConstraintViolation()
            return false
        }
        
        // Check reserved words
        if (reservedKeys.contains(value.lowercase())) {
            context.disableDefaultConstraintViolation()
            context.buildConstraintViolationWithTemplate(
                "Property key '$value' is reserved and cannot be used"
            ).addConstraintViolation()
            return false
        }
        
        return true
    }
}