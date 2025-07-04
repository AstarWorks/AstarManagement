package dev.ryuzu.astermanagement.security.rbac

import dev.ryuzu.astermanagement.domain.user.UserRole
import dev.ryuzu.astermanagement.security.rbac.entity.Permission
import dev.ryuzu.astermanagement.security.rbac.service.CustomPermissionEvaluator
import dev.ryuzu.astermanagement.security.rbac.service.PermissionService
import dev.ryuzu.astermanagement.security.rbac.repository.UserRoleRepository
import dev.ryuzu.astermanagement.auth.service.UserPrincipal
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.security.core.Authentication
import java.util.*
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * Comprehensive unit tests for CustomPermissionEvaluator.
 * 
 * Tests permission evaluation logic including:
 * - Basic permission checking with UserRole enum
 * - Resource-specific permissions (matter ownership)
 * - Permission evaluation performance
 * - Edge cases and error handling
 * 
 * This test aligns with the current implementation that uses UserRole enum
 * and UserPrincipal instead of complex RBAC entities.
 */
class CustomPermissionEvaluatorTest {

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
        every { userPrincipal.role } returns UserRole.LAWYER
    }

    @Test
    fun `should grant MATTER_CREATE permission to LAWYER`() {
        // Arrange
        every { userPrincipal.role } returns UserRole.LAWYER
        
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
        every { userPrincipal.role } returns UserRole.CLERK
        
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
        every { userPrincipal.role } returns UserRole.CLIENT
        
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
        every { userPrincipal.role } returns UserRole.CLERK
        
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
        every { userPrincipal.role } returns UserRole.LAWYER
        
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
        every { userPrincipal.role } returns UserRole.CLIENT
        
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
    fun `should handle resource-specific MATTER permissions for CLIENT when they own the matter`() {
        // Arrange
        val matterId = UUID.randomUUID()
        every { userPrincipal.role } returns UserRole.CLIENT
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
    fun `should deny resource-specific MATTER permissions for CLIENT when they don't own the matter`() {
        // Arrange
        val matterId = UUID.randomUUID()
        every { userPrincipal.role } returns UserRole.CLIENT
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
    fun `should handle resource-specific DOCUMENT permissions for CLIENT when they own the document`() {
        // Arrange
        val documentId = UUID.randomUUID()
        every { userPrincipal.role } returns UserRole.CLIENT
        every { permissionService.isClientDocumentOwnerById(any(), any()) } returns true
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            documentId, 
            "Document", 
            Permission.DOCUMENT_READ.name
        )
        
        // Assert
        assertTrue(hasPermission)
        verify { permissionService.isClientDocumentOwnerById(userPrincipal.id!!, documentId) }
    }

    @Test
    fun `should handle invalid permission gracefully`() {
        // Arrange
        every { userPrincipal.role } returns UserRole.LAWYER
        
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
        every { userPrincipal.role } returns UserRole.LAWYER
        
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
        every { userPrincipal.role } returns UserRole.LAWYER
        
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
        every { userPrincipal.role } returns UserRole.CLERK
        
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

    @Test
    fun `should allow LAWYER access to all matters regardless of ownership`() {
        // Arrange
        val matterId = UUID.randomUUID()
        every { userPrincipal.role } returns UserRole.LAWYER
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            matterId, 
            "Matter", 
            Permission.MATTER_UPDATE.name
        )
        
        // Assert
        assertTrue(hasPermission)
        // Verify that ownership check is not called for lawyers
        verify(exactly = 0) { permissionService.isClientMatterOwnerById(any(), any()) }
    }

    @Test
    fun `should allow CLERK access to all matters regardless of ownership`() {
        // Arrange
        val matterId = UUID.randomUUID()
        every { userPrincipal.role } returns UserRole.CLERK
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            matterId, 
            "Matter", 
            Permission.MATTER_READ.name
        )
        
        // Assert
        assertTrue(hasPermission)
        // Verify that ownership check is not called for clerks
        verify(exactly = 0) { permissionService.isClientMatterOwnerById(any(), any()) }
    }

    @Test
    fun `should handle communication permissions correctly for LAWYER`() {
        // Arrange
        val communicationId = UUID.randomUUID()
        every { userPrincipal.role } returns UserRole.LAWYER
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            communicationId, 
            "Communication", 
            Permission.COMMUNICATION_READ.name
        )
        
        // Assert
        assertTrue(hasPermission)
        // Verify that ownership check is not called for lawyers
        verify(exactly = 0) { permissionService.isClientCommunicationOwnerById(any(), any()) }
    }

    @Test
    fun `should handle communication permissions correctly for CLIENT`() {
        // Arrange
        val communicationId = UUID.randomUUID()
        every { userPrincipal.role } returns UserRole.CLIENT
        every { permissionService.isClientCommunicationOwnerById(any(), any()) } returns true
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            communicationId, 
            "Communication", 
            Permission.COMMUNICATION_READ.name
        )
        
        // Assert
        assertTrue(hasPermission)
        verify { permissionService.isClientCommunicationOwnerById(userPrincipal.id!!, communicationId) }
    }

    @Test
    fun `should handle unknown resource type gracefully`() {
        // Arrange
        val resourceId = UUID.randomUUID()
        every { userPrincipal.role } returns UserRole.LAWYER
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            resourceId, 
            "UnknownResource", 
            Permission.MATTER_READ.name
        )
        
        // Assert
        assertTrue(hasPermission) // Should default to allowing for unknown resource types
    }

    @Test
    fun `should handle null resource ID and type gracefully`() {
        // Arrange
        every { userPrincipal.role } returns UserRole.LAWYER
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            null, 
            null, 
            Permission.MATTER_READ.name
        )
        
        // Assert
        assertTrue(hasPermission) // Should fall back to role-based permission check
    }

    @Test
    fun `should properly evaluate CLERK permissions for DOCUMENT_UPDATE`() {
        // Arrange
        every { userPrincipal.role } returns UserRole.CLERK
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            null, 
            Permission.DOCUMENT_UPDATE.name
        )
        
        // Assert
        assertTrue(hasPermission) // CLERK should have DOCUMENT_UPDATE permission
    }

    @Test
    fun `should properly deny CLIENT permissions for COMMUNICATION_CREATE`() {
        // Arrange
        every { userPrincipal.role } returns UserRole.CLIENT
        
        // Act
        val hasPermission = permissionEvaluator.hasPermission(
            authentication, 
            null, 
            Permission.COMMUNICATION_CREATE.name
        )
        
        // Assert
        assertFalse(hasPermission) // CLIENT should not have COMMUNICATION_CREATE permission
    }
}