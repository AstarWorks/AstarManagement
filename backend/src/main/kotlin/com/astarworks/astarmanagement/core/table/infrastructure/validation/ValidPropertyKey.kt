package com.astarworks.astarmanagement.core.table.infrastructure.validation

import jakarta.validation.Constraint
import jakarta.validation.Payload
import kotlin.reflect.KClass

/**
 * Validation annotation for property keys.
 * Ensures property keys are valid identifiers.
 */
@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY_GETTER, AnnotationTarget.VALUE_PARAMETER)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [PropertyKeyValidator::class])
@MustBeDocumented
annotation class ValidPropertyKey(
    val message: String = "Invalid property key",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)