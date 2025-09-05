package com.astarworks.astarmanagement.core.table.infrastructure.validation

import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import org.springframework.stereotype.Component

/**
 * Minimal validator for table names.
 * Only enforces essential constraints:
 * - Not null or empty
 * - Length limit for database compatibility
 * - Not just whitespace
 */
@Component
class TableNameValidator : ConstraintValidator<ValidTableName, String> {
    
    override fun isValid(value: String?, context: ConstraintValidatorContext): Boolean {
        return !value.isNullOrEmpty() && 
               value.length <= 255 && 
               value.trim().isNotEmpty()  // Prevent whitespace-only names
    }
}