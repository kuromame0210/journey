'use client'

import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const router = useRouter()

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!isSupabaseConfigured) {
        // Demo mode - simulate successful SMS send
        setTimeout(() => {
          setStep('otp')
          setIsLoading(false)
        }, 1000)
        return
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: phone, // 一時的にメール認証を使用
      })

      if (error) throw error
      setStep('otp')
    } catch (error) {
      console.error('Error:', error)
      alert('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!isSupabaseConfigured) {
        // Demo mode - simulate successful verification
        setTimeout(() => {
          // Store demo user in localStorage
          localStorage.setItem('demo_user', JSON.stringify({
            id: 'demo-user-123',
            phone: phone,
            email: 'demo@example.com'
          }))
          router.push('/home')
        }, 1000)
        return
      }

      const { error } = await supabase.auth.verifyOtp({
        email: phone, // 一時的にメール認証を使用
        token: otp,
        type: 'email'
      })

      if (error) throw error
      router.push('/home')
    } catch (error) {
      console.error('Error:', error)
      alert('認証コードが正しくありません')
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
        {!isSupabaseConfigured && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              🚧 デモモード: 任意の電話番号で進めます
            </p>
          </div>
        )}
      </div>

      {step === 'phone' ? (
        <div className="space-y-6">
          <form onSubmit={handlePhoneAuth} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス（開発用）
              </label>
              <input
                id="phone"
                name="phone"
                type="email"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="your-email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '送信中...' : 'メール認証コードを送信'}
            </button>
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
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">認証コードを入力</h2>
            <p className="text-gray-600">
              {phone} に送信された6桁のコードを入力してください
            </p>
          </div>

          <form onSubmit={handleOtpVerify} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                認証コード
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-wider"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '認証中...' : '認証する'}
            </button>
          </form>

          <button
            onClick={() => setStep('phone')}
            className="w-full text-blue-600 hover:text-blue-800 font-medium"
          >
            ← 電話番号入力に戻る
          </button>
        </div>
      )}
    </div>
  )
}