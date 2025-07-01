package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.domain.matter.Matter
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.domain.matter.MatterPriority
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRole
import dev.ryuzu.astermanagement.service.exception.StatusTransitionException
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.any
import org.mockito.kotlin.whenever
import org.springframework.context.ApplicationEventPublisher
import org.springframework.context.MessageSource
import java.time.LocalDateTime
import java.util.*

@ExtendWith(MockitoExtension::class)
class StatusTransitionServiceTest {

    @Mock
    private lateinit var statusPermissionService: StatusPermissionService

    @Mock
    private lateinit var statusBusinessRuleService: StatusBusinessRuleService

    @Mock
    private lateinit var auditService: AuditService

    @Mock
    private lateinit var eventPublisher: ApplicationEventPublisher

    @Mock
    private lateinit var messageSource: MessageSource

    private lateinit var statusTransitionService: StatusTransitionService

    private lateinit var testMatter: Matter
    private lateinit var testLawyer: User
    private lateinit var testClerk: User
    private lateinit var testClient: User

    @BeforeEach
    fun setUp() {
        statusTransitionService = StatusTransitionService(
            statusPermissionService,
            statusBusinessRuleService,
            auditService,
            eventPublisher,
            messageSource
        )

        // Setup test entities
        testLawyer = User().apply {
            id = UUID.randomUUID()
            username = "lawyer@test.com"
            firstName = "John"
            lastName = "Lawyer"
            role = UserRole.LAWYER
            isActive = true
        }

        testClerk = User().apply {
            id = UUID.randomUUID()
            username = "clerk@test.com"
            firstName = "Jane"
            lastName = "Clerk"
            role = UserRole.CLERK
            isActive = true
        }

        testClient = User().apply {
            id = UUID.randomUUID()
            username = "client@test.com"
            firstName = "Bob"
            lastName = "Client"
            role = UserRole.CLIENT
            isActive = true
        }

        testMatter = Matter().apply {
            id = UUID.randomUUID()
            caseNumber = "TEST-001"
            title = "Test Matter"
            clientName = "Bob Client"
            status = MatterStatus.INTAKE
            priority = MatterPriority.MEDIUM
            assignedLawyer = testLawyer
            assignedClerk = testClerk
            createdAt = LocalDateTime.now().minusDays(1)
        }
    }

    @Test
    fun `should allow valid status transition with proper permissions`() {
        // Given
        val context = createTransitionContext(
            currentStatus = MatterStatus.INTAKE,
            newStatus = MatterStatus.INITIAL_REVIEW,
            userRole = UserRole.LAWYER
        )

        whenever(statusPermissionService.validatePermission(any()))
            .thenReturn(ValidationResult.Success)
        whenever(statusBusinessRuleService.validateBusinessRules(any()))
            .thenReturn(ValidationResult.Success)

        // When
        val result = statusTransitionService.validateTransition(context)

        // Then
        assertThat(result).isInstanceOf(ValidationResult.Success::class.java)
    }

    @Test
    fun `should reject invalid status transition`() {
        // Given - trying to go from CLOSED to IN_PROGRESS (invalid)
        val context = createTransitionContext(
            currentStatus = MatterStatus.CLOSED,
            newStatus = MatterStatus.INITIAL_REVIEW,
            userRole = UserRole.LAWYER
        )

        // When
        val result = statusTransitionService.validateTransition(context)

        // Then
        assertThat(result).isInstanceOf(ValidationResult.Failure::class.java)
        val failure = result as ValidationResult.Failure
        assertThat(failure.errorCode).isEqualTo("INVALID_TRANSITION")
    }

    @Test
    fun `should reject transition due to insufficient permissions`() {
        // Given
        val context = createTransitionContext(
            currentStatus = MatterStatus.INTAKE,
            newStatus = MatterStatus.INITIAL_REVIEW,
            userRole = UserRole.LAWYER
        )

        whenever(statusPermissionService.validatePermission(any()))
            .thenReturn(ValidationResult.Failure("INSUFFICIENT_PERMISSION", "Access denied"))
        whenever(statusBusinessRuleService.validateBusinessRules(any()))
            .thenReturn(ValidationResult.Success)

        // When
        val result = statusTransitionService.validateTransition(context)

        // Then
        assertThat(result).isInstanceOf(ValidationResult.Failure::class.java)
        val failure = result as ValidationResult.Failure
        assertThat(failure.errorCode).isEqualTo("INSUFFICIENT_PERMISSION")
    }

    @Test
    fun `should reject transition due to business rule violation`() {
        // Given
        val context = createTransitionContext(
            currentStatus = MatterStatus.INTAKE,
            newStatus = MatterStatus.INITIAL_REVIEW,
            userRole = UserRole.LAWYER
        )

        whenever(statusPermissionService.validatePermission(any()))
            .thenReturn(ValidationResult.Success)
        whenever(statusBusinessRuleService.validateBusinessRules(any()))
            .thenReturn(ValidationResult.Failure("BUSINESS_RULE_VIOLATION", "Rule violated"))

        // When
        val result = statusTransitionService.validateTransition(context)

        // Then
        assertThat(result).isInstanceOf(ValidationResult.Failure::class.java)
        val failure = result as ValidationResult.Failure
        assertThat(failure.errorCode).isEqualTo("BUSINESS_RULE_VIOLATION")
    }

