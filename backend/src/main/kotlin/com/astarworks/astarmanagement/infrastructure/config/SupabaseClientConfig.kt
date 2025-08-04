package com.astarworks.astarmanagement.infrastructure.config

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime
import io.github.jan.supabase.serializer.KotlinXSerializer
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class SupabaseClientConfig {
    
    @Value($$"${supabase.url}")
    private lateinit var supabaseUrl: String
    
    @Value($$"${supabase.anon-key}")
    private lateinit var supabaseAnonKey: String
    
    @Bean
    fun supabaseClient(): SupabaseClient {
        println("Creating Supabase client with URL: $supabaseUrl")
        println("Using anon key: ${supabaseAnonKey.take(20)}...")
        
        return createSupabaseClient(
            supabaseUrl = supabaseUrl,
            supabaseKey = supabaseAnonKey
        ) {
            defaultSerializer = KotlinXSerializer()
            install(Auth)
            install(Postgrest)
            install(Realtime)
        }
    }
}