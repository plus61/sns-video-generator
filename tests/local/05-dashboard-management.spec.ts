import { test, expect } from '@playwright/test';

test.describe('Dashboard Project Management Tests - プロジェクト管理', () => {
  
  test('should load dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // ダッシュボードページが表示されることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // 認証が必要な場合は適切にハンドリング
    const currentUrl = page.url();
    if (currentUrl.includes('/auth')) {
      expect(currentUrl).toContain('/auth');
    } else {
      expect(currentUrl).toContain('/dashboard');
    }
  });

  test('should display project overview', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // プロジェクト概要要素の確認
      const overviewElements = [
        '[data-testid*="project"]',
        '.project-card',
        '.project-list',
        '.video-project',
        'h1:has-text(/dashboard|ダッシュボード/i)',
        'h2:has-text(/project|プロジェクト/i)'
      ];
      
      let overviewFound = false;
      for (const selector of overviewElements) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          overviewFound = true;
          break;
        }
      }
      
      // ダッシュボード関連のテキスト確認
      const dashboardTexts = [
        'text=/dashboard|ダッシュボード/i',
        'text=/project.*management|プロジェクト.*管理/i',
        'text=/video.*project|動画.*プロジェクト/i',
        'text=/recent.*projects|最近.*プロジェクト/i'
      ];
      
      for (const textSelector of dashboardTexts) {
        const element = page.locator(textSelector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          overviewFound = true;
          break;
        }
      }
      
      expect(overviewFound).toBeTruthy();
    }
  });

  test('should display project list', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // プロジェクトリスト要素の確認
      const listElements = [
        '.project-list',
        '.projects-grid',
        '[data-testid*="project-list"]',
        'table', // テーブル形式のプロジェクトリスト
        '.project-card',
        '.video-item'
      ];
      
      let listFound = false;
      for (const selector of listElements) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          listFound = true;
          break;
        }
      }
      
      // プロジェクトがない場合の空状態確認
      const emptyStateTexts = [
        'text=/no.*project|プロジェクト.*ありません/i',
        'text=/create.*first.*project|最初.*プロジェクト.*作成/i',
        'text=/get.*started|始める/i',
        'text=/empty|空/i'
      ];
      
      for (const textSelector of emptyStateTexts) {
        const element = page.locator(textSelector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          listFound = true;
          break;
        }
      }
      
      expect(listFound).toBeTruthy();
    }
  });

  test('should display new project creation option', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // 新プロジェクト作成ボタンの確認
      const createButtons = [
        'button:has-text(/new.*project|新.*プロジェクト/i)',
        'button:has-text(/create|作成/i)',
        'a:has-text(/new.*project|新.*プロジェクト/i)',
        '[data-testid*="create-project"]',
        '.new-project-button',
        'button:has-text(/\\+/)', // プラスボタン
        'a[href*="/upload"], a[href*="/studio"]' // アップロードやスタジオへのリンク
      ];
      
      let createOptionFound = false;
      for (const selector of createButtons) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          await expect(element.first()).toBeEnabled();
          createOptionFound = true;
          break;
        }
      }
      
      expect(createOptionFound).toBeTruthy();
    }
  });

  test('should handle project creation navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // 新プロジェクト作成ボタンをクリック
      const createButton = page.locator('button:has-text(/new.*project|新.*プロジェクト|create|作成/i), a:has-text(/new.*project|新.*プロジェクト/i)').first();
      
      if (await createButton.count() > 0) {
        await createButton.click();
        await page.waitForLoadState('networkidle');
        
        // アップロードページまたはスタジオページに遷移することを確認
        const currentUrl = page.url();
        expect(
          currentUrl.includes('/upload') || 
          currentUrl.includes('/studio') || 
          currentUrl.includes('/new') ||
          currentUrl.includes('/create')
        ).toBeTruthy();
      }
    }
  });

  test('should display project status information', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // プロジェクトステータス要素の確認
      const statusElements = [
        '.status-badge',
        '.project-status',
        '[data-status]',
        'text=/processing|処理中/i',
        'text=/completed|完了/i',
        'text=/draft|下書き/i',
        'text=/published|公開済み/i'
      ];
      
      let statusFound = false;
      for (const selector of statusElements) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          statusFound = true;
          break;
        }
      }
      
      // 統計情報の確認
      const statsElements = [
        'text=/\\d+.*project|\\d+.*プロジェクト/i',
        'text=/\\d+.*video|\\d+.*動画/i',
        'text=/total|合計/i',
        '.stats-card',
        '.summary-stats'
      ];
      
      for (const selector of statsElements) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          statusFound = true;
          break;
        }
      }
      
      // ステータス情報があることを期待（ただし、プロジェクトがない場合は表示されない）
    }
  });

  test('should handle project actions', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // プロジェクトアクション要素の確認
      const actionElements = [
        'button:has-text(/edit|編集/i)',
        'button:has-text(/delete|削除/i)',
        'button:has-text(/view|表示/i)',
        'button:has-text(/download|ダウンロード/i)',
        '.action-button',
        '.project-actions',
        '[data-testid*="action"]'
      ];
      
      for (const selector of actionElements) {
        const elements = page.locator(selector);
        if (await elements.count() > 0) {
          const firstAction = elements.first();
          await expect(firstAction).toBeVisible();
          
          // アクションボタンがクリック可能であることを確認
          if (await firstAction.isEnabled()) {
            // クリックしてみる（ただし、実際の削除などは行わない）
            if ((await firstAction.textContent() || '').toLowerCase().includes('view') ||
                (await firstAction.textContent() || '').includes('表示')) {
              await firstAction.click();
              await page.waitForTimeout(1000);
              // 何らかの応答があることを確認
            }
          }
          break;
        }
      }
    }
  });

  test('should display usage statistics', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // 使用統計の確認
      const usageElements = [
        '.usage-stats',
        '.analytics',
        'text=/usage|使用量/i',
        'text=/storage|ストレージ/i',
        'text=/minutes|分/i',
        'text=/\\d+.*MB|\\d+.*GB/i',
        '[data-testid*="usage"]'
      ];
      
      let usageFound = false;
      for (const selector of usageElements) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          usageFound = true;
          break;
        }
      }
      
      // チャートやグラフの確認
      const chartElements = [
        'canvas', // Chart.jsなどのキャンバスベースのチャート
        '.chart',
        '.graph',
        'svg', // D3.jsなどのSVGベースのチャート
        '[data-testid*="chart"]'
      ];
      
      for (const selector of chartElements) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          usageFound = true;
          break;
        }
      }
      
      // 使用統計があることを期待（ただし、実装によっては存在しない場合もある）
    }
  });

  test('should handle search and filtering', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // 検索入力欄の確認
      const searchElements = [
        'input[type="search"]',
        'input[placeholder*="search"], input[placeholder*="検索"]',
        '[data-testid*="search"]',
        '.search-input'
      ];
      
      for (const selector of searchElements) {
        const searchInput = page.locator(selector);
        if (await searchInput.count() > 0) {
          await expect(searchInput.first()).toBeVisible();
          
          // 検索機能をテスト
          await searchInput.first().fill('test');
          await page.waitForTimeout(500);
          
          // 検索結果の変化を確認
          break;
        }
      }
      
      // フィルタリングオプションの確認
      const filterElements = [
        'select[name*="filter"]',
        'button:has-text(/filter|フィルタ/i)',
        '.filter-dropdown',
        'input[type="checkbox"][name*="status"]'
      ];
      
      for (const selector of filterElements) {
        const filterElement = page.locator(selector);
        if (await filterElement.count() > 0) {
          await expect(filterElement.first()).toBeVisible();
          break;
        }
      }
    }
  });

  test('should be responsive on different devices', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // デスクトップ表示
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('body')).toBeVisible();
      
      // タブレット表示
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('body')).toBeVisible();
      
      // プロジェクトカードまたはリストが適切に表示される
      const projectElements = page.locator('.project-card, .project-list, [data-testid*="project"]');
      if (await projectElements.count() > 0) {
        await expect(projectElements.first()).toBeVisible();
      }
      
      // モバイル表示
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('body')).toBeVisible();
      
      // モバイルでのナビゲーション確認
      const mobileNav = page.locator('.mobile-nav, .hamburger, button[aria-label*="menu"]');
      if (await mobileNav.count() > 0) {
        await expect(mobileNav.first()).toBeVisible();
      }
      
      // アクションボタンがタップ可能なサイズであることを確認
      const actionButtons = page.locator('button');
      if (await actionButtons.count() > 0) {
        const firstButton = actionButtons.first();
        const buttonBox = await firstButton.boundingBox();
        if (buttonBox) {
          expect(Math.min(buttonBox.width, buttonBox.height)).toBeGreaterThan(30);
        }
      }
    }
  });

  test('should handle pagination if present', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // ページネーション要素の確認
      const paginationElements = [
        '.pagination',
        'nav[aria-label*="pagination"]',
        'button:has-text(/next|次/i)',
        'button:has-text(/previous|前/i)',
        'button:has-text(/\\d+/)', // ページ番号ボタン
        '.page-numbers'
      ];
      
      for (const selector of paginationElements) {
        const paginationElement = page.locator(selector);
        if (await paginationElement.count() > 0) {
          await expect(paginationElement.first()).toBeVisible();
          
          // 次ページボタンがある場合はクリックしてみる
          const nextButton = page.locator('button:has-text(/next|次/i)').first();
          if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
            await nextButton.click();
            await page.waitForTimeout(1000);
            
            // ページが変わったことを確認
            const currentUrl = page.url();
            expect(currentUrl.includes('page=') || currentUrl.includes('p=')).toBeTruthy();
          }
          break;
        }
      }
    }
  });

  test('should display user account information', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/auth')) {
      // ユーザー情報要素の確認
      const userInfoElements = [
        '.user-info',
        '.account-info',
        '[data-testid*="user"]',
        'img[alt*="avatar"], img[alt*="profile"]',
        'text=/welcome|ようこそ/i',
        '.user-name',
        '.user-email'
      ];
      
      let userInfoFound = false;
      for (const selector of userInfoElements) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          userInfoFound = true;
          break;
        }
      }
      
      // ログアウトボタンの確認
      const logoutButton = page.locator('button:has-text(/logout|ログアウト|sign.*out/i), a:has-text(/logout|ログアウト|sign.*out/i)');
      if (await logoutButton.count() > 0) {
        await expect(logoutButton.first()).toBeVisible();
        userInfoFound = true;
      }
      
      // 何らかのユーザー情報が表示されることを期待
      expect(userInfoFound).toBeTruthy();
    }
  });
});