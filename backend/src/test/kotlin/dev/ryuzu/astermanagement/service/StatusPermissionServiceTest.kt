package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.domain.matter.Matter
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.domain.matter.MatterPriority
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRole
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import java.time.LocalDateTime
import java.util.*

class StatusPermissionServiceTest {

    private lateinit var statusPermissionService: StatusPermissionService
    private lateinit var testMatter: Matter
    private lateinit var testLawyer: User
    private lateinit var testClerk: User
    private lateinit var testClient: User

    @BeforeEach
    fun setUp() {
        statusPermissionService = StatusPermissionService()

        // Setup test users
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
    fun `lawyer should have full permissions for all transitions`() {
        // Given
        val context = createTransitionContext(
            currentStatus = MatterStatus.INTAKE,
            newStatus = MatterStatus.INITIAL_REVIEW,
            userRole = UserRole.LAWYER,
            userId = testLawyer.id!!
        )

        // When
        val result = statusPermissionService.validatePermission(context)

        // Then
        assertThat(result).isInstanceOf(ValidationResult.Success::class.java)
    }

    @Test
    fun `clerk should have limited permissions for transitions`() {
        // Given - clerk trying to do a basic transition
        val context = createTransitionContext(
            currentStatus = MatterStatus.INTAKE,
            newStatus = MatterStatus.INITIAL_REVIEW,
            userRole = UserRole.CLERK,
            userId = testClerk.id!!
        )

        // When
        val result = statusPermissionService.validatePermission(context)

        // Then
        assertThat(result).isInstanceOf(ValidationResult.Success::class.java)
    }

    @Test
    fun `clerk should be rejected for trial transitions`() {
        // Given - clerk trying to move to trial
        val context = createTransitionContext(
            currentStatus = MatterStatus.TRIAL_PREP,
            newStatus = MatterStatus.TRIAL,
            userRole = UserRole.CLERK,
            userId = testClerk.id!!
        )

        // When
        val result = statusPermissionService.validatePermission(context)

        // Then
        assertThat(result).isInstanceOf(ValidationResult.Failure::class.java)
        val failure = result as ValidationResult.Failure
        assertThat(failure.errorCode).isEqualTo("INSUFFICIENT_PERMISSION")
    }

    @Test
    fun `client should be rejected for all status transitions`() {
        // Given
        val context = createTransitionContext(
            currentStatus = MatterStatus.INTAKE,
            newStatus = MatterStatus.INITIAL_REVIEW,
            userRole = UserRole.CLIENT,
            userId = testClient.id!!
        )

        // When
        val result = statusPermissionService.validatePermission(context)

        // Then
        assertThat(result).isInstanceOf(ValidationResult.Failure::class.java)
        val failure = result as ValidationResult.Failure
        assertThat(failure.errorCode).isEqualTo("INSUFFICIENT_PERMISSION")
    }

    @Test
    fun `lawyer should be rejected if not assigned to matter`() {
        // Given - different lawyer trying to modify matter
        val unassignedLawyer = User().apply {
            id = UUID.randomUUID()
            role = UserRole.LAWYER
        }
        
        val context = createTransitionContext(
            currentStatus = MatterStatus.INTAKE,
            newStatus = MatterStatus.INITIAL_REVIEW,
            userRole = UserRole.LAWYER,
            userId = unassignedLawyer.id!!
        )

        // When
        val result = statusPermissionService.validatePermission(context)

        // Then
        assertThat(result).isInstanceOf(ValidationResult.Failure::class.java)
        val failure = result as ValidationResult.Failure
        assertThat(failure.errorCode).isEqualTo("NOT_ASSIGNED_LAWYER")
    }

    @Test
    fun `clerk should be rejected if not assigned to matter`() {
        // Given - different clerk trying to modify matter
        val unassignedClerk = User().apply {
            id = UUID.randomUUID()
            role = UserRole.CLERK
        }
        
        val context = createTransitionContext(
            currentStatus = MatterStatus.INTAKE,
            newStatus = MatterStatus.INITIAL_REVIEW,
            userRole = UserRole.CLERK,
            userId = unassignedClerk.id!!
        )

        // When
        val result = statusPermissionService.validatePermission(context)

        // Then
        assertThat(result).isInstanceOf(ValidationResult.Failure::class.java)
        val failure = result as ValidationResult.Failure
        assertThat(failure.errorCode).isEqualTo("NOT_ASSIGNED_CLERK")
    }

    @ParameterizedTest
    @EnumSource(MatterStatus::class)
    fun `should return correct permitted transitions for lawyer role`(status: MatterStatus) {
        // When
        val permittedTransitions = statusPermissionService.getPermittedTransitions(status, UserRole.LAWYER)

        // Then
        when (status) {
            MatterStatus.INTAKE -> assertThat(permittedTransitions)
                .containsExactlyInAnyOrder(MatterStatus.INITIAL_REVIEW, MatterStatus.CLOSED)
            MatterStatus.INITIAL_REVIEW -> assertThat(permittedTransitions)
                .containsExactlyInAnyOrder(MatterStatus.INVESTIGATION, MatterStatus.RESEARCH, MatterStatus.CLOSED)
            MatterStatus.CLOSED -> assertThat(permittedTransitions).isEmpty()
            else -> assertThat(permittedTransitions).isNotEmpty()
        }
    }

    @ParameterizedTest
    @EnumSource(MatterStatus::class)
    fun `should return correct permitted transitions for clerk role`(status: MatterStatus) {
        // When
        val permittedTransitions = statusPermissionService.getPermittedTransitions(status, UserRole.CLERK)

        // Then
        when (status) {
            MatterStatus.TRIAL_PREP, MatterStatus.TRIAL, MatterStatus.SETTLEMENT, MatterStatus.CLOSED -> 
                assertThat(permittedTransitions).isEmpty()
            MatterStatus.INTAKE -> assertThat(permittedTransitions)
                .containsExactly(MatterStatus.INITIAL_REVIEW)
            else -> assertThat(permittedTransitions).isNotEmpty()
        }
    }

    @ParameterizedTest
    @EnumSource(MatterStatus::class)
    fun `should return no permitted transitions for client role`(status: MatterStatus) {
        // When
        val permittedTransitions = statusPermissionService.getPermittedTransitions(status, UserRole.CLIENT)

        // Then
        assertThat(permittedTransitions).isEmpty()
    }

    @Test
    fun `should correctly identify roles that can perform specific transitions`() {
        // When
        val rolesForBasicTransition = statusPermissionService.getRolesForTransition(
            MatterStatus.INTAKE, 
            MatterStatus.INITIAL_REVIEW
        )
        val rolesForTrialTransition = statusPermissionService.getRolesForTransition(
            MatterStatus.TRIAL_PREP, 
            MatterStatus.TRIAL
        )

        // Then
        assertThat(rolesForBasicTransition).containsExactlyInAnyOrder(UserRole.LAWYER, UserRole.CLERK)
        assertThat(rolesForTrialTransition).containsExactly(UserRole.LAWYER)
    }

    @Test
    fun `should correctly determine if role can transition from status`() {
        // When & Then
        assertThat(statusPermissionService.canRoleTransitionFrom(MatterStatus.INTAKE, UserRole.LAWYER)).isTrue()
        assertThat(statusPermissionService.canRoleTransitionFrom(MatterStatus.INTAKE, UserRole.CLERK)).isTrue()
        assertThat(statusPermissionService.canRoleTransitionFrom(MatterStatus.INTAKE, UserRole.CLIENT)).isFalse()
        
        assertThat(statusPermissionService.canRoleTransitionFrom(MatterStatus.TRIAL_PREP, UserRole.LAWYER)).isTrue()
        assertThat(statusPermissionService.canRoleTransitionFrom(MatterStatus.TRIAL_PREP, UserRole.CLERK)).isFalse()
        assertThat(statusPermissionService.canRoleTransitionFrom(MatterStatus.TRIAL_PREP, UserRole.CLIENT)).isFalse()
        
        assertThat(statusPermissionService.canRoleTransitionFrom(MatterStatus.CLOSED, UserRole.LAWYER)).isFalse()
        assertThat(statusPermissionService.canRoleTransitionFrom(MatterStatus.CLOSED, UserRole.CLERK)).isFalse()
        assertThat(statusPermissionService.canRoleTransitionFrom(MatterStatus.CLOSED, UserRole.CLIENT)).isFalse()
    }

    private fun createTransitionContext(
        currentStatus: MatterStatus,
        newStatus: MatterStatus,
        userRole: UserRole,
        userId: UUID
    ): StatusTransitionContext {
        testMatter.status = currentStatus
        
        return StatusTransitionContext(
            matterId = testMatter.id!!,
            currentStatus = currentStatus,
            newStatus = newStatus,
            reason = "Test transition",
            userId = userId,
            userRole = userRole,
            matter = testMatter
        )
    }
}