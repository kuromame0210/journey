'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeftIcon, PaperAirplaneIcon, PhotoIcon } from '@heroicons/react/24/outline'
// セキュリティ強化のためのエラーハンドリング統一
// 参考: 他のページの改修に合わせてalert()を置き換え
import ErrorToast from '@/components/ErrorToast'
import useErrorHandler from '@/hooks/useErrorHandler'

/**
 * 共通化対応: Message・ChatRoom型定義を統一型に移行
 * 元の実装: src/app/chat/[id]/page.tsx:12-32 の Message・ChatRoom interface
 * 移行日: 2025-01-08
 * 共通化により型の一貫性を確保、他ファイルとの重複を解消
 */
import { Message, ChatRoomDetail } from '@/shared/types/database'

/**
 * 共通化対応: 重複していたローディングUIを統一コンポーネントに移行
 * 元の実装: src/app/chat/[id]/page.tsx:142-151 のローディング画面
 * 移行日: 2025-01-08
 * 共通化により約10行のコード削減、一貫したUX提供
 */
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'

/**
 * 共通化対応: 日付フォーマット関数を統一ユーティリティに移行
 * 元の実装: src/app/chat/[id]/page.tsx:125-137 の formatTime・formatDate 関数
 * 移行日: 2025-01-08
 * 共通化により約13行のコード削減、一貫した日付表示
 */
import { formatTime, formatMessageDate, formatDateRange } from '@/shared/utils/date'
import { useUserProfile } from '@/shared/hooks/useUserProfile'

// 後方互換性のための型エイリアス
type ChatRoom = ChatRoomDetail

