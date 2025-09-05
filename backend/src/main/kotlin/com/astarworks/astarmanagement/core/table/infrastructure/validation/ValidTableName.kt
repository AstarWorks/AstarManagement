package com.astarworks.astarmanagement.core.table.infrastructure.validation

import jakarta.validation.Constraint
import jakarta.validation.Payload
import kotlin.reflect.KClass

/**
 * Validation annotation for table names.
 * Ensures table names follow business and technical requirements.
 */
@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY_GETTER, AnnotationTarget.VALUE_PARAMETER)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [TableNameValidator::class])
@MustBeDocumented
annotation class ValidTableName(
    val message: String = "Invalid table name",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)