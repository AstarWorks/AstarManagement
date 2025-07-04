/**
 * Matter Module for Legal Case Management
 * 
 * This module provides comprehensive matter management capabilities for legal case workflow,
 * including CRUD operations, status transition management, and Kanban workflow support.
 * 
 * Public API:
 * - {@link dev.ryuzu.astermanagement.modules.matter.api.MatterService} - Core matter operations
 * - {@link dev.ryuzu.astermanagement.modules.matter.api.MatterEvents} - Event definitions for inter-module communication
 * - {@link dev.ryuzu.astermanagement.modules.matter.api.dto.MatterDTO} - Data transfer objects
 * 
 * The module follows Spring Modulith conventions with clear separation between:
 * - api: Public interfaces and DTOs accessible to other modules
 * - domain: Internal domain entities and repositories
 * - infrastructure: Implementation details and external interface adaptations
 * 
 * @since 1.0.0
 */
package dev.ryuzu.astermanagement.modules.matter;