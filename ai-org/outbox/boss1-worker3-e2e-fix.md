# Worker3タスク - E2Eテスト修正

## 即座実行（30分以内）

### 目標: 成功率36% → 50%

### 1. ポート修正
ファイル: e2e/*.spec.ts
```typescript
test.use({
  baseURL: 'http://localhost:3001' // 3000から変更
});
```

### 2. セレクタ修正
```typescript
// data-testid使用
await page.locator('[data-testid="youtube-url-input"]')
await page.locator('[data-testid="process-button"]')
await page.locator('[data-testid="loading-indicator"]')
```

### 3. タイムアウト調整
```typescript
await page.waitForSelector('[data-testid="result-container"]', {
  timeout: 30000 // 30秒に延長
})
```

### 4. テスト実行
```bash
npm run test:e2e
```

成功率を測定して報告してください。