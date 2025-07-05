package dev.ryuzu.astermanagement.testutil

import dev.ryuzu.astermanagement.auth.dto.UserDto
import dev.ryuzu.astermanagement.auth.dto.UserRoleDto
import dev.ryuzu.astermanagement.auth.service.UserPrincipal
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRole
import dev.ryuzu.astermanagement.domain.user.mapper.UserDtoMapper
import java.time.LocalDateTime
import java.util.*

/**
 * Helper class for authentication-related tests
 * Provides utilities for creating test users and user principals
 */
object AuthTestHelper {
    
    /**
     * Create a test UserPrincipal from domain User
     */
    fun createUserPrincipal(user: User): UserPrincipal {
        return UserPrincipal.create(UserDtoMapper.toDto(user))
    }
    
    /**
     * Create a test UserPrincipal with specific role
     */
    fun createUserPrincipal(
        id: UUID = UUID.randomUUID(),
        email: String = "test@example.com",
        firstName: String = "Test",
        lastName: String = "User",
        role: UserRole = UserRole.CLIENT,
        isActive: Boolean = true
    ): UserPrincipal {
        val userDto = UserDto(
            id = id,
            email = email,
            firstName = firstName,
            lastName = lastName,
            passwordHash = "hashedPassword",
            role = mapToDto(role),
            isActive = isActive,
            lastLoginAt = LocalDateTime.now()
        )
        return UserPrincipal.create(userDto)
    }
    
    /**
     * Map domain UserRole to DTO UserRoleDto
     */
    fun mapToDto(role: UserRole): UserRoleDto {
        return UserDtoMapper.mapRole(role)
    }
    
    /**
     * Map DTO UserRoleDto to domain UserRole
     */
    fun mapFromDto(roleDto: UserRoleDto): UserRole {
        return UserDtoMapper.mapRoleFromDto(roleDto)
    }
}