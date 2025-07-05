package dev.ryuzu.astermanagement.service.security

import dev.ryuzu.astermanagement.modules.document.domain.Document
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.security.audit.impl.SecurityAuditLogger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.util.regex.Pattern

/**
 * Data Loss Prevention (DLP) service for detecting and preventing sensitive data exposure
 * Provides content analysis, sensitive data detection, and policy enforcement
 */
@Service
class DocumentDLPService(
    private val securityAuditLogger: SecurityAuditLogger,
    @Value("\${app.dlp.enabled:true}") private val dlpEnabled: Boolean,
    @Value("\${app.dlp.strict-mode:false}") private val strictMode: Boolean
) {
    
    private val logger = LoggerFactory.getLogger(DocumentDLPService::class.java)
    
    // Regex patterns for sensitive data detection
    private val patterns = mapOf(
        "CREDIT_CARD" to Pattern.compile(
            "(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})"
        ),
        "SSN" to Pattern.compile(
            "\\b(?!000|666|9\\d{2})\\d{3}[-\\s]?(?!00)\\d{2}[-\\s]?(?!0{4})\\d{4}\\b"
        ),
        "EMAIL" to Pattern.compile(
            "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"
        ),
        "PHONE" to Pattern.compile(
            "(?:\\+?1[-\\s]?)?\\(?([0-9]{3})\\)?[-\\s]?([0-9]{3})[-\\s]?([0-9]{4})"
        ),
        "JAPANESE_PHONE" to Pattern.compile(
            "0\\d{1,4}-\\d{1,4}-\\d{4}|0\\d{9,10}"
        ),
        "BANK_ACCOUNT" to Pattern.compile(
            "\\b\\d{8,12}\\b"
        ),
        "LEGAL_CASE_NUMBER" to Pattern.compile(
            "(?i)case\\s*(?:no\\.?|number)?\\s*:?\\s*([A-Z0-9-]+)"
        ),
        "ATTORNEY_CLIENT_PRIVILEGE" to Pattern.compile(
            "(?i)(attorney[\\s-]?client\\s+privilege|confidential\\s+communication|privileged\\s+and\\s+confidential)"
        ),
        "JAPANESE_PERSONAL_NUMBER" to Pattern.compile(
            "\\b\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}\\b"
        )
    )
    
    private val sensitiveKeywords = setOf(
        // Legal terms
        "confidential", "privileged", "attorney-client", "work product",
        "settlement", "litigation", "deposition", "discovery",
        // Financial terms  
        "salary", "income", "financial", "bank account", "credit card",
        "social security", "tax return", "investment",
        // Personal information
        "medical record", "health information", "personal information",
        "passport", "driver license", "birth certificate",
        // Japanese legal terms
        "秘密", "機密", "弁護士依頼者間", "和解", "訴訟"
    )
    
    /**
     * Analyze document content for sensitive data and policy violations
     */
    fun analyzeDocument(document: Document, user: User): DLPAnalysisResult {
        if (!dlpEnabled) {
            return DLPAnalysisResult.clean()
        }
        
        try {
            val content = extractTextContent(document)
            val violations = mutableListOf<DLPViolation>()
            
            // Check for sensitive data patterns
            violations.addAll(detectSensitivePatterns(content))
            
            // Check for sensitive keywords
            violations.addAll(detectSensitiveKeywords(content))
            
            // Check document metadata
            violations.addAll(analyzeDocumentMetadata(document))
            
            // Calculate risk score
            val riskScore = calculateRiskScore(violations)
            val riskLevel = determineRiskLevel(riskScore)
            
            val result = DLPAnalysisResult(
                documentId = document.id!!.toString(),
                violations = violations,
                riskScore = riskScore,
                riskLevel = riskLevel,
                isClean = violations.isEmpty(),
                requiresReview = riskLevel >= DLPRiskLevel.HIGH,
                blockAccess = strictMode && riskLevel >= DLPRiskLevel.CRITICAL
            )
            
            // Log DLP analysis
            logDLPAnalysis(document, user, result)
            
            return result
            
        } catch (e: Exception) {
            logger.error("Failed to analyze document ${document.id} for DLP violations", e)
            return DLPAnalysisResult.error("Analysis failed: ${e.message}")
        }
    }
    
    /**
     * Check if document sharing should be blocked based on DLP policies
     */
    fun shouldBlockSharing(document: Document, user: User, targetEmail: String?): Boolean {
        val analysisResult = analyzeDocument(document, user)
        
        if (analysisResult.blockAccess) {
            logDLPBlocking(document, user, "SHARING_BLOCKED", "High risk content detected")
            return true
        }
        
        // Check if sharing externally with sensitive content
        if (targetEmail != null && !isInternalEmail(targetEmail)) {
            val hasHighRiskContent = analysisResult.violations.any { 
                it.severity >= DLPViolationSeverity.HIGH 
            }
            
            if (hasHighRiskContent) {
                logDLPBlocking(document, user, "EXTERNAL_SHARING_BLOCKED", "Sensitive content detected for external sharing")
                return true
            }
        }
        
        return false
    }
    
    /**
     * Apply content filtering and redaction to document text
     */
    fun applyContentFiltering(content: String, violations: List<DLPViolation>): String {
        var filteredContent = content
        
        violations.forEach { violation ->
            when (violation.type) {
                DLPViolationType.CREDIT_CARD -> {
                    filteredContent = filteredContent.replace(
                        violation.pattern!!.toRegex(),
                        "[CREDIT CARD NUMBER REDACTED]"
                    )
                }
                DLPViolationType.SSN -> {
                    filteredContent = filteredContent.replace(
                        violation.pattern!!.toRegex(),
                        "[SSN REDACTED]"
                    )
                }
                DLPViolationType.EMAIL -> {
                    if (violation.severity >= DLPViolationSeverity.MEDIUM) {
                        filteredContent = filteredContent.replace(
                            violation.pattern!!.toRegex(),
                            "[EMAIL REDACTED]"
                        )
                    }
                }
                DLPViolationType.PHONE -> {
                    filteredContent = filteredContent.replace(
                        violation.pattern!!.toRegex(),
                        "[PHONE NUMBER REDACTED]"
                    )
                }
                else -> {
                    // For keyword violations, consider context-sensitive redaction
                    if (violation.severity >= DLPViolationSeverity.HIGH) {
                        violation.matches.forEach { match ->
                            filteredContent = filteredContent.replace(match, "[SENSITIVE CONTENT REDACTED]")
                        }
                    }
                }
            }
        }
        
        return filteredContent
    }
    
    /**
     * Create DLP policy for document classification
     */
    fun createDLPPolicy(
        name: String,
        description: String,
        patterns: List<String>,
        keywords: List<String>,
        severity: DLPViolationSeverity,
        action: DLPAction
    ): DLPPolicy {
        return DLPPolicy(
            name = name,
            description = description,
            patterns = patterns.map { Pattern.compile(it) },
            keywords = keywords.toSet(),
            severity = severity,
            action = action,
            enabled = true
        )
    }
    
    /**
     * Get DLP statistics for reporting
     */
    fun getDLPStatistics(): DLPStatistics {
        // This would typically query a database for DLP violation statistics
        return DLPStatistics(
            totalDocumentsScanned = 0,
            violationsDetected = 0,
            documentsBlocked = 0,
            highRiskDocuments = 0,
            mostCommonViolationType = DLPViolationType.EMAIL
        )
    }
    
    // Private helper methods
    
    private fun extractTextContent(document: Document): String {
        // Use existing extracted text or extract from document content
        return document.extractedText ?: document.description ?: document.title ?: ""
    }
    
    private fun detectSensitivePatterns(content: String): List<DLPViolation> {
        val violations = mutableListOf<DLPViolation>()
        
        patterns.forEach { (type, pattern) ->
            val matcher = pattern.matcher(content)
            val matches = mutableListOf<String>()
            
            while (matcher.find()) {
                matches.add(matcher.group())
            }
            
            if (matches.isNotEmpty()) {
                violations.add(
                    DLPViolation(
                        type = DLPViolationType.valueOf(type),
                        pattern = pattern.pattern(),
                        matches = matches,
                        severity = getSeverityForType(type),
                        description = getDescriptionForType(type),
                        location = "document_content"
                    )
                )
            }
        }
        
        return violations
    }
    
    private fun detectSensitiveKeywords(content: String): List<DLPViolation> {
        val violations = mutableListOf<DLPViolation>()
        val lowerContent = content.lowercase()
        
        val foundKeywords = sensitiveKeywords.filter { keyword ->
            lowerContent.contains(keyword.lowercase())
        }
        
        if (foundKeywords.isNotEmpty()) {
            violations.add(
                DLPViolation(
                    type = DLPViolationType.SENSITIVE_KEYWORD,
                    pattern = null,
                    matches = foundKeywords,
                    severity = DLPViolationSeverity.MEDIUM,
                    description = "Sensitive keywords detected",
                    location = "document_content"
                )
            )
        }
        
        return violations
    }
    
    private fun analyzeDocumentMetadata(document: Document): List<DLPViolation> {
        val violations = mutableListOf<DLPViolation>()
        
        // Check if document is marked as confidential
        if (document.isConfidential) {
            violations.add(
                DLPViolation(
                    type = DLPViolationType.CONFIDENTIAL_METADATA,
                    pattern = null,
                    matches = listOf("confidential_flag"),
                    severity = DLPViolationSeverity.HIGH,
                    description = "Document marked as confidential",
                    location = "metadata"
                )
            )
        }
        
        // Check for privileged tags
        if (document.hasTag("privileged") || document.hasTag("attorney-client")) {
            violations.add(
                DLPViolation(
                    type = DLPViolationType.PRIVILEGED_CONTENT,
                    pattern = null,
                    matches = document.getAllTagNames().filter { 
                        it.contains("privileged") || it.contains("attorney") 
                    }.toList(),
                    severity = DLPViolationSeverity.CRITICAL,
                    description = "Attorney-client privileged content",
                    location = "tags"
                )
            )
        }
        
        return violations
    }
    
    private fun calculateRiskScore(violations: List<DLPViolation>): Int {
        if (violations.isEmpty()) return 0
        
        val severityWeights = mapOf(
            DLPViolationSeverity.LOW to 10,
            DLPViolationSeverity.MEDIUM to 25,
            DLPViolationSeverity.HIGH to 50,
            DLPViolationSeverity.CRITICAL to 100
        )
        
        val totalScore = violations.sumOf { violation ->
            val baseScore = severityWeights[violation.severity] ?: 0
            val matchMultiplier = minOf(violation.matches.size, 5) // Cap at 5x
            baseScore * matchMultiplier
        }
        
        return minOf(totalScore, 1000) // Cap at 1000
    }
    
    private fun determineRiskLevel(riskScore: Int): DLPRiskLevel {
        return when {
            riskScore == 0 -> DLPRiskLevel.NONE
            riskScore <= 50 -> DLPRiskLevel.LOW
            riskScore <= 150 -> DLPRiskLevel.MEDIUM
            riskScore <= 300 -> DLPRiskLevel.HIGH
            else -> DLPRiskLevel.CRITICAL
        }
    }
    
    private fun getSeverityForType(type: String): DLPViolationSeverity {
        return when (type) {
            "CREDIT_CARD", "SSN", "BANK_ACCOUNT", "JAPANESE_PERSONAL_NUMBER" -> DLPViolationSeverity.CRITICAL
            "ATTORNEY_CLIENT_PRIVILEGE", "LEGAL_CASE_NUMBER" -> DLPViolationSeverity.HIGH
            "EMAIL", "PHONE", "JAPANESE_PHONE" -> DLPViolationSeverity.MEDIUM
            else -> DLPViolationSeverity.LOW
        }
    }
    
    private fun getDescriptionForType(type: String): String {
        return when (type) {
            "CREDIT_CARD" -> "Credit card number detected"
            "SSN" -> "Social Security Number detected"
            "EMAIL" -> "Email address detected"
            "PHONE", "JAPANESE_PHONE" -> "Phone number detected"
            "BANK_ACCOUNT" -> "Bank account number detected"
            "LEGAL_CASE_NUMBER" -> "Legal case number detected"
            "ATTORNEY_CLIENT_PRIVILEGE" -> "Attorney-client privileged content detected"
            "JAPANESE_PERSONAL_NUMBER" -> "Japanese personal number detected"
            else -> "Sensitive pattern detected"
        }
    }
    
    private fun isInternalEmail(email: String): Boolean {
        // Check if email belongs to the organization
        // This would typically check against a whitelist of internal domains
        val internalDomains = setOf("company.com", "organization.org") // Configure these
        val domain = email.substringAfter("@").lowercase()
        return internalDomains.contains(domain)
    }
    
    private fun logDLPAnalysis(document: Document, user: User, result: DLPAnalysisResult) {
        try {
            securityAuditLogger.logDataAccess(
                userId = user.id!!.toString(),
                resourceType = "DOCUMENT",
                resourceId = document.id!!.toString(),
                action = "DLP_ANALYSIS",
                ipAddress = "system",
                userAgent = null,
                additionalDetails = mapOf(
                    "violationCount" to result.violations.size,
                    "riskScore" to result.riskScore,
                    "riskLevel" to result.riskLevel.name,
                    "requiresReview" to result.requiresReview,
                    "blockAccess" to result.blockAccess,
                    "violationTypes" to result.violations.map { it.type.name }
                )
            )
        } catch (e: Exception) {
            logger.warn("Failed to log DLP analysis", e)
        }
    }
    
    private fun logDLPBlocking(document: Document, user: User, action: String, reason: String) {
        try {
            securityAuditLogger.logDataAccess(
                userId = user.id!!.toString(),
                resourceType = "DOCUMENT",
                resourceId = document.id!!.toString(),
                action = action,
                ipAddress = "system",
                userAgent = null,
                additionalDetails = mapOf(
                    "reason" to reason,
                    "dlpBlocked" to true
                )
            )
        } catch (e: Exception) {
            logger.warn("Failed to log DLP blocking", e)
        }
    }
}

