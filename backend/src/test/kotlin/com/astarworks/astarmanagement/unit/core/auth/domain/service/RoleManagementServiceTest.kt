package com.astarworks.astarmanagement.unit.core.auth.domain.service

import com.astarworks.astarmanagement.base.UnitTestBase
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.repository.DynamicRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.repository.UserRoleRepository
import com.astarworks.astarmanagement.core.auth.domain.repository.RolePermissionRepository
import com.astarworks.astarmanagement.core.auth.domain.service.RoleManagementService
import com.astarworks.astarmanagement.core.auth.domain.service.RolePermissionService
import com.astarworks.astarmanagement.shared.domain.value.*
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import io.mockk.*
import java.time.Instant
import java.util.*

/**
 * Unit tests for RoleManagementService - MockK Version
 */
@DisplayName("RoleManagementService Unit Tests")
class RoleManagementServiceTest : UnitTestBase() {
    
    private val dynamicRoleRepository = mockk<DynamicRoleRepository>()
    private val userRoleRepository = mockk<UserRoleRepository>()
    private val rolePermissionRepository = mockk<RolePermissionRepository>()
    private val rolePermissionService = mockk<RolePermissionService>()
    
    private lateinit var roleManagementService: RoleManagementService
    
    private val testTenantId = TenantId(UUID.randomUUID())
    private val testRoleId = RoleId(UUID.randomUUID())
    
    @BeforeEach
    fun setup() {
        clearMocks(dynamicRoleRepository, userRoleRepository, rolePermissionRepository, rolePermissionService)
        roleManagementService = RoleManagementService(
            dynamicRoleRepository = dynamicRoleRepository,
            userRoleRepository = userRoleRepository,
            rolePermissionRepository = rolePermissionRepository,
            rolePermissionService = rolePermissionService
        )
    }
    
    @Test
    @DisplayName("Should create tenant role successfully")
    fun `should create tenant role successfully`() {
        // Given
        val roleName = "test_role"
        val expectedRole = createTestTenantRole(
            id = testRoleId,
            tenantId = testTenantId,
            name = roleName
        )
        
        every { dynamicRoleRepository.existsByTenantIdAndName(testTenantId, roleName) } returns false
        every { dynamicRoleRepository.countByTenantId(testTenantId) } returns 5L
        every { dynamicRoleRepository.save(any<DynamicRole>()) } returns expectedRole
        
        // When
        val result = roleManagementService.createRole(
            tenantId = testTenantId,
            name = roleName
        )
        
        // Then
        assertThat(result).isEqualTo(expectedRole)
        verify { dynamicRoleRepository.existsByTenantIdAndName(testTenantId, roleName) }
        verify { dynamicRoleRepository.countByTenantId(testTenantId) }
        verify { dynamicRoleRepository.save(any<DynamicRole>()) }
    }
    
    // Helper method for creating test data
    private fun createTestTenantRole(
        id: RoleId = RoleId(UUID.randomUUID()),
        tenantId: TenantId,
        name: String,
        displayName: String? = null,
        color: String? = null,
        position: Int = 0
    ): DynamicRole {
        return DynamicRole(
            id = id,
            tenantId = tenantId,
            name = name,
            displayName = displayName,
            color = color,
            position = position,
            isSystem = false,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
    }
}