package com.astarworks.astarmanagement.application.usecase

import com.astarworks.astarmanagement.application.dto.auth.*
import com.astarworks.astarmanagement.application.port.input.AuthenticationUseCase
import com.astarworks.astarmanagement.application.port.output.PasswordEncoder
import com.astarworks.astarmanagement.application.port.output.TokenProvider
import com.astarworks.astarmanagement.domain.entity.User
import com.astarworks.astarmanagement.domain.repository.UserRepository
import com.astarworks.astarmanagement.infrastructure.security.TenantContextService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AuthenticationService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val tokenProvider: TokenProvider,
    private val tenantContextService: TenantContextService
) : AuthenticationUseCase {

    override fun login(request: LoginRequest): LoginResponse {
        // Try to find user bypassing RLS first for authentication
        val user = userRepository.findByEmailBypassingRLS(request.email)
            ?: throw IllegalArgumentException("Invalid email or password")
        
        if (!passwordEncoder.matches(request.password, user.password)) {
            throw IllegalArgumentException("Invalid email or password")
        }
        
        if (!user.isActive) {
            throw IllegalStateException("User account is disabled")
        }
        
        // Set tenant context for the authenticated user
        tenantContextService.setSecurityContext(user.tenantId, user.id)
        
        return LoginResponse(
            accessToken = tokenProvider.generateAccessToken(user),
            refreshToken = tokenProvider.generateRefreshToken(user),
            expiresIn = tokenProvider.getExpirationTime(),
            user = user.toResponse()
        )
    }

    override fun register(request: RegisterRequest): UserResponse {
        try {
            // Determine tenant ID - use provided tenantId or default tenant
            val tenantId = if (request.tenantId != null) {
                try {
                    UUID.fromString(request.tenantId)
                } catch (e: IllegalArgumentException) {
                    throw IllegalArgumentException("Invalid tenant ID format")
                }
            } else {
                // Use default tenant ID for demo/development
                UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-000000000001")
            }
            
            // Set tenant context BEFORE checking for existing users for RLS
            // tenantContextService.setSecurityContext(tenantId, null) // Temporarily disabled for testing
            
            // Check if email already exists
            if (userRepository.existsByEmail(request.email)) {
                throw IllegalArgumentException("Email already exists")
            }
            
            // Check if username already exists
            if (userRepository.existsByUsername(request.username)) {
                throw IllegalArgumentException("Username already exists")
            }
            
            val user = User(
                tenantId = tenantId,
                username = request.username,
                email = request.email,
                password = passwordEncoder.encode(request.password),
                firstName = request.firstName,
                lastName = request.lastName,
                role = request.role
            )
            
            val savedUser = userRepository.save(user)
            return savedUser.toResponse()
        } catch (e: Exception) {
            // Debug logging - this will help us see the actual error
            println("DEBUG: Registration error - ${e::class.simpleName}: ${e.message}")
            e.printStackTrace()
            throw e
        }
    }

    override fun validateToken(token: String): Boolean {
        return tokenProvider.validateToken(token)
    }

    override fun refreshToken(refreshToken: String): LoginResponse {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw IllegalArgumentException("Invalid refresh token")
        }
        
        val userId = tokenProvider.getUserIdFromToken(refreshToken)
            ?: throw IllegalArgumentException("Invalid refresh token")
        
        val user = userRepository.findById(userId)
            ?: throw IllegalArgumentException("User not found")
        
        return LoginResponse(
            accessToken = tokenProvider.generateAccessToken(user),
            refreshToken = tokenProvider.generateRefreshToken(user),
            expiresIn = tokenProvider.getExpirationTime(),
            user = user.toResponse()
        )
    }
    
    private fun User.toResponse() = UserResponse(
        id = id ?: throw IllegalStateException("User ID cannot be null"),
        email = email,
        firstName = firstName,
        lastName = lastName,
        role = role,
        isActive = isActive,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}