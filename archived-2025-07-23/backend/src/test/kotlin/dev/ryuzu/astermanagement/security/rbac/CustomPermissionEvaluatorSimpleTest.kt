package dev.ryuzu.astermanagement.security.rbac

import dev.ryuzu.astermanagement.domain.user.UserRole
import dev.ryuzu.astermanagement.auth.dto.UserRoleDto
import dev.ryuzu.astermanagement.security.rbac.entity.Permission
import dev.ryuzu.astermanagement.security.rbac.service.CustomPermissionEvaluator
import dev.ryuzu.astermanagement.security.rbac.service.PermissionService
import dev.ryuzu.astermanagement.security.rbac.repository.UserRoleRepository
import dev.ryuzu.astermanagement.auth.service.UserPrincipal
import dev.ryuzu.astermanagement.testutil.AuthTestHelper
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.security.core.Authentication
import java.util.*
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * Simple unit tests for CustomPermissionEvaluator.
 * Tests the current implementation that uses UserRole enum.
 */
class CustomPermissionEvaluatorSimpleTest {

    private lateinit var userRoleRepository: UserRoleRepository
    private lateinit var permissionService: PermissionService
    private lateinit var permissionEvaluator: CustomPermissionEvaluator
    
    private lateinit var authentication: Authentication
    private lateinit var userPrincipal: UserPrincipal

    @BeforeEach
    fun setup() {
        userRoleRepository = mockk()
        permissionService = mockk()
        permissionEvaluator = CustomPermissionEvaluator(userRoleRepository, permissionService)
        
        authentication = mockk()
        userPrincipal = mockk()
        
        every { authentication.principal } returns userPrincipal
        every { userPrincipal.id } returns UUID.randomUUID()
    }

    @Test
    fun `should grant MATTER_CREATE permission to LAWYER`() {
        // Arrange
        every { userPrincipal.role } returns UserRoleDto.LAWYER
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            null, 
            Permission.MATTER_CREATE.name
        )
        
        // Assert
        assertTrue(hasPermission)
    }

    @Test
    fun `should grant MATTER_CREATE permission to CLERK`() {
        // Arrange
        every { userPrincipal.role } returns UserRoleDto.CLERK
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            null, 
            Permission.MATTER_CREATE.name
        )
        
        // Assert
        assertTrue(hasPermission)
    }

    @Test
    fun `should deny MATTER_CREATE permission to CLIENT`() {
        // Arrange
        every { userPrincipal.role } returns UserRoleDto.CLIENT
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            null, 
            Permission.MATTER_CREATE.name
        )
        
        // Assert
        assertFalse(hasPermission)
    }

    @Test
    fun `should deny MATTER_DELETE permission to CLERK`() {
        // Arrange
        every { userPrincipal.role } returns UserRoleDto.CLERK
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            null, 
            Permission.MATTER_DELETE.name
        )
        
        // Assert
        assertFalse(hasPermission)
    }

    @Test
    fun `should grant MATTER_DELETE permission to LAWYER`() {
        // Arrange
        every { userPrincipal.role } returns UserRoleDto.LAWYER
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            null, 
            Permission.MATTER_DELETE.name
        )
        
        // Assert
        assertTrue(hasPermission)
    }

    @Test
    fun `should deny DOCUMENT_CREATE permission to CLIENT`() {
        // Arrange
        every { userPrincipal.role } returns UserRoleDto.CLIENT
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            null, 
            Permission.DOCUMENT_CREATE.name
        )
        
        // Assert
        assertFalse(hasPermission)
    }

    @Test
    fun `should handle resource-specific MATTER permissions for CLIENT`() {
        // Arrange
        val matterId = UUID.randomUUID()
        every { userPrincipal.role } returns UserRoleDto.CLIENT
        every { permissionService.isClientMatterOwnerById(any(), any()) } returns true
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            matterId, 
            "Matter", 
            Permission.MATTER_READ.name
        )
        
        // Assert
        assertTrue(hasPermission)
        verify { permissionService.isClientMatterOwnerById(userPrincipal.id!!, matterId) }
    }

    @Test
    fun `should deny resource-specific MATTER permissions for CLIENT when not owner`() {
        // Arrange
        val matterId = UUID.randomUUID()
        every { userPrincipal.role } returns UserRoleDto.CLIENT
        every { permissionService.isClientMatterOwnerById(any(), any()) } returns false
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            matterId, 
            "Matter", 
            Permission.MATTER_READ.name
        )
        
        // Assert
        assertFalse(hasPermission)
        verify { permissionService.isClientMatterOwnerById(userPrincipal.id!!, matterId) }
    }

    @Test
    fun `should handle invalid permission gracefully`() {
        // Arrange
        every { userPrincipal.role } returns UserRoleDto.LAWYER
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            null, 
            "INVALID_PERMISSION"
        )
        
        // Assert
        assertFalse(hasPermission)
    }

    @Test
    fun `should handle non-UserPrincipal authentication gracefully`() {
        // Arrange
        every { authentication.principal } returns "not-a-user-principal"
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            null, 
            Permission.MATTER_READ.name
        )
        
        // Assert
        assertFalse(hasPermission)
    }

    @Test
    fun `should handle null permission gracefully`() {
        // Arrange
        every { userPrincipal.role } returns UserRoleDto.LAWYER
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            null, 
            null
        )
        
        // Assert
        assertFalse(hasPermission)
    }

    @Test
    fun `should allow LAWYER access to all documents regardless of ownership`() {
        // Arrange
        val documentId = UUID.randomUUID()
        every { userPrincipal.role } returns UserRoleDto.LAWYER
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            documentId, 
            "Document", 
            Permission.DOCUMENT_READ.name
        )
        
        // Assert
        assertTrue(hasPermission)
        // Verify that ownership check is not called for lawyers
        verify(exactly = 0) { permissionService.isClientDocumentOwnerById(any(), any()) }
    }

    @Test
    fun `should allow CLERK access to all documents regardless of ownership`() {
        // Arrange
        val documentId = UUID.randomUUID()
        every { userPrincipal.role } returns UserRoleDto.CLERK
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            documentId, 
            "Document", 
            Permission.DOCUMENT_READ.name
        )
        
        // Assert
        assertTrue(hasPermission)
        // Verify that ownership check is not called for clerks
        verify(exactly = 0) { permissionService.isClientDocumentOwnerById(any(), any()) }
    }
}