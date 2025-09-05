package com.astarworks.astarmanagement.core.table.infrastructure.persistence.converter

import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.*
import org.postgresql.util.PGobject
import org.springframework.core.convert.converter.Converter
import org.springframework.data.convert.ReadingConverter
import org.springframework.data.convert.WritingConverter
import org.springframework.stereotype.Component

/**
 * Spring Data JDBC converter for kotlinx.serialization.json.JsonObject
 * Converts between JsonObject and PostgreSQL JSONB using PGobject
 */
object JsonConfig {
    val lenient = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
    }
}

@ReadingConverter
class JsonObjectReadingConverter : Converter<PGobject, JsonObject> {
    override fun convert(source: PGobject): JsonObject {
        val value = source.value
        if (value.isNullOrBlank() || value == "{}") {
            return JsonObject(emptyMap())
        }
        return Json.parseToJsonElement(value).jsonObject
    }
}

@WritingConverter
class JsonObjectWritingConverter : Converter<JsonObject, PGobject> {
    override fun convert(source: JsonObject): PGobject {
        return PGobject().apply {
            type = "jsonb"
            value = source.toString()
        }
    }
}

// JsonArray
@ReadingConverter
class JsonArrayReadingConverter : Converter<PGobject, JsonArray> {
    override fun convert(source: PGobject): JsonArray {
        val value = source.value
        if (value.isNullOrBlank() || value == "[]") {
            return JsonArray(emptyList())
        }
        return Json.parseToJsonElement(value).jsonArray
    }
}

@WritingConverter
class JsonArrayWritingConverter : Converter<JsonArray, PGobject> {
    override fun convert(source: JsonArray): PGobject {
        return PGobject().apply {
            type = "jsonb"
            value = source.toString()
        }
    }
}

// JsonPrimitive（必要なら）
@ReadingConverter
class JsonPrimitiveReadingConverter : Converter<PGobject, JsonPrimitive> {
    override fun convert(source: PGobject): JsonPrimitive {
        val value = source.value ?: return JsonPrimitive("")
        return try {
            Json.parseToJsonElement(value).jsonPrimitive
        } catch (e: Exception) {
            // 文字列として扱う
            JsonPrimitive(value)
        }
    }
}

@WritingConverter
class JsonPrimitiveWritingConverter : Converter<JsonPrimitive, PGobject> {
    override fun convert(source: JsonPrimitive): PGobject {
        return PGobject().apply {
            type = "jsonb"
            value = source.toString()
        }
    }
}