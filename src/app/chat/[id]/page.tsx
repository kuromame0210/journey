'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeftIcon, PaperAirplaneIcon, PhotoIcon } from '@heroicons/react/24/outline'

interface Message {
  id: string
  room_id: string
  sender: string
  body: string
  sent_at: string
}

interface ChatRoom {
  id: string
  place_id: string
  place: {
    title: string
    date_start: string
    date_end: string
  }
  other_user: {
    id: string
    name: string
  }
}

export default function ChatRoomPage() {
  const params = useParams()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
      setChatRoom(roomData)
      
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

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !chatRoom) return

    const messageData: Message = {
      id: Date.now().toString(),
      room_id: chatRoom.id,
      sender: user.id,
      body: newMessage.trim(),
      sent_at: new Date().toISOString()
    }

    try {
      // In a real app, you'd save to Supabase here
      setMessages(prev => [...prev, messageData])
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('メッセージの送信に失敗しました')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric'
    })
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
          className="flex-1 cursor-pointer"
          onClick={() => router.push(`/place/${chatRoom.place_id}`)}
        >
          <div className="bg-blue-50 rounded-lg p-3">
            <h2 className="font-medium text-gray-900 text-sm">
              {chatRoom.other_user.name} さんとの {chatRoom.place.title}
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              📅 {new Date(chatRoom.place.date_start).toLocaleDateString('ja-JP')}
              {chatRoom.place.date_end && ` ～ ${new Date(chatRoom.place.date_end).toLocaleDateString('ja-JP')}`}
            </p>
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
                    {formatDate(message.sent_at)}
                  </span>
                </div>
              )}

              {/* Message */}
              <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${isMyMessage ? 'order-2' : 'order-1'}`}>
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
                  <p className={`text-xs text-gray-500 mt-1 ${isMyMessage ? 'text-right' : 'text-left'}`}>
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
              onKeyDown={handleKeyPress}
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
    </div>
  )
}