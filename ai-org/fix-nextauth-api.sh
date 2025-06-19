#!/bin/bash

echo "🔧 Worker2: NextAuth API Routes 一括修正スクリプト"

cd /Users/yuichiroooosuger/sns-video-generator/sns-video-generator/src/app/api

# 修正対象ファイルリスト
files=(
    "upload-youtube/route.ts"
    "billing/portal/route.ts" 
    "billing/checkout/route.ts"
    "analyze-video-ai/route.ts"
    "queue/stats/route.ts"
    "process-video/route.ts"
    "test-db/route.ts"
    "analyze-video/route.ts"
    "video-uploads/[id]/route.ts"
    "video-uploads/route.ts"
    "export-segment/route.ts"
    "generate-video-file/route.ts"
    "user-usage/route.ts"
    "video-projects/route.ts"
    "generate-video/route.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "🔄 修正中: $file"
        
        # NextAuthインポートをSupabaseに置換
        sed -i.bak 's/import { getServerSession } from.*next-auth.*/import { createClient } from "@\/utils\/supabase\/server"/g' "$file"
        sed -i.bak 's/import.*authOptions.*from.*@\/lib\/auth.*//g' "$file"
        
        # セッション取得部分を置換
        sed -i.bak 's/const session = await getServerSession(authOptions)/const supabase = await createClient()\n    const { data: { user }, error } = await supabase.auth.getUser()/g' "$file"
        
        # 認証チェック部分を置換
        sed -i.bak 's/if (!session?.user?.id)/if (!user)/g' "$file"
        sed -i.bak 's/if (!session?.user)/if (!user)/g' "$file"
        sed -i.bak 's/session\.user\.id/user.id/g' "$file"
        sed -i.bak 's/session\.user\.email/user.email/g' "$file"
        
        # バックアップファイル削除
        rm -f "$file.bak"
        
        echo "✅ 完了: $file"
    else
        echo "⚠️  ファイル見つからず: $file"
    fi
done

echo "🎯 NextAuth API Routes 一括修正完了！"