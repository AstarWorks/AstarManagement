package dev.ryuzu.astermanagement.config

import dev.ryuzu.astermanagement.service.base.BaseService
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.domain.AuditorAware
import org.springframework.data.jpa.repository.config.EnableJpaAuditing
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import java.util.*
import java.util.concurrent.Executor
import java.util.concurrent.ThreadPoolExecutor

/**
 * Enhanced audit configuration for comprehensive audit logging system
 * Extends the basic JPA auditing with advanced features for compliance and performance
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "enhancedAuditorProvider")
@EnableAsync
class EnhancedAuditConfiguration : BaseService() {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    /**
     * Enhanced auditor provider that extracts user information from Spring Security context
     * Supports both UUID-based and username-based authentication
     */
    @Bean("enhancedAuditorProvider")
    fun enhancedAuditorProvider(): AuditorAware<UUID> {
        return AuditorAware {
            try {
                val authentication: Authentication? = SecurityContextHolder.getContext().authentication
                
                when {
                    authentication == null -> {
                        logger.debug("No authentication context found, using system user")
                        Optional.of(getSystemUserId())
                    }
                    !authentication.isAuthenticated -> {
                        logger.debug("User not authenticated, using anonymous user")
                        Optional.of(getAnonymousUserId())
                    }
                    authentication.name == "anonymousUser" -> {
                        logger.debug("Anonymous user detected")
                        Optional.of(getAnonymousUserId())
                    }
                    else -> {
                        // Try to extract UUID from authentication
                        extractUserIdFromAuthentication(authentication)
                    }
                }
            } catch (e: Exception) {
                logger.warn("Error extracting auditor information: ${e.message}")
                Optional.of(getSystemUserId())
            }
        }
    }
    
    /**
     * Extracts user ID from authentication object with multiple fallback strategies
     */
    private fun extractUserIdFromAuthentication(authentication: Authentication): Optional<UUID> {
        return try {
            // Strategy 1: Direct UUID from name
            when {
                authentication.name.matches(Regex("^[0-9a-fA-F-]{36}$")) -> {
                    Optional.of(UUID.fromString(authentication.name))
                }
                // Strategy 2: Extract from principal if it's a UserDetails-like object
                authentication.principal is Map<*, *> -> {
                    val principal = authentication.principal as Map<*, *>
                    val userId = principal["id"] ?: principal["userId"]
                    if (userId is String) {
                        Optional.of(UUID.fromString(userId))
                    } else {
                        // Fallback: Create deterministic UUID from username
                        Optional.of(UUID.nameUUIDFromBytes(authentication.name.toByteArray()))
                    }
                }
                // Strategy 3: Use current user ID from base service if available
                getCurrentUserId() != null -> {
                    Optional.of(getCurrentUserId()!!)
                }
                // Strategy 4: Create deterministic UUID from username
                else -> {
                    logger.debug("Creating deterministic UUID for username: ${authentication.name}")
                    Optional.of(UUID.nameUUIDFromBytes(authentication.name.toByteArray()))
                }
            }
        } catch (e: Exception) {
            logger.warn("Failed to extract user ID from authentication: ${e.message}")
            Optional.of(getSystemUserId())
        }
    }
    
    /**
     * Task executor for asynchronous audit processing
     * Configured to handle high-volume audit events without blocking main threads
     */
    @Bean("auditTaskExecutor")
    fun auditTaskExecutor(): Executor {
        val executor = ThreadPoolTaskExecutor()
        executor.corePoolSize = 3
        executor.maxPoolSize = 15
        executor.queueCapacity = 500
        executor.setThreadNamePrefix("audit-")
        executor.setRejectedExecutionHandler(ThreadPoolExecutor.CallerRunsPolicy())
        executor.setAwaitTerminationSeconds(30)
        executor.initialize()
        
        logger.info("Configured audit task executor: core={}, max={}, queue={}", 
            executor.corePoolSize, executor.maxPoolSize, executor.queueCapacity)
        
        return executor
    }
    
    /**
     * Task executor for audit cleanup operations
     * Separate executor for maintenance tasks to avoid interfering with regular audit processing
     */
    @Bean("auditCleanupExecutor")
    fun auditCleanupExecutor(): Executor {
        val executor = ThreadPoolTaskExecutor()
        executor.corePoolSize = 1
        executor.maxPoolSize = 3
        executor.queueCapacity = 100
        executor.setThreadNamePrefix("audit-cleanup-")
        executor.setRejectedExecutionHandler(ThreadPoolExecutor.CallerRunsPolicy())
        executor.setAwaitTerminationSeconds(60)
        executor.initialize()
        
        logger.info("Configured audit cleanup executor: core={}, max={}", 
            executor.corePoolSize, executor.maxPoolSize)
        
        return executor
    }
    
    /**
     * Audit context provider for extracting request-specific information
     */
    @Bean
    fun auditContextProvider(): AuditContextProvider {
        return AuditContextProvider()
    }
    
    companion object {
        /**
         * System user UUID for automated operations
         */
        private val SYSTEM_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001")
        
        /**
         * Anonymous user UUID for unauthenticated operations
         */
        private val ANONYMOUS_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000002")
        
        fun getSystemUserId(): UUID = SYSTEM_USER_ID
        fun getAnonymousUserId(): UUID = ANONYMOUS_USER_ID
    }
}

