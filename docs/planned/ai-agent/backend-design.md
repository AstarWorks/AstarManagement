# AIエージェント統合

## 概要

プラットフォームの全機能をAIが操作可能にする統合システム。
MCP (Model Context Protocol) とCLIツールを使用して、自然言語でタスクを実行。

## アーキテクチャ

### システム構成
```
ユーザー
   ↓
チャットUI
   ↓
AIエージェントサービス
   ↓
LLMプロバイダー（OpenAI/Claude/ローカル）
   ↓
MCP/CLIツール
   ↓
プラットフォームAPI
```

## データモデル

### エージェント定義
```kotlin
@Entity
@Table(name = "ai_agents")
data class AIAgent(
    @Id
    val id: UUID = UUID.randomUUID(),
    
    @Column(nullable = false)
    val tenantId: UUID,
    
    @Column(nullable = false)
    val name: String,
    
    val description: String? = null,
    
    @Enumerated(EnumType.STRING)
    val provider: LLMProvider,
    
    @Column(columnDefinition = "jsonb")
    val configuration: JsonNode, // プロバイダー固有設定
    
    @ElementCollection
    @CollectionTable(name = "agent_capabilities")
    val capabilities: Set<String> = emptySet(), // 許可された機能
    
    @Column(nullable = false)
    val isActive: Boolean = true,
    
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now()
)

enum class LLMProvider {
    OPENAI,
    ANTHROPIC,
    GOOGLE,
    AZURE,
    LOCAL
}
```

### 会話管理
```kotlin
@Entity
@Table(name = "ai_conversations")
data class AIConversation(
    @Id
    val id: UUID = UUID.randomUUID(),
    
    @Column(nullable = false)
    val agentId: UUID,
    
    @Column(nullable = false)
    val userId: UUID,
    
    val title: String? = null,
    
    @Column(columnDefinition = "jsonb")
    val context: JsonNode? = null, // コンテキスト情報
    
    val startedAt: Instant = Instant.now(),
    val endedAt: Instant? = null
)

@Entity
@Table(name = "ai_messages")
data class AIMessage(
    @Id
    val id: UUID = UUID.randomUUID(),
    
    @Column(nullable = false)
    val conversationId: UUID,
    
    @Enumerated(EnumType.STRING)
    val role: MessageRole,
    
    @Lob
    val content: String,
    
    @Column(columnDefinition = "jsonb")
    val toolCalls: JsonNode? = null, // 実行されたツール
    
    val createdAt: Instant = Instant.now()
)

enum class MessageRole {
    USER,
    ASSISTANT,
    SYSTEM,
    TOOL
}
```

## LLMプロバイダー統合

### OpenAIクライアント
```kotlin
@Component
class OpenAIClient(
    @Value("\${openai.api-key}")
    private val apiKey: String
) : LLMClient {
    
    private val client = OpenAI(apiKey)
    
    override suspend fun chat(
        messages: List<ChatMessage>,
        tools: List<Tool>? = null
    ): ChatResponse {
        val request = ChatCompletionRequest(
            model = "gpt-4-turbo-preview",
            messages = messages.map { it.toOpenAIMessage() },
            tools = tools?.map { it.toOpenAITool() },
            temperature = 0.7
        )
        
        val response = client.chatCompletion(request)
        
        return ChatResponse(
            content = response.choices.first().message.content,
            toolCalls = response.choices.first().message.toolCalls
        )
    }
    
    override suspend fun embedding(text: String): List<Float> {
        val request = EmbeddingRequest(
            model = "text-embedding-3-small",
            input = text
        )
        
        val response = client.embedding(request)
        return response.data.first().embedding
    }
}
```

### Claudeクライアント
```kotlin
@Component
class ClaudeClient(
    @Value("\${anthropic.api-key}")
    private val apiKey: String
) : LLMClient {
    
    override suspend fun chat(
        messages: List<ChatMessage>,
        tools: List<Tool>? = null
    ): ChatResponse {
        val request = mapOf(
            "model" to "claude-3-opus-20240229",
            "messages" to messages,
            "max_tokens" to 4096
        )
        
        // Anthropic API呼び出し
        val response = httpClient.post("https://api.anthropic.com/v1/messages") {
            header("x-api-key", apiKey)
            header("anthropic-version", "2023-06-01")
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        
        return parseClaudeResponse(response)
    }
}
```

### ローカルLLM (Ollama)
```kotlin
@Component
class OllamaClient(
    @Value("\${ollama.base-url}")
    private val baseUrl: String = "http://localhost:11434"
) : LLMClient {
    
    override suspend fun chat(
        messages: List<ChatMessage>,
        tools: List<Tool>? = null
    ): ChatResponse {
        val request = mapOf(
            "model" to "llama2",
            "messages" to messages,
            "stream" to false
        )
        
        val response = httpClient.post("$baseUrl/api/chat") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }
        
        return parseOllamaResponse(response)
    }
}
```

## MCPツール統合

