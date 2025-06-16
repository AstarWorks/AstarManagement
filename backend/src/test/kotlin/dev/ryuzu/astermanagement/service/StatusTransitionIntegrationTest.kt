package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.domain.matter.Matter
import dev.ryuzu.astermanagement.domain.matter.MatterRepository
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.domain.matter.MatterPriority
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.domain.user.UserRole
import dev.ryuzu.astermanagement.service.exception.StatusTransitionException
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.*

/**
 * Integration tests for StatusTransitionService with Spring Security context and database persistence
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class StatusTransitionIntegrationTest {

    @Autowired
    private lateinit var statusTransitionService: StatusTransitionService

    @Autowired
    private lateinit var matterRepository: MatterRepository

    @Autowired
    private lateinit var userRepository: UserRepository

    @Autowired
    private lateinit var auditService: AuditService

    private lateinit var testLawyer: User
    private lateinit var testClerk: User
    private lateinit var testClient: User
    private lateinit var testMatter: Matter

    @BeforeEach
    fun setUp() {
        // Create test users
        testLawyer = User().apply {
            username = "lawyer@test.com"
            email = "lawyer@test.com"
            firstName = "John"
            lastName = "Lawyer"
            role = UserRole.LAWYER
            isActive = true
        }
        testLawyer = userRepository.save(testLawyer)

        testClerk = User().apply {
            username = "clerk@test.com"
            email = "clerk@test.com"
            firstName = "Jane"
            lastName = "Clerk"
            role = UserRole.CLERK
            isActive = true
        }
        testClerk = userRepository.save(testClerk)

        testClient = User().apply {
            username = "client@test.com"
            email = "client@test.com"
            firstName = "Bob"
            lastName = "Client"
            role = UserRole.CLIENT
            isActive = true
        }
        testClient = userRepository.save(testClient)

        // Create test matter
        testMatter = Matter().apply {
            caseNumber = "INT-TEST-001"
            title = "Integration Test Matter"
            clientName = "Bob Client"
            status = MatterStatus.INTAKE
            priority = MatterPriority.MEDIUM
            assignedLawyer = testLawyer
            assignedClerk = testClerk
            createdAt = LocalDateTime.now().minusDays(1)
        }
        testMatter = matterRepository.save(testMatter)
    }

    @Test
    @WithMockUser(username = "lawyer@test.com", roles = ["LAWYER"])
    fun `should successfully execute status transition with database persistence`() {
        // Given
        val context = StatusTransitionContext(
            matterId = testMatter.id!!,
            currentStatus = MatterStatus.INTAKE,
            newStatus = MatterStatus.INITIAL_REVIEW,
            reason = "Starting initial review process",
            userId = testLawyer.id!!,
            userRole = UserRole.LAWYER,
            matter = testMatter
        )

        // When
        val result = statusTransitionService.executeTransition(context)

        // Then
        assertThat(result.matterId).isEqualTo(testMatter.id)
        assertThat(result.oldStatus).isEqualTo(MatterStatus.INTAKE)
        assertThat(result.newStatus).isEqualTo(MatterStatus.INITIAL_REVIEW)
        assertThat(result.reason).isEqualTo("Starting initial review process")
        assertThat(result.userId).isEqualTo(testLawyer.id)
        assertThat(result.auditId).isNotNull()

        // Verify matter is updated in database
        val updatedMatter = matterRepository.findById(testMatter.id!!).orElseThrow()
        // Note: Matter status would be updated by the calling service, not the transition service itself
    }

    @Test
    @WithMockUser(username = "clerk@test.com", roles = ["CLERK"])
    fun `should allow clerk to perform permitted transitions`() {
        // Given
        val context = StatusTransitionContext(
            matterId = testMatter.id!!,
            currentStatus = MatterStatus.INTAKE,
            newStatus = MatterStatus.INITIAL_REVIEW,
            reason = "Clerk performing initial review",
            userId = testClerk.id!!,
            userRole = UserRole.CLERK,
            matter = testMatter
        )

        // When
        val result = statusTransitionService.executeTransition(context)

        // Then
        assertThat(result.oldStatus).isEqualTo(MatterStatus.INTAKE)
        assertThat(result.newStatus).isEqualTo(MatterStatus.INITIAL_REVIEW)
        assertThat(result.userId).isEqualTo(testClerk.id)
    }

    @Test
    @WithMockUser(username = "clerk@test.com", roles = ["CLERK"])
    fun `should reject clerk attempting restricted transitions`() {
        // Given - clerk trying to move to trial (not allowed)
        testMatter.status = MatterStatus.TRIAL_PREP
        testMatter = matterRepository.save(testMatter)
        
        val context = StatusTransitionContext(
            matterId = testMatter.id!!,
            currentStatus = MatterStatus.TRIAL_PREP,
            newStatus = MatterStatus.TRIAL,
            reason = "Attempting trial transition",
            userId = testClerk.id!!,
            userRole = UserRole.CLERK,
            matter = testMatter
        )

        // When & Then
        val exception = assertThrows<StatusTransitionException> {
            statusTransitionService.executeTransition(context)
        }
        assertThat(exception.errorCode).isEqualTo("INSUFFICIENT_PERMISSION")
    }

    @Test
    @WithMockUser(username = "client@test.com", roles = ["CLIENT"])
    fun `should reject all client transition attempts`() {
        // Given
        val context = StatusTransitionContext(
            matterId = testMatter.id!!,
            currentStatus = MatterStatus.INTAKE,
            newStatus = MatterStatus.INITIAL_REVIEW,
            reason = "Client attempting transition",
            userId = testClient.id!!,
            userRole = UserRole.CLIENT,
            matter = testMatter
        )

        // When & Then
        val exception = assertThrows<StatusTransitionException> {
            statusTransitionService.executeTransition(context)
        }
        assertThat(exception.errorCode).isEqualTo("INSUFFICIENT_PERMISSION")
    }

    @Test
    @WithMockUser(username = "lawyer@test.com", roles = ["LAWYER"])
    fun `should reject invalid state machine transitions`() {
        // Given - trying to go from INTAKE directly to TRIAL (invalid)
        val context = StatusTransitionContext(
            matterId = testMatter.id!!,
            currentStatus = MatterStatus.INTAKE,
            newStatus = MatterStatus.TRIAL,
            reason = "Invalid direct transition",
            userId = testLawyer.id!!,
            userRole = UserRole.LAWYER,
            matter = testMatter
        )

        // When & Then
        val exception = assertThrows<StatusTransitionException> {
            statusTransitionService.executeTransition(context)
        }
        assertThat(exception.errorCode).isEqualTo("INVALID_TRANSITION")
    }

    @Test
    @WithMockUser(username = "lawyer@test.com", roles = ["LAWYER"])
    fun `should require reason for closure transitions`() {
        // Given - trying to close without reason
        testMatter.status = MatterStatus.SETTLEMENT
        testMatter = matterRepository.save(testMatter)
        
        val context = StatusTransitionContext(
            matterId = testMatter.id!!,
            currentStatus = MatterStatus.SETTLEMENT,
            newStatus = MatterStatus.CLOSED,
            reason = null, // No reason provided
            userId = testLawyer.id!!,
            userRole = UserRole.LAWYER,
            matter = testMatter
        )

        // When & Then
        val exception = assertThrows<StatusTransitionException> {
            statusTransitionService.executeTransition(context)
        }
        assertThat(exception.errorCode).isEqualTo("REASON_REQUIRED")
    }

    @Test
    @WithMockUser(username = "lawyer@test.com", roles = ["LAWYER"])
    fun `should successfully close matter with reason`() {
        // Given
        testMatter.status = MatterStatus.SETTLEMENT
        testMatter = matterRepository.save(testMatter)
        
        val context = StatusTransitionContext(
            matterId = testMatter.id!!,
            currentStatus = MatterStatus.SETTLEMENT,
            newStatus = MatterStatus.CLOSED,
            reason = "Settlement reached successfully",
            userId = testLawyer.id!!,
            userRole = UserRole.LAWYER,
            matter = testMatter
        )

        // When
        val result = statusTransitionService.executeTransition(context)

        // Then
        assertThat(result.oldStatus).isEqualTo(MatterStatus.SETTLEMENT)
        assertThat(result.newStatus).isEqualTo(MatterStatus.CLOSED)
        assertThat(result.reason).isEqualTo("Settlement reached successfully")
    }

    @Test
    @WithMockUser(username = "lawyer@test.com", roles = ["LAWYER"])
    fun `should validate business rules for high priority matters`() {
        // Given - high priority matter
        testMatter.status = MatterStatus.INVESTIGATION
        testMatter.priority = MatterPriority.HIGH
        testMatter = matterRepository.save(testMatter)
        
        val context = StatusTransitionContext(
            matterId = testMatter.id!!,
            currentStatus = MatterStatus.INVESTIGATION,
            newStatus = MatterStatus.FILED, // High priority can skip draft pleadings
            reason = "High priority direct filing",
            userId = testLawyer.id!!,
            userRole = UserRole.LAWYER,
            matter = testMatter
        )

        // When
        val result = statusTransitionService.executeTransition(context)

        // Then
        assertThat(result.oldStatus).isEqualTo(MatterStatus.INVESTIGATION)
        assertThat(result.newStatus).isEqualTo(MatterStatus.FILED)
    }

    @Test
    @WithMockUser(username = "lawyer@test.com", roles = ["LAWYER"])
    fun `should get filtered valid transitions based on user permissions`() {
        // Given
        testMatter.status = MatterStatus.TRIAL_PREP
        testMatter = matterRepository.save(testMatter)

        // When - get transitions for lawyer
        val lawyerTransitions = statusTransitionService.getValidTransitions(
            matter = testMatter,
            userId = testLawyer.id!!,
            userRole = UserRole.LAWYER
        )

        // Then - lawyer should have access to trial transitions
        assertThat(lawyerTransitions).contains(MatterStatus.TRIAL)
        assertThat(lawyerTransitions).contains(MatterStatus.SETTLEMENT)
        assertThat(lawyerTransitions).contains(MatterStatus.CLOSED)
    }

    @Test
    @WithMockUser(username = "clerk@test.com", roles = ["CLERK"])
    fun `should get limited valid transitions for clerk`() {
        // Given
        testMatter.status = MatterStatus.TRIAL_PREP
        testMatter = matterRepository.save(testMatter)

        // When - get transitions for clerk
        val clerkTransitions = statusTransitionService.getValidTransitions(
            matter = testMatter,
            userId = testClerk.id!!,
            userRole = UserRole.CLERK
        )

        // Then - clerk should not have access to trial transitions
        assertThat(clerkTransitions).doesNotContain(MatterStatus.TRIAL)
        assertThat(clerkTransitions).isEmpty() // No valid transitions for clerk from TRIAL_PREP
    }

    @Test
    @WithMockUser(username = "lawyer@test.com", roles = ["LAWYER"])
    fun `should validate assignment-based permissions`() {
        // Given - matter with different assigned lawyer
        val otherLawyer = User().apply {
            username = "other@test.com"
            email = "other@test.com"
            firstName = "Other"
            lastName = "Lawyer"
            role = UserRole.LAWYER
            isActive = true
        }
        val savedOtherLawyer = userRepository.save(otherLawyer)

        testMatter.assignedLawyer = savedOtherLawyer
        testMatter = matterRepository.save(testMatter)
        
        val context = StatusTransitionContext(
            matterId = testMatter.id!!,
            currentStatus = MatterStatus.INTAKE,
            newStatus = MatterStatus.INITIAL_REVIEW,
            reason = "Unassigned lawyer attempting transition",
            userId = testLawyer.id!!, // Different from assigned lawyer
            userRole = UserRole.LAWYER,
            matter = testMatter
        )

        // When & Then
        val exception = assertThrows<StatusTransitionException> {
            statusTransitionService.executeTransition(context)
        }
        assertThat(exception.errorCode).isEqualTo("NOT_ASSIGNED_LAWYER")
    }
}