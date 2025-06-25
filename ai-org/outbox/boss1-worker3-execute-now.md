# 【Boss1→Worker3】即時実行指示

## Worker3へ

品質保証の専門家として、E2Eテストの成功率向上をお願いします。
以下のタスクを即座に実行してください。

## 🚨 実行タスク

### 1. E2Eテスト修正（30分以内）

**e2e/simple-test.spec.ts を以下のように修正**:

```typescript
import { test, expect } from '@playwright/test';

test.use({
  baseURL: 'http://localhost:3001'  // 3000から3001に変更
});

test('シンプル動画処理のE2Eテスト', async ({ page }) => {
  // /simpleページに直接アクセス
  await page.goto('/simple');
  
  // ページ読み込み待機
  await page.waitForLoadState('networkidle');
  
  // YouTube URL入力
  const urlInput = page.locator('[data-testid="youtube-url-input"]');
  await expect(urlInput).toBeVisible();
  await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  
  // 処理ボタンクリック
  const processButton = page.locator('[data-testid="process-button"]');
  await expect(processButton).toBeEnabled();
  await processButton.click();
  
  // ローディング表示確認
  const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
  await expect(loadingSpinner).toBeVisible();
  
  // 結果表示待機（最大60秒）
  const resultContainer = page.locator('[data-testid="result-container"]');
  await expect(resultContainer).toBeVisible({ timeout: 60000 });
  
  // セグメント表示確認
  const segments = page.locator('text=/segment|セグメント/i');
  await expect(segments.first()).toBeVisible();
});
```

### 2. タイムアウト設定の調整

**playwright.config.ts で以下を設定**:
```typescript
use: {
  baseURL: 'http://localhost:3001',
  timeout: 60000,  // 60秒
  actionTimeout: 30000,  // 30秒
}
```

### 3. テスト実行と成功率測定

```bash
# テスト実行
npm run test:e2e

# 成功率を記録
# 目標: 36% → 50%以上
```

## 📊 期待する報告

30分後に以下を報告してください：
1. テストケース修正完了
2. 実行結果（成功/失敗の詳細）
3. 成功率の改善度

**品質保証のプロとして、確実な改善を！**

---
Boss1
実行指示