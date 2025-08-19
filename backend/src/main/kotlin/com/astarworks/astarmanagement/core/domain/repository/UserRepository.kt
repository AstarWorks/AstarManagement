package com.astarworks.astarmanagement.core.domain.repository

import com.astarworks.astarmanagement.core.domain.model.User
import java.util.*

/**
 * User repository interface for domain layer.
 * Defines operations for user persistence without infrastructure concerns.
 */
interface UserRepository {
    
    fun save(user: User): User
    
    fun findById(id: UUID): User?
    
    fun findByAuth0Id(auth0Id: String): User?
    
    fun findByEmail(email: String): User?
    
    fun existsByAuth0Id(auth0Id: String): Boolean
    
    fun existsByEmail(email: String): Boolean
    
    fun deleteById(id: UUID)
    
    fun findAll(): List<User>
}