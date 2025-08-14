package com.astarworks.astarmanagement.infrastructure.persistence.jpa

import com.astarworks.astarmanagement.domain.entity.User
import com.astarworks.astarmanagement.domain.entity.UserRole
import com.astarworks.astarmanagement.domain.repository.UserRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface SpringDataUserRepository : JpaRepository<User, UUID> {
    fun findByEmail(email: String): User?
    fun existsByEmail(email: String): Boolean
    fun existsByUsername(username: String): Boolean
    
    @Query("SELECT * FROM users WHERE email = :email", nativeQuery = true)
    fun findByEmailNative(@Param("email") email: String): User?
    
    @Query("SELECT * FROM users WHERE id = :id", nativeQuery = true)
    fun findByIdNative(@Param("id") id: UUID): User?
}

@Repository
class JpaUserRepository(
    private val springDataUserRepository: SpringDataUserRepository,
    private val jdbcTemplate: org.springframework.jdbc.core.JdbcTemplate
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
    
    override fun existsByUsername(username: String): Boolean {
        return springDataUserRepository.existsByUsername(username)
    }
    
    override fun deleteById(id: UUID) {
        springDataUserRepository.deleteById(id)
    }
    
    override fun findByEmailBypassingRLS(email: String): User? {
        return try {
            // Use direct JDBC to completely bypass JPA/Hibernate and RLS
            val sql = "SELECT * FROM users WHERE email = ?"
            jdbcTemplate.queryForObject(sql, { rs, _ ->
                val user = User(
                    tenantId = UUID.fromString(rs.getString("tenant_id")),
                    username = rs.getString("username"),
                    email = rs.getString("email"),
                    password = rs.getString("password_hash"),
                    firstName = rs.getString("first_name"),
                    lastName = rs.getString("last_name"),
                    role = UserRole.valueOf(rs.getString("role")),
                    isActive = rs.getBoolean("is_active"),
                    createdAt = rs.getTimestamp("created_at").toLocalDateTime(),
                    updatedAt = rs.getTimestamp("updated_at").toLocalDateTime(),
                    createdBy = rs.getString("created_by")?.let { UUID.fromString(it) },
                    updatedBy = rs.getString("updated_by")?.let { UUID.fromString(it) },
                    lastLoginAt = rs.getTimestamp("last_login_at")?.toLocalDateTime()
                )
                user.id = UUID.fromString(rs.getString("id"))
                user
            }, email)
        } catch (e: Exception) {
            null
        }
    }
    
    override fun findByIdBypassingRLS(id: UUID): User? {
        return try {
            // Use direct JDBC to completely bypass JPA/Hibernate and RLS
            val sql = "SELECT * FROM users WHERE id = ?"
            jdbcTemplate.queryForObject(sql, { rs, _ ->
                val user = User(
                    tenantId = UUID.fromString(rs.getString("tenant_id")),
                    username = rs.getString("username"),
                    email = rs.getString("email"),
                    password = rs.getString("password_hash"),
                    firstName = rs.getString("first_name"),
                    lastName = rs.getString("last_name"),
                    role = UserRole.valueOf(rs.getString("role")),
                    isActive = rs.getBoolean("is_active"),
                    createdAt = rs.getTimestamp("created_at").toLocalDateTime(),
                    updatedAt = rs.getTimestamp("updated_at").toLocalDateTime(),
                    createdBy = rs.getString("created_by")?.let { UUID.fromString(it) },
                    updatedBy = rs.getString("updated_by")?.let { UUID.fromString(it) },
                    lastLoginAt = rs.getTimestamp("last_login_at")?.toLocalDateTime()
                )
                user.id = UUID.fromString(rs.getString("id"))
                user
            }, id)
        } catch (e: Exception) {
            null
        }
    }
}