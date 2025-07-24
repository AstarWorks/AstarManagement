package dev.ryuzu.astermanagement.domain.matter

import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.modules.matter.domain.Matter
import dev.ryuzu.astermanagement.modules.matter.domain.MatterRepository
import dev.ryuzu.astermanagement.modules.matter.domain.MatterStatus
import dev.ryuzu.astermanagement.modules.matter.domain.MatterPriority
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager
import org.springframework.data.domain.PageRequest
import org.springframework.test.context.TestPropertySource
import org.testcontainers.junit.jupiter.Testcontainers
import java.time.LocalDate
import java.time.LocalDateTime
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * Integration tests for MatterRepository using Testcontainers PostgreSQL
 */
@DataJpaTest
@Testcontainers
@TestPropertySource(properties = [
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.datasource.url=jdbc:tc:postgresql:15:///test",
    "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect"
])
class MatterRepositoryTest {

    @Autowired
    private lateinit var matterRepository: MatterRepository

    @Autowired
    private lateinit var entityManager: TestEntityManager

    private lateinit var testLawyer: User
    private lateinit var testClerk: User
    private lateinit var testMatter1: Matter
    private lateinit var testMatter2: Matter

    @BeforeEach
    fun setup() {
        // Create test users
        testLawyer = User().apply {
            username = "lawyer@example.com"
            email = "lawyer@example.com"
            firstName = "John"
            lastName = "Lawyer"
        }
        entityManager.persistAndFlush(testLawyer)

        testClerk = User().apply {
            username = "clerk@example.com"
            email = "clerk@example.com"
            firstName = "Jane"
            lastName = "Clerk"
        }
        entityManager.persistAndFlush(testClerk)

        // Create test matters
        testMatter1 = Matter().apply {
            caseNumber = "CASE-2024-001"
            title = "Contract Dispute Case"
            clientName = "Acme Corporation"
            status = MatterStatus.INVESTIGATION
            priority = MatterPriority.HIGH
            assignedLawyer = testLawyer
            assignedClerk = testClerk
            estimatedCompletionDate = LocalDate.now().plusDays(30)
        }

        testMatter2 = Matter().apply {
            caseNumber = "CASE-2024-002"
            title = "Personal Injury Case"
            clientName = "John Smith"
            status = MatterStatus.DRAFT_PLEADINGS
            priority = MatterPriority.MEDIUM
            assignedLawyer = testLawyer
            estimatedCompletionDate = LocalDate.now().minusDays(5) // Overdue
        }
    }

    @Test
    fun `should save and find matter by id`() {
        val savedMatter = matterRepository.save(testMatter1)
        assertNotNull(savedMatter.id)

        val foundMatter = matterRepository.findById(savedMatter.id!!)
        assertTrue(foundMatter.isPresent)
        assertEquals(testMatter1.caseNumber, foundMatter.get().caseNumber)
        assertEquals(testMatter1.title, foundMatter.get().title)
    }

    @Test
    fun `should find matter by case number`() {
        matterRepository.save(testMatter1)

        val foundMatter = matterRepository.findByCaseNumber("CASE-2024-001")
        assertNotNull(foundMatter)
        assertEquals(testMatter1.title, foundMatter.title)
        assertEquals(testMatter1.clientName, foundMatter.clientName)
    }

    @Test
    fun `should return null for non-existent case number`() {
        val foundMatter = matterRepository.findByCaseNumber("NON-EXISTENT")
        assertNull(foundMatter)
    }

    @Test
    fun `should find matters by status`() {
        matterRepository.save(testMatter1)
        matterRepository.save(testMatter2)

        val investigationMatters = matterRepository.findByStatus(MatterStatus.INVESTIGATION)
        assertEquals(1, investigationMatters.size)
        assertEquals(testMatter1.caseNumber, investigationMatters[0].caseNumber)

        val draftMatters = matterRepository.findByStatus(MatterStatus.DRAFT_PLEADINGS)
        assertEquals(1, draftMatters.size)
        assertEquals(testMatter2.caseNumber, draftMatters[0].caseNumber)
    }

    @Test
    fun `should find matters by assigned lawyer`() {
        matterRepository.save(testMatter1)
        matterRepository.save(testMatter2)

        val lawyerMatters = matterRepository.findByAssignedLawyer(testLawyer)
        assertEquals(2, lawyerMatters.size)
    }

    @Test
    fun `should find matters by assigned lawyer with pagination`() {
        matterRepository.save(testMatter1)
        matterRepository.save(testMatter2)

        val page = matterRepository.findByAssignedLawyer(testLawyer, PageRequest.of(0, 1))
        assertEquals(1, page.content.size)
        assertEquals(2, page.totalElements)
        assertEquals(2, page.totalPages)
    }

    @Test
    fun `should find matters by priority`() {
        matterRepository.save(testMatter1)
        matterRepository.save(testMatter2)

        val highPriorityMatters = matterRepository.findByPriority(MatterPriority.HIGH)
        assertEquals(1, highPriorityMatters.size)
        assertEquals(testMatter1.caseNumber, highPriorityMatters[0].caseNumber)
    }

