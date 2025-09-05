package com.astarworks.astarmanagement.shared.exception.common

import com.astarworks.astarmanagement.shared.exception.base.BusinessException
import com.astarworks.astarmanagement.shared.exception.base.ErrorCode
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.JsonPrimitive

/**
 * Exception thrown when authentication is required but not provided or invalid.
 * This is typically mapped to HTTP 401 status code.
 * 
 * @property reason The reason for authentication failure (optional)
 * @property realm The authentication realm (optional)
 */
class UnauthorizedException(
    val reason: String? = null,
    val realm: String? = null,
    message: String = "Authentication required",
    cause: Throwable? = null
) : BusinessException(
    message = message,
    errorCode = ErrorCode.UNAUTHORIZED,
    httpStatus = UNAUTHORIZED,
    details = if (reason != null || realm != null) {
        buildJsonObject {
            reason?.let { put("reason", JsonPrimitive(it)) }
            realm?.let { put("realm", JsonPrimitive(it)) }
        }
    } else null,
    cause = cause
) {
    companion object {
        // Common authentication failure reasons
        const val INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
        const val TOKEN_EXPIRED = "TOKEN_EXPIRED"
        const val TOKEN_INVALID = "TOKEN_INVALID"
        const val TOKEN_MISSING = "TOKEN_MISSING"
        const val SESSION_EXPIRED = "SESSION_EXPIRED"
        const val ACCOUNT_LOCKED = "ACCOUNT_LOCKED"
        const val ACCOUNT_DISABLED = "ACCOUNT_DISABLED"
        
        /**
         * Creates an UnauthorizedException for invalid credentials.
         */
        fun invalidCredentials(): UnauthorizedException {
            return UnauthorizedException(
                reason = INVALID_CREDENTIALS,
                message = "Invalid username or password"
            )
        }
        
        /**
         * Creates an UnauthorizedException for expired token.
         */
        fun tokenExpired(): UnauthorizedException {
            return UnauthorizedException(
                reason = TOKEN_EXPIRED,
                message = "Authentication token has expired"
            )
        }
        
        /**
         * Creates an UnauthorizedException for invalid token.
         */
        fun tokenInvalid(): UnauthorizedException {
            return UnauthorizedException(
                reason = TOKEN_INVALID,
                message = "Authentication token is invalid"
            )
        }
        
        /**
         * Creates an UnauthorizedException for missing token.
         */
        fun tokenMissing(): UnauthorizedException {
            return UnauthorizedException(
                reason = TOKEN_MISSING,
                message = "Authentication token is required"
            )
        }
        
        /**
         * Creates an UnauthorizedException for expired session.
         */
        fun sessionExpired(): UnauthorizedException {
            return UnauthorizedException(
                reason = SESSION_EXPIRED,
                message = "Session has expired. Please login again"
            )
        }
        
        /**
         * Creates an UnauthorizedException for locked account.
         */
        fun accountLocked(lockReason: String? = null): UnauthorizedException {
            val message = if (lockReason != null) {
                "Account is locked: $lockReason"
            } else {
                "Account is locked"
            }
            
            return UnauthorizedException(
                reason = ACCOUNT_LOCKED,
                message = message
            )
        }
        
        /**
         * Creates an UnauthorizedException for disabled account.
         */
        fun accountDisabled(): UnauthorizedException {
            return UnauthorizedException(
                reason = ACCOUNT_DISABLED,
                message = "Account is disabled"
            )
        }
    }
}

/**
 * Exception thrown when authorization fails (user is authenticated but lacks permissions).
 * This is typically mapped to HTTP 403 status code.
 * 
 * @property requiredPermission The permission that was required (optional)
 * @property userPermissions The permissions the user has (optional)
 * @property resource The resource being accessed (optional)
 */
class ForbiddenException(
    val requiredPermission: String? = null,
    val userPermissions: List<String>? = null,
    val resource: Any? = null,
    message: String = "Access denied",
    cause: Throwable? = null
) : BusinessException(
    message = message,
    errorCode = ErrorCode.FORBIDDEN,
    httpStatus = FORBIDDEN,
    details = if (requiredPermission != null || userPermissions != null || resource != null) {
        buildJsonObject {
            requiredPermission?.let { put("requiredPermission", JsonPrimitive(it)) }
            userPermissions?.let { put("userPermissions", JsonPrimitive(it.joinToString(", "))) }
            resource?.let { put("resource", JsonPrimitive(it.toString())) }
        }
    } else null,
    cause = cause
) {
    companion object {
        /**
         * Creates a ForbiddenException for missing permission.
         */
        fun missingPermission(
            permission: String,
            resource: String? = null
        ): ForbiddenException {
            val message = if (resource != null) {
                "Permission '$permission' is required to access $resource"
            } else {
                "Permission '$permission' is required"
            }
            
            return ForbiddenException(
                requiredPermission = permission,
                resource = resource,
                message = message
            )
        }
        
        /**
         * Creates a ForbiddenException for insufficient privileges.
         */
        fun insufficientPrivileges(
            action: String,
            resource: String
        ): ForbiddenException {
            return ForbiddenException(
                resource = resource,
                message = "Insufficient privileges to $action $resource"
            )
        }
        
        /**
         * Creates a ForbiddenException for access to another tenant's resource.
         */
        fun wrongTenant(
            resourceType: String,
            resourceId: Any
        ): ForbiddenException {
            return ForbiddenException(
                resource = buildJsonObject {
                    put("type", JsonPrimitive(resourceType))
                    put("id", JsonPrimitive(resourceId.toString()))
                },
                message = "Access denied: $resourceType belongs to another tenant"
            )
        }
        
        /**
         * Creates a ForbiddenException for role-based access denial.
         */
        fun roleRequired(
            requiredRole: String,
            userRoles: List<String>? = null
        ): ForbiddenException {
            return ForbiddenException(
                requiredPermission = "role:$requiredRole",
                userPermissions = userRoles?.map { "role:$it" },
                message = "Role '$requiredRole' is required"
            )
        }
        
        /**
         * Creates a ForbiddenException for resource ownership requirement.
         */
        fun notOwner(
            resourceType: String,
            resourceId: Any
        ): ForbiddenException {
            return ForbiddenException(
                resource = buildJsonObject {
                    put("type", JsonPrimitive(resourceType))
                    put("id", JsonPrimitive(resourceId.toString()))
                },
                message = "Only the owner can access this $resourceType"
            )
        }
    }
}