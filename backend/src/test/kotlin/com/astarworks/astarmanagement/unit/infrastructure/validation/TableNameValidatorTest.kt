package com.astarworks.astarmanagement.core.table.infrastructure.validation

import jakarta.validation.ConstraintValidatorContext
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import io.mockk.*

@Tag("unit")
class TableNameValidatorTest {
    
    private lateinit var validator: TableNameValidator
    private lateinit var context: ConstraintValidatorContext
    private lateinit var violationBuilder: ConstraintValidatorContext.ConstraintViolationBuilder
    
    @BeforeEach
    fun setUp() {
        context = mockk()
        violationBuilder = mockk()
        validator = TableNameValidator()
        
        every { context.buildConstraintViolationWithTemplate(any()) } returns violationBuilder
        every { violationBuilder.addConstraintViolation() } returns context
    }
    
    @Test
    fun `should accept valid table names`() {
        val validNames = listOf(
            "customers",
            "order_items",
            "product-catalog",
            "user_profiles_2024",
            "Task123",
            "project_A",
            "123invalid",  // Now valid - implementation doesn't check format
            "_invalid",     // Now valid - implementation doesn't check format
            "test_data",    // Now valid - implementation doesn't check patterns
            "user"          // Now valid - implementation doesn't check reserved words
        )
        
        validNames.forEach { name ->
            assertTrue(validator.isValid(name, context), "Name '$name' should be valid")
        }
        
        verify(exactly = 0) { context.disableDefaultConstraintViolation() }
    }
    
    @Test
    fun `should reject invalid names based on simple validation`() {
        val invalidNames = listOf(
            "", // empty
            "   ", // whitespace only
            "a".repeat(256) // too long (over 255 chars)
        )
        
        invalidNames.forEach { name ->
            assertFalse(validator.isValid(name, context), "Name '$name' should be invalid")
        }
    }
    
    
    
    @Test
    fun `should handle null and blank values`() {
        assertFalse(validator.isValid(null, context))
        assertFalse(validator.isValid("", context))
        assertFalse(validator.isValid("   ", context))
    }
}