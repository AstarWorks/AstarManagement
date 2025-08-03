# エラーハンドリング詳細設計書

## 1. 業界標準のベストプラクティス

### 1.1 スタックトレースの扱い
```json
// 開発環境：スタックトレースを含む
{
  "success": false,
  "error": {
    "code": "EXPENSE_VALIDATION_ERROR",
    "statusCode": 400,
    "message": "Validation failed",
    "details": { ... },
    "debug": {
      "stackTrace": "at ExpenseService.create()...",
      "requestId": "req-123456",
      "timestamp": "2024-01-20T10:00:00Z"
    }
  }
}

// 本番環境：エラーIDのみ提供
{
  "success": false,
  "error": {
    "code": "EXPENSE_VALIDATION_ERROR",
    "statusCode": 400,
    "message": "Validation failed",
    "errorId": "err-550e8400-e29b-41d4",  // ログと照合用
    "timestamp": "2024-01-20T10:00:00Z"
  }
}
```

**業界標準の理由**：
- セキュリティ：本番環境で内部構造を露出しない
- デバッグ効率：エラーIDでログを検索できる
- ユーザー体験：ユーザーにはシンプルなメッセージのみ

### 1.2 ログレベルの使い分け（業界標準）

```kotlin
// ERROR: システムが継続不可能な状態
logger.error("Database connection failed", exception)
logger.error("Critical service unavailable: {}", serviceName)

// WARN: 業務エラー、回復可能なエラー
logger.warn("Validation failed for expense: {}", validationErrors)
logger.warn("Rate limit exceeded for user: {}", userId)

// INFO: 重要な業務イベント
logger.info("Expense created: id={}, amount={}", expenseId, amount)
logger.info("User logged in: {}", userId)

// DEBUG: 開発時の詳細情報
logger.debug("Request payload: {}", requestBody)
logger.debug("SQL query executed: {}", query)
```

## 2. エラーコード体系

### 2.1 構造
```
{DOMAIN}_{ERROR_TYPE}_{SPECIFIC}

例：
- AUTH_TOKEN_EXPIRED
- EXPENSE_NOT_FOUND
- ATTACHMENT_SIZE_EXCEEDED
```

### 2.2 エラーコード定義
```kotlin
enum class ErrorCode(
    val code: String,
    val statusCode: Int,
    val messageKey: String
) {
    // 認証エラー (401)
    AUTH_TOKEN_MISSING("AUTH_TOKEN_MISSING", 401, "errors.auth.token_missing"),
    AUTH_TOKEN_INVALID("AUTH_TOKEN_INVALID", 401, "errors.auth.token_invalid"),
    AUTH_TOKEN_EXPIRED("AUTH_TOKEN_EXPIRED", 401, "errors.auth.token_expired"),
    
    // 権限エラー (403)
    AUTH_PERMISSION_DENIED("AUTH_PERMISSION_DENIED", 403, "errors.auth.permission_denied"),
    AUTH_TENANT_MISMATCH("AUTH_TENANT_MISMATCH", 403, "errors.auth.tenant_mismatch"),
    
    // 実費エラー (400, 404, 409)
    EXPENSE_NOT_FOUND("EXPENSE_NOT_FOUND", 404, "errors.expense.not_found"),
    EXPENSE_VALIDATION_ERROR("EXPENSE_VALIDATION_ERROR", 400, "errors.expense.validation_error"),
    EXPENSE_DUPLICATE("EXPENSE_DUPLICATE", 409, "errors.expense.duplicate"),
    EXPENSE_INVALID_AMOUNT("EXPENSE_INVALID_AMOUNT", 400, "errors.expense.invalid_amount"),
    EXPENSE_FUTURE_DATE("EXPENSE_FUTURE_DATE", 400, "errors.expense.future_date"),
    
    // 添付ファイルエラー
    ATTACHMENT_NOT_FOUND("ATTACHMENT_NOT_FOUND", 404, "errors.attachment.not_found"),
    ATTACHMENT_SIZE_EXCEEDED("ATTACHMENT_SIZE_EXCEEDED", 413, "errors.attachment.size_exceeded"),
    ATTACHMENT_TYPE_NOT_ALLOWED("ATTACHMENT_TYPE_NOT_ALLOWED", 415, "errors.attachment.type_not_allowed"),
    ATTACHMENT_LIMIT_EXCEEDED("ATTACHMENT_LIMIT_EXCEEDED", 400, "errors.attachment.limit_exceeded"),
    
    // タグエラー
    TAG_NOT_FOUND("TAG_NOT_FOUND", 404, "errors.tag.not_found"),
    TAG_DUPLICATE("TAG_DUPLICATE", 409, "errors.tag.duplicate"),
    TAG_NAME_INVALID("TAG_NAME_INVALID", 400, "errors.tag.name_invalid"),
    
    // システムエラー (500)
    INTERNAL_SERVER_ERROR("INTERNAL_SERVER_ERROR", 500, "errors.system.internal_error"),
    DATABASE_ERROR("DATABASE_ERROR", 500, "errors.system.database_error"),
    EXTERNAL_SERVICE_ERROR("EXTERNAL_SERVICE_ERROR", 502, "errors.system.external_service_error"),
    
    // レート制限 (429)
    RATE_LIMIT_EXCEEDED("RATE_LIMIT_EXCEEDED", 429, "errors.system.rate_limit_exceeded")
}
```

