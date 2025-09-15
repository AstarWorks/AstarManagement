# マルチテナント設計

## 概要

ハイブリッド型マルチテナントアーキテクチャで、セキュリティ要件とコストのバランスを最適化。
3つのプラン（Starter/Professional/Enterprise）で異なる分離レベルを提供。

## アーキテクチャパターン

### 1. Starter - Shared Database + RLS
```
┌─────────────────────────────────────┐
│         PostgreSQL Instance          │
│  ┌─────────────────────────────┐    │
│  │      Public Schema           │    │
│  │  ┌────────┐  ┌────────┐    │    │
│  │  │Tenant A│  │Tenant B│    │    │
│  │  └────────┘  └────────┘    │    │
│  │        Row Level Security    │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**実装**:
```sql
-- RLS有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_records ENABLE ROW LEVEL SECURITY;

-- ポリシー作成
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation ON documents
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- アプリケーション側でテナントID設定
SET LOCAL app.tenant_id = '123e4567-e89b-12d3-a456-426614174000';
```

### 2. Professional - Dedicated Schema
```
┌─────────────────────────────────────┐
│         PostgreSQL Instance          │
│  ┌─────────────────────────────┐    │
│  │    Schema: tenant_abc123     │    │
│  │  ┌────────────────────┐     │    │
│  │  │   All Tables       │     │    │
│  │  └────────────────────┘     │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │    Schema: tenant_xyz789     │    │
│  │  ┌────────────────────┘     │    │
│  │  │   All Tables       │     │    │
│  │  └────────────────────┘     │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**実装**:
```kotlin
@Component
class SchemaBasedTenantResolver : TenantResolver {
    
    override fun setTenant(tenantId: String) {
        val schema = "tenant_${tenantId.replace("-", "_")}"
        jdbcTemplate.execute("SET search_path TO $schema, public")
    }
    
    fun createTenantSchema(tenantId: String) {
        val schema = "tenant_${tenantId.replace("-", "_")}"
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS $schema")
        
        // テーブルをコピー
        val tables = listOf("users", "documents", "table_records")
        tables.forEach { table ->
            jdbcTemplate.execute("""
                CREATE TABLE $schema.$table (LIKE public.$table INCLUDING ALL)
            """)
        }
    }
}
```

### 3. Enterprise - Dedicated Container
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Container A  │  │  Container B  │  │  Container C  │
│  ┌─────────┐ │  │  ┌─────────┐ │  │  ┌─────────┐ │
│  │PostgreSQL│ │  │  │PostgreSQL│ │  │  │PostgreSQL│ │
│  │   DB A   │ │  │  │   DB B   │ │  │  │   DB C   │ │
│  └─────────┘ │  │  └─────────┘ │  │  └─────────┘ │
│  ┌─────────┐ │  │  ┌─────────┐ │  │  ┌─────────┐ │
│  │  Redis  │ │  │  │  Redis  │ │  │  │  Redis  │ │
│  └─────────┘ │  │  └─────────┘ │  │  └─────────┘ │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Kubernetes実装**:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-${TENANT_ID}
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: tenant-${TENANT_ID}
spec:
  serviceName: postgres
  replicas: 1
  template:
    spec:
      containers:
      - name: postgres
        image: postgres:15
        env:
        - name: POSTGRES_DB
          value: tenant_db
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 100Gi
```

## テナント管理

### TenantService
```kotlin
@Service
class TenantService(
    private val tenantRepository: TenantRepository,
    private val schemaManager: SchemaManager,
    private val k8sClient: KubernetesClient
) {
    
    @Transactional
    fun createTenant(request: CreateTenantRequest): Tenant {
        val tenant = Tenant(
            id = UUID.randomUUID(),
            name = request.name,
            plan = request.plan,
            status = TenantStatus.PROVISIONING
        )
        
        tenantRepository.save(tenant)
        
        when (request.plan) {
            Plan.STARTER -> setupStarterTenant(tenant)
            Plan.PROFESSIONAL -> setupProfessionalTenant(tenant)
            Plan.ENTERPRISE -> setupEnterpriseTenant(tenant)
        }
        
        tenant.status = TenantStatus.ACTIVE
        return tenantRepository.save(tenant)
    }
    
    private fun setupStarterTenant(tenant: Tenant) {
        // RLSの設定のみ（テーブルは共有）
        // 初期ユーザー作成
        createInitialUser(tenant.id)
    }
    
    private fun setupProfessionalTenant(tenant: Tenant) {
        // 専用スキーマ作成
        schemaManager.createSchema(tenant.id)
        
        // マイグレーション実行
        flyway.configure()
            .schemas("tenant_${tenant.id}")
            .load()
            .migrate()
        
        createInitialUser(tenant.id)
    }
    
    private suspend fun setupEnterpriseTenant(tenant: Tenant) {
        // Kubernetes namespace作成
        k8sClient.createNamespace(tenant.id)
        
        // リソース展開
        k8sClient.applyManifests(
            namespace = tenant.id,
            manifests = loadTenantManifests()
        )
        
        // データベース初期化を待つ
        waitForDatabase(tenant.id)
        
        // マイグレーション実行
        runMigrations(tenant.id)
        
        createInitialUser(tenant.id)
    }
}
```

## テナント切り替え

### TenantContext
```kotlin
@Component
class TenantContext {
    companion object {
        private val currentTenant = ThreadLocal<String>()
        
        fun setTenant(tenantId: String) {
            currentTenant.set(tenantId)
        }
        
        fun getTenant(): String? {
            return currentTenant.get()
        }
        
        fun clear() {
            currentTenant.remove()
        }
    }
}

