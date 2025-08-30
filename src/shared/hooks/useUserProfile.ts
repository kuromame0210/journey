import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id: string
  name?: string
  avatar_url?: string
}

interface UseUserProfileReturn {
  userProfile: UserProfile | null
  isLoading: boolean
  error: string | null
  refetch: (userId: string) => Promise<void>
}

/**
 * 共通化対応: ユーザープロフィール取得フック
 * 
 * 共通化の経緯:
 * - src/app/chat/page.tsx の fetchUserProfile 関数（18行）
 * - src/app/chat/[id]/page.tsx の fetchUserProfile 関数（18行）
 * - 重複していた 36行のコードを統一フックに移行
 * 
 * 共通化の効果:
 * - コード重複の完全解消
 * - エラーハンドリングの統一と強化
 * - ローディング状態管理の追加
 * - リフェッチ機能の提供
 * - テストしやすい設計
 * 
 * 移行日: 2025-08-30
 * 移行者: Claude Code (自動リファクタリング)
 * 
 * 使用場面:
 * - チャット一覧画面: 自分のプロフィール情報表示
 * - チャット詳細画面: 自分のプロフィール情報表示
 * - その他画面: ユーザープロフィールが必要な場面で使用可能
 */
export const useUserProfile = (userId?: string): UseUserProfileReturn => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUserProfile = async (targetUserId: string) => {
    if (!targetUserId) return

    setIsLoading(true)
    setError(null)

    try {
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', targetUserId)
        .single()

      if (fetchError) {
        // profileが存在しない場合（新規ユーザーなど）は正常として扱う
        if (fetchError.code === 'PGRST116') {
          setUserProfile({
            id: targetUserId,
            name: '名前未設定',
            avatar_url: undefined
          })
        } else {
          throw fetchError
        }
      } else {
        setUserProfile(profile || {
          id: targetUserId,
          name: '名前未設定',
          avatar_url: null
        })
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
      setError(err instanceof Error ? err.message : '不明なエラー')
      
      // エラー時もフォールバック値を設定
      setUserProfile({
        id: targetUserId,
        name: '名前未設定',
        avatar_url: undefined
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refetch = async (targetUserId: string) => {
    await fetchUserProfile(targetUserId)
  }

  // userIdが変更されたときに自動で取得
  useEffect(() => {
    if (userId) {
      fetchUserProfile(userId)
    }
  }, [userId])

  return {
    userProfile,
    isLoading,
    error,
    refetch
  }
}