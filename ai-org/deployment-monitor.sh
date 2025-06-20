#!/bin/bash
# Deployment monitoring script

echo "🔍 デプロイメント監視開始..."
echo "開始時刻: $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================"

check_count=0
max_checks=20  # 10分間（30秒ごと）

while [ $check_count -lt $max_checks ]; do
    check_count=$((check_count + 1))
    echo -e "\n📊 チェック #$check_count ($(date '+%H:%M:%S'))"
    
    # Vercel status
    echo -n "🔷 Vercel: "
    vercel_status=$(curl -s -o /dev/null -w "%{http_code}" https://sns-video-generator-plus62s-projects.vercel.app)
    echo "HTTP $vercel_status"
    
    # Railway status
    echo -n "🔶 Railway: "
    railway_status=$(curl -s -o /dev/null -w "%{http_code}" https://sns-video-generator-production-ad7957.up.railway.app)
    echo "HTTP $railway_status"
    
    # Check specific endpoints
    if [ $railway_status -eq 200 ]; then
        echo "  ✅ Railway is responding!"
        # Test API endpoint
        api_status=$(curl -s -o /dev/null -w "%{http_code}" https://sns-video-generator-production-ad7957.up.railway.app/api/health)
        echo "  📡 API Health: HTTP $api_status"
    fi
    
    # Success condition
    if [ $vercel_status -eq 200 ] && [ $railway_status -eq 200 ]; then
        echo -e "\n🎉 両環境が正常に動作しています！"
        echo "デプロイ成功時刻: $(date '+%Y-%m-%d %H:%M:%S')"
        exit 0
    fi
    
    # Wait before next check
    if [ $check_count -lt $max_checks ]; then
        echo "  ⏳ 30秒後に再チェック..."
        sleep 30
    fi
done

echo -e "\n❌ タイムアウト: 10分経過してもデプロイが完了しませんでした"
exit 1