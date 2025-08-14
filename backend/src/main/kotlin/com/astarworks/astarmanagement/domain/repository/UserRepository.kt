package com.astarworks.astarmanagement.domain.repository

import com.astarworks.astarmanagement.domain.entity.User
import java.util.UUID

interface UserRepository {
    fun findById(id: UUID): User?
    fun findByEmail(email: String): User?
    fun save(user: User): User
    fun existsByEmail(email: String): Boolean
    fun existsByUsername(username: String): Boolean
    fun deleteById(id: UUID)
    
    // RLS bypass methods for authentication
    fun findByEmailBypassingRLS(email: String): User?
    fun findByIdBypassingRLS(id: UUID): User?
}