# Sprint 1: 認証・基盤機能

**期間**: 未定  
**目標**: ユーザーがログインしてシステムを利用できる状態を実現

## 🎯 Sprint目標
ユーザーがログインしてダッシュボードにアクセスできる基本的な認証システムを構築する。

## 📋 Sprint Backlog

### Backend Tasks

#### 🔐 AUTH-001: Spring Security設定実装
- **優先度**: Critical
- **見積もり**: Medium (3-5日)
- **担当者**: 未定
- **Status**: Todo
- **説明**: 
  - Spring Security基本設定
  - JWT認証フィルター実装
  - セキュリティ設定クラス作成
- **Definition of Done**:
  - [ ] SecurityConfigクラス実装
  - [ ] JWTフィルター実装
  - [ ] セキュリティテスト作成
  - [ ] エンドポイント保護確認

#### 🔐 AUTH-002: JWT認証エンドポイント実装
- **優先度**: Critical
- **見積もり**: Medium (3-5日)
- **担当者**: 未定
- **Status**: Todo
- **説明**:
  - ログインエンドポイント実装
  - JWTトークン生成・検証
  - リフレッシュトークン機能
- **Definition of Done**:
  - [ ] /api/auth/login エンドポイント
  - [ ] /api/auth/refresh エンドポイント
  - [ ] JWTService実装
  - [ ] 認証APIテスト作成

#### 👤 AUTH-003: ユーザー管理API実装
- **優先度**: High
- **見積もり**: Medium (3-5日)
- **担当者**: 未定
- **Status**: Todo
- **説明**:
  - ユーザーCRUD API
  - パスワードハッシュ化
  - ユーザー検索機能
- **Definition of Done**:
  - [ ] User エンティティ実装
  - [ ] UserRepository実装
  - [ ] UserService実装
  - [ ] UserController実装
  - [ ] API統合テスト作成

#### 🛡️ AUTH-004: RBAC権限チェック実装
- **優先度**: High
- **見積もり**: Large (1-2週間)
- **担当者**: 未定
- **Status**: Todo
- **説明**:
  - Role-Based Access Control実装
  - 権限注釈(@PreAuthorize)
  - 権限階層設定
- **Definition of Done**:
  - [ ] Role, Permission エンティティ実装
  - [ ] 権限チェックアスペクト実装
  - [ ] 権限管理API実装
  - [ ] 権限テスト作成

### Frontend Tasks

#### 🖥️ UI-001: ログイン画面実装
- **優先度**: Critical
- **見積もり**: Small (1-2日)
- **担当者**: 未定
- **Status**: Todo
- **説明**:
  - ログインフォーム作成
  - バリデーション実装
  - エラーハンドリング
- **Definition of Done**:
  - [ ] LoginForm コンポーネント実装
  - [ ] VeeValidate + Zod バリデーション
  - [ ] Storybook ストーリー作成
  - [ ] エラー表示機能

#### 🏪 UI-002: 認証状態管理実装
- **優先度**: Critical
- **見積もり**: Medium (3-5日)
- **担当者**: 未定
- **Status**: Todo
- **説明**:
  - Piniaストア実装
  - トークン管理
  - 自動ログアウト機能
- **Definition of Done**:
  - [ ] authStore実装
  - [ ] トークン永続化
  - [ ] 自動リフレッシュ機能
  - [ ] ストアテスト作成

#### 🛡️ UI-003: ルートガード実装
- **優先度**: High
- **見積もり**: Small (1-2日)
- **担当者**: 未定
- **Status**: Todo
- **説明**:
  - 認証ミドルウェア実装
  - 権限ベースルーティング
  - リダイレクト処理
- **Definition of Done**:
  - [ ] auth.tsミドルウェア実装
  - [ ] rbac.tsミドルウェア実装
  - [ ] ルートガードテスト作成

#### 🎨 UI-004: 基本レイアウト実装
- **優先度**: High
- **見積もり**: Medium (3-5日)
- **担当者**: 未定
- **Status**: Todo
- **説明**:
  - ヘッダー・サイドバー実装
  - レスポンシブデザイン
  - ナビゲーション機能
- **Definition of Done**:
  - [ ] DefaultLayout実装
  - [ ] ヘッダーコンポーネント
  - [ ] サイドバーコンポーネント
  - [ ] モバイル対応確認

## 📊 Sprint進捗

### 全体進捗
- **計画タスク数**: 8
- **完了タスク数**: 0
- **進行中タスク数**: 0
- **進捗率**: 0%

### カテゴリ別進捗
- **Backend**: 0/4 (0%)
- **Frontend**: 0/4 (0%)

## 🚧 ブロッカー・課題
- なし

## 📝 Sprint振り返り用メモ
- Sprint開始日: 未定
- 主要な学び: 未記録
- 改善点: 未記録

## 📅 次Sprint予定
Sprint 2では事件管理ボードの基本機能実装を予定