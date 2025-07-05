package dev.ryuzu.astermanagement.modules.user.infrastructure

import dev.ryuzu.astermanagement.auth.dto.UserDto
import dev.ryuzu.astermanagement.auth.dto.UserRoleDto
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.domain.user.UserRole
import dev.ryuzu.astermanagement.modules.user.api.UserService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

/**
 * User Service Implementation
 * 
 * Implementation of the User module API that bridges the module interface
 * with the underlying domain repository. This service follows Spring Modulith
 * patterns for clean module boundaries.
 */
@Service
@Transactional
class UserServiceImpl(
    private val userRepository: UserRepository
) : UserService {
    
    @Transactional(readOnly = true)
    override fun findByEmail(email: String): User? {
        return userRepository.findByEmail(email)
    }
    
    @Transactional(readOnly = true)
    override fun findById(userId: UUID): User? {
        return userRepository.findById(userId).orElse(null)
    }
    
    @Transactional(readOnly = true)
    override fun isActiveByEmail(email: String): Boolean {
        return userRepository.findByEmail(email)?.isActive ?: false
    }
    
    @Transactional(readOnly = true)
    override fun isActiveById(userId: UUID): Boolean {
        return userRepository.findById(userId).map { it.isActive }.orElse(false)
    }
    
    override fun createUser(user: User): User {
        return userRepository.save(user)
    }
    
    override fun updateUser(user: User): User {
        return userRepository.save(user)
    }
    
    @Transactional(readOnly = true)
    override fun getAllUsers(): List<User> {
        return userRepository.findAll()
    }
    
    @Transactional(readOnly = true)
    override fun findUserDtoByEmail(email: String): UserDto? {
        return userRepository.findByEmail(email)?.toUserDto()
    }
    
    @Transactional(readOnly = true)
    override fun findUserDtoById(userId: UUID): UserDto? {
        return userRepository.findById(userId).orElse(null)?.toUserDto()
    }
    
    /**
     * Convert User entity to UserDto for authentication purposes
     */
    private fun User.toUserDto(): UserDto {
        return UserDto(
            id = this.id,
            email = this.email,
            firstName = this.firstName,
            lastName = this.lastName,
            passwordHash = this.passwordHash,
            role = this.role.toUserRoleDto(),
            isActive = this.isActive,
            lastLoginAt = this.lastLoginAt
        )
    }
    
    /**
     * Convert UserRole entity to UserRoleDto
     */
    private fun UserRole.toUserRoleDto(): UserRoleDto {
        return when (this) {
            UserRole.LAWYER -> UserRoleDto.LAWYER
            UserRole.CLERK -> UserRoleDto.CLERK
            UserRole.CLIENT -> UserRoleDto.CLIENT
        }
    }
}