// Data classes for DLP functionality

data class DLPAnalysisResult(
    val documentId: String,
    val violations: List<DLPViolation>,
    val riskScore: Int,
    val riskLevel: DLPRiskLevel,
    val isClean: Boolean,
    val requiresReview: Boolean,
    val blockAccess: Boolean,
    val errorMessage: String? = null
) {
    companion object {
        fun clean() = DLPAnalysisResult(
            documentId = "",
            violations = emptyList(),
            riskScore = 0,
            riskLevel = DLPRiskLevel.NONE,
            isClean = true,
            requiresReview = false,
            blockAccess = false
        )
        
        fun error(message: String) = DLPAnalysisResult(
            documentId = "",
            violations = emptyList(),
            riskScore = 0,
            riskLevel = DLPRiskLevel.NONE,
            isClean = false,
            requiresReview = true,
            blockAccess = false,
            errorMessage = message
        )
    }
}

data class DLPViolation(
    val type: DLPViolationType,
    val pattern: String?,
    val matches: List<String>,
    val severity: DLPViolationSeverity,
    val description: String,
    val location: String
)

enum class DLPViolationType {
    CREDIT_CARD,
    SSN,
    EMAIL,
    PHONE,
    JAPANESE_PHONE,
    BANK_ACCOUNT,
    LEGAL_CASE_NUMBER,
    ATTORNEY_CLIENT_PRIVILEGE,
    JAPANESE_PERSONAL_NUMBER,
    SENSITIVE_KEYWORD,
    CONFIDENTIAL_METADATA,
    PRIVILEGED_CONTENT
}

enum class DLPViolationSeverity {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}

enum class DLPRiskLevel {
    NONE,
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}

enum class DLPAction {
    LOG_ONLY,
    WARN,
    BLOCK,
    QUARANTINE
}

data class DLPPolicy(
    val name: String,
    val description: String,
    val patterns: List<Pattern>,
    val keywords: Set<String>,
    val severity: DLPViolationSeverity,
    val action: DLPAction,
    val enabled: Boolean
)

data class DLPStatistics(
    val totalDocumentsScanned: Long,
    val violationsDetected: Long,
    val documentsBlocked: Long,
    val highRiskDocuments: Long,
    val mostCommonViolationType: DLPViolationType
)