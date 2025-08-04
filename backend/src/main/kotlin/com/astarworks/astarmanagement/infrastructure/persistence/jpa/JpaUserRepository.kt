package com.astarworks.astarmanagement.infrastructure.persistence.jpa

import com.astarworks.astarmanagement.domain.entity.User
import com.astarworks.astarmanagement.domain.repository.UserRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface SpringDataUserRepository : JpaRepository<User, UUID> {
    fun findByEmail(email: String): User?
    fun existsByEmail(email: String): Boolean
}

@Repository
class JpaUserRepository(
    private val springDataUserRepository: SpringDataUserRepository
) : UserRepository {
    
    override fun findById(id: UUID): User? {
        return springDataUserRepository.findById(id).orElse(null)
    }
    
    override fun findByEmail(email: String): User? {
        return springDataUserRepository.findByEmail(email)
    }
    
    override fun save(user: User): User {
        return springDataUserRepository.save(user)
    }
    
    override fun existsByEmail(email: String): Boolean {
        return springDataUserRepository.existsByEmail(email)
    }
    
    override fun deleteById(id: UUID) {
        springDataUserRepository.deleteById(id)
    }
}