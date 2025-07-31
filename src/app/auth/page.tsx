'use client'

import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [step, setStep] = useState<'form' | 'email_sent' | 'reset_sent'>('form')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (error) throw error
      
      // Check if user has a profile
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileData) {
          router.push('/home')
        } else {
          router.push('/profile/edit')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      alert('メールアドレスまたはパスワードが間違っています')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (password !== confirmPassword) {
        alert('パスワードが一致しません')
        return
      }

      if (password.length < 6) {
        alert('パスワードは6文字以上で入力してください')
        return
      }

      console.log('🚀 サインアップ開始:', { email, timestamp: new Date().toISOString() })
      console.log('📧 Supabase設定確認:', { 
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
        isConfigured: isSupabaseConfigured
      })

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      })

      console.log('📊 サインアップレスポンス:', {
        success: !error,
        hasUser: !!data?.user,
        userId: data?.user?.id,
        userEmail: data?.user?.email,
        emailConfirmed: data?.user?.email_confirmed_at,
        needsConfirmation: !data?.user?.email_confirmed_at,
        timestamp: new Date().toISOString()
      })

      if (error) {
        console.error('❌ サインアップエラー詳細:', {
          message: error.message,
          status: error.status,
          name: error.name,
          details: error
        })
        throw error
      }

      if (data?.user && !data.user.email_confirmed_at) {
        console.log('✅ メール認証が必要 - 認証メールが送信されました')
      } else if (data?.user?.email_confirmed_at) {
        console.log('⚠️ メール認証不要 - 即座に認証済み')
      }

      setStep('email_sent')
    } catch (error) {
      console.error('💥 予期しないエラー:', error)
      alert('アカウント作成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      
      if (error) throw error
      setStep('reset_sent')
    } catch (error) {
      console.error('Error:', error)
      alert('パスワードリセットの送信に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }


  const handleAppleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
      })
      if (error) throw error
    } catch (error) {
      console.error('Error:', error)
      alert('Apple認証でエラーが発生しました')
    }
  }

  const handleLineAuth = async () => {
    alert('LINE認証は準備中です')
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">Journey</h1>
        <p className="text-gray-600">旅の仲間を見つけよう</p>
        
        {/* Mode Tabs */}
        {mode !== 'reset' && (
          <div className="flex bg-gray-100 rounded-lg p-1 mt-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ログイン
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              新規登録
            </button>
          </div>
        )}
      </div>

      {step === 'form' ? (
        <div className="space-y-6">
          <form onSubmit={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handlePasswordReset} className="space-y-4">
            {mode !== 'reset' && (
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {mode === 'login' ? 'ログイン' : '新規登録'}
              </h2>
            )}
            
            {mode === 'reset' && (
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">パスワードをリセット</h2>
                <p className="text-gray-600">登録時のメールアドレスを入力してください</p>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード
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
            )}
            
            {mode === 'signup' && (
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
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 
                (
                  mode === 'login' ? 'ログイン中...' :
                  mode === 'signup' ? '登録中...' :
                  '送信中...'
                ) : (
                  mode === 'login' ? 'ログイン' :
                  mode === 'signup' ? 'アカウント作成' :
                  'リセットメールを送信'
                )
              }
            </button>
            
            {mode === 'login' && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  パスワードを忘れた方
                </button>
              </div>
            )}
            
            {mode === 'reset' && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← ログインに戻る
                </button>
              </div>
            )}
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">または</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleAppleAuth}
              className="w-full bg-black text-white py-3 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Apple でサインイン
            </button>
            <button
              onClick={handleLineAuth}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              LINE でサインイン
            </button>
          </div>
        </div>
      ) : step === 'email_sent' ? (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">📧</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">メールを送信しました</h2>
            <p className="text-gray-600 mb-6">
              {email} に認証メールを送信しました。<br/>
              メール内のリンクをクリックしてアカウントを有効化してください。
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                メールが届かない場合は、迷惑メールフォルダを確認してください。
              </p>
            </div>
            <button
              onClick={() => {
                setStep('form')
                setMode('login')
              }}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              ログイン画面に戻る
            </button>
          </div>
        </div>
      ) : step === 'reset_sent' ? (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🔑</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">リセットメールを送信しました</h2>
            <p className="text-gray-600 mb-6">
              {email} にパスワードリセットメールを送信しました。<br/>
              メール内のリンクをクリックして新しいパスワードを設定してください。
            </p>
            <button
              onClick={() => {
                setStep('form')
                setMode('login')
              }}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              ログイン画面に戻る
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}