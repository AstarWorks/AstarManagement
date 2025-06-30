package dev.ryuzu.astermanagement.auth.service

import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRole
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.springframework.security.core.authority.SimpleGrantedAuthority
import java.util.*

class UserPrincipalTest {

    @Test
    fun `should create UserPrincipal from User entity`() {
        // Given
        val user = createTestUser(UserRole.LAWYER)
        
        // When
        val userPrincipal = UserPrincipal.create(user)
        
        // Then
        assertEquals(user.id, userPrincipal.id)
        assertEquals(user.email, userPrincipal.email)
        assertEquals(user.fullName, userPrincipal.fullName)
        assertEquals(user.role, userPrincipal.role)
        assertEquals(user.email, userPrincipal.username)
        assertEquals(user.passwordHash, userPrincipal.password)
        assertTrue(userPrincipal.isEnabled)
        assertTrue(userPrincipal.isAccountNonLocked)
    }

    @Test
    fun `should map lawyer role to correct authorities`() {
        // Given
        val user = createTestUser(UserRole.LAWYER)
        val userPrincipal = UserPrincipal.create(user)
        
        // When
        val authorities = userPrincipal.authorities.map { it.authority }.toSet()
        
        // Then
        assertTrue(authorities.contains("ROLE_LAWYER"))
        assertTrue(authorities.contains("matter:read"))
        assertTrue(authorities.contains("matter:write"))
        assertTrue(authorities.contains("matter:delete"))
        assertTrue(authorities.contains("document:read"))
        assertTrue(authorities.contains("document:write"))
        assertTrue(authorities.contains("document:delete"))
        assertTrue(authorities.contains("memo:read"))
        assertTrue(authorities.contains("memo:write"))
        assertTrue(authorities.contains("memo:delete"))
        assertTrue(authorities.contains("expense:read"))
        assertTrue(authorities.contains("expense:write"))
        assertTrue(authorities.contains("expense:approve"))
        assertTrue(authorities.contains("admin:users"))
        assertTrue(authorities.contains("admin:roles"))
        assertTrue(authorities.contains("export:data"))
    }

    @Test
    fun `should map clerk role to correct authorities`() {
        // Given
        val user = createTestUser(UserRole.CLERK)
        val userPrincipal = UserPrincipal.create(user)
        
        // When
        val authorities = userPrincipal.authorities.map { it.authority }.toSet()
        
        // Then
        assertTrue(authorities.contains("ROLE_CLERK"))
        assertTrue(authorities.contains("matter:read"))
        assertTrue(authorities.contains("matter:write"))
        assertFalse(authorities.contains("matter:delete"))
        assertTrue(authorities.contains("document:read"))
        assertTrue(authorities.contains("document:write"))
        assertFalse(authorities.contains("document:delete"))
        assertTrue(authorities.contains("memo:read"))
        assertTrue(authorities.contains("memo:write"))
        assertFalse(authorities.contains("memo:delete"))
        assertTrue(authorities.contains("expense:read"))
        assertTrue(authorities.contains("expense:write"))
        assertFalse(authorities.contains("expense:approve"))
        assertFalse(authorities.contains("admin:users"))
    }

    @Test
    fun `should map client role to correct authorities`() {
        // Given
        val user = createTestUser(UserRole.CLIENT)
        val userPrincipal = UserPrincipal.create(user)
        
        // When
        val authorities = userPrincipal.authorities.map { it.authority }.toSet()
        
        // Then
        assertTrue(authorities.contains("ROLE_CLIENT"))
        assertTrue(authorities.contains("matter:read"))
        assertFalse(authorities.contains("matter:write"))
        assertFalse(authorities.contains("matter:delete"))
        assertTrue(authorities.contains("document:read"))
        assertFalse(authorities.contains("document:write"))
        assertTrue(authorities.contains("memo:read"))
        assertFalse(authorities.contains("memo:write"))
        assertFalse(authorities.contains("expense:read"))
    }

