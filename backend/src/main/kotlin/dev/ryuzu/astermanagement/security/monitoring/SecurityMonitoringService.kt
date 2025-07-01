package dev.ryuzu.astermanagement.security.monitoring

import dev.ryuzu.astermanagement.security.audit.RiskLevel
import dev.ryuzu.astermanagement.security.audit.SecurityEventType
import java.time.Duration
import java.time.Instant

/**
 * Service for security monitoring and alerting
 */
interface SecurityMonitoringService {
    
    /**
     * Get security dashboard metrics
     */
    fun getSecurityDashboard(timeRange: Duration = Duration.ofHours(24)): SecurityDashboard
    
    /**
     * Get real-time security alerts
     */
    fun getActiveAlerts(): List<SecurityAlert>
    
    /**
     * Get security event trends
     */
    fun getSecurityTrends(timeRange: Duration = Duration.ofDays(7)): SecurityTrends
    
    /**
     * Check for anomalous activity
     */
    fun detectAnomalies(): List<SecurityAnomaly>
    
    /**
     * Get threat intelligence summary
     */
    fun getThreatIntelligence(): ThreatIntelligence
    
    /**
     * Generate security report
     */
    fun generateSecurityReport(timeRange: Duration): SecurityReport
}

/**
 * Security dashboard data
 */
data class SecurityDashboard(
    val timeRange: Duration,
    val totalEvents: Long,
    val criticalEvents: Long,
    val highRiskEvents: Long,
    val activeThreats: Int,
    val failedLogins: Long,
    val blockedIps: Int,
    val lockedAccounts: Int,
    val suspiciousActivity: Long,
    val eventsByType: Map<SecurityEventType, Long>,
    val eventsByRisk: Map<RiskLevel, Long>,
    val topAttackedEndpoints: List<EndpointAttackSummary>,
    val topAttackingIPs: List<IPAttackSummary>,
    val recentAlerts: List<SecurityAlert>,
    val systemHealth: SecuritySystemHealth,
    val complianceStatus: ComplianceStatus
)

/**
 * Security alert information
 */
data class SecurityAlert(
    val id: String,
    val type: AlertType,
    val severity: AlertSeverity,
    val title: String,
    val description: String,
    val timestamp: Instant,
    val source: String,
    val metadata: Map<String, Any>,
    val acknowledged: Boolean = false,
    val acknowledgedBy: String? = null,
    val acknowledgedAt: Instant? = null,
    val resolved: Boolean = false,
    val resolvedAt: Instant? = null
)

/**
 * Security trends over time
 */
data class SecurityTrends(
    val timeRange: Duration,
    val eventTrends: Map<SecurityEventType, List<TimeSeriesPoint>>,
    val riskTrends: Map<RiskLevel, List<TimeSeriesPoint>>,
    val authenticationTrends: AuthenticationTrends,
    val anomalyDetection: AnomalyDetectionResults
)

/**
 * Security anomaly detected by monitoring
 */
data class SecurityAnomaly(
    val id: String,
    val type: AnomalyType,
    val severity: AnomalySeverity,
    val description: String,
    val detectedAt: Instant,
    val affectedResource: String,
    val metrics: Map<String, Double>,
    val threshold: Double,
    val actualValue: Double,
    val confidence: Double,
    val actionTaken: String? = null
)

/**
 * Threat intelligence summary
 */
data class ThreatIntelligence(
    val threatLevel: ThreatLevel,
    val activeCampaigns: List<ThreatCampaign>,
    val suspiciousIPs: List<SuspiciousIP>,
    val malwareSignatures: List<MalwareSignature>,
    val vulnerabilityAlerts: List<VulnerabilityAlert>,
    val lastUpdated: Instant
)

/**
 * Comprehensive security report
 */
data class SecurityReport(
    val reportId: String,
    val generatedAt: Instant,
    val timeRange: Duration,
    val summary: SecuritySummary,
    val incidentAnalysis: List<IncidentAnalysis>,
    val riskAssessment: RiskAssessment,
    val recommendations: List<SecurityRecommendation>,
    val complianceCheck: ComplianceReport
)

// Supporting data classes

data class EndpointAttackSummary(
    val endpoint: String,
    val attackCount: Long,
    val uniqueAttackers: Int,
    val attackTypes: Map<String, Long>
)

data class IPAttackSummary(
    val ipAddress: String,
    val attackCount: Long,
    val attackTypes: Map<String, Long>,
    val isBlocked: Boolean,
    val riskScore: Int,
    val geolocation: String? = null
)

data class SecuritySystemHealth(
    val overallStatus: SystemStatus,
    val authenticationSystem: ComponentStatus,
    val auditingSystem: ComponentStatus,
    val rateLimitingSystem: ComponentStatus,
    val monitoringSystem: ComponentStatus,
    val lastHealthCheck: Instant
)

data class ComplianceStatus(
    val gdprCompliant: Boolean,
    val dataRetentionCompliant: Boolean,
    val auditLogIntegrity: Boolean,
    val encryptionCompliant: Boolean,
    val accessControlCompliant: Boolean,
    val overallScore: Double
)

data class TimeSeriesPoint(
    val timestamp: Instant,
    val value: Long
)

