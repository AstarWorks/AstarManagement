---
task_id: T06_S04
sprint_sequence_id: S04
status: open
complexity: Medium
last_updated: 2025-06-18T10:35:00Z
---

# Task: Backend Performance Optimization

## Description
Optimize backend API performance through query optimization, caching implementation, and connection pooling configuration. Focus on achieving p95 < 200ms response times for all critical endpoints under load conditions.

## Goal / Objectives
- Optimize database queries to reduce response times
- Implement Redis caching for frequently accessed data
- Configure optimal connection pooling settings
- Ensure API endpoints meet p95 < 200ms benchmark under load

## Acceptance Criteria
- [ ] All API endpoints achieve p95 < 200ms response time
- [ ] Database query execution time < 50ms for common operations
- [ ] Redis cache hit ratio > 80% for cacheable endpoints
- [ ] Zero database connection pool exhaustion under load
- [ ] Performance metrics dashboard showing real-time stats

## Subtasks
### Database Query Optimization
- [ ] Analyze slow queries using PostgreSQL EXPLAIN ANALYZE
- [ ] Add appropriate indexes for common query patterns
- [ ] Optimize N+1 query problems with proper joins
- [ ] Implement query result pagination
- [ ] Review and optimize JPA fetch strategies

### Caching Implementation
- [ ] Set up Redis cluster for caching
- [ ] Implement cache-aside pattern for matter queries
- [ ] Add cache warming for frequently accessed data
- [ ] Configure cache TTL and eviction policies
- [ ] Implement cache invalidation strategy

### Connection Pool Optimization
- [ ] Analyze current connection pool metrics
- [ ] Configure HikariCP optimal settings
- [ ] Implement connection pool monitoring
- [ ] Add circuit breaker for database failures
- [ ] Configure read replica routing

### API Optimization
- [ ] Implement response compression (gzip)
- [ ] Add pagination to list endpoints
- [ ] Optimize JSON serialization
- [ ] Implement request/response interceptors for metrics
- [ ] Add rate limiting for resource-intensive endpoints

## Technical Guidance

### Query Optimization Examples
```kotlin
// Before: N+1 query problem
@Repository
interface MatterRepository : JpaRepository<Matter, UUID> {
    fun findByStatus(status: MatterStatus): List<Matter>
}

// After: Optimized with join fetch
@Repository
interface MatterRepository : JpaRepository<Matter, UUID> {
    @Query("""
        SELECT DISTINCT m FROM Matter m
        LEFT JOIN FETCH m.assignedLawyer
        LEFT JOIN FETCH m.documents
        LEFT JOIN FETCH m.auditLogs
        WHERE m.status = :status
    """)
    fun findByStatusWithDetails(@Param("status") status: MatterStatus): List<Matter>
    
    // Paginated query for large datasets
    @Query("""
        SELECT m FROM Matter m
        WHERE m.assignedLawyer.id = :lawyerId
        AND (:status IS NULL OR m.status = :status)
        ORDER BY m.priority DESC, m.updatedAt DESC
    """)
    fun findByLawyerAndStatus(
        @Param("lawyerId") lawyerId: UUID,
        @Param("status") status: MatterStatus?,
        pageable: Pageable
    ): Page<Matter>
}
```

### Redis Caching Configuration
```kotlin
@Configuration
@EnableCaching
class CacheConfig {
    
    @Bean
    fun redisConnectionFactory(): LettuceConnectionFactory {
        val config = RedisStandaloneConfiguration().apply {
            hostName = "localhost"
            port = 6379
            password = RedisPassword.of("your-password")
        }
        
        val clientConfig = LettuceClientConfiguration.builder()
            .commandTimeout(Duration.ofSeconds(2))
            .shutdownTimeout(Duration.ZERO)
            .build()
            
        return LettuceConnectionFactory(config, clientConfig)
    }
    
    @Bean
    fun cacheManager(connectionFactory: RedisConnectionFactory): RedisCacheManager {
        val defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))
            .disableCachingNullValues()
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    GenericJackson2JsonRedisSerializer()
                )
            )
        
        val cacheConfigurations = mapOf(
            "matters" to defaultConfig.entryTtl(Duration.ofMinutes(5)),
            "users" to defaultConfig.entryTtl(Duration.ofHours(1)),
            "documents" to defaultConfig.entryTtl(Duration.ofMinutes(30))
        )
        
        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigurations)
            .transactionAware()
            .build()
    }
}

// Service layer caching
@Service
class MatterService(
    private val matterRepository: MatterRepository,
    private val cacheManager: CacheManager
) {
    
    @Cacheable(value = ["matters"], key = "#id")
    fun findById(id: UUID): Matter? {
        return matterRepository.findById(id).orElse(null)
    }
    
    @CacheEvict(value = ["matters"], key = "#matter.id")
    fun update(matter: Matter): Matter {
        return matterRepository.save(matter)
    }
    
    @Cacheable(
        value = ["matter-list"], 
        key = "#lawyerId + '_' + #status + '_' + #pageable.pageNumber"
    )
    fun findByLawyerAndStatus(
        lawyerId: UUID, 
        status: MatterStatus?, 
        pageable: Pageable
    ): Page<Matter> {
        return matterRepository.findByLawyerAndStatus(lawyerId, status, pageable)
    }
}
```