### ツール定義
```kotlin
@Component
class MCPToolRegistry {
    
    private val tools = mutableMapOf<String, MCPTool>()
    
    @PostConstruct
    fun registerTools() {
        // テーブル操作
        register(MCPTool(
            name = "create_table",
            description = "新しいテーブルを作成",
            parameters = listOf(
                Parameter("name", "string", "テーブル名"),
                Parameter("columns", "array", "カラム定義")
            ),
            handler = ::createTable
        ))
        
        // ドキュメント操作
        register(MCPTool(
            name = "create_document",
            description = "新しいドキュメントを作成",
            parameters = listOf(
                Parameter("path", "string", "ファイルパス"),
                Parameter("content", "string", "コンテンツ")
            ),
            handler = ::createDocument
        ))
        
        // クエリ実行
        register(MCPTool(
            name = "query_table",
            description = "テーブルをクエリ",
            parameters = listOf(
                Parameter("table", "string", "テーブル名"),
                Parameter("filter", "object", "フィルタ条件")
            ),
            handler = ::queryTable
        ))
    }
    
    fun execute(toolName: String, parameters: Map<String, Any>): Any {
        val tool = tools[toolName] 
            ?: throw IllegalArgumentException("Unknown tool: $toolName")
        
        return tool.handler(parameters)
    }
}
```

### ツール実行
```kotlin
@Service
class AIAgentService(
    private val llmClient: LLMClient,
    private val toolRegistry: MCPToolRegistry
) {
    
    suspend fun processMessage(
        conversationId: UUID,
        message: String
    ): String {
        val conversation = getConversation(conversationId)
        val messages = getConversationHistory(conversationId)
        
        // LLMにメッセージを送信
        val response = llmClient.chat(
            messages = messages + ChatMessage(MessageRole.USER, message),
            tools = toolRegistry.getAvailableTools()
        )
        
        // ツール呼び出しがある場合
        response.toolCalls?.forEach { toolCall ->
            val result = toolRegistry.execute(
                toolCall.name,
                toolCall.parameters
            )
            
            // 結果をLLMにフィードバック
            messages.add(ChatMessage(
                role = MessageRole.TOOL,
                content = Json.encodeToString(result)
            ))
        }
        
        // 最終応答を取得
        val finalResponse = llmClient.chat(messages)
        
        // 会話履歴を保存
        saveMessage(conversationId, MessageRole.USER, message)
        saveMessage(conversationId, MessageRole.ASSISTANT, finalResponse.content)
        
        return finalResponse.content
    }
}
```

## RAG (Retrieval-Augmented Generation)

### ベクトルDB統合
```kotlin
@Service
class VectorSearchService(
    private val embeddingClient: LLMClient
) {
    
    suspend fun indexDocument(document: Document) {
        // ドキュメントをチャンクに分割
        val chunks = splitIntoChunks(document.content)
        
        chunks.forEach { chunk ->
            // エンベディングを生成
            val embedding = embeddingClient.embedding(chunk.text)
            
            // ベクトルDBに保存
            vectorRepository.save(VectorDocument(
                documentId = document.id,
                chunkId = chunk.id,
                content = chunk.text,
                embedding = embedding,
                metadata = mapOf(
                    "path" to document.path,
                    "tenant" to document.tenantId.toString()
                )
            ))
        }
    }
    
    suspend fun search(
        query: String,
        tenantId: UUID,
        limit: Int = 10
    ): List<SearchResult> {
        // クエリのエンベディングを生成
        val queryEmbedding = embeddingClient.embedding(query)
        
        // ベクトル検索
        return vectorRepository.findSimilar(
            embedding = queryEmbedding,
            filter = mapOf("tenant" to tenantId.toString()),
            limit = limit
        )
    }
}
```

### コンテキスト生成
```kotlin
@Service
class RAGService(
    private val vectorSearch: VectorSearchService,
    private val llmClient: LLMClient
) {
    
    suspend fun generateWithContext(
        query: String,
        tenantId: UUID
    ): String {
        // 関連ドキュメントを検索
        val relevantDocs = vectorSearch.search(query, tenantId)
        
        // コンテキストを構築
        val context = relevantDocs.joinToString("\n\n") { it.content }
        
        // プロンプトを構築
        val prompt = """
            以下のコンテキストを基に質問に答えてください。
            
            コンテキスト:
            $context
            
            質問: $query
        """.trimIndent()
        
        // LLMに問い合わせ
        val response = llmClient.chat(listOf(
            ChatMessage(MessageRole.SYSTEM, "あなたは役立つアシスタントです。"),
            ChatMessage(MessageRole.USER, prompt)
        ))
        
        return response.content
    }
}
```

## API設計

### WebSocketエンドポイント
```kotlin
@Controller
class AIWebSocketController(
    private val agentService: AIAgentService
) {
    
    @MessageMapping("/ai/chat")
    @SendTo("/topic/ai/response")
    suspend fun chat(
        @Payload message: ChatRequest,
        @Header("conversation-id") conversationId: String
    ): ChatResponse {
        val response = agentService.processMessage(
            UUID.fromString(conversationId),
            message.content
        )
        
        return ChatResponse(
            content = response,
            timestamp = Instant.now()
        )
    }
}
```

### REST API
```yaml
# AIエージェント管理
GET    /api/v1/agents               # エージェント一覧
POST   /api/v1/agents               # エージェント作成
GET    /api/v1/agents/{id}          # エージェント詳細
PUT    /api/v1/agents/{id}          # エージェント更新

# 会話管理
POST   /api/v1/conversations        # 会話開始
GET    /api/v1/conversations/{id}   # 会話履歴
POST   /api/v1/conversations/{id}/messages # メッセージ送信

# RAG
POST   /api/v1/rag/index            # ドキュメントインデックス
POST   /api/v1/rag/search           # ベクトル検索
```

## まとめ

AIエージェント統合により：
1. **全機能AIアクセス**: MCPツールでプラットフォームのすべてを操作
2. **マルチLLM対応**: OpenAI, Claude, ローカルを選択可能
3. **RAG実装**: 組織の知識を活用した高精度応答
4. **リアルタイム対話**: WebSocketでスムーズなチャット体験