/**
 * Provides audit context information from HTTP requests
 * Extracts IP address, user agent, session ID, and other request metadata
 */
open class AuditContextProvider {
    
    private val logger = LoggerFactory.getLogger(javaClass)
    
    /**
     * Extracts comprehensive audit context from current HTTP request
     */
    fun getCurrentContext(): AuditContext {
        return try {
            val requestAttributes = RequestContextHolder.getRequestAttributes() as? ServletRequestAttributes
            val request = requestAttributes?.request
            
            AuditContext(
                ipAddress = extractClientIpAddress(request),
                userAgent = request?.getHeader("User-Agent") ?: "Unknown",
                sessionId = request?.session?.id,
                requestId = request?.getHeader("X-Request-ID") ?: generateRequestId(),
                requestUri = request?.requestURI,
                httpMethod = request?.method,
                referer = request?.getHeader("Referer"),
                userLanguage = request?.locale?.toString()
            )
        } catch (e: Exception) {
            logger.debug("Could not extract full audit context: ${e.message}")
            AuditContext()
        }
    }
    
    /**
     * Extracts client IP address with proxy support
     */
    private fun extractClientIpAddress(request: jakarta.servlet.http.HttpServletRequest?): String? {
        if (request == null) return null
        
        // Check common proxy headers in order of preference
        val proxyHeaders = listOf(
            "X-Forwarded-For",
            "X-Real-IP", 
            "X-Cluster-Client-IP",
            "X-Forwarded",
            "Forwarded-For",
            "Forwarded"
        )
        
        for (header in proxyHeaders) {
            val ip = request.getHeader(header)
            if (!ip.isNullOrBlank() && !"unknown".equals(ip, ignoreCase = true)) {
                // X-Forwarded-For can contain multiple IPs, take the first one
                return ip.split(",")[0].trim()
            }
        }
        
        return request.remoteAddr
    }
    
    /**
     * Generates a unique request ID for correlation
     */
    private fun generateRequestId(): String {
        return UUID.randomUUID().toString().substring(0, 8)
    }
}

/**
 * Data class containing audit context information
 */
data class AuditContext(
    val ipAddress: String? = null,
    val userAgent: String = "Unknown",
    val sessionId: String? = null,
    val requestId: String? = null,
    val requestUri: String? = null,
    val httpMethod: String? = null,
    val referer: String? = null,
    val userLanguage: String? = null
) {
    /**
     * Converts audit context to a map for JSON storage
     */
    fun toMap(): Map<String, Any?> {
        return mapOf(
            "ipAddress" to ipAddress,
            "userAgent" to userAgent,
            "sessionId" to sessionId,
            "requestId" to requestId,
            "requestUri" to requestUri,
            "httpMethod" to httpMethod,
            "referer" to referer,
            "userLanguage" to userLanguage
        ).filterValues { it != null }
    }
}

/**
 * Custom exception handler for audit configuration errors
 */
class AuditConfigurationException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)