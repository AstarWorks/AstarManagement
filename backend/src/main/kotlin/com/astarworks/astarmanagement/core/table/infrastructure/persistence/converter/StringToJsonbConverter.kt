package com.astarworks.astarmanagement.core.table.infrastructure.persistence.converter

import org.postgresql.util.PGobject
import org.springframework.core.convert.converter.Converter
import org.springframework.data.convert.WritingConverter

/**
 * Converter for String to PostgreSQL JSONB
 * This allows storing JSON strings directly in JSONB columns
 */
@WritingConverter
class StringToJsonbConverter : Converter<String, PGobject> {
    override fun convert(source: String): PGobject {
        return PGobject().apply {
            type = "jsonb"
            value = source
        }
    }
}