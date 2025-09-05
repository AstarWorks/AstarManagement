package com.astarworks.astarmanagement.unit.core.auth.domain.service

import com.astarworks.astarmanagement.base.UnitTestBase
import com.astarworks.astarmanagement.core.auth.domain.model.UserRole
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.repository.DynamicRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.repository.UserRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.service.UserRoleService
import com.astarworks.astarmanagement.shared.domain.value.*
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import io.mockk.*
import java.time.Instant
import java.util.*

/**
 * Unit tests for UserRoleService - MockK Version
 */
@DisplayName("UserRoleService Unit Tests")
class UserRoleServiceTest : UnitTestBase() {
    
    private val userRoleRepository = mockk<UserRoleRepository>()
    private val dynamicRoleRepository = mockk<DynamicRoleRepository>()
    
    private lateinit var userRoleService: UserRoleService
    
    private val testTenantId = UUID.randomUUID()
    private val testUserId = UUID.randomUUID()
    private val testRoleId = UUID.randomUUID()
    private val testAssignerId = UUID.randomUUID()
    
    private lateinit var testUserRole: UserRole
    private lateinit var testDynamicRole: DynamicRole
    
    @BeforeEach
    fun setup() {
        clearMocks(userRoleRepository, dynamicRoleRepository)
        
        userRoleService = UserRoleService(
            userRoleRepository = userRoleRepository,
            dynamicRoleRepository = dynamicRoleRepository
        )
        
        // Create test data
        testDynamicRole = DynamicRole(
            id = RoleId(testRoleId),
            tenantId = TenantId(testTenantId),
            name = "test_role",
            displayName = "Test Role",
            color = "#FF0000",
            position = 10,
            isSystem = false,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        
        testUserRole = UserRole(
            tenantUserId = TenantMembershipId(testUserId),
            roleId = RoleId(testRoleId),
            assignedBy = UserId(testAssignerId),
            assignedAt = Instant.now()
        )
    }
    
    @Test
    @DisplayName("Should assign role to user successfully")
    fun `should assign role to user successfully`() {
        // Given
        every { dynamicRoleRepository.findById(RoleId(testRoleId)) } returns testDynamicRole
        every { userRoleRepository.existsByTenantUserIdAndRoleId(testUserId, testRoleId) } returns false
        every { userRoleRepository.save(any<UserRole>()) } returns testUserRole
        
        // When
        val result = userRoleService.assignRole(testUserId, testRoleId, testAssignerId)
        
        // Then
        assertThat(result).isNotNull
        assertThat(result.tenantUserId.value).isEqualTo(testUserId)
        assertThat(result.roleId.value).isEqualTo(testRoleId)
        
        verify { dynamicRoleRepository.findById(RoleId(testRoleId)) }
        verify { userRoleRepository.existsByTenantUserIdAndRoleId(testUserId, testRoleId) }
        verify { userRoleRepository.save(any<UserRole>()) }
    }
    
    @Test
    @DisplayName("Should remove role from user successfully")
    fun `should remove role from user successfully`() {
        // Given
        every { userRoleRepository.existsByTenantUserIdAndRoleId(testUserId, testRoleId) } returns true
        every { userRoleRepository.deleteByTenantUserIdAndRoleId(testUserId, testRoleId) } just Runs
        
        // When
        userRoleService.removeRole(testUserId, testRoleId)
        
        // Then
        verify { userRoleRepository.existsByTenantUserIdAndRoleId(testUserId, testRoleId) }
        verify { userRoleRepository.deleteByTenantUserIdAndRoleId(testUserId, testRoleId) }
    }
    
    @Test
    @DisplayName("Should get user roles successfully")
    fun `should get user roles successfully`() {
        // Given
        val userRoles = listOf(testUserRole)
        every { userRoleRepository.findByTenantUserId(testUserId) } returns userRoles
        
        // When
        val result = userRoleService.getUserRoles(testUserId)
        
        // Then
        assertThat(result).hasSize(1)
        assertThat(result[0]).isEqualTo(testUserRole)
        
        verify { userRoleRepository.findByTenantUserId(testUserId) }
    }
}