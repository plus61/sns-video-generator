// APIヘルスチェック
async function checkAPIHealth() {
  console.log('=== API Health Check ===')
  
  const endpoints = [
    { url: '/api/health', method: 'GET' },
    { url: '/api/upload-video', method: 'GET' },
    { url: '/api/youtube-download', method: 'GET' },
    { url: '/api/export-segment', method: 'GET' },
  ]
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint.url}`, {
        method: endpoint.method,
      })
      
      console.log(`${endpoint.url}: ${response.status} ${response.statusText}`)
      
      if (response.status === 200) {
        const text = await response.text()
        console.log(`  Response: ${text.substring(0, 100)}`)
      }
    } catch (error) {
      console.log(`${endpoint.url}: ❌ ${error.message}`)
    }
  }
}

checkAPIHealth()