# Railway リアルタイムモニタリング設定

## 1. Railwayログ監視（別ターミナル）
```bash
railway logs --tail
```

## 2. 定期的なヘルスチェック
```bash
# 30秒ごとにヘルスチェック
watch -n 30 'curl -s https://sns-video-generator-production.up.railway.app/api/health/simple-health | jq .'
```

## 3. 検証スクリプト実行
```bash
# 検証スクリプトの実行
./railway-test.sh
```

## 4. モニタリング項目
- [ ] アプリケーション起動ログ
- [ ] エラーログの有無
- [ ] メモリ使用量
- [ ] レスポンスタイム
- [ ] エンドポイントの可用性

## 5. アラート条件
- 500エラーが3回連続で発生
- レスポンスタイムが5秒を超える
- メモリ使用量が1GBを超える
- ヘルスチェックが失敗する