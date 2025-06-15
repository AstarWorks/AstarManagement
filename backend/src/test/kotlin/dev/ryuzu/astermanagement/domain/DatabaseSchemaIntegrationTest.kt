package dev.ryuzu.astermanagement.domain

import dev.ryuzu.astermanagement.domain.matter.Matter
import dev.ryuzu.astermanagement.domain.matter.MatterPriority
import dev.ryuzu.astermanagement.domain.matter.MatterRepository
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.domain.matter.MatterStatusHistoryRepository
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.domain.user.UserRole
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.test.context.ActiveProfiles
import org.testcontainers.junit.jupiter.Testcontainers
import java.time.LocalDate
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Integration test for database schema and entity relationships
 * Verifies that Flyway migrations work correctly and entities can be persisted
 */
@DataJpaTest
@Testcontainers
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class DatabaseSchemaIntegrationTest {

    @Autowired
    private lateinit var userRepository: UserRepository

    @Autowired
    private lateinit var matterRepository: MatterRepository

    @Autowired
    private lateinit var matterStatusHistoryRepository: MatterStatusHistoryRepository

    @Test
    fun `should create and persist user entity`() {
        // Given
        val user = User().apply {
            username = "testlawyer"
            email = "lawyer@example.com"
            firstName = "John"
            lastName = "Doe"
            role = UserRole.LAWYER
            isActive = true
        }

        // When
        val savedUser = userRepository.save(user)

        // Then
        assertNotNull(savedUser.id)
        assertNotNull(savedUser.createdAt)
        assertNotNull(savedUser.updatedAt)
        assertEquals("testlawyer", savedUser.username)
        assertEquals("lawyer@example.com", savedUser.email)
        assertEquals(UserRole.LAWYER, savedUser.role)
        assertTrue(savedUser.isActive)
    }

    @Test
    fun `should create and persist matter entity with relationships`() {
        // Given - Create a lawyer user first
        val lawyer = User().apply {
            username = "lawyer1"
            email = "lawyer1@example.com"
            firstName = "Jane"
            lastName = "Smith"
            role = UserRole.LAWYER
            isActive = true
        }
        val savedLawyer = userRepository.save(lawyer)

        // Given - Create a matter
        val matter = Matter().apply {
            caseNumber = "2025-CV-0001"
            title = "Contract Dispute Case"
            description = "Client contract dispute with vendor"
            clientName = "ABC Corporation"
            clientContact = "contact@abc.com"
            opposingParty = "XYZ Vendor"
            courtName = "District Court"
            filingDate = LocalDate.now()
            estimatedCompletionDate = LocalDate.now().plusMonths(6)
            status = MatterStatus.INTAKE
            priority = MatterPriority.HIGH
            assignedLawyer = savedLawyer
            notes = "Initial consultation completed"
            tags = arrayOf("contract", "commercial", "urgent")
        }

        // When
        val savedMatter = matterRepository.save(matter)

        // Then
        assertNotNull(savedMatter.id)
        assertNotNull(savedMatter.createdAt)
        assertNotNull(savedMatter.updatedAt)
        assertEquals("2025-CV-0001", savedMatter.caseNumber)
        assertEquals("Contract Dispute Case", savedMatter.title)
        assertEquals("ABC Corporation", savedMatter.clientName)
        assertEquals(MatterStatus.INTAKE, savedMatter.status)
        assertEquals(MatterPriority.HIGH, savedMatter.priority)
        assertEquals(savedLawyer.id, savedMatter.assignedLawyer?.id)
        assertTrue(savedMatter.hasTag("contract"))
        assertTrue(savedMatter.hasTag("commercial"))
        assertTrue(savedMatter.hasTag("urgent"))
    }

    @Test
    fun `should automatically create status history when matter is created`() {
        // Given - Create a lawyer user first
        val lawyer = User().apply {
            username = "lawyer2"
            email = "lawyer2@example.com"
            firstName = "Bob"
            lastName = "Johnson"
            role = UserRole.LAWYER
            isActive = true
        }
        val savedLawyer = userRepository.save(lawyer)

        // Given - Create a matter
        val matter = Matter().apply {
            caseNumber = "2025-CV-0002"
            title = "Test Matter for Status History"
            clientName = "Test Client"
            status = MatterStatus.INTAKE
            priority = MatterPriority.MEDIUM
            assignedLawyer = savedLawyer
        }

        // When
        val savedMatter = matterRepository.save(matter)

        // Update the matter status to trigger status history
        savedMatter.updateStatus(MatterStatus.INITIAL_REVIEW)
        matterRepository.save(savedMatter)

        // Then - Check status history was created
        val statusHistory = matterStatusHistoryRepository.findByMatter(savedMatter)
        assertTrue(statusHistory.isNotEmpty(), "Status history should be created automatically")
        
        // Find the status change record
        val statusChange = statusHistory.find { it.oldStatus == MatterStatus.INTAKE && it.newStatus == MatterStatus.INITIAL_REVIEW }
        assertNotNull(statusChange, "Status change from INTAKE to INITIAL_REVIEW should be recorded")
        assertEquals(savedLawyer.id, statusChange.changedBy?.id)
    }

    @Test
    fun `should enforce database constraints`() {
        // Test unique constraint on username
        val user1 = User().apply {
            username = "duplicate_user"
            email = "user1@example.com"
            firstName = "User"
            lastName = "One"
            role = UserRole.LAWYER
        }
        userRepository.save(user1)

        val user2 = User().apply {
            username = "duplicate_user" // Same username
            email = "user2@example.com"
            firstName = "User"
            lastName = "Two"
            role = UserRole.CLERK
        }

        // This should throw an exception due to unique constraint
        try {
            userRepository.save(user2)
            userRepository.flush() // Force the constraint check
            assert(false) { "Should have thrown constraint violation exception" }
        } catch (e: Exception) {
            // Expected - constraint violation
            assertTrue(e.message?.contains("username") == true || e.message?.contains("unique") == true)
        }
    }

    @Test
    fun `should handle status transitions correctly`() {
        // Given
        val lawyer = User().apply {
            username = "statuslawyer"
            email = "statuslawyer@example.com"
            firstName = "Status"
            lastName = "Lawyer"
            role = UserRole.LAWYER
        }
        val savedLawyer = userRepository.save(lawyer)

        val matter = Matter().apply {
            caseNumber = "2025-ST-0001"
            title = "Status Transition Test"
            clientName = "Status Test Client"
            status = MatterStatus.INTAKE
            priority = MatterPriority.MEDIUM
            assignedLawyer = savedLawyer
        }
        val savedMatter = matterRepository.save(matter)

        // When - Test status transition
        assertTrue(savedMatter.status.canTransitionTo(MatterStatus.INITIAL_REVIEW))
        savedMatter.updateStatus(MatterStatus.INITIAL_REVIEW)
        
        // Then
        assertEquals(MatterStatus.INITIAL_REVIEW, savedMatter.status)
        
        // Test invalid transition
        assertTrue(!savedMatter.status.canTransitionTo(MatterStatus.TRIAL))
    }
}