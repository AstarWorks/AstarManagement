package com.astarworks.astarmanagement.infrastructure.external

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.springframework.stereotype.Service

@Service
class SupabaseClientService(
    private val supabaseClient: SupabaseClient
) {
    
    fun testConnection(): Boolean {
        println("SupabaseClientService.testConnection() called")
        println("Supabase client: $supabaseClient")
        return try {
            runBlocking {
                // Try to access the API to test connection
                supabaseClient.from("test_table").select {
                    limit(1)
                }
            }
            true
        } catch (e: Exception) {
            println("Supabase connection error: ${e.message}")
            e.printStackTrace()
            false
        }
    }
    
    fun fetchData(table: String): List<Map<String, Any>> {
        return try {
            runBlocking {
                val result = supabaseClient.from(table).select()
                // Convert the result to List<Map<String, Any>>
                result.decodeList<JsonObject>().map { jsonObject ->
                    jsonObject.entries.associate { (key, value) ->
                        key to value.toString().trim('"')
                    }
                }
            }
        } catch (e: Exception) {
            println("Error fetching data from $table: ${e.message}")
            e.printStackTrace()
            emptyList()
        }
    }
    
    fun insertData(table: String, data: Map<String, Any>): Map<String, Any> {
        return try {
            runBlocking {
                val jsonObject = buildJsonObject {
                    data.forEach { (key, value) ->
                        put(key, value.toString())
                    }
                }
                
                val result = supabaseClient.from(table)
                    .insert(jsonObject)
                    .decodeSingle<JsonObject>()
                
                result.entries.associate { (key, value) ->
                    key to value.toString().trim('"')
                }
            }
        } catch (e: Exception) {
            println("Error inserting data to $table: ${e.message}")
            e.printStackTrace()
            emptyMap()
        }
    }
}