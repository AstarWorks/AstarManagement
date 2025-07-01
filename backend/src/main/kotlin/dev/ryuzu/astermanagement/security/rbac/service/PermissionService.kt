package dev.ryuzu.astermanagement.security.rbac.service

import dev.ryuzu.astermanagement.security.rbac.repository.UserRoleRepository
import org.slf4j.LoggerFactory
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service
import java.io.Serializable
import java.util.*

/**
 * Permission service for business logic permission checking.
 * Provides resource-specific access control methods for matter, document, and communication ownership verification.
 * 
 * This service implements the business rules for determining whether a client user
 * has access to specific resources based on matter ownership relationships.
 */
@Service
class PermissionService(
    private val userRoleRepository: UserRoleRepository
) {
    
    private val logger = LoggerFactory.getLogger(PermissionService::class.java)

    /**
     * Check if a client user owns a specific matter by domain object.
     * 
     * @param clientUserId The client user ID
     * @param matterObject The matter domain object (should have clientId property)
     * @return true if the client owns the matter, false otherwise
     */
    @Cacheable("client-matter-ownership", key = "#clientUserId + ':matter:' + #matterObject?.javaClass?.simpleName")
    fun isClientMatterOwner(clientUserId: UUID, matterObject: Any): Boolean {
        return try {
            // Extract clientId from matter object using reflection
            val clientIdField = findClientIdField(matterObject)
            val matterClientId = clientIdField?.let { field ->
                field.isAccessible = true
                field.get(matterObject) as? UUID
            }
            
            clientUserId == matterClientId
        } catch (e: Exception) {
            logger.warn("Failed to check matter ownership for client {} and matter {}: {}", 
                       clientUserId, matterObject.javaClass.simpleName, e.message)
            false
        }
    }

    /**
     * Check if a client user owns a specific matter by matter ID.
     * 
     * @param clientUserId The client user ID
     * @param matterId The matter ID (can be UUID, String, or Long)
     * @return true if the client owns the matter, false otherwise
     */
    @Cacheable("client-matter-ownership-by-id", key = "#clientUserId + ':matter:' + #matterId")
    fun isClientMatterOwnerById(clientUserId: UUID, matterId: Serializable): Boolean {
        return try {
            // Convert matterId to UUID if needed
            val matterUuid = when (matterId) {
                is UUID -> matterId
                is String -> UUID.fromString(matterId)
                else -> {
                    logger.warn("Unsupported matter ID type: {}", matterId.javaClass)
                    return false
                }
            }
            
            // Query database to check matter ownership
            // TODO: Replace with actual matter repository call when matter entity is available
            checkMatterOwnershipInDatabase(clientUserId, matterUuid)
        } catch (e: Exception) {
            logger.warn("Failed to check matter ownership for client {} and matter ID {}: {}", 
                       clientUserId, matterId, e.message)
            false
        }
    }

    /**
     * Check if a client user owns a document by domain object.
     * Documents are owned through their associated matter.
     * 
     * @param clientUserId The client user ID
     * @param documentObject The document domain object (should have matterId property)
     * @return true if the client owns the matter containing the document, false otherwise
     */
    @Cacheable("client-document-ownership", key = "#clientUserId + ':document:' + #documentObject?.javaClass?.simpleName")
    fun isClientDocumentOwner(clientUserId: UUID, documentObject: Any): Boolean {
        return try {
            // Extract matterId from document object using reflection
            val matterIdField = findMatterIdField(documentObject)
            val documentMatterId = matterIdField?.let { field ->
                field.isAccessible = true
                field.get(documentObject) as? UUID
            }
            
            if (documentMatterId != null) {
                isClientMatterOwnerById(clientUserId, documentMatterId)
            } else {
                logger.warn("Could not extract matterId from document object: {}", documentObject.javaClass.simpleName)
                false
            }
        } catch (e: Exception) {
            logger.warn("Failed to check document ownership for client {} and document {}: {}", 
                       clientUserId, documentObject.javaClass.simpleName, e.message)
            false
        }
    }

    /**
     * Check if a client user owns a document by document ID.
     * Documents are owned through their associated matter.
     * 
     * @param clientUserId The client user ID
     * @param documentId The document ID
     * @return true if the client owns the matter containing the document, false otherwise
     */
    @Cacheable("client-document-ownership-by-id", key = "#clientUserId + ':document:' + #documentId")
    fun isClientDocumentOwnerById(clientUserId: UUID, documentId: Serializable): Boolean {
        return try {
            // Convert documentId to UUID if needed
            val documentUuid = when (documentId) {
                is UUID -> documentId
                is String -> UUID.fromString(documentId)
                else -> {
                    logger.warn("Unsupported document ID type: {}", documentId.javaClass)
                    return false
                }
            }
            
            // Query database to get matter ID for the document, then check matter ownership
            // TODO: Replace with actual document repository call when document entity is available
            val matterId = getDocumentMatterIdFromDatabase(documentUuid)
            if (matterId != null) {
                isClientMatterOwnerById(clientUserId, matterId)
            } else {
                logger.warn("Could not find matter ID for document: {}", documentUuid)
                false
            }
        } catch (e: Exception) {
            logger.warn("Failed to check document ownership for client {} and document ID {}: {}", 
                       clientUserId, documentId, e.message)
            false
        }
    }

    /**
     * Check if a client user owns a communication by domain object.
     * Communications are owned through their associated matter.
     * 
     * @param clientUserId The client user ID
     * @param communicationObject The communication domain object (should have matterId property)
     * @return true if the client owns the matter containing the communication, false otherwise
     */
    @Cacheable("client-communication-ownership", key = "#clientUserId + ':communication:' + #communicationObject?.javaClass?.simpleName")
    fun isClientCommunicationOwner(clientUserId: UUID, communicationObject: Any): Boolean {
        return try {
            // Extract matterId from communication object using reflection
            val matterIdField = findMatterIdField(communicationObject)
            val communicationMatterId = matterIdField?.let { field ->
                field.isAccessible = true
                field.get(communicationObject) as? UUID
            }
            
            if (communicationMatterId != null) {
                isClientMatterOwnerById(clientUserId, communicationMatterId)
            } else {
                logger.warn("Could not extract matterId from communication object: {}", communicationObject.javaClass.simpleName)
                false
            }
        } catch (e: Exception) {
            logger.warn("Failed to check communication ownership for client {} and communication {}: {}", 
                       clientUserId, communicationObject.javaClass.simpleName, e.message)
            false
        }
    }

    /**
     * Check if a client user owns a communication by communication ID.
     * Communications are owned through their associated matter.
     * 
     * @param clientUserId The client user ID
     * @param communicationId The communication ID
     * @return true if the client owns the matter containing the communication, false otherwise
     */
    @Cacheable("client-communication-ownership-by-id", key = "#clientUserId + ':communication:' + #communicationId")
    fun isClientCommunicationOwnerById(clientUserId: UUID, communicationId: Serializable): Boolean {
        return try {
            // Convert communicationId to UUID if needed
            val communicationUuid = when (communicationId) {
                is UUID -> communicationId
                is String -> UUID.fromString(communicationId)
                else -> {
                    logger.warn("Unsupported communication ID type: {}", communicationId.javaClass)
                    return false
                }
            }
            
            // Query database to get matter ID for the communication, then check matter ownership
            // TODO: Replace with actual communication repository call when communication entity is available
            val matterId = getCommunicationMatterIdFromDatabase(communicationUuid)
            if (matterId != null) {
                isClientMatterOwnerById(clientUserId, matterId)
            } else {
                logger.warn("Could not find matter ID for communication: {}", communicationUuid)
                false
            }
        } catch (e: Exception) {
            logger.warn("Failed to check communication ownership for client {} and communication ID {}: {}", 
                       clientUserId, communicationId, e.message)
            false
        }
    }

    /**
     * Find the clientId field in a matter object using reflection.
     * Looks for common field names: clientId, client_id, client.
     */
    private fun findClientIdField(obj: Any): java.lang.reflect.Field? {
        val clazz = obj.javaClass
        val fieldNames = listOf("clientId", "client_id", "client")
        
        for (fieldName in fieldNames) {
            try {
                return clazz.getDeclaredField(fieldName)
            } catch (e: NoSuchFieldException) {
                // Continue to next field name
            }
        }
        
        // Try searching in parent classes
        var parentClass = clazz.superclass
        while (parentClass != null) {
            for (fieldName in fieldNames) {
                try {
                    return parentClass.getDeclaredField(fieldName)
                } catch (e: NoSuchFieldException) {
                    // Continue to next field name
                }
            }
            parentClass = parentClass.superclass
        }
        
        return null
    }

    /**
     * Find the matterId field in a document/communication object using reflection.
     * Looks for common field names: matterId, matter_id, matter.
     */
    private fun findMatterIdField(obj: Any): java.lang.reflect.Field? {
        val clazz = obj.javaClass
        val fieldNames = listOf("matterId", "matter_id", "matter")
        
        for (fieldName in fieldNames) {
            try {
                return clazz.getDeclaredField(fieldName)
            } catch (e: NoSuchFieldException) {
                // Continue to next field name
            }
        }
        
        // Try searching in parent classes
        var parentClass = clazz.superclass
        while (parentClass != null) {
            for (fieldName in fieldNames) {
                try {
                    return parentClass.getDeclaredField(fieldName)
                } catch (e: NoSuchFieldException) {
                    // Continue to next field name
                }
            }
            parentClass = parentClass.superclass
        }
        
        return null
    }

    /**
     * Check matter ownership in database.
     * TODO: Implement actual database query when matter repository is available.
     */
    private fun checkMatterOwnershipInDatabase(clientUserId: UUID, matterId: UUID): Boolean {
        // Placeholder implementation - will be replaced with actual repository call
        logger.debug("Checking matter ownership in database for client {} and matter {}", clientUserId, matterId)
        
        // TODO: Implement actual query like:
        // return matterRepository.existsByIdAndClientId(matterId, clientUserId)
        
        // For now, return false as a safe default
        return false
    }

    /**
     * Get matter ID for a document from database.
     * TODO: Implement actual database query when document repository is available.
     */
    private fun getDocumentMatterIdFromDatabase(documentId: UUID): UUID? {
        // Placeholder implementation - will be replaced with actual repository call
        logger.debug("Getting matter ID for document {} from database", documentId)
        
        // TODO: Implement actual query like:
        // return documentRepository.findById(documentId)?.matterId
        
        // For now, return null as a safe default
        return null
    }

    /**
     * Get matter ID for a communication from database.
     * TODO: Implement actual database query when communication repository is available.
     */
    private fun getCommunicationMatterIdFromDatabase(communicationId: UUID): UUID? {
        // Placeholder implementation - will be replaced with actual repository call
        logger.debug("Getting matter ID for communication {} from database", communicationId)
        
        // TODO: Implement actual query like:
        // return communicationRepository.findById(communicationId)?.matterId
        
        // For now, return null as a safe default
        return null
    }
}