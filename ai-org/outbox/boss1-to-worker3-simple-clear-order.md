# Boss1 → Worker3 シンプルで明確な指示

## 一つだけ覚えてください

**Railway だけ。他は忘れる。**

## あなたのタスク（1つだけ）

### TASK-20240625-RAILWAY-003

Railwayにデプロイされたアプリをテストする。

### テストURL
```
https://cooperative-wisdom.railway.app
```

### やること（3つだけ）

1. **ヘルスチェック**
   ```javascript
   fetch('https://cooperative-wisdom.railway.app/api/health')
   ```

2. **YouTube API テスト**
   ```javascript
   fetch('https://cooperative-wisdom.railway.app/api/upload-youtube', {
     method: 'POST',
     body: JSON.stringify({ url: 'https://youtube.com/shorts/test' })
   })
   ```

3. **結果を報告**
   ```json
   {
     "taskId": "TASK-20240625-RAILWAY-003",
     "health": "pass or fail",
     "youtube": "pass or fail"
   }
   ```

## やらないこと

- ❌ Render
- ❌ Glitch
- ❌ その他のプラットフォーム

## 今すぐ実行

Railwayのテストだけ。シンプルに。確実に。

以上。