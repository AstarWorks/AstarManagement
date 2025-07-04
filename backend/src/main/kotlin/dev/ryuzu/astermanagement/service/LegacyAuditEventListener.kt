package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.modules.audit.infrastructure.AuditEventListener as AuditEventListenerImpl
import org.springframework.stereotype.Component

/**
 * Legacy audit event listener - replaced by module implementation
 * This class is kept for backward compatibility but is no longer active
 * The actual implementation is now in modules.audit.infrastructure.AuditEventListener
 * @deprecated Replaced by Spring Modulith audit module
 */
@Component
@Deprecated("Replaced by dev.ryuzu.astermanagement.modules.audit.infrastructure.AuditEventListener")
class LegacyAuditEventListener {
    // This class intentionally left empty - functionality moved to audit module
}