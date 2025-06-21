# 1行エラー解決集

## Railway エラー

**404 Not Found**
```bash
echo "NEXT_PUBLIC_SUPABASE_URL=your-url" >> .env
```

**Missing .next directory**
```bash
npm run build && git push
```

**PORT undefined**
```bash
echo 'PORT = "${PORT}"' >> railway.toml
```

## Build エラー

**TypeScript errors**
```bash
npm install typescript@5.8.3 --save-dev
```

**Module not found**
```bash
rm -rf node_modules package-lock.json && npm install
```

## Runtime エラー

**Supabase connection failed**
```bash
echo "Check NEXT_PUBLIC_ prefix in env vars"
```

**Memory limit exceeded**
```bash
rm -rf .next && npm run build
```

**Cannot find module 'typescript'**
```bash
npm install --save-dev typescript @types/node @types/react
```

## 究極の解決策
```bash
git reset --hard && git pull && npm install && git push
```

以上。考えるな、実行せよ。