package com.astarworks.astarmanagement.core.table.infrastructure.persistence.converter

import org.postgresql.util.PGobject
import org.springframework.core.convert.converter.Converter
import org.springframework.data.convert.ReadingConverter

/**
 * Converter for PostgreSQL JSONB to String
 * This allows reading JSONB columns as String values
 */
@ReadingConverter
class JsonbToStringConverter : Converter<PGobject, String> {
    override fun convert(source: PGobject): String {
        return source.value ?: "{}"
    }
}