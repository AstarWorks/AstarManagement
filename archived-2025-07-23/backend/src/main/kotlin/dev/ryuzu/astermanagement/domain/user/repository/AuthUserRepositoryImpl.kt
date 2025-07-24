package dev.ryuzu.astermanagement.domain.user.repository

import dev.ryuzu.astermanagement.auth.dto.UserDto
import dev.ryuzu.astermanagement.auth.repository.AuthUserRepository
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.domain.user.mapper.UserDtoMapper
import org.springframework.stereotype.Repository
import java.util.*

/**
 * Implementation of AuthUserRepository that bridges auth and domain layers
 * 
 * This implementation lives in the domain layer and provides user data
 * to the auth layer in DTO format to break circular dependencies.
 */
@Repository
class AuthUserRepositoryImpl(
    private val userRepository: UserRepository
) : AuthUserRepository {
    
    override fun findByEmailForAuth(email: String): UserDto? {
        return userRepository.findByEmail(email)?.let { user ->
            UserDtoMapper.toDto(user)
        }
    }
    
    override fun findByIdForAuth(id: UUID): UserDto? {
        return userRepository.findById(id).orElse(null)?.let { user ->
            UserDtoMapper.toDto(user)
        }
    }
}