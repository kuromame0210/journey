'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 認証コールバック処理開始')
        
        // URLからhashを取得してセッションを処理
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ 認証エラー:', error)
          router.push('/auth?error=auth_failed')
          return
        }

        if (data.session) {
          console.log('✅ 認証成功:', data.session.user.email)
          
          // プロフィールの存在確認
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single()
          
          if (profileData) {
            console.log('📋 既存プロフィール確認 -> ホームへ')
            router.push('/home')
          } else {
            console.log('📝 新規プロフィール作成が必要 -> プロフィール編集へ')
            router.push('/profile/edit')
          }
        } else {
          console.log('⚠️ セッションなし -> 認証画面へ')
          router.push('/auth')
        }
      } catch (error) {
        console.error('💥 予期しないエラー:', error)
        router.push('/auth?error=callback_failed')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">認証処理中...</h2>
        <p className="text-gray-600">しばらくお待ちください</p>
      </div>
    </div>
  )
}