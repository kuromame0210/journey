'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeftIcon, 
  UserIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const router = useRouter()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      // セッション状態を確認
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.log('セッションが存在しません。ローカルストレージをクリアして認証画面へ')
        // ローカルストレージを手動でクリア
        localStorage.clear()
        router.push('/auth')
        return
      }

      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('ログアウトエラー:', error)
        // エラーでも強制的にログアウトする
        localStorage.clear()
      }
      
      router.push('/auth')
    } catch (error) {
      console.error('Error signing out:', error)
      // エラーが発生してもローカルストレージをクリアして認証画面へ
      localStorage.clear()
      router.push('/auth')
    } finally {
      setIsLoggingOut(false)
      setShowLogoutConfirm(false)
    }
  }

  const settingsItems = [
    {
      icon: UserIcon,
      title: 'プロフィール設定',
      description: 'プロフィール情報を編集',
      action: () => router.push('/profile/edit'),
      showArrow: true
    },
    {
      icon: BellIcon,
      title: '通知設定',
      description: 'プッシュ通知の設定',
      action: () => alert('通知設定は後で実装予定です'),
      showArrow: true
    },
    {
      icon: ShieldCheckIcon,
      title: 'プライバシー',
      description: 'プライバシーとセキュリティ',
      action: () => alert('プライバシー設定は後で実装予定です'),
      showArrow: true
    },
    {
      icon: QuestionMarkCircleIcon,
      title: 'ヘルプ・サポート',
      description: 'よくある質問とサポート',
      action: () => alert('ヘルプページは後で実装予定です'),
      showArrow: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 mr-2"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">設定</h1>
      </div>

      {/* Settings List */}
      <div className="mt-4">
        {settingsItems.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className="w-full bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <item.icon className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </div>
            {item.showArrow && (
              <ArrowLeftIcon className="h-4 w-4 text-gray-400 rotate-180" />
            )}
          </button>
        ))}

        {/* Logout Section */}
        <div className="mt-8">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full bg-white px-4 py-4 flex items-center space-x-3 border-b border-gray-200 hover:bg-red-50 transition-colors"
          >
            <div className="p-2 bg-red-100 rounded-lg">
              <ArrowRightOnRectangleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-medium text-red-600">ログアウト</h3>
              <p className="text-xs text-gray-500">アカウントからログアウトします</p>
            </div>
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="mt-8 px-4">
        <div className="bg-white rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">アプリ情報</h3>
          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>バージョン</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>ビルド</span>
              <span>2024.01.15</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 mx-4 w-full max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ログアウトしますか？
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              アカウントからログアウトして、認証画面に戻ります。
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isLoggingOut}
              >
                キャンセル
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}