    @Test
    fun `should find matters by client name containing text`() {
        matterRepository.save(testMatter1)
        matterRepository.save(testMatter2)

        val acmeMatters = matterRepository.findByClientNameContainingIgnoreCase("acme")
        assertEquals(1, acmeMatters.size)
        assertEquals(testMatter1.caseNumber, acmeMatters[0].caseNumber)

        val smithMatters = matterRepository.findByClientNameContainingIgnoreCase("smith")
        assertEquals(1, smithMatters.size)
        assertEquals(testMatter2.caseNumber, smithMatters[0].caseNumber)
    }

    @Test
    fun `should find active matters`() {
        testMatter1.status = MatterStatus.INVESTIGATION
        testMatter2.status = MatterStatus.CLOSED
        matterRepository.save(testMatter1)
        matterRepository.save(testMatter2)

        val activeMatters = matterRepository.findActiveMatters()
        assertEquals(1, activeMatters.size)
        assertEquals(testMatter1.caseNumber, activeMatters[0].caseNumber)
    }

    @Test
    fun `should find overdue matters`() {
        matterRepository.save(testMatter1) // Due in 30 days
        matterRepository.save(testMatter2) // Overdue by 5 days

        val overdueMatters = matterRepository.findOverdueMatters()
        assertEquals(1, overdueMatters.size)
        assertEquals(testMatter2.caseNumber, overdueMatters[0].caseNumber)
    }

    @Test
    fun `should find matters by assigned lawyer and status`() {
        matterRepository.save(testMatter1)
        matterRepository.save(testMatter2)

        val investigationMatters = matterRepository.findByAssignedLawyerAndStatus(
            testLawyer, 
            MatterStatus.INVESTIGATION
        )
        assertEquals(1, investigationMatters.size)
        assertEquals(testMatter1.caseNumber, investigationMatters[0].caseNumber)
    }

    @Test
    fun `should search matters with multiple criteria`() {
        matterRepository.save(testMatter1)
        matterRepository.save(testMatter2)

        val searchResults = matterRepository.searchMatters(
            caseNumber = "2024",
            clientName = null,
            title = null,
            status = null,
            priority = MatterPriority.HIGH,
            assignedLawyer = null,
            pageable = PageRequest.of(0, 10)
        )

        assertEquals(1, searchResults.content.size)
        assertEquals(testMatter1.caseNumber, searchResults.content[0].caseNumber)
    }

    @Test
    fun `should count matters by status`() {
        matterRepository.save(testMatter1)
        matterRepository.save(testMatter2)

        val investigationCount = matterRepository.countByStatus(MatterStatus.INVESTIGATION)
        assertEquals(1, investigationCount)

        val draftCount = matterRepository.countByStatus(MatterStatus.DRAFT_PLEADINGS)
        assertEquals(1, draftCount)

        val intakeCount = matterRepository.countByStatus(MatterStatus.INTAKE)
        assertEquals(0, intakeCount)
    }

    @Test
    fun `should count matters by priority`() {
        matterRepository.save(testMatter1)
        matterRepository.save(testMatter2)

        val highCount = matterRepository.countByPriority(MatterPriority.HIGH)
        assertEquals(1, highCount)

        val mediumCount = matterRepository.countByPriority(MatterPriority.MEDIUM)
        assertEquals(1, mediumCount)

        val lowCount = matterRepository.countByPriority(MatterPriority.LOW)
        assertEquals(0, lowCount)
    }

    @Test
    fun `should count matters by assigned lawyer`() {
        matterRepository.save(testMatter1)
        matterRepository.save(testMatter2)

        val lawyerCount = matterRepository.countByAssignedLawyer(testLawyer)
        assertEquals(2, lawyerCount)
    }

    @Test
    fun `should find matters by created date range`() {
        val savedMatter1 = matterRepository.save(testMatter1)
        val savedMatter2 = matterRepository.save(testMatter2)

        val startDate = LocalDateTime.now().minusHours(1)
        val endDate = LocalDateTime.now().plusHours(1)

        val matters = matterRepository.findByCreatedAtBetween(startDate, endDate)
        assertEquals(2, matters.size)
    }

    @Test
    fun `should check if case number exists`() {
        matterRepository.save(testMatter1)

        assertTrue(matterRepository.existsByCaseNumber("CASE-2024-001"))
        assertTrue(!matterRepository.existsByCaseNumber("NON-EXISTENT"))
    }

    @Test
    fun `should find matters by tag`() {
        testMatter1.addTag("urgent")
        testMatter1.addTag("complex")
        testMatter2.addTag("routine")

        matterRepository.save(testMatter1)
        matterRepository.save(testMatter2)

        val urgentMatters = matterRepository.findByTag("urgent")
        assertEquals(1, urgentMatters.size)
        assertEquals(testMatter1.id, urgentMatters[0].id)

        val routineMatters = matterRepository.findByTag("routine")
        assertEquals(1, routineMatters.size)
        assertEquals(testMatter2.id, routineMatters[0].id)
    }
}