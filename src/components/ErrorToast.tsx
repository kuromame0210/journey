/**
 * ErrorToast Component
 * 
 * セキュリティ強化のためのエラー通知UIコンポーネント
 * alert()を置き換えてユーザー体験とセキュリティを向上
 * 
 * 機能:
 * - エラー、成功、警告メッセージの表示
 * - 自動消去機能（デフォルト5秒）
 * - セキュアなエラーメッセージ表示
 * 
 * 置き換え対象のalert()使用箇所:
 * - src/app/auth/page.tsx:45,57,62,75,94,109,114
 * - src/app/auth/reset-password/page.tsx:31,42,47,57,62
 * - src/app/settings/page.tsx:28,47,54,61
 * - src/app/profile/edit/page.tsx:178,184,288
 * - src/app/chat/[id]/page.tsx:108
 * - src/app/place/[id]/page.tsx:90
 * - src/app/place/create/page.tsx:132,194
 */

'use client'

import { useEffect } from 'react'

export interface ErrorToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  type?: 'error' | 'success' | 'warning' | 'info'
  duration?: number // 自動消去までの時間（ミリ秒）
}

export function ErrorToast({ 
  message, 
  isVisible, 
  onClose, 
  type = 'error',
  duration = 5000 
}: ErrorToastProps) {
  // 自動消去機能
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  // ESCキーでの閉じる機能
  useEffect(() => {
    if (isVisible) {
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose()
        }
      }

      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  // トーストのスタイル設定
  const getToastStyles = () => {
    const baseStyles = "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 px-6 py-4 rounded-lg shadow-lg border transition-all duration-300 ease-in-out"
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 text-green-800 border-green-200`
      case 'warning':
        return `${baseStyles} bg-yellow-50 text-yellow-800 border-yellow-200`
      case 'info':
        return `${baseStyles} bg-blue-50 text-blue-800 border-blue-200`
      case 'error':
      default:
        return `${baseStyles} bg-red-50 text-red-800 border-red-200`
    }
  }

  // アイコンの取得
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'info':
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
      case 'error':
      default:
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  return (
    <div className={getToastStyles()} role="alert" aria-live="polite">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium leading-5">
            {message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full p-1"
            aria-label="メッセージを閉じる"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorToast