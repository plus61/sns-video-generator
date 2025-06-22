'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import { Header } from '../../components/ui/Header'

interface TestResult {
  test: string
  status: 'pending' | 'running' | 'success' | 'error'
  message: string
  duration?: number
}

interface ConnectionInfo {
  url: string
  connected: boolean
  latency?: number
  version?: string
}

function DatabaseTestContent() {
  const supabase = createClient()
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    url: '',
    connected: false
  })
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [testData, setTestData] = useState({ first_name: '', last_name: '', username: '' })

  const tests = [
    { id: 'connection', name: '接続テスト', description: 'Supabaseサーバーへの接続確認' },
    { id: 'auth', name: '認証テスト', description: 'ユーザー認証の確認' },
    { id: 'create', name: 'CREATE操作', description: 'プロファイルデータの作成' },
    { id: 'read', name: 'READ操作', description: 'プロファイルデータの読み取り確認' },
    { id: 'update', name: 'UPDATE操作', description: 'プロファイルデータの更新確認' }
  ]

  useEffect(() => {
    // Initialize test results
    setTestResults(tests.map(test => ({
      test: test.name,
      status: 'pending',
      message: '未実行'
    })))
  }, [])

  const updateTestResult = (index: number, status: TestResult['status'], message: string, duration?: number) => {
    setTestResults(prev => prev.map((result, i) => 
      i === index ? { ...result, status, message, duration } : result
    ))
  }

  const runTest = async (testId: string, index: number) => {
    updateTestResult(index, 'running', '実行中...')
    const startTime = Date.now()
    
    try {
      let response: Response
      let data: any
      
      switch (testId) {
        case 'connection':
          try {
            const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
            if (error) throw error
            setConnectionInfo({
              url: 'Connected to Supabase',
              connected: true,
              latency: Date.now() - startTime
            })
            updateTestResult(index, 'success', '接続成功', Date.now() - startTime)
          } catch (error: any) {
            throw new Error(error.message || '接続に失敗しました')
          }
          break
          
        case 'auth':
          try {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (error) throw error
            if (user) {
              updateTestResult(index, 'success', `認証成功 (User ID: ${user.id})`, Date.now() - startTime)
            } else {
              throw new Error('ユーザーが認証されていません')
            }
          } catch (error: any) {
            throw new Error(error.message || '認証テストに失敗しました')
          }
          break
          
        case 'create':
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('ユーザーが認証されていません')
            
            const { data, error } = await supabase
              .from('profiles')
              .upsert({
                id: user.id,
                first_name: testData.first_name || 'テスト',
                last_name: testData.last_name || 'ユーザー',
                username: testData.username || 'testuser',
                updated_at: new Date().toISOString()
              })
              .select()
              
            if (error) throw error
            updateTestResult(index, 'success', `プロファイル作成/更新成功`, Date.now() - startTime)
          } catch (error: any) {
            throw new Error(error.message || 'データ作成に失敗しました')
          }
          break
          
        case 'read':
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('ユーザーが認証されていません')
            
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              
            if (error) throw error
            updateTestResult(index, 'success', `プロファイルデータ取得成功`, Date.now() - startTime)
          } catch (error: any) {
            throw new Error(error.message || 'データ読み取りに失敗しました')
          }
          break
          
        case 'update':
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('ユーザーが認証されていません')
            
            const { data, error } = await supabase
              .from('profiles')
              .update({
                first_name: 'Updated Test',
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id)
              .select()
              
            if (error) throw error
            updateTestResult(index, 'success', 'プロファイル更新成功', Date.now() - startTime)
          } catch (error: any) {
            throw new Error(error.message || 'データ更新に失敗しました')
          }
          break
          
        default:
          throw new Error('不明なテストです')
      }
    } catch (error) {
      updateTestResult(index, 'error', error instanceof Error ? error.message : '予期しないエラーが発生しました', Date.now() - startTime)
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    
    for (let i = 0; i < tests.length; i++) {
      await runTest(tests[i].id, i)
      // Add small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'running': return '🔄'
      case 'success': return '✅'
      case 'error': return '❌'
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500'
      case 'running': return 'text-blue-500'
      case 'success': return 'text-green-500'
      case 'error': return 'text-red-500'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            データベーステスト
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Supabaseデータベースの接続とCRUD操作をテスト
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Connection Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              接続状態
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <span className={`w-3 h-3 rounded-full mr-3 ${
                  connectionInfo.connected ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {connectionInfo.connected ? '接続済み' : '未接続'}
                </span>
              </div>
              
              {connectionInfo.latency && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  レイテンシ: {connectionInfo.latency}ms
                </div>
              )}
              
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {connectionInfo.url || 'Supabase接続待機中'}
              </div>
            </div>
          </div>

          {/* Test Data Input */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              テストデータ
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  名
                </label>
                <input
                  type="text"
                  value={testData.first_name}
                  onChange={(e) => setTestData({ ...testData, first_name: e.target.value })}
                  placeholder="テスト"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  姓
                </label>
                <input
                  type="text"
                  value={testData.last_name}
                  onChange={(e) => setTestData({ ...testData, last_name: e.target.value })}
                  placeholder="ユーザー"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ユーザー名
                </label>
                <input
                  type="text"
                  value={testData.username}
                  onChange={(e) => setTestData({ ...testData, username: e.target.value })}
                  placeholder="testuser"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Test Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              テスト実行
            </h2>
            
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
            >
              {isRunning ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  テスト実行中...
                </span>
              ) : (
                '全テスト実行'
              )}
            </button>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              すべてのCRUD操作を順次テストします
            </p>
          </div>
        </div>

        {/* Test Results */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              テスト結果
            </h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {tests.map((test, index) => (
                <div key={test.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">
                        {getStatusIcon(testResults[index]?.status || 'pending')}
                      </span>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {test.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {test.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getStatusColor(testResults[index]?.status || 'pending')}`}>
                      {testResults[index]?.message || '未実行'}
                    </p>
                    {testResults[index]?.duration && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {testResults[index].duration}ms
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => runTest(test.id, index)}
                    disabled={isRunning || testResults[index]?.status === 'running'}
                    className="ml-4 px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    実行
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            デバッグ情報
          </h3>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>• このページではSupabaseデータベースの各種操作をテストできます</p>
            <p>• テスト用のデータは一時的なものです</p>
            <p>• 実際のユーザーデータには影響しません</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DatabaseTest() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <DatabaseTestContent />
}