### HikariCP Configuration
```yaml
spring:
  datasource:
    hikari:
      connection-timeout: 30000 # 30 seconds
      idle-timeout: 600000 # 10 minutes
      max-lifetime: 1800000 # 30 minutes
      maximum-pool-size: 20
      minimum-idle: 5
      validation-timeout: 5000
      leak-detection-threshold: 60000 # 1 minute
      connection-test-query: SELECT 1
      
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 25
          batch_versioned_data: true
        order_inserts: true
        order_updates: true
        query:
          in_clause_parameter_padding: true
        connection:
          provider_disables_autocommit: true
```

### Performance Monitoring
```kotlin
@Component
class PerformanceMonitor(
    private val meterRegistry: MeterRegistry
) {
    
    @EventListener
    fun handleConnectionAcquired(event: ConnectionAcquiredEvent) {
        meterRegistry.counter("db.connection.acquired").increment()
    }
    
    @EventListener
    fun handleSlowQuery(event: SlowQueryEvent) {
        meterRegistry.timer("db.query.slow").record(event.duration)
    }
    
    @Bean
    fun hibernateStatistics(entityManagerFactory: EntityManagerFactory): HibernateStatistics {
        val sessionFactory = entityManagerFactory.unwrap(SessionFactory::class.java)
        return HibernateStatistics(sessionFactory, meterRegistry)
    }
}

// Custom metrics for API endpoints
@RestControllerAdvice
class ApiMetricsAdvice(private val meterRegistry: MeterRegistry) {
    
    @Around("@annotation(org.springframework.web.bind.annotation.GetMapping)")
    fun measureGetEndpoints(joinPoint: ProceedingJoinPoint): Any? {
        val timer = meterRegistry.timer(
            "api.request.duration",
            "method", "GET",
            "endpoint", joinPoint.signature.name
        )
        
        return timer.recordCallable {
            joinPoint.proceed()
        }
    }
}
```

### Database Indexing Strategy
```sql
-- Analyze missing indexes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    avg_width,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
AND tablename IN ('matters', 'documents', 'audit_logs')
ORDER BY tablename, n_distinct DESC;

-- Create optimized indexes
CREATE INDEX idx_matters_status_priority 
ON matters(status, priority DESC, updated_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX idx_matters_lawyer_status 
ON matters(assigned_lawyer_id, status)
WHERE deleted_at IS NULL;

CREATE INDEX idx_audit_logs_entity 
ON audit_logs(entity_type, entity_id, created_at DESC);

-- Partial index for active matters
CREATE INDEX idx_active_matters 
ON matters(updated_at DESC)
WHERE status NOT IN ('CLOSED', 'CANCELLED');
```

## Implementation Notes

### Optimization Strategy
1. **Measure First**
   - Profile current performance bottlenecks
   - Identify slow queries and N+1 problems
   - Monitor connection pool usage

2. **Quick Wins**
   - Add missing database indexes
   - Enable query result caching
   - Optimize connection pool settings

3. **Advanced Optimizations**
   - Implement read replicas for queries
   - Add database query hints
   - Consider CQRS for complex queries

### Performance Targets
- API Response Times:
  - GET /matters: p95 < 150ms
  - GET /matters/{id}: p95 < 50ms
  - POST /matters: p95 < 200ms
  - Search endpoints: p95 < 300ms

- Database Metrics:
  - Query execution: < 50ms average
  - Connection wait time: < 10ms
  - Cache hit ratio: > 80%

## Output Log
*(This section is populated as work progresses on the task)*

[2025-06-18 10:35:00] Task created from T02_S04 split