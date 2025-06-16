package dev.ryuzu.astermanagement.service.exception

import java.util.*

/**
 * Base class for all business-related exceptions
 */
abstract class BusinessException(
    message: String,
    cause: Throwable? = null
) : RuntimeException(message, cause)

/**
 * Exception thrown when a matter is not found
 */
class MatterNotFoundException(id: UUID) : BusinessException("Matter not found: $id")

/**
 * Exception thrown when an invalid status transition is attempted
 */
class InvalidStatusTransitionException(
    currentStatus: String,
    newStatus: String
) : BusinessException("Cannot transition from $currentStatus to $newStatus")

/**
 * Exception thrown when user has insufficient permissions
 */
class InsufficientPermissionException(message: String) : BusinessException(message)

/**
 * Exception thrown when validation fails
 */
class ValidationException(
    val field: String,
    message: String
) : BusinessException("Validation failed for field '$field': $message")

/**
 * Exception thrown when a business rule is violated
 */
class BusinessRuleViolationException(message: String) : BusinessException(message)

/**
 * Exception thrown when a resource already exists
 */
class ResourceAlreadyExistsException(resource: String, identifier: String) : 
    BusinessException("$resource already exists: $identifier")

// Enhanced Status Transition Exception Hierarchy

/**
 * Base exception for status transition failures
 */
open class StatusTransitionException(
    message: String,
    val errorCode: String,
    cause: Throwable? = null
) : BusinessException(message, cause)

/**
 * Exception for business rule violations in status transitions
 */
class StatusTransitionBusinessRuleViolationException(
    ruleName: String,
    message: String
) : StatusTransitionException(
    "Business rule violation in $ruleName: $message",
    "BUSINESS_RULE_VIOLATION"
)

/**
 * Exception when transition reason is required but not provided
 */
class TransitionReasonRequiredException(
    status: String
) : StatusTransitionException(
    "Reason is required for transition to $status",
    "REASON_REQUIRED"
)

/**
 * Exception for enhanced status transition validation failures
 */
class EnhancedStatusTransitionException(
    currentStatus: String,
    newStatus: String,
    validTransitions: Set<String>
) : StatusTransitionException(
    "Invalid status transition from $currentStatus to $newStatus. Valid transitions: ${validTransitions.joinToString(", ")}",
    "INVALID_TRANSITION"
)

/**
 * Exception for insufficient permissions in status transitions
 */
class StatusTransitionPermissionException(
    userRole: String,
    requiredPermission: String
) : StatusTransitionException(
    "User with role $userRole lacks permission: $requiredPermission",
    "INSUFFICIENT_PERMISSION"
)