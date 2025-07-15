'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNavigation from '@/components/BottomNavigation'

interface ChatRoom {
  id: string
  place_id: string
  user_a: string
  user_b: string
  created_at: string
  place: {
    title: string
    images: string[]
  }
  other_user: {
    name: string
  }
  latest_message: {
    body: string
    sent_at: string
  } | null
  unread_count: number
}

export default function ChatListPage() {
  const router = useRouter()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)

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
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          places(*),
          messages(
            body,
            sent_at
          )
        `)
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setChatRooms(data || [])
    } catch (error) {
      console.error('Error fetching chat rooms:', error)
      setChatRooms([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)
    const diffInDays = diffInHours / 24

    if (diffInHours < 1) {
      return '今'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}時間前`
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}日前`
    } else {
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">チャット</h1>
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
                {/* Place Image */}
                <div className="flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={room.place.images[0]}
                    alt={room.place.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {room.other_user.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {room.place.title}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {room.latest_message && (
                        <span className="text-xs text-gray-500">
                          {formatTime(room.latest_message.sent_at)}
                        </span>
                      )}
                      {room.unread_count > 0 && (
                        <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {room.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {room.latest_message ? (
                    <p className="text-sm text-gray-600 truncate">
                      {room.latest_message.body}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      メッセージはまだありません
                    </p>
                  )}
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