export default function ChatRoomPage() {
  const params = useParams()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastKeyPress, setLastKeyPress] = useState<number>(0)
  const [isComposing, setIsComposing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // セキュリティ強化: alert()をErrorToastに置き換え
  const { message, type, isVisible, handleError, clearMessage } = useErrorHandler()
  
  /**
   * 共通化対応: ユーザープロフィール取得
   * 
   * 従来の fetchUserProfile 関数を共通フック useUserProfile に移行
   * - 重複コード 18行削除
   * - 一覧画面との実装統一
   */
  const { userProfile } = useUserProfile(user?.id)

  const fetchChatRoom = async (userId: string) => {
    try {
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          places(*)
        `)
        .eq('id', params.id)
        .single()
      
      if (roomError) throw roomError
      
      // 相手ユーザーのプロフィール情報を取得
      const otherUserId = roomData.user_a === userId ? roomData.user_b : roomData.user_a
      const { data: otherUserProfile } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', otherUserId)
        .single()
      
      // チャットルームデータにother_user情報を追加し、placesをplaceにマッピング
      const enhancedRoomData = {
        ...roomData,
        place: roomData.places,
        other_user: otherUserProfile || { 
          id: otherUserId, 
          name: 'Unknown User', 
          avatar_url: null 
        }
      }
      
      setChatRoom(enhancedRoomData)
      
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', params.id)
        .order('sent_at', { ascending: true })
      
      if (messagesError) throw messagesError
      setMessages(messagesData || [])
    } catch (error) {
      console.error('Error fetching chat room:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }
      setUser(session.user)
      fetchChatRoom(session.user.id)
    }

    checkAuth()
  }, [params.id, router])

  // リアルタイム機能: 新しいメッセージを受信
  useEffect(() => {
    if (!chatRoom) return

    console.log('Setting up realtime subscription for room:', chatRoom.id)
    
    // Supabase Realtimeチャンネルを設定
    const channel = supabase
      .channel(`messages:${chatRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${chatRoom.id}`
        },
        (payload) => {
          console.log('New message received:', payload)
          const newMessage = payload.new as Message
          
          // 自分が送信したメッセージは既にローカル状態に反映済みなのでスキップ
          if (newMessage.sender === user?.id) {
            return
          }
          
          // 他のユーザーからの新しいメッセージをローカル状態に追加
          setMessages(prev => {
            // より厳密な重複チェック（IDとbodyの両方で確認）
            const exists = prev.some(msg => 
              msg.id === newMessage.id || 
              (msg.body === newMessage.body && msg.sender === newMessage.sender && Math.abs(new Date(msg.sent_at).getTime() - new Date(newMessage.sent_at).getTime()) < 5000)
            )
            if (exists) {
              console.log('Duplicate message detected, skipping:', newMessage.id)
              return prev
            }
            return [...prev, newMessage]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${chatRoom.id}`
        },
        (payload) => {
          console.log('Message updated:', payload)
          const updatedMessage = payload.new as Message
          
          // メッセージの既読ステータス更新などに対応
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
            )
          )
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
      })

    // クリーンアップ関数
    return () => {
      console.log('Cleaning up realtime subscription')
      supabase.removeChannel(channel)
    }
  }, [chatRoom, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 既読機能: チャット画面を開いたとき、相手からのメッセージを既読にする
  useEffect(() => {
    if (!user || !chatRoom || !messages.length) return

    const markMessagesAsRead = async () => {
      try {
        // 相手から受信した未読メッセージを取得
        const unreadMessages = messages.filter(msg => 
          msg.sender !== user.id && msg.is_read === false
        )

        if (unreadMessages.length === 0) return

        // 未読メッセージを既読にマーク
        const { error } = await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadMessages.map(msg => msg.id))

        if (error) {
          console.error('Error marking messages as read:', error)
          return
        }

        // ローカル状態も更新
        setMessages(prev => 
          prev.map(msg => 
            unreadMessages.some(unread => unread.id === msg.id) 
              ? { ...msg, is_read: true }
              : msg
          )
        )

        console.log(`Marked ${unreadMessages.length} messages as read`)
      } catch (error) {
        console.error('Error in markMessagesAsRead:', error)
      }
    }

    // 画面を開いてから少し遅らせて既読処理を実行（Realtimeとの競合を避けるため）
    const timer = setTimeout(markMessagesAsRead, 500)
    
    return () => clearTimeout(timer)
  }, [messages, user, chatRoom])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !chatRoom) return

    // UUIDを生成してローカル状態を即座に更新（楽観的UI）
    const tempId = crypto.randomUUID()
    const messageData: Message = {
      id: tempId,
      room_id: chatRoom.id,
      sender: user.id,
      body: newMessage.trim(),
      sent_at: new Date().toISOString()
    }

    // 即座にUIを更新（楽観的更新）
    setMessages(prev => [...prev, messageData])
    const originalMessage = newMessage
    setNewMessage('')

    try {
      // Supabaseにメッセージを保存
      const { data, error } = await supabase
        .from('messages')
        .insert({
          room_id: chatRoom.id,
          sender: user.id,
          body: messageData.body,
          sent_at: messageData.sent_at,
          is_read: false // 新しいメッセージは未読状態
        })
        .select()
        .single()

      if (error) throw error

      // 実際に保存されたデータでローカル状態を更新
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...data, id: data.id } : msg
      ))

    } catch (error) {
      console.error('Error sending message:', error)
      
      // エラー時は楽観的更新をロールバック
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      setNewMessage(originalMessage) // メッセージを復元
      
      // セキュリティ強化: 技術的詳細を隠したエラーメッセージ表示
      // 旧実装: alert('メッセージの送信に失敗しました')
      handleError(error, 'メッセージの送信に失敗しました')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enterは改行（デフォルト動作を許可）
        return
      }
      
      console.log('Enter pressed, isComposing:', isComposing)
      
      if (!isComposing) {
        // IME無効（半角英数字など）→ 1回のEnterで送信
        console.log('Direct input mode, sending message immediately')
        e.preventDefault()
        sendMessage()
      } else {
        // IME有効（変換候補がある）→ 2回のEnterで送信
        const now = Date.now()
        console.log('Composition mode, last press was:', now - lastKeyPress, 'ms ago')
        
        if (now - lastKeyPress < 500) {
          console.log('Double enter detected in composition mode, sending message')
          e.preventDefault()
          sendMessage()
          setLastKeyPress(0) // リセット
        } else {
          // 1回目のEnterは記録するのみ（確定処理）
          console.log('First enter in composition mode, confirming text')
          setLastKeyPress(now)
          // 確定処理はデフォルト動作に任せる
        }
      }
    }
  }

  const handleCompositionStart = () => {
    console.log('Composition started')
    setIsComposing(true)
  }

  const handleCompositionEnd = () => {
    console.log('Composition ended')
    setIsComposing(false)
  }


  if (isLoading) {
    return <LoadingSpinner message="チャットルームを読み込み中..." />
  }

  if (!chatRoom) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">チャットが見つかりません</h2>
          <button
            onClick={() => router.push('/chat')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            チャット一覧に戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center shadow-sm border-b">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 mr-2"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
        </button>
        
        <div 
          className="flex-1 cursor-pointer flex items-center space-x-3"
          onClick={() => router.push(`/place/${chatRoom.place_id}`)}
        >
          {/* Place Image */}
          <div className="flex-shrink-0">
            <img
              src={chatRoom.place?.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='}
              alt={chatRoom.place?.title || 'Place'}
              className="w-10 h-10 rounded-lg object-cover"
            />
          </div>
          
          {/* Place Info */}
          <div className="flex-1 min-w-0">
            {/* Place Title (Primary) */}
            <h2 className="font-semibold text-gray-900 text-base truncate">
              {chatRoom.place?.title || '場所未設定'}
            </h2>
            {/* Names & Date Info (Secondary) */}
            <div className="flex items-center space-x-2 mt-0.5">
              <p className="text-sm text-gray-600">
                {userProfile?.name || '名前未設定'} ⇄ {chatRoom.other_user?.name || '名前未設定'}
              </p>
              {chatRoom.place?.date_start && (
                <>
                  <span className="text-gray-400">•</span>
                  <p className="text-xs text-gray-500">
                    📅 {formatDateRange(chatRoom.place.date_start, chatRoom.place.date_end)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message, index) => {
          const isMyMessage = message.sender === user?.id
          const showDate = index === 0 || 
            new Date(message.sent_at).toDateString() !== new Date(messages[index - 1].sent_at).toDateString()

          return (
            <div key={message.id}>
              {/* Date divider */}
              {showDate && (
                <div className="text-center my-4">
                  <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {formatMessageDate(message.sent_at)}
                  </span>
                </div>
              )}

              {/* Message */}
              <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                {/* 相手のアバター（左側） */}
                {!isMyMessage && (
                  <div className="flex-shrink-0 mr-2">
                    {chatRoom?.other_user?.avatar_url ? (
                      <img
                        src={chatRoom.other_user.avatar_url}
                        alt={chatRoom.other_user.name || 'User'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {chatRoom?.other_user?.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                )}
                
                <div className={`max-w-[70%] ${isMyMessage ? 'order-2' : 'order-1'}`}>
                  {/* 相手の名前（相手のメッセージの場合のみ） */}
                  {!isMyMessage && (
                    <p className="text-xs text-gray-500 mb-1 ml-1">
                      {chatRoom?.other_user?.name || 'Unknown User'}
                    </p>
                  )}
                  
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isMyMessage
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.body}
                    </p>
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 ${isMyMessage ? 'text-right' : 'text-left'} ${!isMyMessage ? 'ml-1' : ''}`}>
                    {formatTime(message.sent_at)}
                  </p>
                </div>
                
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-3">
        <div className="flex items-end space-x-3">
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <PhotoIcon className="h-6 w-6" />
          </button>
          
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder="メッセージを入力..."
              rows={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
      
      {/* セキュリティ強化: 統一されたエラー表示UIコンポーネント */}
      {/* 旧実装のalert()を置き換え */}
      <ErrorToast
        message={message}
        type={type}
        isVisible={isVisible}
        onClose={clearMessage}
      />
    </div>
  )
}