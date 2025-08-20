# 環境分離セットアップガイド

Astar Management フロントエンドは、3つの異なる環境で動作するよう設定されています。

## 📋 環境構成

### 1. フロントエンドオンリー環境
**目的**: UI/UX開発に集中、バックエンド不要
- Mock APIを使用
- 高速起動・開発
- バックエンド依存なし

### 2. バックエンド連携開発環境  
**目的**: API統合テスト、フルスタック開発
- 実際のSpring Boot APIに接続
- Mock認証使用
- 統合テスト可能

### 3. Auth0本番環境
**目的**: 本番デプロイ用
- Auth0認証フロー
- 本番レベルセキュリティ
- 静的生成対応

## 🚀 起動方法

### フロントエンドオンリー開発
```bash
cd frontend
bun run dev:frontend
```

### バックエンド連携開発
```bash
# 1. バックエンドを起動（別ターミナル）
cd backend
./gradlew bootRun

# 2. フロントエンドを起動
cd frontend  
bun run dev:integrated
```

### 本番環境ビルド
```bash
cd frontend
bun run build:production
```

## 🔐 認証情報

### フロントエンドオンリー環境のテストユーザー

| メールアドレス | パスワード | 役割 | 説明 |
|---|---|---|---|
| admin@example.com | admin123 | admin | 管理者 |
| lawyer@example.com | lawyer123 | lawyer | 弁護士 |
| staff@example.com | staff123 | staff | スタッフ |
| user@example.com | user123 | user | 一般ユーザー |

### バックエンド連携環境
Spring Boot側のmock認証を使用します。詳細はバックエンドのドキュメントを参照してください。

### 本番環境
Auth0の設定が必要です。`.env.production`でAuth0の認証情報を設定してください。

## ⚙️ 設定ファイル

### 環境変数ファイル
- `.env.frontend-only` - フロントエンド単体用
- `.env.development` - バックエンド連携用
- `.env.production` - 本番環境用
- `.env.example` - 参考用（既存）

### 設定の仕組み
`nuxt.config.ts`で`NUXT_PUBLIC_API_MODE`環境変数を読み取り、以下のように分岐：

- `frontend-only`: Mock API使用、プロキシ無効
- `development`: Spring Boot API接続、プロキシ有効
- `production`: Auth0認証、本番設定

## 🔄 環境の切り替え

### 開発中の切り替え
```bash
# フロントエンド単体 → バックエンド連携
bun run dev:integrated

# バックエンド連携 → フロントエンド単体
bun run dev:frontend
```

### Nuxt設定の確認
起動時のコンソールで現在の環境設定を確認できます：
- API Mode: `frontend-only` | `development` | `production`
- Base URL: 使用中のAPI URL
- Auth Provider: `local` | `auth0`

## 🛠️ 開発のベストプラクティス

### フロントエンド開発時
1. UI/UXに集中したい場合は`dev:frontend`を使用
2. Mock APIはNuxt Server API Routesで実装
3. 既存の`useAuth()`コンポーザブルをそのまま使用

### 統合開発時
1. バックエンドとの連携確認は`dev:integrated`を使用
2. Spring BootのMock認証で認証フローをテスト
3. APIレスポンス形式の検証

### 本番デプロイ時
1. Auth0設定を`.env.production`で構成
2. `build:production`でビルド
3. 環境変数は本番環境で適切に設定

## 🔍 トラブルシューティング

### よくある問題

**1. Mock APIが動かない**
- `NUXT_PUBLIC_API_MODE=frontend-only`が設定されているか確認
- `server/api/mock/auth/`ディレクトリが存在するか確認

**2. バックエンド接続できない**
- Spring Bootが起動しているか確認
- `http://localhost:8080`でAPIが応答するか確認

**3. Auth0認証が失敗する**
- `.env.production`のAuth0設定が正しいか確認
- Auth0ダッシュボードで設定を確認

### ログの確認
```bash
# コンソールでAPI Mode確認
# 起動時に表示される設定を確認

# ネットワークタブでAPI呼び出し確認
# ブラウザの開発者ツールで確認
```

## 📁 ファイル構造

```
frontend/
├── .env.frontend-only          # フロントエンド単体環境
├── .env.development           # バックエンド連携環境  
├── .env.production            # 本番環境
├── nuxt.config.ts             # 環境別設定対応済み
├── server/api/mock/auth/      # Mock API実装
│   ├── mockData.ts           # テストデータ
│   ├── login.post.ts         # ログインAPI
│   ├── logout.post.ts        # ログアウトAPI
│   ├── validate.get.ts       # セッション検証API
│   └── refresh.post.ts       # トークン更新API
└── package.json               # 環境別スクリプト追加済み
```

この設定により、開発段階に応じて最適な環境を選択でき、既存のSidebase Auth設定を最大限活用できます。