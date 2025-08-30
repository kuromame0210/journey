import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface UseUnreadCountReturn {
  unreadCount: number
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * 未読メッセージ数を取得・管理する共通フック
 * 
 * 機能:
 * - 現在のユーザーの未読メッセージ総数を取得
 * - リアルタイムで未読数を更新
 * - 複数画面で共有可能
 * 
 * 使用場面:
 * - BottomNavigation: 通知バッジ表示
 * - ヘッダー: 通知アイコン表示
 * - チャット一覧: 未読数表示
 */
export const useUnreadCount = (userId?: string): UseUnreadCountReturn => {
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUnreadCount = async () => {
    if (!userId) {
      setUnreadCount(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 自分が参加しているチャットルームのIDを取得
      const { data: chatRooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('id')
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)

      if (roomsError) throw roomsError

      if (!chatRooms || chatRooms.length === 0) {
        setUnreadCount(0)
        return
      }

      const roomIds = chatRooms.map(room => room.id)

      // 自分宛ての未読メッセージ数を取得
      const { data: unreadMessages, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .in('room_id', roomIds)
        .neq('sender', userId) // 自分が送信したメッセージは除外
        .eq('is_read', false)   // 未読のみ

      if (messagesError) throw messagesError

      setUnreadCount(unreadMessages?.length || 0)
    } catch (err) {
      console.error('Error fetching unread count:', err)
      setError(err instanceof Error ? err.message : '未読数の取得に失敗しました')
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  // リアルタイム更新のセットアップ
  useEffect(() => {
    if (!userId) return

    // 初回取得
    fetchUnreadCount()

    // メッセージテーブルの変更を監視
    const channel = supabase
      .channel(`unread-count-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE すべて
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Message change detected for unread count:', payload)
          
          // 新規メッセージ（INSERT）の場合
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new
            // 自分が送信者でない場合のみ未読数を増加
            if (newMessage.sender !== userId) {
              setUnreadCount(prev => prev + 1)
            }
          }
          // 既読更新（UPDATE）の場合
          else if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new
            const oldMessage = payload.old
            
            // is_read が false -> true になった場合（既読になった場合）
            if (!oldMessage.is_read && updatedMessage.is_read && updatedMessage.sender !== userId) {
              setUnreadCount(prev => Math.max(0, prev - 1))
            }
          }
          // 削除（DELETE）の場合は再取得
          else if (payload.eventType === 'DELETE') {
            fetchUnreadCount()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const refetch = async () => {
    await fetchUnreadCount()
  }

  return {
    unreadCount,
    isLoading,
    error,
    refetch
  }
}