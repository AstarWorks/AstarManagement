package dev.ryuzu.astermanagement.security.session.controller

import dev.ryuzu.astermanagement.security.session.exception.SessionNotFoundException
import dev.ryuzu.astermanagement.security.session.model.SessionStatistics
import dev.ryuzu.astermanagement.security.session.service.*
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

/**
 * REST controller for session management operations.
 * Provides endpoints for users to view and manage their active sessions.
 */
@RestController
@RequestMapping("/api/sessions")
class SessionController(
    private val sessionService: SessionService
) {
    
    companion object {
        private val logger = LoggerFactory.getLogger(SessionController::class.java)
    }
    
    /**
     * List all active sessions for the authenticated user.
     */
    @GetMapping
    fun listMySessions(authentication: Authentication): ResponseEntity<List<SessionInfo>> {
        logger.debug("Listing sessions for user: {}", authentication.name)
        
        return try {
            val userId = authentication.name
            val sessions = sessionService.listUserSessions(userId)
            
            ResponseEntity.ok(sessions)
        } catch (exception: Exception) {
            logger.error("Failed to list sessions for user: {}", authentication.name, exception)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }
    
    /**
     * Get detailed information about a specific session.
     */
    @GetMapping("/{sessionId}")
    fun getSessionDetails(
        @PathVariable sessionId: String,
        authentication: Authentication
    ): ResponseEntity<SessionDetails> {
        logger.debug("Getting session details: {} for user: {}", sessionId, authentication.name)
        
        return try {
            val userId = authentication.name
            val sessionDetails = sessionService.getSessionDetails(sessionId, userId)
                ?: return ResponseEntity.notFound().build()
            
            ResponseEntity.ok(sessionDetails)
        } catch (exception: SessionNotFoundException) {
            ResponseEntity.notFound().build()
        } catch (exception: Exception) {
            logger.error("Failed to get session details: {}", sessionId, exception)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }
    
    /**
     * Invalidate a specific session.
     */
    @DeleteMapping("/{sessionId}")
    fun invalidateSession(
        @PathVariable sessionId: String,
        authentication: Authentication,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any>> {
        logger.info("Invalidating session: {} for user: {}", sessionId, authentication.name)
        
        return try {
            val userId = authentication.name
            
            // Verify session belongs to user
            val sessionDetails = sessionService.getSessionDetails(sessionId, userId)
                ?: return ResponseEntity.notFound().build()
            
            val invalidated = sessionService.invalidateSession(
                sessionId, 
                "User requested invalidation from ${request.remoteAddr}"
            )
            
            if (invalidated) {
                ResponseEntity.ok(mapOf(
                    "message" to "Session invalidated successfully",
                    "sessionId" to sessionId
                ))
            } else {
                ResponseEntity.status(HttpStatus.CONFLICT).body(mapOf(
                    "error" to "Failed to invalidate session",
                    "sessionId" to sessionId
                ))
            }
        } catch (exception: Exception) {
            logger.error("Failed to invalidate session: {}", sessionId, exception)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf(
                "error" to "Internal server error",
                "message" to (exception.message ?: "Unknown error")
            ))
        }
    }
    
    /**
     * Invalidate all sessions for the authenticated user.
     */
    @PostMapping("/invalidate-all")
    fun invalidateAllSessions(
        @RequestParam(required = false, defaultValue = "true") exceptCurrent: Boolean,
        authentication: Authentication,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any>> {
        logger.info("Invalidating all sessions for user: {} (except current: {})", 
            authentication.name, exceptCurrent)
        
        return try {
            val userId = authentication.name
            val currentSessionId = request.getHeader("X-Auth-Token")
            
            val invalidatedCount = if (exceptCurrent && currentSessionId != null) {
                sessionService.invalidateOtherUserSessions(
                    userId, 
                    currentSessionId, 
                    "User requested invalidation of other sessions from ${request.remoteAddr}"
                )
            } else {
                sessionService.invalidateAllUserSessions(
                    userId, 
                    "User requested invalidation of all sessions from ${request.remoteAddr}"
                )
            }
            
            ResponseEntity.ok(mapOf(
                "message" to "Sessions invalidated successfully",
                "invalidatedCount" to invalidatedCount,
                "exceptCurrent" to exceptCurrent
            ))
        } catch (exception: Exception) {
            logger.error("Failed to invalidate all sessions for user: {}", authentication.name, exception)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf(
                "error" to "Internal server error",
                "message" to (exception.message ?: "Unknown error")
            ))
        }
    }
    
    /**
     * Refresh the current session.
     */
    @PostMapping("/refresh")
    fun refreshCurrentSession(
        authentication: Authentication,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any>> {
        val sessionId = request.getHeader("X-Auth-Token")
            ?: return ResponseEntity.badRequest().body(mapOf(
                "error" to "No session token provided"
            ))
        
        logger.debug("Refreshing session: {} for user: {}", sessionId, authentication.name)
        
        return try {
            val refreshedSession = sessionService.refreshSession(sessionId)
            
            if (refreshedSession != null) {
                ResponseEntity.ok(mapOf(
                    "message" to "Session refreshed successfully",
                    "sessionId" to sessionId,
                    "expiresAt" to refreshedSession.expiresAt
                ))
            } else {
                ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf(
                    "error" to "Session not found or invalid",
                    "sessionId" to sessionId
                ))
            }
        } catch (exception: Exception) {
            logger.error("Failed to refresh session: {}", sessionId, exception)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf(
                "error" to "Internal server error",
                "message" to (exception.message ?: "Unknown error")
            ))
        }
    }
    
    /**
     * Get session activity for the authenticated user.
     */
    @GetMapping("/activity")
    fun getSessionActivity(
        @RequestParam(required = false, defaultValue = "30") days: Int,
        authentication: Authentication
    ): ResponseEntity<SessionActivity> {
        logger.debug("Getting session activity for user: {} over {} days", authentication.name, days)
        
        return try {
            val userId = authentication.name
            val activity = sessionService.getUserSessionActivity(userId, days)
            
            ResponseEntity.ok(activity)
        } catch (exception: Exception) {
            logger.error("Failed to get session activity for user: {}", authentication.name, exception)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }
    
    /**
     * Validate current session (health check endpoint).
     */
    @GetMapping("/validate")
    fun validateCurrentSession(
        authentication: Authentication,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any>> {
        val sessionId = request.getHeader("X-Auth-Token")
            ?: return ResponseEntity.badRequest().body(mapOf(
                "error" to "No session token provided"
            ))
        
        return try {
            val session = sessionService.validateSession(sessionId)
            
            if (session != null) {
                ResponseEntity.ok(mapOf(
                    "valid" to true,
                    "sessionId" to sessionId,
                    "userId" to session.userId,
                    "expiresAt" to session.expiresAt,
                    "lastAccessedAt" to session.lastAccessedAt
                ))
            } else {
                ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf(
                    "valid" to false,
                    "error" to "Session is invalid or expired"
                ))
            }
        } catch (exception: Exception) {
            logger.error("Failed to validate session: {}", sessionId, exception)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf(
                "error" to "Internal server error",
                "message" to (exception.message ?: "Unknown error")
            ))
        }
    }
    
    /**
     * Administrative endpoint to get session statistics.
     */
    @GetMapping("/admin/statistics")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('MANAGE_SESSIONS')")
    fun getSessionStatistics(): ResponseEntity<SessionStatistics> {
        logger.debug("Getting session statistics (admin request)")
        
        return try {
            val statistics = sessionService.getSessionStatistics()
            ResponseEntity.ok(statistics)
        } catch (exception: Exception) {
            logger.error("Failed to get session statistics", exception)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }
    
    /**
     * Administrative endpoint to perform session maintenance.
     */
    @PostMapping("/admin/maintenance")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('MANAGE_SESSIONS')")
    fun performSessionMaintenance(): ResponseEntity<Map<String, Any>> {
        logger.info("Performing session maintenance (admin request)")
        
        return try {
            val cleanedUp = sessionService.performSessionMaintenance()
            
            ResponseEntity.ok(mapOf(
                "message" to "Session maintenance completed",
                "expiredSessionsCleaned" to cleanedUp
            ))
        } catch (exception: Exception) {
            logger.error("Failed to perform session maintenance", exception)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf(
                "error" to "Internal server error",
                "message" to (exception.message ?: "Unknown error")
            ))
        }
    }
}