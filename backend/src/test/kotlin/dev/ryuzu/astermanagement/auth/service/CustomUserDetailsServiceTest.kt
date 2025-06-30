package dev.ryuzu.astermanagement.auth.service

import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.domain.user.UserRole
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.assertThrows
import org.mockito.Mock
import org.mockito.MockitoAnnotations
import org.mockito.kotlin.whenever
import org.springframework.security.core.userdetails.UsernameNotFoundException
import java.util.*

class CustomUserDetailsServiceTest {

    @Mock
    private lateinit var userRepository: UserRepository

    private lateinit var userDetailsService: CustomUserDetailsService

    @BeforeEach
    fun setup() {
        MockitoAnnotations.openMocks(this)
        userDetailsService = CustomUserDetailsService(userRepository)
    }

    @Test
    fun `should load user by username successfully`() {
        // Given
        val email = "test@example.com"
        val user = createTestUser(email, UserRole.LAWYER, true)
        whenever(userRepository.findByEmail(email)).thenReturn(user)

        // When
        val userDetails = userDetailsService.loadUserByUsername(email)

        // Then
        assertNotNull(userDetails)
        assertTrue(userDetails is UserPrincipal)
        assertEquals(email, userDetails.username)
        assertEquals(user.passwordHash, userDetails.password)
        assertTrue(userDetails.isEnabled)
    }

    @Test
    fun `should throw exception when user not found by email`() {
        // Given
        val email = "nonexistent@example.com"
        whenever(userRepository.findByEmail(email)).thenReturn(null)

        // When & Then
        val exception = assertThrows<UsernameNotFoundException> {
            userDetailsService.loadUserByUsername(email)
        }
        assertTrue(exception.message!!.contains("User not found with email: $email"))
    }

    @Test
    fun `should throw exception when user account is disabled`() {
        // Given
        val email = "disabled@example.com"
        val user = createTestUser(email, UserRole.CLERK, false) // isActive = false
        whenever(userRepository.findByEmail(email)).thenReturn(user)

        // When & Then
        val exception = assertThrows<UsernameNotFoundException> {
            userDetailsService.loadUserByUsername(email)
        }
        assertTrue(exception.message!!.contains("User account is disabled for email: $email"))
    }

    @Test
    fun `should load user by ID successfully`() {
        // Given
        val userId = UUID.randomUUID()
        val user = createTestUser("test@example.com", UserRole.CLIENT, true).apply {
            id = userId
        }
        whenever(userRepository.findById(userId)).thenReturn(Optional.of(user))

        // When
        val userDetails = userDetailsService.loadUserById(userId)

        // Then
        assertNotNull(userDetails)
        assertTrue(userDetails is UserPrincipal)
        val userPrincipal = userDetails as UserPrincipal
        assertEquals(userId, userPrincipal.id)
        assertEquals(user.email, userPrincipal.email)
    }

    @Test
    fun `should throw exception when user not found by ID`() {
        // Given
        val userId = UUID.randomUUID()
        whenever(userRepository.findById(userId)).thenReturn(Optional.empty())

        // When & Then
        val exception = assertThrows<UsernameNotFoundException> {
            userDetailsService.loadUserById(userId)
        }
        assertTrue(exception.message!!.contains("User not found with id: $userId"))
    }

    @Test
    fun `should load user by email with details successfully`() {
        // Given
        val email = "test@example.com"
        val user = createTestUser(email, UserRole.LAWYER, true)
        whenever(userRepository.findByEmail(email)).thenReturn(user)

        // When
        val userPrincipal = userDetailsService.loadUserByEmailWithDetails(email)

        // Then
        assertNotNull(userPrincipal)
        assertEquals(email, userPrincipal.email)
        assertEquals(UserRole.LAWYER, userPrincipal.role)
        assertTrue(userPrincipal.isEnabled)
    }

    @Test
    fun `should throw detailed exception when user not found by email with details`() {
        // Given
        val email = "missing@example.com"
        whenever(userRepository.findByEmail(email)).thenReturn(null)

        // When & Then
        val exception = assertThrows<UsernameNotFoundException> {
            userDetailsService.loadUserByEmailWithDetails(email)
        }
        assertTrue(exception.message!!.contains("No user found with email address: $email"))
    }

    @Test
    fun `should throw detailed exception when user disabled with details`() {
        // Given
        val email = "disabled@example.com"
        val user = createTestUser(email, UserRole.CLERK, false)
        whenever(userRepository.findByEmail(email)).thenReturn(user)

        // When & Then
        val exception = assertThrows<UsernameNotFoundException> {
            userDetailsService.loadUserByEmailWithDetails(email)
        }
        assertTrue(exception.message!!.contains("User account is disabled or suspended: $email"))
    }

    @Test
    fun `should check if user is active by email correctly`() {
        // Given
        val activeEmail = "active@example.com"
        val inactiveEmail = "inactive@example.com"
        val nonexistentEmail = "nonexistent@example.com"
        
        val activeUser = createTestUser(activeEmail, UserRole.LAWYER, true)
        val inactiveUser = createTestUser(inactiveEmail, UserRole.CLERK, false)
        
        whenever(userRepository.findByEmail(activeEmail)).thenReturn(activeUser)
        whenever(userRepository.findByEmail(inactiveEmail)).thenReturn(inactiveUser)
        whenever(userRepository.findByEmail(nonexistentEmail)).thenReturn(null)

        // When & Then
        assertTrue(userDetailsService.isUserActiveByEmail(activeEmail))
        assertFalse(userDetailsService.isUserActiveByEmail(inactiveEmail))
        assertFalse(userDetailsService.isUserActiveByEmail(nonexistentEmail))
    }

    @Test
    fun `should check if user is active by ID correctly`() {
        // Given
        val activeUserId = UUID.randomUUID()
        val inactiveUserId = UUID.randomUUID()
        val nonexistentUserId = UUID.randomUUID()
        
        val activeUser = createTestUser("active@example.com", UserRole.LAWYER, true)
        val inactiveUser = createTestUser("inactive@example.com", UserRole.CLERK, false)
        
        whenever(userRepository.findById(activeUserId)).thenReturn(Optional.of(activeUser))
        whenever(userRepository.findById(inactiveUserId)).thenReturn(Optional.of(inactiveUser))
        whenever(userRepository.findById(nonexistentUserId)).thenReturn(Optional.empty())

        // When & Then
        assertTrue(userDetailsService.isUserActiveById(activeUserId))
        assertFalse(userDetailsService.isUserActiveById(inactiveUserId))
        assertFalse(userDetailsService.isUserActiveById(nonexistentUserId))
    }

    @Test
    fun `should handle null password hash`() {
        // Given
        val email = "nullpassword@example.com"
        val user = createTestUser(email, UserRole.CLIENT, true).apply {
            passwordHash = null
        }
        whenever(userRepository.findByEmail(email)).thenReturn(user)

        // When
        val userDetails = userDetailsService.loadUserByUsername(email)

        // Then
        assertEquals("", userDetails.password)
    }

    private fun createTestUser(email: String, role: UserRole, isActive: Boolean): User {
        return User().apply {
            id = UUID.randomUUID()
            this.email = email
            firstName = "Test"
            lastName = "User"
            this.role = role
            passwordHash = "hashedPassword123"
            this.isActive = isActive
        }
    }
}