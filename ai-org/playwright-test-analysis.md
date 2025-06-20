# Playwrightテストエラー改善案
作成日時: #午後
作成者: Worker3

## 1. 本番環境と期待値の差異分析

### 発見された差異

#### ❌ h1タグの不一致
- **期待値**: `h1`タグに "SNS Video Generator"
- **実際**: 
  - ヘッダー内に "SNS Video Generator" (h1)
  - メインコンテンツに "AI動画生成プラットフォーム" (h1)
- **問題**: 複数のh1タグが存在し、`.locator('h1')`が最初の要素を取得

#### ❌ フッターコンポーネントの欠如
- **期待値**: フッターが存在することを期待するテストがある可能性
- **実際**: フッターコンポーネントが存在しない
- **影響**: フッター関連のテストが失敗

#### ✅ メタタグは正しく設定
- **期待値**: `description` = "AI-powered social media video generation platform"
- **実際**: 同一の値が設定されている
- **状態**: 問題なし

## 2. 即座に実施可能な改善案

### 短期的修正（デプロイ不要）

```typescript
// tests/railway-deployment.spec.ts の修正

// 修正前
await expect(page.locator('h1')).toContainText('SNS Video Generator');

// 修正後（より具体的なセレクタ）
await expect(page.locator('header h1')).toContainText('SNS Video Generator');
// または
await expect(page.locator('h1').first()).toContainText('SNS Video Generator');
```

### テストの安定性向上策

```typescript
// 1. 要素の存在を確認してからテキストを検証
const h1Element = page.locator('h1').first();
await expect(h1Element).toBeVisible();
await expect(h1Element).toContainText('SNS Video Generator');

// 2. 複数のh1タグに対応
const h1Elements = page.locator('h1');
const h1Count = await h1Elements.count();
expect(h1Count).toBeGreaterThanOrEqual(1);

// 3. タイムアウトの調整
await expect(page.locator('h1').first()).toContainText('SNS Video Generator', {
  timeout: 10000 // 10秒のタイムアウト
});
```

## 3. 整合性を保つための改善案

### A. テストの柔軟性向上

```typescript
// 本番環境の実装に合わせたテスト
test('ヘッダーとメインコンテンツのタイトルが表示される', async ({ page }) => {
  await page.goto(SITE_URL);
  
  // ヘッダーのh1
  await expect(page.locator('header h1')).toContainText('SNS Video Generator');
  
  // メインコンテンツのh1
  await expect(page.locator('main h1')).toContainText('AI動画生成プラットフォーム');
});
```

### B. データテスト属性の活用

```typescript
// 将来的な実装提案
// HTML: <h1 data-testid="site-title">SNS Video Generator</h1>
await expect(page.locator('[data-testid="site-title"]')).toContainText('SNS Video Generator');
```

## 4. 長期的な改善提案

### 1. **Visual Regression Testing の導入**
```typescript
// スクリーンショット比較によるテスト
await expect(page).toHaveScreenshot('homepage.png', {
  fullPage: true,
  animations: 'disabled'
});
```

### 2. **環境差分を吸収するテスト構造**
```typescript
// config/test-selectors.ts
export const selectors = {
  production: {
    mainTitle: 'header h1',
    heroTitle: 'main h1'
  },
  development: {
    mainTitle: 'h1.site-title',
    heroTitle: 'h1.hero-title'
  }
};
```

### 3. **Contract Testing の実装**
```typescript
// APIレスポンスの構造を検証
const healthCheck = await request.get('/api/health');
expect(healthCheck).toMatchSchema({
  type: 'object',
  properties: {
    status: { type: 'string' },
    timestamp: { type: 'string' }
  }
});
```

### 4. **監視とアラートの統合**
```typescript
// 本番環境の継続的監視
class ProductionMonitor {
  async checkCriticalElements() {
    const criticalTests = [
      { selector: 'h1', expected: 'SNS Video Generator' },
      { selector: '[href="/upload"]', type: 'link' }
    ];
    
    for (const test of criticalTests) {
      await this.verifyElement(test);
    }
  }
}
```

### 5. **テストの優先順位付け**
```typescript
test.describe('Critical Path Tests', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 
    'Critical tests run only on Chromium');
  
  test('必須機能の動作確認', async ({ page }) => {
    // ビジネスクリティカルな機能のみテスト
  });
});
```

## 5. 実装優先順位

1. **即時対応**（5分以内）
   - テストセレクタの修正
   - タイムアウトの調整

2. **短期対応**（1日以内）
   - data-testid属性の追加
   - テストの分類と優先順位付け

3. **中期対応**（1週間以内）
   - Visual Regression Testingの導入
   - 環境別設定の実装

4. **長期対応**（1ヶ月以内）
   - Contract Testingの実装
   - 継続的監視システムの構築

## 総括

現在のテストエラーは、本番環境の実装とテストの期待値のミスマッチが原因です。デプロイを変更せずに、テスト側の修正で対応可能です。長期的には、より堅牢なテスト戦略の実装を推奨します。