data class AuthenticationTrends(
    val successRate: Double,
    val failureRate: Double,
    val twoFactorUsage: Double,
    val peakHours: List<Int>,
    val geographicDistribution: Map<String, Long>
)

data class AnomalyDetectionResults(
    val anomaliesDetected: Int,
    val falsePositiveRate: Double,
    val modelAccuracy: Double,
    val lastModelUpdate: Instant
)

data class ThreatCampaign(
    val id: String,
    val name: String,
    val description: String,
    val severity: ThreatSeverity,
    val indicators: List<String>,
    val firstSeen: Instant,
    val lastSeen: Instant
)

data class SuspiciousIP(
    val ipAddress: String,
    val riskScore: Int,
    val reasons: List<String>,
    val firstSeen: Instant,
    val lastActivity: Instant,
    val activityCount: Long
)

data class MalwareSignature(
    val id: String,
    val name: String,
    val type: String,
    val severity: ThreatSeverity,
    val signatures: List<String>,
    val lastUpdated: Instant
)

data class VulnerabilityAlert(
    val cveId: String,
    val severity: VulnerabilitySeverity,
    val description: String,
    val affectedComponents: List<String>,
    val patchAvailable: Boolean,
    val publishedAt: Instant
)

data class SecuritySummary(
    val totalIncidents: Int,
    val resolvedIncidents: Int,
    val openIncidents: Int,
    val averageResolutionTime: Duration,
    val riskTrend: RiskTrend,
    val topThreats: List<String>
)

data class IncidentAnalysis(
    val incidentId: String,
    val type: IncidentType,
    val severity: IncidentSeverity,
    val description: String,
    val timeline: List<IncidentEvent>,
    val rootCause: String,
    val impact: String,
    val resolution: String
)

data class RiskAssessment(
    val overallRiskLevel: RiskLevel,
    val riskFactors: Map<String, Double>,
    val mitigationStrategies: List<String>,
    val residualRisk: Double
)

data class SecurityRecommendation(
    val id: String,
    val priority: RecommendationPriority,
    val title: String,
    val description: String,
    val category: RecommendationCategory,
    val implementation: String,
    val estimatedEffort: String,
    val riskReduction: Double
)

data class ComplianceReport(
    val frameworks: Map<String, ComplianceFrameworkStatus>,
    val gaps: List<ComplianceGap>,
    val recommendations: List<ComplianceRecommendation>
)

data class ComponentStatus(
    val status: SystemStatus,
    val lastCheck: Instant,
    val uptime: Duration,
    val errorRate: Double,
    val performance: PerformanceMetrics
)

data class PerformanceMetrics(
    val responseTime: Duration,
    val throughput: Double,
    val errorCount: Long,
    val availability: Double
)

data class IncidentEvent(
    val timestamp: Instant,
    val event: String,
    val details: String,
    val source: String
)

data class ComplianceFrameworkStatus(
    val framework: String,
    val compliant: Boolean,
    val score: Double,
    val lastAssessment: Instant
)

data class ComplianceGap(
    val requirement: String,
    val description: String,
    val severity: GapSeverity,
    val remediation: String
)

data class ComplianceRecommendation(
    val requirement: String,
    val action: String,
    val priority: RecommendationPriority,
    val deadline: Instant?
)

// Enums

enum class AlertType {
    AUTHENTICATION_ANOMALY,
    BRUTE_FORCE_ATTACK,
    SUSPICIOUS_ACTIVITY,
    SYSTEM_COMPROMISE,
    DATA_BREACH,
    CONFIGURATION_CHANGE,
    VULNERABILITY_DETECTED,
    COMPLIANCE_VIOLATION
}

enum class AlertSeverity {
    LOW, MEDIUM, HIGH, CRITICAL
}

enum class AnomalyType {
    STATISTICAL_OUTLIER,
    BEHAVIORAL_ANOMALY,
    FREQUENCY_ANOMALY,
    PATTERN_DEVIATION,
    THRESHOLD_BREACH
}

enum class AnomalySeverity {
    MINOR, MODERATE, MAJOR, CRITICAL
}

enum class ThreatLevel {
    LOW, ELEVATED, HIGH, SEVERE
}

enum class ThreatSeverity {
    INFO, LOW, MEDIUM, HIGH, CRITICAL
}

enum class VulnerabilitySeverity {
    LOW, MEDIUM, HIGH, CRITICAL
}

enum class SystemStatus {
    HEALTHY, WARNING, CRITICAL, OFFLINE
}

enum class RiskTrend {
    DECREASING, STABLE, INCREASING
}

enum class IncidentType {
    SECURITY_BREACH,
    AUTHENTICATION_FAILURE,
    UNAUTHORIZED_ACCESS,
    DATA_LOSS,
    SYSTEM_COMPROMISE,
    MALWARE_DETECTION,
    POLICY_VIOLATION
}

enum class IncidentSeverity {
    LOW, MEDIUM, HIGH, CRITICAL
}

enum class RecommendationPriority {
    LOW, MEDIUM, HIGH, URGENT
}

enum class RecommendationCategory {
    AUTHENTICATION,
    AUTHORIZATION,
    DATA_PROTECTION,
    MONITORING,
    COMPLIANCE,
    INFRASTRUCTURE,
    TRAINING
}

enum class GapSeverity {
    MINOR, MODERATE, MAJOR, CRITICAL
}