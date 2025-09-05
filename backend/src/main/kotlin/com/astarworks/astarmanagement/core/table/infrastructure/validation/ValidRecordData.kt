package com.astarworks.astarmanagement.core.table.infrastructure.validation

import jakarta.validation.Constraint
import jakarta.validation.Payload
import kotlin.reflect.KClass

/**
 * Validation annotation for record data maps.
 * Ensures record data is safe and within limits.
 */
@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY_GETTER, AnnotationTarget.VALUE_PARAMETER)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [RecordDataValidator::class])
@MustBeDocumented
annotation class ValidRecordData(
    val message: String = "Invalid record data",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)