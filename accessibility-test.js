const { chromium } = require('playwright');

async function runAccessibilityChecks() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 アクセシビリティチェックを開始します...\n');

  try {
    // ホームページのアクセシビリティチェック
    console.log('📝 ホームページをチェック中...');
    await page.goto('http://localhost:3000');
    await checkAccessibility(page, 'ホームページ');

    // サインインページのアクセシビリティチェック
    console.log('🔐 サインインページをチェック中...');
    await page.goto('http://localhost:3000/signin');
    await checkAccessibility(page, 'サインインページ');

    // アップロードページのアクセシビリティチェック
    console.log('📤 アップロードページをチェック中...');
    await page.goto('http://localhost:3000/upload');
    await checkAccessibility(page, 'アップロードページ');

    // スタジオページのアクセシビリティチェック
    console.log('🎬 スタジオページをチェック中...');
    await page.goto('http://localhost:3000/studio');
    await checkAccessibility(page, 'スタジオページ');

    console.log('\n✅ アクセシビリティチェック完了！');

  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message);
  } finally {
    await browser.close();
  }
}

async function checkAccessibility(page, pageName) {
  const results = {
    altTexts: 0,
    headings: 0,
    labels: 0,
    landmarks: 0,
    focusable: 0,
    issues: []
  };

  try {
    // 画像のalt属性チェック
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      if (alt) results.altTexts++;
      else results.issues.push('画像にalt属性がありません');
    }

    // 見出し構造チェック
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    results.headings = headings.length;

    // フォームラベルチェック
    const inputs = await page.locator('input, textarea, select').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        if (label > 0) results.labels++;
        else if (!ariaLabel && !placeholder) {
          results.issues.push('入力要素にラベルがありません');
        }
      } else if (ariaLabel || placeholder) {
        results.labels++;
      } else {
        results.issues.push('入力要素にラベルがありません');
      }
    }

    // ランドマークチェック
    const landmarks = await page.locator('main, nav, header, footer, aside, section[aria-label], section[aria-labelledby]').count();
    results.landmarks = landmarks;

    // フォーカス可能要素チェック
    const focusableElements = await page.locator('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])').count();
    results.focusable = focusableElements;

    // キーボードナビゲーションチェック
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    if (!focusedElement || focusedElement === 'BODY') {
      results.issues.push('キーボードナビゲーションが機能していません');
    }

    // 色のコントラストチェック（簡易版）
    const textElements = await page.locator('p, span, div, h1, h2, h3, h4, h5, h6, a, button').first();
    if (await textElements.count() > 0) {
      const styles = await textElements.evaluate(el => {
        const computed = getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      if (styles.color === 'rgb(255, 255, 255)' && styles.backgroundColor === 'rgb(255, 255, 255)') {
        results.issues.push('テキストの色と背景色のコントラストが不十分です');
      }
    }

  } catch (error) {
    results.issues.push(`チェック中にエラーが発生しました: ${error.message}`);
  }

  // 結果出力
  console.log(`  ${pageName}の結果:`);
  console.log(`    ✓ alt属性付き画像: ${results.altTexts}個`);
  console.log(`    ✓ 見出し要素: ${results.headings}個`);
  console.log(`    ✓ ラベル付き入力要素: ${results.labels}個`);
  console.log(`    ✓ ランドマーク要素: ${results.landmarks}個`);
  console.log(`    ✓ フォーカス可能要素: ${results.focusable}個`);
  
  if (results.issues.length > 0) {
    console.log(`    ⚠️ 問題点: ${results.issues.length}件`);
    results.issues.forEach(issue => console.log(`      - ${issue}`));
  } else {
    console.log(`    ✅ 問題なし`);
  }
  console.log('');
}

// テスト実行
runAccessibilityChecks();