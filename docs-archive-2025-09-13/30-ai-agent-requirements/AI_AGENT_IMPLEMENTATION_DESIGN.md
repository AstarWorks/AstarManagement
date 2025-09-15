# AIエージェント実装設計

## 1. 概要

Astar ManagementのAIエージェントは、プラットフォームの全機能を自然言語で操作可能にする中核機能です。
「AI-Agent + Notion + Obsidian」の融合というコンセプトを実現し、ユーザーが自然言語でタスクを指示・実行できる環境を提供します。

## 2. アーキテクチャ概要

### 2.1 基本構成

```
┌─────────────────────────────────────────────────────────────┐
│                         ユーザーインターフェース                  │
│                    (チャット UI / 音声入力 / API)               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Agent Orchestrator                       │
│              (インテント理解・タスク分解・実行管理)                │
└──────┬──────────────────┬──────────────────┬───────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Tool Executor │  │  LLM Router  │  │  RAG Engine  │
│ (機能実行層)   │  │ (モデル選択) │  │ (知識検索)   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     Platform API Layer                      │
│        (プロジェクト管理 / 経費管理 / 文書管理 / 顧客管理)        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 データフロー

```yaml
1. ユーザー入力:
   - 自然言語テキスト
   - 音声（音声認識後テキスト化）
   - 構造化コマンド

2. 処理パイプライン:
   a. インテント分析
   b. コンテキスト取得（RAG）
   c. 権限チェック
   d. タスク計画生成
   e. ツール実行
   f. 結果整形・返却

3. レスポンス:
   - テキスト応答
   - 実行結果
   - UI操作（画面遷移等）
```

## 3. 技術スタック

### 3.1 コアフレームワーク

#### LangChain
```yaml
用途: エージェントオーケストレーション
バージョン: 0.2.x
機能:
  - エージェントループ管理
  - ツールチェーン構築
  - メモリ管理
  - プロンプトテンプレート
```

#### Model Context Protocol (MCP)
```yaml
用途: ツール定義・統合の標準化
提供元: Anthropic
利点:
  - 標準化されたツール定義
  - 型安全な実行
  - 将来的な拡張性
```

#### Instructor
```yaml
用途: 構造化出力の保証
連携: Pydantic
機能:
  - 型検証
  - リトライ機構
  - エラーハンドリング
```

### 3.2 LLMプロバイダー管理

#### LiteLLM
```python
# 統一APIでの複数プロバイダー管理
from litellm import completion

class LLMRouter:
    def __init__(self):
        self.providers = {
            "general": "gpt-4-turbo",
            "fast": "gpt-3.5-turbo",
            "secure": "ollama/llama3",
            "japanese": "claude-3-opus"
        }
    
    async def route(self, task_type: str, sensitivity: str):
        if sensitivity == "high":
            return self.providers["secure"]
        elif task_type == "translation":
            return self.providers["japanese"]
        else:
            return self.providers["general"]
```

#### ローカルLLM対応
```yaml
Ollama:
  - Llama 3 (8B/70B)
  - Mistral (7B)
  - Qwen 2.5
  - 日本語特化モデル

選択基準:
  - 機密データ処理: ローカルLLM必須
  - 一般業務: クラウドLLM優先
  - コスト最適化: タスク複雑度で自動選択
```

### 3.3 ベクトルデータベース

#### Qdrant（推奨）
```yaml
特徴:
  - 高性能
  - スケーラブル
  - フィルタリング機能充実
  - マルチテナント対応

設定:
  collection_per_tenant: true
  embedding_dimension: 1536
  distance_metric: cosine
```

#### 代替オプション
- Weaviate: GraphQL対応
- Pinecone: マネージドサービス
- pgvector: PostgreSQL統合

### 3.4 開発支援ツール

```yaml
必須ツール:
  LangSmith:
    - エージェントデバッグ
    - トレース分析
    - パフォーマンス監視
  
  Helicone:
    - LLMコスト追跡
    - 使用量分析
    - 最適化提案
  
  Promptfoo:
    - プロンプトテスト自動化
    - 回帰テスト
    - A/Bテスト

