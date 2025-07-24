package dev.ryuzu.astermanagement.security.rbac.service

import dev.ryuzu.astermanagement.domain.operation.OperationRepository
import dev.ryuzu.astermanagement.domain.user.UserRepository
import org.springframework.stereotype.Service
import java.util.*

/**
 * Service for checking operation-specific security permissions.
 * Provides methods to determine if a user can access or control specific operations.
 */
@Service
class OperationSecurityService(
    private val operationRepository: OperationRepository,
    private val userRepository: UserRepository
) {

    /**
     * Check if a user can access a specific operation.
     * Users can access operations if they are the owner of the operation.
     */
    fun canUserAccessOperation(operationId: UUID, username: String): Boolean {
        return try {
            val operation = operationRepository.findById(operationId).orElse(null)
                ?: return false
            
            val user = userRepository.findByEmail(username)
                ?: return false
            
            // Users can access if they are the owner of the operation
            operation.user?.id == user.id
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Check if a user can control (modify/delete) a specific operation.
     * Users can control operations if they are the owner of the operation.
     */
    fun canUserControlOperation(operationId: UUID, username: String): Boolean {
        return try {
            val operation = operationRepository.findById(operationId).orElse(null)
                ?: return false
            
            val user = userRepository.findByEmail(username)
                ?: return false
            
            // Users can control only if they are the owner
            operation.user?.id == user.id
        } catch (e: Exception) {
            false
        }
    }
}