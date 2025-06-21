# 最小環境変数ガイド

## 必須環境変数（3つだけ）

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your-openai-key
```

## Railway設定は自動
- `PORT` → Railway自動設定
- `NODE_ENV` → railway.tomlで設定済み

以上。他は全部オプション。