オプション:
  Phoenix: RAGパフォーマンス分析
  Weights & Biases: 実験管理
  Arize: MLOps監視
```

## 4. 実装設計

### 4.1 エージェントクラス構造

```python
from typing import List, Dict, Any
from langchain.agents import AgentExecutor
from langchain.memory import ConversationBufferMemory

class AstarAgent:
    """Astar Management統合AIエージェント"""
    
    def __init__(self, tenant_id: str, user_id: str):
        self.tenant_id = tenant_id
        self.user_id = user_id
        self.tools = self._initialize_tools()
        self.memory = ConversationBufferMemory()
        self.rag_engine = RAGEngine(tenant_id)
        self.llm_router = LLMRouter()
        self.permission_checker = PermissionChecker(user_id)
    
    async def execute(self, user_input: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """ユーザー入力を処理し、適切なアクションを実行"""
        
        # 1. インテント理解
        intent = await self._understand_intent(user_input, context)
        
        # 2. 権限チェック
        if not await self.permission_checker.check(intent.required_permissions):
            return {
                "status": "permission_denied",
                "message": "この操作を実行する権限がありません",
                "required_permissions": intent.required_permissions
            }
        
        # 3. コンテキスト拡張（RAG）
        enhanced_context = await self.rag_engine.enhance_context(
            query=user_input,
            intent=intent,
            context=context
        )
        
        # 4. LLM選択
        llm = await self.llm_router.select_model(
            task_type=intent.task_type,
            data_sensitivity=intent.sensitivity_level
        )
        
        # 5. タスク実行計画
        plan = await self._create_execution_plan(
            intent=intent,
            context=enhanced_context,
            llm=llm
        )
        
        # 6. ツール実行
        results = []
        for step in plan.steps:
            try:
                result = await self._execute_tool(
                    tool_name=step.tool,
                    parameters=step.parameters
                )
                results.append(result)
            except Exception as e:
                return self._handle_error(e, step)
        
        # 7. 結果整形
        return self._format_response(results, intent)
    
    def _initialize_tools(self) -> List[Tool]:
        """プラットフォーム機能をツールとして初期化"""
        return [
            CreateProjectTool(),
            UpdateExpenseTool(),
            SearchDocumentsTool(),
            GenerateReportTool(),
            ManageWorkflowTool(),
            # ... その他のツール
        ]
```

### 4.2 ツール定義（MCP準拠）

```python
from pydantic import BaseModel, Field
from typing import Optional

class CreateLegalCaseParams(BaseModel):
    """法律案件作成パラメータ"""
    client_id: str = Field(description="クライアントID")
    case_type: str = Field(description="案件種別")
    title: str = Field(description="案件タイトル")
    deadline: Optional[str] = Field(description="期限（ISO 8601形式）")
    assigned_lawyer: Optional[str] = Field(description="担当弁護士ID")

class CreateLegalCaseTool:
    """法律案件作成ツール"""
    
    name = "create_legal_case"
    description = "新規法律案件を作成します"
    parameters = CreateLegalCaseParams
    
    async def execute(self, params: CreateLegalCaseParams) -> Dict[str, Any]:
        # API呼び出し
        response = await api_client.post(
            "/api/v1/cases",
            json=params.dict()
        )
        return response.json()
```

### 4.3 RAG実装

```python
from qdrant_client import QdrantClient
from langchain.embeddings import OpenAIEmbeddings
import hashlib

class RAGEngine:
    """組織知識検索エンジン"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.client = QdrantClient(url="localhost:6333")
        self.embedder = OpenAIEmbeddings()
        self.collection_name = f"tenant_{tenant_id}"
        
    async def index_documents(self):
        """組織のドキュメントをインデックス化"""
        
        # Markdownドキュメント取得
        documents = await self._load_markdown_documents()
        
        # テーブルデータ取得
        table_data = await self._load_table_data()
        
        # チャンク化
        chunks = self._create_chunks(documents + table_data)
        
        # エンベディング生成
        embeddings = await self.embedder.aembed_documents(
            [chunk.content for chunk in chunks]
        )
        
        # ベクトルDBに保存
        points = [
            {
                "id": hashlib.md5(chunk.content.encode()).hexdigest(),
                "vector": embedding,
                "payload": {
                    "content": chunk.content,
                    "source": chunk.source,
                    "metadata": chunk.metadata
                }
            }
            for chunk, embedding in zip(chunks, embeddings)
        ]
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
    
    async def search(self, query: str, limit: int = 5) -> List[Dict]:
        """関連情報を検索"""
        
        # クエリのエンベディング
        query_vector = await self.embedder.aembed_query(query)
        
        # 検索実行
        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            limit=limit,
            query_filter={
                "must": [
                    {"key": "tenant_id", "match": {"value": self.tenant_id}}
                ]
            }
        )
        
        return [
            {
                "content": hit.payload["content"],
                "source": hit.payload["source"],
                "score": hit.score
            }
            for hit in results
        ]
```

## 5. セキュリティ設計

### 5.1 データ分離

```yaml
テナント分離:
  - ベクトルDB: テナントごとのコレクション
  - LLMコンテキスト: テナントIDでフィルタリング
  - ツールアクセス: テナント境界の厳密な管理

実装:
  vector_db:
    collection_naming: "tenant_{tenant_id}_{type}"
    access_control: JWT検証必須
    
  llm_context:
    system_prompt: "You are operating in tenant {tenant_id}"
    data_filtering: "WHERE tenant_id = :tenant_id"
```

### 5.2 権限管理

```python
class PermissionChecker:
    """Discord風ロールベース権限チェック"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.roles = self._load_user_roles()
    
    async def check(self, required_permissions: List[str]) -> bool:
        """必要な権限を持っているかチェック"""
        
        user_permissions = set()
        for role in self.roles:
            user_permissions.update(role.permissions)
        
        return all(perm in user_permissions for perm in required_permissions)
    
    def get_data_access_filter(self) -> Dict:
        """データアクセスフィルタを生成"""
        
        filters = []
        for role in self.roles:
            if "data:read:all" in role.permissions:
                return {}  # 全データアクセス可能
            
            # スコープベースのフィルタ
            for perm in role.permissions:
                if perm.startswith("data:read:"):
                    scope = perm.split(":")[-1]
                    filters.append({"scope": scope})
        
        return {"or": filters} if filters else {"scope": "none"}
```

### 5.3 監査ログ

```python
from datetime import datetime
import json

class AuditLogger:
    """AIエージェントアクション監査"""
    
    async def log_action(self, action: Dict[str, Any]):
        """アクションを監査ログに記録"""
        
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "tenant_id": action.get("tenant_id"),
            "user_id": action.get("user_id"),
            "agent_action": {
                "type": action.get("type"),
                "tool": action.get("tool"),
                "parameters": action.get("parameters"),
                "result": action.get("result")
            },
            "llm_metadata": {
                "model": action.get("model"),
                "tokens": action.get("tokens"),
                "cost": action.get("cost")
            },
            "security": {
                "data_accessed": action.get("data_accessed"),
                "permissions_used": action.get("permissions_used")
            }
        }
        
        # データベースに保存
        await self.save_to_db(log_entry)
        
        # 異常検知
        if await self.detect_anomaly(log_entry):
            await self.alert_security_team(log_entry)