    @Test
    fun `should check role correctly`() {
        // Given
        val lawyerUser = createTestUser(UserRole.LAWYER)
        val lawyerPrincipal = UserPrincipal.create(lawyerUser)
        
        // Then
        assertTrue(lawyerPrincipal.hasRole(UserRole.LAWYER))
        assertFalse(lawyerPrincipal.hasRole(UserRole.CLERK))
        assertFalse(lawyerPrincipal.hasRole(UserRole.CLIENT))
    }

    @Test
    fun `should check any role correctly`() {
        // Given
        val clerkUser = createTestUser(UserRole.CLERK)
        val clerkPrincipal = UserPrincipal.create(clerkUser)
        
        // Then
        assertTrue(clerkPrincipal.hasAnyRole(UserRole.LAWYER, UserRole.CLERK))
        assertTrue(clerkPrincipal.hasAnyRole(UserRole.CLERK, UserRole.CLIENT))
        assertFalse(clerkPrincipal.hasAnyRole(UserRole.LAWYER, UserRole.CLIENT))
    }

    @Test
    fun `should check permissions correctly`() {
        // Given
        val lawyerUser = createTestUser(UserRole.LAWYER)
        val lawyerPrincipal = UserPrincipal.create(lawyerUser)
        
        // Then
        assertTrue(lawyerPrincipal.hasPermission("matter:read"))
        assertTrue(lawyerPrincipal.hasPermission("matter:write"))
        assertTrue(lawyerPrincipal.hasPermission("matter:delete"))
        assertFalse(lawyerPrincipal.hasPermission("nonexistent:permission"))
    }

    @Test
    fun `should get permissions list correctly`() {
        // Given
        val clientUser = createTestUser(UserRole.CLIENT)
        val clientPrincipal = UserPrincipal.create(clientUser)
        
        // When
        val permissions = clientPrincipal.getPermissions()
        
        // Then
        assertTrue(permissions.contains("matter:read"))
        assertTrue(permissions.contains("document:read"))
        assertTrue(permissions.contains("memo:read"))
        assertFalse(permissions.contains("ROLE_CLIENT")) // Should not include role authorities
        assertEquals(3, permissions.size)
    }

    @Test
    fun `should handle disabled user account`() {
        // Given
        val user = createTestUser(UserRole.LAWYER).apply {
            isActive = false
        }
        val userPrincipal = UserPrincipal.create(user)
        
        // Then
        assertFalse(userPrincipal.isEnabled)
        assertFalse(userPrincipal.isAccountNonLocked)
    }

    @Test
    fun `should return correct string representation`() {
        // Given
        val user = createTestUser(UserRole.LAWYER)
        val userPrincipal = UserPrincipal.create(user)
        
        // When
        val stringRepresentation = userPrincipal.toString()
        
        // Then
        assertTrue(stringRepresentation.contains("UserPrincipal"))
        assertTrue(stringRepresentation.contains(user.id.toString()))
        assertTrue(stringRepresentation.contains(user.email))
        assertTrue(stringRepresentation.contains(user.fullName))
        assertTrue(stringRepresentation.contains("LAWYER"))
        assertTrue(stringRepresentation.contains("enabled=true"))
    }

    @Test
    fun `should handle account status methods correctly`() {
        // Given
        val user = createTestUser(UserRole.CLERK)
        val userPrincipal = UserPrincipal.create(user)
        
        // Then
        assertTrue(userPrincipal.isAccountNonExpired) // Always true in our implementation
        assertTrue(userPrincipal.isCredentialsNonExpired) // Always true in our implementation
        assertTrue(userPrincipal.isAccountNonLocked) // Based on isActive
        assertTrue(userPrincipal.isEnabled) // Based on isActive
    }

    private fun createTestUser(role: UserRole): User {
        return User().apply {
            id = UUID.randomUUID()
            email = "test@example.com"
            firstName = "Test"
            lastName = "User"
            this.role = role
            passwordHash = "hashedPassword123"
            isActive = true
        }
    }
}