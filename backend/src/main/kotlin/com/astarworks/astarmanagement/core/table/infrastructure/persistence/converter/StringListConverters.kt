package com.astarworks.astarmanagement.core.table.infrastructure.persistence.converter

import org.springframework.core.convert.converter.Converter
import org.springframework.data.convert.ReadingConverter
import org.springframework.data.convert.WritingConverter
import org.springframework.stereotype.Component
import java.sql.Array
import java.sql.Connection

/**
 * Spring Data JDBC converter for List<String> to PostgreSQL text[]
 */
@ReadingConverter
class StringListReadingConverter : Converter<Array, List<String>> {
    
    override fun convert(source: Array): List<String> {
        return try {
            val array = source.array as? kotlin.Array<*>
            array?.filterIsInstance<String>() ?: emptyList()
        } catch (e: Exception) {
            throw IllegalStateException("Failed to convert SQL Array to List<String>", e)
        }
    }
}

@WritingConverter
class StringListWritingConverter : Converter<List<String>, kotlin.Array<String>> {
    
    override fun convert(source: List<String>): kotlin.Array<String> {
        return source.toTypedArray()
    }
}