```

## 6. パフォーマンス最適化

### 6.1 キャッシュ戦略

```python
from functools import lru_cache
import redis
import hashlib

class AgentCache:
    """マルチレイヤーキャッシュ"""
    
    def __init__(self):
        self.redis_client = redis.Redis()
        self.ttl = 3600  # 1時間
    
    async def get_or_compute(self, key: str, compute_func, ttl: int = None):
        """キャッシュから取得、なければ計算して保存"""
        
        # L1: メモリキャッシュ
        if hasattr(self, '_memory_cache'):
            if key in self._memory_cache:
                return self._memory_cache[key]
        
        # L2: Redisキャッシュ
        cached = self.redis_client.get(key)
        if cached:
            return json.loads(cached)
        
        # 計算実行
        result = await compute_func()
        
        # キャッシュに保存
        self.redis_client.setex(
            key,
            ttl or self.ttl,
            json.dumps(result)
        )
        
        return result
    
    def generate_cache_key(self, query: str, context: Dict) -> str:
        """セマンティックキャッシュキー生成"""
        
        # クエリの正規化
        normalized_query = self._normalize_query(query)
        
        # コンテキストのハッシュ化
        context_hash = hashlib.md5(
            json.dumps(context, sort_keys=True).encode()
        ).hexdigest()
        
        return f"agent:{normalized_query}:{context_hash}"
