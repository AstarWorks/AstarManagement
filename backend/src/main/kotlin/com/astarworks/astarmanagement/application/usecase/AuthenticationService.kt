package com.astarworks.astarmanagement.application.usecase

import com.astarworks.astarmanagement.application.dto.auth.*
import com.astarworks.astarmanagement.application.port.input.AuthenticationUseCase
import com.astarworks.astarmanagement.application.port.output.PasswordEncoder
import com.astarworks.astarmanagement.application.port.output.TokenProvider
import com.astarworks.astarmanagement.domain.entity.User
import com.astarworks.astarmanagement.domain.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AuthenticationService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val tokenProvider: TokenProvider
) : AuthenticationUseCase {

    override fun login(request: LoginRequest): LoginResponse {
        val user = userRepository.findByEmail(request.email)
            ?: throw IllegalArgumentException("Invalid email or password")
        
        if (!passwordEncoder.matches(request.password, user.password)) {
            throw IllegalArgumentException("Invalid email or password")
        }
        
        if (!user.isActive) {
            throw IllegalStateException("User account is disabled")
        }
        
        return LoginResponse(
            accessToken = tokenProvider.generateAccessToken(user),
            refreshToken = tokenProvider.generateRefreshToken(user),
            expiresIn = tokenProvider.getExpirationTime(),
            user = user.toResponse()
        )
    }

    override fun register(request: RegisterRequest): UserResponse {
        if (userRepository.existsByEmail(request.email)) {
            throw IllegalArgumentException("Email already exists")
        }
        
        val user = User(
            tenantId = UUID.randomUUID(), // TODO: Get actual tenant ID from request or context
            email = request.email,
            password = passwordEncoder.encode(request.password),
            firstName = request.firstName,
            lastName = request.lastName,
            role = request.role
        )
        
        val savedUser = userRepository.save(user)
        return savedUser.toResponse()
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
        id = id,
        email = email,
        firstName = firstName,
        lastName = lastName,
        role = role,
        isActive = isActive,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}