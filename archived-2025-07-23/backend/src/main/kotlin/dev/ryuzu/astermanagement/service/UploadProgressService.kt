package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.dto.document.UploadProgressDto
import java.util.*

/**
 * Service interface for tracking upload progress
 */
interface UploadProgressService {
    
    /**
     * Get current upload progress for a document
     * 
     * @param documentId The document ID
     * @return Upload progress or null if not found
     */
    fun getProgress(documentId: UUID): UploadProgressDto?
    
    /**
     * Notify progress update to subscribers
     * 
     * @param userId The user ID to notify
     * @param progress The progress update
     */
    fun notifyProgress(userId: String, progress: UploadProgressDto)
    
    /**
     * Store progress information
     * 
     * @param documentId The document ID
     * @param progress The progress information
     */
    fun storeProgress(documentId: UUID, progress: UploadProgressDto)
    
    /**
     * Remove progress information when upload is complete
     * 
     * @param documentId The document ID
     */
    fun removeProgress(documentId: UUID)
}