@Component
class TenantInterceptor(
    private val tenantContext: TenantContext
) : HandlerInterceptor {
    
    override fun preHandle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any
    ): Boolean {
        val tenantId = extractTenantId(request)
        
        if (tenantId == null) {
            response.sendError(400, "Tenant ID required")
            return false
        }
        
        tenantContext.setTenant(tenantId)
        return true
    }
    
    override fun afterCompletion(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any,
        ex: Exception?
    ) {
        tenantContext.clear()
    }
    
    private fun extractTenantId(request: HttpServletRequest): String? {
        // ヘッダーから取得
        request.getHeader("X-Tenant-ID")?.let { return it }
        
        // JWTから取得
        val token = request.getHeader("Authorization")
            ?.removePrefix("Bearer ")
        
        return jwtDecoder.decode(token)?.getClaim("tenant_id")
    }
}
```

## データ分離

### リポジトリ実装
```kotlin
@Repository
class TenantAwareRepository<T : TenantEntity>(
    private val entityManager: EntityManager,
    private val tenantContext: TenantContext
) {
    
    fun findAll(entityClass: Class<T>): List<T> {
        val tenantId = tenantContext.getTenant()
            ?: throw IllegalStateException("No tenant context")
        
        val query = entityManager.createQuery(
            "SELECT e FROM ${entityClass.simpleName} e WHERE e.tenantId = :tenantId",
            entityClass
        )
        query.setParameter("tenantId", tenantId)
        
        return query.resultList
    }
    
    fun save(entity: T): T {
        entity.tenantId = tenantContext.getTenant()
            ?: throw IllegalStateException("No tenant context")
        
        return entityManager.merge(entity)
    }
}
```

## 移行戦略

### プランアップグレード
```kotlin
@Service
class TenantMigrationService {
    
    @Transactional
    suspend fun upgradeToEnterprise(tenantId: String) {
        val tenant = tenantRepository.findById(tenantId)
            .orElseThrow { NotFoundException() }
        
        // データエクスポート
        val exportFile = exportTenantData(tenantId)
        
        // Enterprise環境準備
        val enterpriseEnv = provisionEnterpriseEnvironment(tenantId)
        
        // データインポート
        importDataToEnterprise(exportFile, enterpriseEnv)
        
        // DNS切り替え
        updateDnsRecords(tenantId, enterpriseEnv.endpoint)
        
        // 旧環境クリーンアップ（猶予期間後）
        scheduleCleanup(tenantId, Duration.ofDays(7))
        
        tenant.plan = Plan.ENTERPRISE
        tenantRepository.save(tenant)
    }
}
```

## パフォーマンス最適化

### コネクションプーリング
```yaml
spring:
  datasource:
    hikari:
      # Starter（共有DB）
      maximum-pool-size: 100
      minimum-idle: 10
      
      # Professional（スキーマ分離）
      maximum-pool-size: 50
      minimum-idle: 5
      
      # Enterprise（専用DB）
      maximum-pool-size: 20
      minimum-idle: 2
```

### キャッシュ戦略
```kotlin
@Configuration
class CacheConfig {
    
    @Bean
    fun tenantCacheManager(): CacheManager {
        return CaffeineCacheManager().apply {
            setCaffeine(Caffeine.newBuilder()
                .maximumSize(10000)
                .expireAfterWrite(Duration.ofMinutes(10))
            )
        }
    }
}

@Service
class TenantCacheService {
    
    @Cacheable(value = ["tenant-data"], key = "#tenantId + ':' + #key")
    fun get(tenantId: String, key: String): Any? {
        // キャッシュミス時のみDB検索
        return repository.findByTenantIdAndKey(tenantId, key)
    }
}
```

## 料金計算

### UsageTracker
```kotlin
@Service
class UsageTrackingService {
    
    @Scheduled(cron = "0 0 * * * *") // 毎時実行
    fun trackUsage() {
        tenantRepository.findAll().forEach { tenant ->
            val usage = calculateUsage(tenant)
            
            usageRepository.save(TenantUsage(
                tenantId = tenant.id,
                timestamp = Instant.now(),
                storage = usage.storage,
                bandwidth = usage.bandwidth,
                apiCalls = usage.apiCalls,
                activeUsers = usage.activeUsers
            ))
        }
    }
    
    fun calculateMonthlyBill(tenantId: String): Bill {
        val tenant = tenantRepository.findById(tenantId).get()
        val usage = getMonthlyUsage(tenantId)
        
        val baseCost = when(tenant.plan) {
            Plan.STARTER -> 1000
            Plan.PROFESSIONAL -> 2000
            Plan.ENTERPRISE -> 5000
        }
        
        val overageCost = calculateOverage(usage, tenant.plan)
        
        return Bill(
            tenantId = tenantId,
            period = YearMonth.now(),
            baseCost = baseCost,
            overageCost = overageCost,
            total = baseCost + overageCost
        )
    }
}
```

## まとめ

マルチテナント設計により：
1. **柔軟な分離レベル**: 要件に応じた3つのプラン
2. **コスト最適化**: 小規模から大規模まで効率的
3. **セキュリティ**: エンタープライズグレードの分離
4. **スケーラビリティ**: 成長に応じたシームレスな移行