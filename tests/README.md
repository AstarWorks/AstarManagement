# Tests

統合テスト・E2Eテスト・パフォーマンステストの配置

## 構成

- `e2e/` - End-to-End テスト（Playwright使用）
- `integration/` - 統合テスト（TestContainers使用）
- `performance/` - パフォーマンステスト（k6使用）
- `fixtures/` - テストデータ・モックデータ

## テスト実行

### E2Eテスト
```bash
cd tests/e2e
npx playwright test
```

### 統合テスト
```bash
./gradlew integrationTest
```

### パフォーマンステスト
```bash
cd tests/performance
k6 run load-test.js
```