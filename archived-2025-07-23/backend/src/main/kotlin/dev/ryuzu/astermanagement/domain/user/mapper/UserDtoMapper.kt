package dev.ryuzu.astermanagement.domain.user.mapper

import dev.ryuzu.astermanagement.auth.dto.UserDto
import dev.ryuzu.astermanagement.auth.dto.UserRoleDto
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRole

/**
 * Mapper to convert between domain User and auth UserDto
 * 
 * Located in domain package to avoid circular dependencies.
 * The domain layer provides mapping services to other layers.
 */
object UserDtoMapper {
    
    /**
     * Convert domain User entity to auth UserDto
     */
    fun toDto(user: User): UserDto {
        return UserDto(
            id = user.id,
            email = user.email,
            firstName = user.firstName,
            lastName = user.lastName,
            passwordHash = user.passwordHash,
            role = mapRole(user.role),
            isActive = user.isActive,
            lastLoginAt = user.lastLoginAt
        )
    }
    
    /**
     * Convert domain UserRole to auth UserRoleDto
     */
    fun mapRole(role: UserRole): UserRoleDto {
        return when (role) {
            UserRole.LAWYER -> UserRoleDto.LAWYER
            UserRole.CLERK -> UserRoleDto.CLERK
            UserRole.CLIENT -> UserRoleDto.CLIENT
        }
    }
    
    /**
     * Convert auth UserRoleDto to domain UserRole
     */
    fun mapRoleFromDto(roleDto: UserRoleDto): UserRole {
        return when (roleDto) {
            UserRoleDto.LAWYER -> UserRole.LAWYER
            UserRoleDto.CLERK -> UserRole.CLERK
            UserRoleDto.CLIENT -> UserRole.CLIENT
        }
    }
}