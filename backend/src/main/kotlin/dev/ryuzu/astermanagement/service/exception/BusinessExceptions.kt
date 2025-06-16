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