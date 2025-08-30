'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNavigation from '@/components/BottomNavigation'

/**
 * 共通化対応: ChatRoom型定義を統一型に移行
 * 元の実装: src/app/chat/page.tsx:8-26 の ChatRoom interface
 * 移行日: 2025-01-08
 * 共通化により型の一貫性を確保、他ファイルとの重複を解消
 */
import { ChatRoomListItem } from '@/shared/types/database'

/**
 * 共通化対応: 重複していたローディングUIを統一コンポーネントに移行
 * 元の実装: src/app/chat/page.tsx:93-102 のローディング画面
 * 移行日: 2025-01-08
 * 共通化により約10行のコード削減、一貫したUX提供
 */
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'

/**
 * 共通化対応: 日付フォーマット関数を統一ユーティリティに移行
 * 元の実装: src/app/chat/page.tsx:74-91 の formatTime 関数
 * 移行日: 2025-01-08
 * 共通化により約18行のコード削減、一貫した日付表示
 */
import { formatRelativeTime } from '@/shared/utils/date'

/**
 * 共通化対応: 基本状態管理を統一フックに移行
 * 元の実装: src/app/chat/page.tsx:46-47 の user, isLoading useState
 * 移行日: 2025-01-08
 * 共通化により約2行のコード削減、状態管理の一貫性確保
 */
import { useBasePageState } from '@/shared/hooks/useBasePageState'

/**
 * 共通化対応: 認証処理を統一フックに移行
 * 元の実装: src/app/chat/page.tsx:42-52 の checkAuth 関数
 * 移行日: 2025-01-08
 * 共通化により約11行のコード削減、一貫した認証フロー (将来適用予定)
 */
import { useAuth } from '@/shared/hooks/useAuth'
import HelpIcon from '@/components/HelpIcon'
import { useUserProfile } from '@/shared/hooks/useUserProfile'

// 後方互換性のための型エイリアス
type ChatRoom = ChatRoomListItem

