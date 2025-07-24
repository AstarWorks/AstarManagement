/**
 * Audit Module for Aster Management
 * 
 * This module provides comprehensive audit logging capabilities for the application.
 * It follows Spring Modulith principles with clear separation between:
 * 
 * - api: Public interfaces and event definitions
 * - domain: Core entities and repositories  
 * - infrastructure: Implementation details and event processing
 * 
 * Public API:
 * - AuditEventPublisher: Interface for publishing audit events
 * - AuditEvent: Sealed class hierarchy for type-safe events
 * - AuditEventType: Enumeration of all supported event types
 * 
 * @since 1.0.0
 */
package dev.ryuzu.astermanagement.modules.audit