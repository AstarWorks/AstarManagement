package dev.ryuzu.astermanagement.domain.matter

import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.modules.matter.domain.Matter
import dev.ryuzu.astermanagement.modules.matter.domain.MatterStatus
import dev.ryuzu.astermanagement.modules.matter.domain.MatterPriority
import jakarta.validation.ConstraintViolation
import jakarta.validation.Validation
import jakarta.validation.Validator
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.time.LocalDate
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * Unit tests for Matter entity validation and business logic
 */
class MatterTest {

    private lateinit var validator: Validator
    private lateinit var validMatter: Matter

    @BeforeEach
    fun setup() {
        validator = Validation.buildDefaultValidatorFactory().validator
        
        // Create a mock user for assigned lawyer
        val testLawyer = User().apply {
            username = "lawyer@example.com"
            email = "lawyer@example.com"
            firstName = "John"
            lastName = "Lawyer"
        }
        
        validMatter = Matter().apply {
            caseNumber = "CASE-2024-001"
            title = "Test Legal Case"
            clientName = "John Doe"
            assignedLawyer = testLawyer
        }
    }

    @Test
    fun `should validate matter with all required fields`() {
        val violations: Set<ConstraintViolation<Matter>> = validator.validate(validMatter)
        
        // Print violations for debugging
        violations.forEach { violation ->
            println("Validation error: ${violation.propertyPath} - ${violation.message}")
        }
        
        assertTrue(violations.isEmpty(), "Valid matter should have no validation errors")
    }

    @Test
    fun `should fail validation when case number is blank`() {
        validMatter.caseNumber = ""
        val violations = validator.validate(validMatter)
        assertEquals(1, violations.size)
        assertTrue(violations.any { it.message.contains("Case number is required") })
    }

    @Test
    fun `should fail validation when title is blank`() {
        validMatter.title = ""
        val violations = validator.validate(validMatter)
        assertEquals(1, violations.size)
        assertTrue(violations.any { it.message.contains("Title is required") })
    }

    @Test
    fun `should fail validation when client name is blank`() {
        validMatter.clientName = ""
        val violations = validator.validate(validMatter)
        assertEquals(1, violations.size)
        assertTrue(violations.any { it.message.contains("Client name is required") })
    }

    @Test
    fun `should fail validation when case number exceeds max length`() {
        validMatter.caseNumber = "A".repeat(256)
        val violations = validator.validate(validMatter)
        assertEquals(1, violations.size)
        assertTrue(violations.any { it.message.contains("Case number must not exceed 255 characters") })
    }

    @Test
    fun `should fail validation when title exceeds max length`() {
        validMatter.title = "A".repeat(501)
        val violations = validator.validate(validMatter)
        assertEquals(1, violations.size)
        assertTrue(violations.any { it.message.contains("Title must not exceed 500 characters") })
    }

    @Test
    fun `should fail validation when client name exceeds max length`() {
        validMatter.clientName = "A".repeat(256)
        val violations = validator.validate(validMatter)
        assertEquals(1, violations.size)
        assertTrue(violations.any { it.message.contains("Client name must not exceed 255 characters") })
    }

    @Test
    fun `should have default status as INTAKE`() {
        assertEquals(MatterStatus.INTAKE, validMatter.status)
    }

    @Test
    fun `should have default priority as MEDIUM`() {
        assertEquals(MatterPriority.MEDIUM, validMatter.priority)
    }

    @Test
    fun `should be active when status is not CLOSED`() {
        validMatter.status = MatterStatus.INVESTIGATION
        assertTrue(validMatter.isActive)
        
        validMatter.status = MatterStatus.CLOSED
        assertFalse(validMatter.isActive)
    }

    @Test
    fun `should be overdue when estimated completion date is past and not completed`() {
        validMatter.estimatedCompletionDate = LocalDate.now().minusDays(1)
        validMatter.actualCompletionDate = null
        assertTrue(validMatter.isOverdue)
        
        validMatter.actualCompletionDate = LocalDate.now()
        assertFalse(validMatter.isOverdue)
    }

    @Test
    fun `should be completed when actual completion date is set`() {
        validMatter.actualCompletionDate = LocalDate.now()
        assertTrue(validMatter.isCompleted)
        
        validMatter.actualCompletionDate = null
        assertFalse(validMatter.isCompleted)
    }

    @Test
    fun `should be completed when status is CLOSED`() {
        validMatter.status = MatterStatus.CLOSED
        assertTrue(validMatter.isCompleted)
    }

    @Test
    fun `should add and remove tags correctly`() {
        assertTrue(validMatter.tags.isEmpty())
        
        validMatter.addTag("urgent")
        assertTrue(validMatter.hasTag("urgent"))
        assertEquals(1, validMatter.tags.size)
        
        validMatter.addTag("high-priority")
        assertTrue(validMatter.hasTag("high-priority"))
        assertEquals(2, validMatter.tags.size)
        
        // Should not add duplicate tags
        validMatter.addTag("urgent")
        assertEquals(2, validMatter.tags.size)
        
        validMatter.removeTag("urgent")
        assertFalse(validMatter.hasTag("urgent"))
        assertEquals(1, validMatter.tags.size)
    }

    @Test
    fun `should handle tag trimming correctly`() {
        validMatter.addTag("  spaced tag  ")
        assertTrue(validMatter.hasTag("spaced tag"))
        assertFalse(validMatter.hasTag("  spaced tag  "))
    }

    @Test
    fun `should update status and set completion date automatically`() {
        validMatter.updateStatus(MatterStatus.CLOSED)
        assertEquals(MatterStatus.CLOSED, validMatter.status)
        assertEquals(LocalDate.now(), validMatter.actualCompletionDate)
    }

    @Test
    fun `should clear completion date when reopening closed matter`() {
        validMatter.updateStatus(MatterStatus.CLOSED)
        assertEquals(LocalDate.now(), validMatter.actualCompletionDate)
        
        validMatter.updateStatus(MatterStatus.INVESTIGATION)
        assertEquals(MatterStatus.INVESTIGATION, validMatter.status)
        assertEquals(null, validMatter.actualCompletionDate)
    }

    @Test
    fun `should not override existing completion date when closing`() {
        val existingDate = LocalDate.now().minusDays(5)
        validMatter.actualCompletionDate = existingDate
        validMatter.updateStatus(MatterStatus.CLOSED)
        assertEquals(existingDate, validMatter.actualCompletionDate)
    }
}