```

### 6.2 並列処理

```python
import asyncio
from typing import List, Callable

class ParallelExecutor:
    """ツールの並列実行"""
    
    async def execute_parallel(
        self,
        tasks: List[Callable],
        max_concurrent: int = 5
    ) -> List[Any]:
        """複数タスクを並列実行"""
        
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def execute_with_limit(task):
            async with semaphore:
                return await task()
        
        results = await asyncio.gather(
            *[execute_with_limit(task) for task in tasks],
            return_exceptions=True
        )
        
        # エラーハンドリング
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                # エラー処理
                results[i] = self._handle_task_error(result, tasks[i])
        
        return results
```

### 6.3 ストリーミング応答

```python
from typing import AsyncGenerator

class StreamingAgent:
    """ストリーミング応答対応エージェント"""
    
    async def stream_response(
        self,
        query: str
    ) -> AsyncGenerator[str, None]:
        """ストリーミングで応答を生成"""
        
        # LLMストリーミング
        async for chunk in self.llm.astream(query):
            # 部分的な応答を即座に返す
            yield chunk.content
            
            # ツール実行が必要な場合
            if self._needs_tool_execution(chunk):
                tool_result = await self._execute_tool_async(chunk)
                yield f"\n[実行結果: {tool_result}]\n"
```

## 7. 実装ロードマップ

### Phase 1: 基礎実装（Week 1-2）
```yaml
目標: 基本的なチャット機能の実現
タスク:
  - LangChainセットアップ
  - 基本的なツール定義（CRUD操作）
  - シンプルなチャットUI実装
  - OpenAI API統合

成果物:
  - 動作するチャットボット
  - 5つの基本ツール
  - デモ可能な状態
```

### Phase 2: RAG実装（Week 3-4）
```yaml
目標: 組織知識を活用した応答
タスク:
  - Qdrantセットアップ
  - ドキュメントインデックス化
  - セマンティック検索実装
  - コンテキスト注入機構

成果物:
  - RAGパイプライン
  - 知識ベース検索
  - 精度向上の確認
```

### Phase 3: ツール統合（Week 5-6）
```yaml
目標: プラットフォーム全機能のツール化
タスク:
  - 全APIエンドポイントのツール化
  - MCP準拠の定義作成
  - 複雑なワークフロー実装
  - エラーハンドリング強化

成果物:
  - 30+ツール実装
  - ワークフロー自動化
  - ロバストなエラー処理
```

### Phase 4: 最適化（Week 7-8）
```yaml
目標: 本番環境向け最適化
タスク:
  - マルチエージェント実装
  - キャッシュ層実装
  - パフォーマンスチューニング
  - セキュリティ強化

成果物:
  - 応答時間50%削減
  - コスト30%削減
  - セキュリティ監査パス
```

### Phase 5: 高度な機能（Week 9-12）
```yaml
目標: 差別化機能の実装
タスク:
  - ローカルLLM対応
  - マルチモーダル対応
  - プロアクティブ提案
  - 学習・適応機能

成果物:
  - ハイブリッドLLM環境
  - 画像・音声対応
  - パーソナライゼーション