export default function ChatListPage() {
  const router = useRouter()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  
  // 統一された基本状態管理（元の個別useState実装を置換）
  const { user, setUser, isLoading, setIsLoading, error, setError } = useBasePageState()
  
  /**
   * 共通化対応: ユーザープロフィール取得
   * 
   * 従来の実装を共通フック useUserProfile に移行
   * - 重複コード 18行削除
   * - エラーハンドリング・ローディング状態管理を統一
   */
  const { userProfile } = useUserProfile(user?.id)


  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }
      setUser(session.user)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _user = user
      fetchChatRooms(session.user.id)
    }

    checkAuth()
  }, [router])

  const fetchChatRooms = async (userId: string) => {
    try {
      // まずチャットルームの基本情報を取得
      const { data: roomsData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .order('created_at', { ascending: false })
      
      if (roomsError) throw roomsError
      
      if (!roomsData || roomsData.length === 0) {
        setChatRooms([])
        return
      }
      
      // すべてのユーザーIDと場所IDを収集
      const userIds = new Set<string>()
      const placeIds = new Set<string>()
      
      roomsData.forEach(room => {
        userIds.add(room.user_a)
        userIds.add(room.user_b)
        placeIds.add(room.place_id)
      })
      
      // プロフィール情報を一括取得
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', Array.from(userIds))
      
      // 場所情報を一括取得
      const { data: placesData } = await supabase
        .from('places')
        .select('id, title, images, date_start, date_end')
        .in('id', Array.from(placeIds))
      
      // 最新メッセージを一括取得
      const { data: messagesData } = await supabase
        .from('messages')
        .select('room_id, body, sent_at')
        .in('room_id', roomsData.map(room => room.id))
        .order('sent_at', { ascending: false })
      
      // 未読メッセージ数を一括取得
      const { data: unreadData } = await supabase
        .from('messages')
        .select('room_id, id')
        .in('room_id', roomsData.map(room => room.id))
        .neq('sender', userId)
        .eq('is_read', false)
      
      // データをマップに変換
      const profilesMap = new Map()
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile)
      })
      
      const placesMap = new Map()
      placesData?.forEach(place => {
        placesMap.set(place.id, place)
      })
      
      const latestMessagesMap = new Map()
      messagesData?.forEach(message => {
        if (!latestMessagesMap.has(message.room_id)) {
          latestMessagesMap.set(message.room_id, message)
        }
      })
      
      // 未読数をルーム別にカウント
      const unreadCountMap = new Map()
      unreadData?.forEach(message => {
        const roomId = message.room_id
        unreadCountMap.set(roomId, (unreadCountMap.get(roomId) || 0) + 1)
      })
      
      // データを変換し、自己チャットを除外
      const transformedData = roomsData
        .filter(room => room.user_a !== room.user_b) // 自己チャットを除外
        .map(room => {
          const otherUserId = room.user_a === userId ? room.user_b : room.user_a
          const otherUser = profilesMap.get(otherUserId) || { 
            id: otherUserId, 
            name: 'Unknown User', 
            avatar_url: null 
          }
          
          const place = placesMap.get(room.place_id) || {
            id: room.place_id,
            title: 'Unknown Place',
            images: [],
            date_start: null,
            date_end: null
          }
          
          const latestMessage = latestMessagesMap.get(room.id) || null
          
          return {
            ...room,
            other_user: otherUser,
            place: place,
            latest_message: latestMessage,
            unread_count: unreadCountMap.get(room.id) || 0 // 実際の未読数を設定
          }
        })
      
      setChatRooms(transformedData)
    } catch (error) {
      console.error('Error fetching chat rooms:', error)
      setChatRooms([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner message="チャット履歴を読み込み中..." />
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">チャット</h1>
        <HelpIcon
          title="チャットについて"
          content={
            <div className="space-y-3">
              <p>💬 <strong>チャット機能</strong></p>
              <div className="space-y-2 text-sm">
                <p>• マッチング成立時に自動でチャットルームが作成されます</p>
                <p>• リアルタイムでメッセージのやり取りができます</p>
                <p>• 既読機能で相手が読んだかわかります</p>
                <p>• 場所の詳細はチャットヘッダーから確認できます</p>
              </div>
              <div className="mt-4 p-3 bg-pink-50 rounded-lg">
                <p className="text-sm">❤️ まだチャットがない場合は、ホーム画面で場所にいいねしてマッチングしましょう！</p>
              </div>
            </div>
          }
          size="md"
        />
      </div>

      {/* Chat List */}
      <div className="divide-y divide-gray-200">
        {chatRooms.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                まだチャットがありません
              </h3>
              <p className="text-gray-500 mb-6">
                場所にいいねをしてマッチするとチャットができます
              </p>
              <button
                onClick={() => router.push('/home')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                場所を探す
              </button>
            </div>
          </div>
        ) : (
          chatRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => router.push(`/chat/${room.id}`)}
            >
              <div className="flex items-center space-x-3">
                {/* Place Image (Main) */}
                <div className="flex-shrink-0">
                  <img
                    src={room.place?.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='}
                    alt={room.place?.title || 'Place'}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      {/* Place Title (Primary) */}
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {room.place?.title || 'Unknown Place'}
                      </h3>
                      {/* Names (Secondary) */}
                      <p className="text-sm text-gray-600 mt-0.5">
                        {userProfile?.name || '名前未設定'} ⇄ {room.other_user.name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1 ml-2">
                      {room.latest_message && (
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(room.latest_message.sent_at)}
                        </span>
                      )}
                      {(room.unread_count || 0) > 0 && (
                        <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {room.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Latest Message */}
                  {room.latest_message ? (
                    <p className="text-sm text-gray-600 truncate mb-2">
                      「{room.latest_message.body}」
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic mb-2">
                      メッセージはまだありません
                    </p>
                  )}
                  
                  {/* Trip Details */}
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    {room.place?.date_start && (
                      <span className="flex items-center">
                        📅 {new Date(room.place.date_start).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                        {room.place?.date_end && room.place.date_end !== room.place.date_start && 
                          `-${new Date(room.place.date_end).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}`
                        }
                      </span>
                    )}
                    {room.place?.recruit_num && (
                      <span className="flex items-center">
                        👥 {room.place.recruit_num}名募集
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}