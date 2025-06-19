'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/ui/Header'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'

interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

interface APISettings {
  openai_api_key?: string
  youtube_api_key?: string
  tiktok_access_token?: string
  instagram_access_token?: string
}

interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  video_processing_complete: boolean
  upload_notifications: boolean
  weekly_digest: boolean
}

function SettingsContent() {
  useAuth({ required: true })
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'notifications'>('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    email: '',
    name: '',
    created_at: '',
    updated_at: ''
  })

  // API settings state
  const [apiSettings, setApiSettings] = useState<APISettings>({})

  // Notification settings state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: false,
    video_processing_complete: true,
    upload_notifications: true,
    weekly_digest: false
  })

  useEffect(() => {
    if (session?.user) {
      setProfile({
        id: session.user.id || '',
        email: session.user.email || '',
        name: session.user.name || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }, [session])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleProfileSave = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      showMessage('success', 'プロフィールを更新しました')
    } catch (error) {
      showMessage('error', 'プロフィールの更新に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleApiSave = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      showMessage('success', 'API設定を保存しました')
    } catch (error) {
      showMessage('error', 'API設定の保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleNotificationSave = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      showMessage('success', '通知設定を保存しました')
    } catch (error) {
      showMessage('error', '通知設定の保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            設定
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            アカウント設定とアプリケーションの設定を管理
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex">
              <span className="mr-2">
                {message.type === 'success' ? '✅' : '❌'}
              </span>
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {[
                { id: 'profile', name: 'プロフィール', icon: '👤' },
                { id: 'api', name: 'API設定', icon: '🔑' },
                { id: 'notifications', name: '通知設定', icon: '🔔' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    プロフィール設定
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          ユーザー名
                        </label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          メールアドレス
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          メールアドレスは変更できません
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        プロフィール画像URL
                      </label>
                      <input
                        type="url"
                        value={profile.avatar_url || ''}
                        onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                        placeholder="https://example.com/avatar.jpg"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleProfileSave}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
                      >
                        {isSaving ? '保存中...' : 'プロフィールを保存'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* API Tab */}
              {activeTab === 'api' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    API設定
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        OpenAI API Key
                      </label>
                      <input
                        type="password"
                        value={apiSettings.openai_api_key || ''}
                        onChange={(e) => setApiSettings({ ...apiSettings, openai_api_key: e.target.value })}
                        placeholder="sk-..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        動画解析とAI機能に使用されます
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        YouTube API Key
                      </label>
                      <input
                        type="password"
                        value={apiSettings.youtube_api_key || ''}
                        onChange={(e) => setApiSettings({ ...apiSettings, youtube_api_key: e.target.value })}
                        placeholder="AIza..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        YouTube動画のアップロードに使用されます
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        TikTok Access Token
                      </label>
                      <input
                        type="password"
                        value={apiSettings.tiktok_access_token || ''}
                        onChange={(e) => setApiSettings({ ...apiSettings, tiktok_access_token: e.target.value })}
                        placeholder="token..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Instagram Access Token
                      </label>
                      <input
                        type="password"
                        value={apiSettings.instagram_access_token || ''}
                        onChange={(e) => setApiSettings({ ...apiSettings, instagram_access_token: e.target.value })}
                        placeholder="token..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleApiSave}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
                      >
                        {isSaving ? '保存中...' : 'API設定を保存'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    通知設定
                  </h2>
                  
                  <div className="space-y-6">
                    {[
                      { key: 'email_notifications', label: 'メール通知', desc: '重要な更新をメールで受信' },
                      { key: 'push_notifications', label: 'プッシュ通知', desc: 'ブラウザ通知を有効にする' },
                      { key: 'video_processing_complete', label: '動画処理完了通知', desc: '動画の処理が完了したときに通知' },
                      { key: 'upload_notifications', label: 'アップロード通知', desc: '動画のアップロードに関する通知' },
                      { key: 'weekly_digest', label: '週間ダイジェスト', desc: '週次の活動サマリーを受信' }
                    ].map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {setting.label}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {setting.desc}
                          </p>
                        </div>
                        <button
                          onClick={() => setNotifications({
                            ...notifications,
                            [setting.key]: !notifications[setting.key as keyof NotificationSettings]
                          })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            notifications[setting.key as keyof NotificationSettings]
                              ? 'bg-blue-600'
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notifications[setting.key as keyof NotificationSettings]
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}

                    <div className="pt-4">
                      <button
                        onClick={handleNotificationSave}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
                      >
                        {isSaving ? '保存中...' : '通知設定を保存'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}