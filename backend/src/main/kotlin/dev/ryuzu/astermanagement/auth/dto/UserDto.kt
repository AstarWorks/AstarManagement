package dev.ryuzu.astermanagement.auth.dto

import java.time.LocalDateTime
import java.util.*

/**
 * User Data Transfer Object for Authentication
 * 
 * This DTO breaks the circular dependency between auth and domain packages
 * by providing a simplified user representation for authentication purposes.
 */
data class UserDto(
    val id: UUID?,
    val email: String,
    val firstName: String,
    val lastName: String,
    val passwordHash: String?,
    val role: UserRoleDto,
    val isActive: Boolean,
    val lastLoginAt: LocalDateTime?
) {
    val fullName: String
        get() = "$firstName $lastName".trim()
}

/**
 * User Role enum for authentication
 */
enum class UserRoleDto {
    LAWYER,
    CLERK,
    CLIENT
}