```

## 8. ツール定義仕様

### 8.1 標準ツールカテゴリ

```yaml
プロジェクト管理:
  - create_project: プロジェクト作成
  - update_project_status: ステータス更新
  - assign_member: メンバーアサイン
  - create_task: タスク作成
  - move_card: カンバンカード移動

経費管理:
  - record_expense: 経費記録
  - approve_expense: 経費承認
  - generate_expense_report: レポート生成
  - calculate_budget: 予算計算

文書管理:
  - create_document: ドキュメント作成
  - update_document: ドキュメント更新
  - search_documents: ドキュメント検索
  - apply_template: テンプレート適用
  - extract_variables: 変数抽出

顧客管理:
  - create_client: 顧客登録
  - update_contact: 連絡先更新
  - log_interaction: やり取り記録
  - search_clients: 顧客検索

レポート・分析:
  - generate_dashboard: ダッシュボード生成
  - create_report: カスタムレポート作成
  - analyze_trends: トレンド分析
  - export_data: データエクスポート
```

### 8.2 ツール自動生成

```python
class ToolGenerator:
    """OpenAPI仕様からツールを自動生成"""
    
    def generate_from_openapi(self, spec_path: str) -> List[Tool]:
        """OpenAPI仕様からツールを生成"""
        
        with open(spec_path) as f:
            spec = json.load(f)
        
        tools = []
        for path, methods in spec["paths"].items():
            for method, details in methods.items():
                tool = self._create_tool(
                    path=path,
                    method=method,
                    details=details
                )
                tools.append(tool)
        
        return tools
    
    def _create_tool(self, path: str, method: str, details: Dict) -> Tool:
        """個別ツールの生成"""
        
        # パラメータスキーマの生成
        params_schema = self._generate_params_schema(
            details.get("parameters", []),
            details.get("requestBody", {})
        )
        
        # ツールクラスの動的生成
        tool_class = type(
            f"{details['operationId']}Tool",
            (BaseTool,),
            {
                "name": details["operationId"],
                "description": details["summary"],
                "parameters": params_schema,
                "execute": self._create_executor(path, method)
            }
        )
        
        return tool_class()
```

## 9. ユーザー体験設計

### 9.1 インターフェース統合

```typescript
// フロントエンド実装例
import { ref, computed } from 'vue'

export const useAIAssistant = () => {
  const isOpen = ref(false)
  const messages = ref<Message[]>([])
  const isLoading = ref(false)
  
  // チャット送信
  const sendMessage = async (text: string) => {
    isLoading.value = true
    
    // ユーザーメッセージ追加
    messages.value.push({
      role: 'user',
      content: text,
      timestamp: new Date()
    })
    
    try {
      // ストリーミング応答
      const response = await streamChat({
        message: text,
        context: getCurrentContext()
      })
      
      let assistantMessage = ''
      for await (const chunk of response) {
        assistantMessage += chunk
        
        // リアルタイム更新
        updateLastMessage(assistantMessage)
      }
    } finally {
      isLoading.value = false
    }
  }
  
  // コンテキストアウェア提案
  const suggestions = computed(() => {
    const currentRoute = useRoute()
    
    switch (currentRoute.name) {
      case 'projects':
        return [
          '新規プロジェクトを作成',
          '今週の進捗をまとめて',
          '遅延しているタスクを表示'
        ]
      case 'expenses':
        return [
          '今月の経費を集計',
          '承認待ちの経費を表示',
          '経費レポートを生成'
        ]
      default:
        return []
    }
  })
  
  // 自然言語コマンド実行
  const executeCommand = async (command: string) => {
    const result = await $fetch('/api/agent/execute', {
      method: 'POST',
      body: { command }
    })
    
    // 実行結果に応じたアクション
    if (result.action === 'navigate') {
      await navigateTo(result.path)
    } else if (result.action === 'update_ui') {
      updateUIState(result.changes)
    }
    
    return result
  }
  
  return {
    isOpen,
    messages,
    isLoading,
    suggestions,
    sendMessage,
    executeCommand
  }
}
```

### 9.2 プロアクティブ支援

```python
class ProactiveAssistant:
    """プロアクティブな支援機能"""
    
    async def analyze_user_behavior(self, user_id: str) -> List[Suggestion]:
        """ユーザー行動を分析して提案を生成"""
        
        # 現在のコンテキスト
        context = await self.get_user_context(user_id)
        
        suggestions = []
        
        # 定期的なタスクの検出
        if self._is_recurring_task(context):
            suggestions.append({
                "type": "automation",
                "message": "このタスクを自動化しますか？",
                "action": "create_workflow"
            })
        
        # 異常パターンの検出
        if anomaly := self._detect_anomaly(context):
            suggestions.append({
                "type": "alert",
                "message": f"通常と異なるパターンを検出: {anomaly}",
                "action": "review_details"
            })
        
        # 最適化の提案
        if optimization := self._suggest_optimization(context):
            suggestions.append({
                "type": "optimization",
                "message": optimization.message,
                "action": optimization.action
            })
        
        return suggestions
