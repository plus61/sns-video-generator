#!/usr/bin/env python3
import requests
import time
import json

print("=========================================")
print("Railway E2E テスト実行")
print("=========================================")
print()

base_url = "https://cooperative-wisdom.railway.app"

def test_endpoint(name, url):
    print(f"\n{name}")
    print("-" * 40)
    print(f"URL: {url}")
    
    try:
        start_time = time.time()
        response = requests.get(url, timeout=30)
        end_time = time.time()
        
        print(f"HTTPステータスコード: {response.status_code}")
        print(f"レスポンスタイム: {end_time - start_time:.3f}秒")
        
        # レスポンスヘッダーの一部を表示
        print("\n主要なレスポンスヘッダー:")
        headers_to_show = ['Content-Type', 'Server', 'X-Powered-By', 'Cache-Control']
        for header in headers_to_show:
            if header in response.headers:
                print(f"  {header}: {response.headers[header]}")
        
        # レスポンスボディ
        if response.headers.get('Content-Type', '').startswith('application/json'):
            try:
                body = response.json()
                print("\nレスポンスボディ (JSON):")
                print(json.dumps(body, indent=2, ensure_ascii=False))
            except:
                print("\nレスポンスボディ (Text):")
                print(response.text[:500] + "..." if len(response.text) > 500 else response.text)
        else:
            print("\nレスポンスボディ (HTML/Text) - 最初の200文字:")
            print(response.text[:200] + "..." if len(response.text) > 200 else response.text)
            
    except requests.exceptions.Timeout:
        print("エラー: タイムアウト (30秒)")
    except requests.exceptions.ConnectionError:
        print("エラー: 接続エラー")
    except Exception as e:
        print(f"エラー: {str(e)}")

# 1. ヘルスチェックエンドポイント
test_endpoint("1. ヘルスチェックエンドポイント (/api/health)", f"{base_url}/api/health")

# 2. ホームページ
test_endpoint("2. ホームページ (/)", base_url)

# 3. その他の主要APIエンドポイント
print("\n\n3. その他の主要APIエンドポイント")
print("=" * 40)

endpoints = [
    "/api/video-uploads",
    "/api/video-projects", 
    "/api/video-templates",
    "/api/audio-library"
]

for endpoint in endpoints:
    test_endpoint(f"エンドポイント: {endpoint}", f"{base_url}{endpoint}")

print("\n\n=========================================")
print("E2Eテスト完了")
print("=========================================")