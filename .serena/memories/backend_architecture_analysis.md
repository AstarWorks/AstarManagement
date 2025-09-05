# Astar Management バックエンド アーキテクチャ分析

## プロジェクト概要と思想

### コンセプト
**Astar Management**は、**Notion + Obsidian + AI-Agent**の融合を目指した汎用ビジネス管理プラットフォームです。

### 主な特徴
1. **Notionライクなフレキシブルテーブルシステム**
2. **Discord風動的ロールシステム**  
3. **マルチテナント対応（RLS実装）**
4. **業界テンプレート戦略**

## アーキテクチャの特徴

### 1. フレキシブルテーブルシステム（Notion風）
- **動的スキーマ定義**: `Table`、`PropertyDefinition`、`Record`モデルで実現
- **JSONB型での柔軟なデータ格納**: スキーマレスで様々なデータ型に対応
- **PropertyTypeCatalog**: プロパティ型の再利用可能なカタログシステム
- **完全にカスタマイズ可能**: ユーザーが自由にテーブル構造を定義

### 2. Discord風ロールシステム  
- **動的ロール作成**: 事前定義されたロールは存在しない
- **複数ロール付与**: 1ユーザーに複数ロールを付与可能
- **フラットな階層**: ロール間に継承関係なし
- **色分けと表示優先度**: Discord同様の視覚的表現

### 3. マルチテナントアーキテクチャ
- **Row Level Security (RLS)**: PostgreSQLのネイティブ機能を活用
- **AOP Interceptor**: `@Transactional`メソッドで自動的にテナントコンテキスト設定
- **セッション変数**: `app.current_tenant_id`、`app.current_user_id`で制御
- **透過的なデータ分離**: アプリケーション層での明示的なフィルタリング不要

### 4. リソースグループベースの認可
- **ResourceGroup**: リソースのUserRole版（部署、プロジェクト、クライアントなど）
- **柔軟な権限管理**: リソースも複数グループに所属可能
- **階層構造サポート**: オプショナルな親子関係

## 技術スタック

### バックエンド
- **Kotlin + Spring Boot 3.5**: 型安全性とモダンなJVM環境
- **Spring Data JDBC**: JPA不使用、シンプルなデータアクセス
- **Spring Security + JWT**: OAuth2リソースサーバー
- **PostgreSQL 15**: JSONB、RLS、高度なJSON操作
- **Flyway**: データベースマイグレーション管理

## ドメイン駆動設計（DDD）の実装

### レイヤー構造
```
core/
├── [module]/
│   ├── domain/          # ドメインモデル、ビジネスロジック
│   │   ├── model/       # エンティティ、値オブジェクト
│   │   ├── repository/  # リポジトリインターフェース
│   │   └── service/     # ドメインサービス
│   ├── infrastructure/  # 技術的実装
│   │   └── persistence/ # データアクセス実装
│   └── api/            # プレゼンテーション層
│       ├── controller/  # RESTエンドポイント
│       └── dto/        # データ転送オブジェクト
```

### 値オブジェクトの活用
- **EntityId<T>**: 型安全なID（TableId、RecordId、UserIdなど）
- **強い型付け**: プリミティブ型の使用を避け、ドメインの意図を明確化

## データベース設計の特徴

### ハイブリッド設計
- **構造化データ**: 通常のテーブル（users、tenants、roles）
- **半構造化データ**: JSONB型（tables.properties、records.data）
- **型カタログシステム**: 再利用可能なプロパティ型定義

### RLS（Row Level Security）実装
```sql
-- セッション変数の設定
SELECT set_config('app.current_tenant_id', 'UUID', true);
SELECT set_config('app.current_user_id', 'UUID', true);

-- RLSポリシーでの自動フィルタリング
CREATE POLICY tenant_isolation ON tables
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces 
      WHERE tenant_id = current_setting('app.current_tenant_id')::UUID
    )
  );
```

## 開発哲学

### Simple over Easy
- 明示的で分かりやすい実装を優先
- フレームワークマジックより直接的な実装
- 依存関係と複雑性の最小化

### クリーンアーキテクチャ
- **ビジネスロジックの分離**: ドメイン層に集約
- **依存性の逆転**: インフラ層がドメイン層に依存
- **テスタビリティ**: 各層が独立してテスト可能

### トランザクション管理
- **Service層で`@Transactional`**: ビジネストランザクション境界を明確化
- **読み取り専用の明示**: `@Transactional(readOnly = true)`
- **Repository層はCRUDのみ**: ビジネスロジックを含まない

## 将来の拡張性

### 業界テンプレート戦略
- **汎用基盤 + 業界特化テンプレート**: コードは汎用、設定で特化
- **最初の実装**: 法律事務所向けテンプレート
- **将来展開**: 司法書士、物流、不動産管理など

### AIエージェント統合
- **全機能AIアクセス可能**: プラットフォーム全体をAIが操作
- **自然言語タスク実行**: チャットボット型の操作
- **RAG学習**: 組織データからの学習と提案

## まとめ

Astar Managementは、**Notionの柔軟性**、**Obsidianの構造化**、**AIの知能**を組み合わせた次世代のビジネス管理プラットフォームです。技術的には、**Spring Boot + Kotlin**による堅牢なバックエンド、**PostgreSQL RLS**による強力なマルチテナント、**JSONB**による柔軟なデータモデルが特徴的です。

Discord風のロールシステムとNotionライクなフレキシブルテーブルにより、どんな業界・組織にも適応できる汎用性と、テンプレートによる即座の業界特化を両立させています。