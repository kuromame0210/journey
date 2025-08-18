'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
// セキュリティ強化のためのエラーハンドリング統一
// 参考: src/app/auth/page.tsx の改修に合わせて統一
import ErrorToast from '@/components/ErrorToast'
import useErrorHandler from '@/hooks/useErrorHandler'

function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  
  // セキュリティ強化: alert()をErrorToastに置き換え
  const { message, type, isVisible, handleError, showWarning, showSuccess, clearMessage } = useErrorHandler()

  useEffect(() => {
    // URL からトークンを取得して検証
    if (typeof window === 'undefined') return
    
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    
    if (accessToken && refreshToken) {
      // トークンが有効な場合
      setIsValidToken(true)
      
      // セッションを設定
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
    } else {
      // 無効なリンクの場合
      // セキュリティ強化: alert()をhandleError()に置き換え
      // 旧実装: alert('無効なリセットリンクです。もう一度パスワードリセットを行ってください。')
      handleError(new Error('invalid_reset_link'), '無効なリセットリンクです。もう一度パスワードリセットを行ってください。')
      router.push('/auth')
    }
  }, [router])

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (password !== confirmPassword) {
        // セキュリティ強化: alert()をshowWarning()に置き換え
        // 旧実装: alert('パスワードが一致しません')
        showWarning('パスワードが一致しません')
        return
      }

      if (password.length < 6) {
        // セキュリティ強化: alert()をshowWarning()に置き換え
        // 旧実装: alert('パスワードは6文字以上で入力してください')
        showWarning('パスワードは6文字以上で入力してください')
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      // セキュリティ強化: alert()をshowSuccess()に置き換え
      // 旧実装: alert('パスワードが正常に更新されました')
      showSuccess('パスワードが正常に更新されました')
      
      // 成功メッセージ表示後に少し待ってからリダイレクト
      setTimeout(() => {
        router.push('/auth')
      }, 1500)
      
    } catch (error) {
      console.error('Error updating password:', error)
      // セキュリティ強化: 技術的詳細を隠したエラーメッセージ表示
      // 旧実装: alert('パスワードの更新に失敗しました')
      handleError(error, 'パスワードの更新に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">リンクを確認中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">Journey</h1>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">新しいパスワードを設定</h2>
        <p className="text-gray-600">
          新しいパスワードを入力してください
        </p>
      </div>

      <form onSubmit={handlePasswordUpdate} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            新しいパスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6文字以上で入力"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            パスワード確認
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="パスワードを再入力"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'パスワード更新中...' : 'パスワードを更新'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => router.push('/auth')}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← ログイン画面に戻る
        </button>
      </div>
      
      {/* セキュリティ強化: 統一されたエラー表示UIコンポーネント */}
      {/* 旧実装のalert()を全て置き換え */}
      <ErrorToast
        message={message}
        type={type}
        isVisible={isVisible}
        onClose={clearMessage}
      />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}