```

## 10. 差別化機能の実装

### 10.1 全機能AIアクセス

```python
class UniversalAccessAdapter:
    """プラットフォーム全機能への統一アクセス"""
    
    def __init__(self):
        self.ui_actions = self._map_ui_actions()
        self.api_endpoints = self._load_api_spec()
        self.database_ops = self._init_db_operations()
    
    async def execute_any_action(self, action_description: str) -> Any:
        """自然言語の指示から任意のアクションを実行"""
        
        # アクション特定
        action = await self._identify_action(action_description)
        
        if action.type == "ui":
            # UI操作（ページ遷移、フォーム入力等）
            return await self._execute_ui_action(action)
        
        elif action.type == "api":
            # API呼び出し
            return await self._execute_api_call(action)
        
        elif action.type == "database":
            # 直接的なDB操作
            return await self._execute_db_operation(action)
        
        elif action.type == "workflow":
            # 複合的なワークフロー
            return await self._execute_workflow(action)
    
    def _map_ui_actions(self) -> Dict[str, Callable]:
        """UIアクションのマッピング"""
        
        return {
            "navigate": self.navigate_to_page,
            "click": self.click_element,
            "input": self.input_text,
            "select": self.select_option,
            "upload": self.upload_file,
            # ... 全UI操作
        }
```

### 10.2 学習と適応

```python
class AdaptiveLearning:
    """組織固有の学習と適応"""
    
    async def learn_from_feedback(self, interaction: Dict):
        """ユーザーフィードバックから学習"""
        
        if interaction["feedback"] == "positive":
            # 成功パターンの強化
            await self.reinforce_pattern(interaction["pattern"])
        
        elif interaction["feedback"] == "negative":
            # 失敗パターンの修正
            await self.adjust_pattern(interaction["pattern"])
    
    async def fine_tune_for_organization(self, tenant_id: str):
        """組織専用のファインチューニング"""
        
        # 組織のデータ収集
        org_data = await self.collect_organization_data(tenant_id)
        
        # プロンプトテンプレートの最適化
        optimized_prompts = await self.optimize_prompts(org_data)
        
        # RAGインデックスの更新
        await self.update_rag_index(org_data)
        
        return {
            "prompts_updated": len(optimized_prompts),
            "documents_indexed": org_data["document_count"],
            "accuracy_improvement": self.measure_improvement()
        }
```

## まとめ

このAIエージェント実装設計により、Astar Managementは以下を実現します：

1. **全機能AIアクセス**: プラットフォームのあらゆる機能をAIが操作可能
2. **セキュアな実装**: テナント分離、権限管理、監査ログによる堅牢性
3. **高パフォーマンス**: キャッシュ、並列処理、最適化による高速応答
4. **拡張性**: MCP準拠、ツール自動生成による継続的な機能追加
5. **学習と適応**: 組織固有のパターン学習による精度向上

これにより、「AI-Agent + Notion + Obsidian」という革新的なコンセプトを実現し、
ユーザーが自然言語で全ての業務を遂行できる次世代プラットフォームを構築します。