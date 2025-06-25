# Worker1タスク - ポート3001固定

## 即座実行（30分以内）

### 1. package.json修正
```json
"scripts": {
  "dev": "next dev -p 3001"
}
```

### 2. .env.local作成
```
PORT=3001
```

### 3. サーバーコード修正
ファイル: src/app/layout.tsx（必要なら）
```javascript
const PORT = process.env.PORT || 3001
```

### 4. 確認
```bash
npm run dev
# http://localhost:3001 でアクセス可能を確認
```

完了後報告してください。