    @Test
    fun `should require reason for closure transitions`() {
        // Given
        val context = createTransitionContext(
            currentStatus = MatterStatus.SETTLEMENT,
            newStatus = MatterStatus.CLOSED,
            userRole = UserRole.LAWYER,
            reason = null // No reason provided
        )

        whenever(statusPermissionService.validatePermission(any()))
            .thenReturn(ValidationResult.Success)
        whenever(statusBusinessRuleService.validateBusinessRules(any()))
            .thenReturn(ValidationResult.Success)

        // When
        val result = statusTransitionService.validateTransition(context)

        // Then
        assertThat(result).isInstanceOf(ValidationResult.Failure::class.java)
        val failure = result as ValidationResult.Failure
        assertThat(failure.errorCode).isEqualTo("REASON_REQUIRED")
        assertThat(failure.field).isEqualTo("reason")
    }

    @Test
    fun `should execute transition successfully with audit logging`() {
        // Given
        val context = createTransitionContext(
            currentStatus = MatterStatus.INTAKE,
            newStatus = MatterStatus.INITIAL_REVIEW,
            userRole = UserRole.LAWYER,
            reason = "Starting initial review"
        )

        val auditId = UUID.randomUUID()
        whenever(statusPermissionService.validatePermission(any()))
            .thenReturn(ValidationResult.Success)
        whenever(statusBusinessRuleService.validateBusinessRules(any()))
            .thenReturn(ValidationResult.Success)
        whenever(auditService.recordMatterStatusChange(any(), any(), any(), any(), any()))
            .thenReturn(auditId)

        // When
        val result = statusTransitionService.executeTransition(context)

        // Then
        assertThat(result.matterId).isEqualTo(context.matterId)
        assertThat(result.oldStatus).isEqualTo(MatterStatus.INTAKE)
        assertThat(result.newStatus).isEqualTo(MatterStatus.INITIAL_REVIEW)
        assertThat(result.reason).isEqualTo("Starting initial review")
        assertThat(result.userId).isEqualTo(context.userId)
        assertThat(result.auditId).isEqualTo(auditId)
    }

    @Test
    fun `should throw exception when executing invalid transition`() {
        // Given
        val context = createTransitionContext(
            currentStatus = MatterStatus.CLOSED,
            newStatus = MatterStatus.INITIAL_REVIEW,
            userRole = UserRole.LAWYER
        )

        // When & Then
        val exception = assertThrows<StatusTransitionException> {
            statusTransitionService.executeTransition(context)
        }
        assertThat(exception.errorCode).isEqualTo("INVALID_TRANSITION")
    }

    @Test
    fun `should get valid transitions filtered by permissions`() {
        // Given
        testMatter.status = MatterStatus.INTAKE
        val validBaseTransitions = setOf(MatterStatus.INITIAL_REVIEW, MatterStatus.CLOSED)
        
        // Mock permission service to allow only INITIAL_REVIEW
        whenever(statusPermissionService.validatePermission(any()))
            .thenAnswer { invocation ->
                val context = invocation.arguments[0] as StatusTransitionContext
                if (context.newStatus == MatterStatus.INITIAL_REVIEW) {
                    ValidationResult.Success
                } else {
                    ValidationResult.Failure("INSUFFICIENT_PERMISSION", "Not allowed")
                }
            }

        // When
        val result = statusTransitionService.getValidTransitions(
            matter = testMatter,
            userId = testLawyer.id!!,
            userRole = UserRole.LAWYER
        )

        // Then
        assertThat(result).containsExactly(MatterStatus.INITIAL_REVIEW)
    }

    @Test
    fun `should create transition context correctly`() {
        // Given
        val reason = "Test transition"
        val newStatus = MatterStatus.INITIAL_REVIEW

        // When
        val context = statusTransitionService.createTransitionContext(
            matter = testMatter,
            newStatus = newStatus,
            reason = reason,
            userId = testLawyer.id!!,
            userRole = testLawyer.role
        )

        // Then
        assertThat(context.matterId).isEqualTo(testMatter.id)
        assertThat(context.currentStatus).isEqualTo(testMatter.status)
        assertThat(context.newStatus).isEqualTo(newStatus)
        assertThat(context.reason).isEqualTo(reason)
        assertThat(context.userId).isEqualTo(testLawyer.id)
        assertThat(context.userRole).isEqualTo(UserRole.LAWYER)
        assertThat(context.matter).isEqualTo(testMatter)
    }

    private fun createTransitionContext(
        currentStatus: MatterStatus = MatterStatus.INTAKE,
        newStatus: MatterStatus = MatterStatus.INITIAL_REVIEW,
        userRole: UserRole = UserRole.LAWYER,
        reason: String? = "Test reason"
    ): StatusTransitionContext {
        testMatter.status = currentStatus
        val userId = when (userRole) {
            UserRole.LAWYER -> testLawyer.id!!
            UserRole.CLERK -> testClerk.id!!
            UserRole.CLIENT -> testClient.id!!
        }

        return StatusTransitionContext(
            matterId = testMatter.id!!,
            currentStatus = currentStatus,
            newStatus = newStatus,
            reason = reason,
            userId = userId,
            userRole = userRole,
            matter = testMatter
        )
    }
}