## 3. Kotlin実装

### 3.1 例外クラス階層
```kotlin
// 基底例外クラス
sealed class AstarException(
    val errorCode: ErrorCode,
    message: String? = null,
    cause: Throwable? = null
) : RuntimeException(message ?: errorCode.messageKey, cause)

// ビジネス例外
class BusinessException(
    errorCode: ErrorCode,
    message: String? = null,
    val details: Map<String, Any>? = null
) : AstarException(errorCode, message)

// バリデーション例外
class ValidationException(
    val errors: List<FieldError>
) : AstarException(ErrorCode.EXPENSE_VALIDATION_ERROR) {
    data class FieldError(
        val field: String,
        val code: String,
        val message: String,
        val rejectedValue: Any? = null
    )
}

// リソース未検出例外
class ResourceNotFoundException(
    errorCode: ErrorCode,
    val resourceType: String,
    val resourceId: String
) : AstarException(errorCode, "$resourceType not found: $resourceId")

// システム例外
class SystemException(
    errorCode: ErrorCode,
    message: String? = null,
    cause: Throwable? = null
) : AstarException(errorCode, message, cause)
```

### 3.2 グローバル例外ハンドラー
```kotlin
@RestControllerAdvice
class GlobalExceptionHandler(
    private val messageSource: MessageSource,
    private val errorLogger: ErrorLogger
) {
    @ExceptionHandler(BusinessException::class)
    fun handleBusinessException(
        ex: BusinessException,
        request: HttpServletRequest,
        locale: Locale
    ): ResponseEntity<ApiErrorResponse> {
        val errorId = generateErrorId()
        
        // WARNレベルでログ
        logger.warn(
            "Business error occurred: errorId={}, code={}, details={}",
            errorId, ex.errorCode.code, ex.details
        )
        
        return ResponseEntity
            .status(ex.errorCode.statusCode)
            .body(createErrorResponse(ex, errorId, locale, request))
    }
    
    @ExceptionHandler(ValidationException::class)
    fun handleValidationException(
        ex: ValidationException,
        locale: Locale
    ): ResponseEntity<ApiErrorResponse> {
        logger.warn("Validation failed: {}", ex.errors)
        
        val fieldErrors = ex.errors.map { error ->
            FieldErrorDto(
                field = error.field,
                code = error.code,
                message = messageSource.getMessage(error.code, null, error.message, locale),
                rejectedValue = if (isDevelopment()) error.rejectedValue else null
            )
        }
        
        return ResponseEntity.badRequest().body(
            ApiErrorResponse(
                success = false,
                error = ErrorDto(
                    code = ErrorCode.EXPENSE_VALIDATION_ERROR.code,
                    statusCode = 400,
                    message = "Validation failed",
                    details = mapOf("fields" to fieldErrors)
                )
            )
        )
    }
    
    @ExceptionHandler(Exception::class)
    fun handleUnexpectedException(
        ex: Exception,
        request: HttpServletRequest
    ): ResponseEntity<ApiErrorResponse> {
        val errorId = generateErrorId()
        
        // ERRORレベルでログ（スタックトレース付き）
        logger.error(
            "Unexpected error occurred: errorId={}, uri={}, method={}",
            errorId, request.requestURI, request.method, ex
        )
        
        // 将来の外部サービス連携準備
        errorLogger.logToExternalService(errorId, ex, request)
        
        return ResponseEntity
            .status(500)
            .body(
                ApiErrorResponse(
                    success = false,
                    error = ErrorDto(
                        code = ErrorCode.INTERNAL_SERVER_ERROR.code,
                        statusCode = 500,
                        message = "An unexpected error occurred",
                        errorId = errorId,
                        timestamp = Instant.now()
                    )
                )
            )
    }
    
    private fun createErrorResponse(
        ex: AstarException,
        errorId: String,
        locale: Locale,
        request: HttpServletRequest
    ): ApiErrorResponse {
        val error = ErrorDto(
            code = ex.errorCode.code,
            statusCode = ex.errorCode.statusCode,
            message = messageSource.getMessage(
                ex.errorCode.messageKey,
                null,
                ex.message ?: "Error occurred",
                locale
            ),
            details = if (ex is BusinessException) ex.details else null,
            errorId = if (isProduction()) errorId else null,
            debug = if (isDevelopment()) DebugInfo(
                stackTrace = ex.stackTraceToString(),
                requestId = request.getAttribute("requestId") as? String,
                timestamp = Instant.now()
            ) else null
        )
        
        return ApiErrorResponse(success = false, error = error)
    }
}
```

