/**
 * useErrorHandler Custom Hook
 * 
 * エラーハンドリング統一のためのカスタムフック
 * alert()を置き換えてセキュリティとユーザー体験を向上
 * 
 * 機能:
 * - エラーメッセージのサニタイゼーション
 * - 技術的詳細の隠蔽（セキュリティ向上）
 * - 統一されたエラー表示ロジック
 * - 成功・警告・情報メッセージのサポート
 * 
 * 使用想定箇所:
 * - 全ての既存alert()呼び出し（52箇所）
 * - Supabaseエラーハンドリング
 * - フォーム検証エラー
 * - ネットワークエラー
 * 
 * セキュリティ考慮事項:
 * - データベースエラーの詳細を隠蔽
 * - スタックトレース情報の漏洩防止
 * - ユーザーフレンドリーなメッセージに変換
 */

'use client'

import { useState, useCallback } from 'react'

export type MessageType = 'error' | 'success' | 'warning' | 'info'

interface ToastState {
  message: string
  type: MessageType
  isVisible: boolean
}

export function useErrorHandler() {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'error',
    isVisible: false
  })

  /**
   * エラーメッセージのサニタイゼーション
   * 技術的詳細を隠してユーザーフレンドリーなメッセージに変換
   */
  const sanitizeErrorMessage = useCallback((error: unknown, fallbackMessage?: string): string => {
    // デフォルトのフォールバックメッセージ
    const defaultFallback = '予期しないエラーが発生しました'
    
    let message = ''
    
    // エラータイプに応じて処理
    if (error instanceof Error) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String((error as { message: unknown }).message)
    }

    // Supabaseエラーの特別処理
    if (error && typeof error === 'object' && 'code' in error) {
      const supabaseError = error as { code: string; message?: string }
      
      // よくあるSupabaseエラーコードの処理
      switch (supabaseError.code) {
        case 'invalid_credentials':
        case 'email_not_confirmed':
          return 'メールアドレスまたはパスワードが間違っています'
        case 'signup_disabled':
          return '現在、新規登録を一時停止しています'
        case 'email_address_not_authorized':
          return 'このメールアドレスでの登録は許可されていません'
        case 'weak_password':
          return 'パスワードが弱すぎます。より複雑なパスワードを設定してください'
        case 'email_address_invalid':
          return '有効なメールアドレスを入力してください'
        case 'too_many_requests':
          return 'アクセス回数が上限に達しました。しばらく時間をおいてから再試行してください'
        case '23505': // PostgreSQL unique violation
          return 'この情報は既に登録されています'
        case 'PGRST301': // PostgREST error
          return '権限がありません'
      }
    }

    // 機密情報を含む可能性のあるエラーメッセージのパターンマッチング
    const sensitivePatterns = [
      // データベース関連
      { pattern: /duplicate key|unique constraint|violation/i, message: 'この情報は既に登録されています' },
      { pattern: /invalid input syntax|invalid text representation/i, message: '入力形式が正しくありません' },
      { pattern: /permission denied|access denied|unauthorized/i, message: 'アクセス権限がありません' },
      { pattern: /connection refused|network error|timeout/i, message: '通信エラーが発生しました。しばらく時間をおいてから再試行してください' },
      { pattern: /server error|internal error/i, message: 'システムエラーが発生しました。しばらく時間をおいてから再試行してください' },
      
      // 認証関連
      { pattern: /invalid.?password|wrong.?password/i, message: 'パスワードが間違っています' },
      { pattern: /invalid.?email|email.?not.?found/i, message: 'メールアドレスが見つかりません' },
      { pattern: /account.?not.?found|user.?not.?found/i, message: 'アカウントが見つかりません' },
      { pattern: /session.?expired|token.?expired/i, message: 'セッションが切れました。再度ログインしてください' },
      
      // ファイルアップロード関連
      { pattern: /file.?too.?large|size.?limit/i, message: 'ファイルサイズが大きすぎます' },
      { pattern: /invalid.?file.?type|unsupported.?format/i, message: 'サポートされていないファイル形式です' },
      
      // バリデーション関連
      { pattern: /required.?field|missing.?field/i, message: '必須項目が入力されていません' },
      { pattern: /invalid.?format|format.?error/i, message: '入力形式が正しくありません' }
    ]

    // パターンマッチングで適切なメッセージを返す
    for (const { pattern, message: userMessage } of sensitivePatterns) {
      if (pattern.test(message)) {
        return userMessage
      }
    }

    // 特定のパターンに一致しない場合
    if (message.length > 0) {
      // 技術的詳細を含む可能性がある長いメッセージは短縮
      if (message.length > 100) {
        return fallbackMessage || defaultFallback
      }
      
      // 比較的安全そうな短いメッセージはそのまま使用
      // ただし、HTMLタグやスクリプトを除去
      const cleanMessage = message.replace(/<[^>]*>/g, '').trim()
      if (cleanMessage.length > 0 && cleanMessage.length <= 100) {
        return cleanMessage
      }
    }

    return fallbackMessage || defaultFallback
  }, [])

  /**
   * メッセージを表示する汎用関数
   */
  const showMessage = useCallback((message: string, type: MessageType = 'error') => {
    setToast({
      message,
      type,
      isVisible: true
    })
  }, [])

  /**
   * エラーを処理して表示
   */
  const handleError = useCallback((error: unknown, fallbackMessage?: string) => {
    const sanitizedMessage = sanitizeErrorMessage(error, fallbackMessage)
    showMessage(sanitizedMessage, 'error')
    
    // 開発環境では詳細なエラー情報をコンソールに出力
    if (process.env.NODE_ENV === 'development') {
      console.error('Original error:', error)
      console.error('Sanitized message:', sanitizedMessage)
    }
  }, [sanitizeErrorMessage, showMessage])

  /**
   * 成功メッセージを表示
   */
  const showSuccess = useCallback((message: string) => {
    showMessage(message, 'success')
  }, [showMessage])

  /**
   * 警告メッセージを表示
   */
  const showWarning = useCallback((message: string) => {
    showMessage(message, 'warning')
  }, [showMessage])

  /**
   * 情報メッセージを表示
   */
  const showInfo = useCallback((message: string) => {
    showMessage(message, 'info')
  }, [showMessage])

  /**
   * トーストを閉じる
   */
  const clearMessage = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }, [])

  return {
    // 状態
    message: toast.message,
    type: toast.type,
    isVisible: toast.isVisible,
    
    // メソッド
    handleError,
    showSuccess,
    showWarning,
    showInfo,
    showMessage,
    clearMessage,
    
    // 直接的なエラーサニタイゼーション（必要に応じて）
    sanitizeErrorMessage
  }
}

export default useErrorHandler