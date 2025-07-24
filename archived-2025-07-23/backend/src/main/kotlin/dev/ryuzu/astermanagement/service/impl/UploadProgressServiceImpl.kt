package dev.ryuzu.astermanagement.service.impl

import dev.ryuzu.astermanagement.dto.document.UploadProgressDto
import dev.ryuzu.astermanagement.service.UploadProgressService
import org.slf4j.LoggerFactory
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import java.time.Duration
import java.util.*

/**
 * Implementation of UploadProgressService using Redis for storage and WebSocket for notifications
 */
@Service
class UploadProgressServiceImpl(
    private val messagingTemplate: SimpMessagingTemplate,
    private val redisTemplate: RedisTemplate<String, Any>
) : UploadProgressService {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    companion object {
        private const val PROGRESS_KEY_PREFIX = "upload_progress:"
        private val PROGRESS_EXPIRY = Duration.ofHours(1) // Progress data expires after 1 hour
    }
    
    override fun getProgress(documentId: UUID): UploadProgressDto? {
        val key = buildProgressKey(documentId)
        return try {
            redisTemplate.opsForValue().get(key) as? UploadProgressDto
        } catch (e: Exception) {
            logger.error("Failed to get upload progress for document: $documentId", e)
            null
        }
    }
    
    override fun notifyProgress(userId: String, progress: UploadProgressDto) {
        try {
            // Store progress in Redis
            storeProgress(progress.documentId, progress)
            
            // Send progress update to user via WebSocket
            messagingTemplate.convertAndSendToUser(
                userId,
                "/queue/upload-progress",
                progress
            )
            
            logger.debug("Progress notification sent to user: $userId for document: ${progress.documentId}")
        } catch (e: Exception) {
            logger.error("Failed to notify upload progress for user: $userId, document: ${progress.documentId}", e)
        }
    }
    
    override fun storeProgress(documentId: UUID, progress: UploadProgressDto) {
        val key = buildProgressKey(documentId)
        try {
            redisTemplate.opsForValue().set(key, progress, PROGRESS_EXPIRY)
            logger.debug("Progress stored for document: $documentId")
        } catch (e: Exception) {
            logger.error("Failed to store upload progress for document: $documentId", e)
        }
    }
    
    override fun removeProgress(documentId: UUID) {
        val key = buildProgressKey(documentId)
        try {
            redisTemplate.delete(key)
            logger.debug("Progress removed for document: $documentId")
        } catch (e: Exception) {
            logger.error("Failed to remove upload progress for document: $documentId", e)
        }
    }
    
    /**
     * Build Redis key for progress storage
     */
    private fun buildProgressKey(documentId: UUID): String {
        return "$PROGRESS_KEY_PREFIX$documentId"
    }
}