### 3.3 エラーログ記録サービス
```kotlin
@Service
class ErrorLogger {
    private val errorBuffer = mutableListOf<ErrorLog>()
    
    fun logToExternalService(
        errorId: String,
        exception: Exception,
        request: HttpServletRequest
    ) {
        val errorLog = ErrorLog(
            errorId = errorId,
            timestamp = Instant.now(),
            exception = exception,
            request = RequestInfo(
                method = request.method,
                uri = request.requestURI,
                headers = request.headerNames.toList().associateWith { request.getHeader(it) },
                remoteAddr = request.remoteAddr,
                userId = SecurityContextHolder.getContext().authentication?.name
            )
        )
        
        // バッファに追加（将来Sentryなどに送信）
        errorBuffer.add(errorLog)
        
        // 非同期で外部サービスに送信（将来実装）
        // CompletableFuture.runAsync { 
        //     sentryClient.captureException(exception, errorLog)
        // }
    }
}
```

## 4. フロントエンド実装

### 4.1 エラーインターセプター
```typescript
// axios interceptor
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    
    // リトライ処理
    if (!originalRequest._retry && shouldRetry(error)) {
      originalRequest._retry = true
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1
      
      if (originalRequest._retryCount <= 3) {
        // 即座にリトライ（間隔0）
        return axios(originalRequest)
      }
    }
    
    // エラー処理
    handleApiError(error)
    return Promise.reject(error)
  }
)

function shouldRetry(error: any): boolean {
  // ネットワークエラーまたは5xx系エラーの場合リトライ
  return !error.response || error.response.status >= 500
}
```

### 4.2 トースト通知
```typescript
function handleApiError(error: any) {
  const toast = useToast()
  
  if (!error.response) {
    // ネットワークエラー
    toast.error(t('errors.network.connection_failed'))
    return
  }
  
  const { data } = error.response
  const errorCode = data?.error?.code
  
  // エラーコードに基づいた表示
  switch (errorCode) {
    case 'AUTH_TOKEN_EXPIRED':
      toast.warning(t('errors.auth.session_expired'))
      router.push('/login')
      break
      
    case 'RATE_LIMIT_EXCEEDED':
      toast.error(t('errors.system.rate_limit_exceeded'))
      break
      
    case 'EXPENSE_VALIDATION_ERROR':
      // バリデーションエラーは個別に表示
      const fields = data.error.details?.fields || []
      fields.forEach(field => {
        toast.error(`${field.field}: ${field.message}`)
      })
      break
      
    default:
      // その他のエラー
      const message = data?.error?.message || t('errors.system.unexpected')
      toast.error(message)
      
      // 開発環境ではエラーIDも表示
      if (import.meta.env.DEV && data?.error?.errorId) {
        console.error(`Error ID: ${data.error.errorId}`)
      }
  }
}
```

## 5. エラー監視の準備

### 5.1 メトリクス収集
```kotlin
@Component
class ErrorMetrics {
    private val errorCounter = ConcurrentHashMap<String, AtomicInteger>()
    
    fun incrementError(errorCode: String) {
        errorCounter
            .computeIfAbsent(errorCode) { AtomicInteger(0) }
            .incrementAndGet()
    }
    
    fun getErrorStats(): Map<String, Int> {
        return errorCounter.mapValues { it.value.get() }
    }
}
```

### 5.2 将来の外部サービス統合準備
```yaml
# application.yml
Astar:
  error-tracking:
    enabled: false  # 将来trueに
    service: sentry # or datadog, newrelic
    dsn: ${SENTRY_DSN:}
    environment: ${ENVIRONMENT:development}
    sample-rate: 1.0
```

この設計により、堅牢なエラーハンドリングシステムが構築できます。