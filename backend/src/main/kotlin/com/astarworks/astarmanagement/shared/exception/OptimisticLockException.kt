package com.astarworks.astarmanagement.shared.exception

/**
 * Exception thrown when an optimistic lock conflict occurs.
 * This happens when trying to update an entity that has been modified by another transaction.
 */
class OptimisticLockException(
    message: String = "Entity was modified by another transaction",
    cause: Throwable? = null
) : RuntimeException(message, cause)