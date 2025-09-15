# Astar Management

**AI-Agent + Notion + Obsidian の融合による次世代ビジネス管理プラットフォーム**

## 🎯 プロダクトビジョン

小中規模企業（1-100名）のDXを実現する汎用基盤SaaS。散在する情報、非効率な書類管理、複雑な財務管理の課題を解決します。

### コアコンセプト
- **汎用基盤 + 業界テンプレート**: プラットフォームは業界非依存、テンプレートで特化
- **企業向けObsidian**: ローカルファースト、Markdown中心、直感的UI
- **AIネイティブ**: 全機能がAIから操作可能、自然言語でタスク実行

## 🚀 クイックスタート

```bash
# バックエンド起動
cd backend
./gradlew bootRun

# フロントエンド起動
cd frontend
bun install
bun dev
```

## 📚 ドキュメント構成

```
docs/
├── README.md                    # このファイル
├── ARCHITECTURE.md             # 全体アーキテクチャ
│
├── backend/                    # バックエンド（Spring Boot）
│   ├── README.md              # 概要とAPI設計
│   ├── role-system.md         # Discord風ロールシステム
│   ├── flexible-table.md      # 柔軟テーブル（JSONB）
│   ├── document-management.md # Markdownドキュメント管理
│   └── ai-agent.md           # AIエージェント統合
│
├── frontend/                   # フロントエンド（Nuxt3）
│   ├── README.md              # 概要と設計原則
│   ├── workspace.md           # ワークスペース管理UI
│   ├── table-view.md          # テーブルビュー
│   ├── document-editor.md    # Markdownエディタ
│   └── ai-chat.md            # AIチャットUI
│
└── infrastructure/            # インフラストラクチャ
    ├── deployment.md          # Docker/Kubernetes
    └── multitenancy.md       # マルチテナント設計
```

## 🔧 技術スタック

### バックエンド
- **言語**: Kotlin + Java 21
- **フレームワーク**: Spring Boot 3.5
- **データベース**: PostgreSQL 15
- **認証**: Spring Security + JWT

### フロントエンド
- **フレームワーク**: Nuxt 3 + Vue 3
- **言語**: TypeScript 5
- **UI**: shadcn-vue + Tailwind CSS
- **パッケージマネージャー**: Bun

### インフラ
- **コンテナ**: Docker
- **オーケストレーション**: Kubernetes
- **CI/CD**: GitHub Actions

## 💡 主要機能

### バックエンド（4つのコア機能）
1. **柔軟なロールシステム**: Discord風の動的権限管理
2. **柔軟テーブル**: JSONB活用の動的スキーマ
3. **ドキュメント管理**: Markdownベースの階層型管理
4. **AIエージェント**: 全機能統合のAI操作

### フロントエンド
- **ワークスペース**: ファイルツリー、プロジェクト管理
- **テーブルビュー**: カンバン、テーブル、各種ビュー
- **ドキュメントエディタ**: Markdownエディタ、変数システム
- **AIチャット**: 自然言語での操作インターフェース

## 🏢 マルチテナント戦略

### 3つのプラン
- **Starter** (1,000円〜): Shared DB + RLS
- **Professional** (2,000円〜): Dedicated Schema
- **Enterprise** (5,000円〜): Dedicated Container

## 📈 ロードマップ

### Phase 1: MVP（現在）
- ✅ 認証・権限管理
- 🚧 柔軟テーブル
- 🚧 ドキュメント管理
- 📅 基本AIエージェント

### Phase 2: 拡張
- 📅 プロジェクト管理（カンバン）
- 📅 高度なAI機能
- 📅 テンプレートシステム

### Phase 3: スケール
- 📅 他業界テンプレート
- 📅 グローバル展開
- 📅 エンタープライズ機能

## 🤝 コントリビューション

[CLAUDE.md](../CLAUDE.md) を参照してください。

## 📄 ライセンス

Proprietary Software. All rights reserved.