'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { checkAuthStatus } from '@/lib/auth-helpers'
import BottomNavigation from '@/components/BottomNavigation'
import ImageWithFallback from '@/components/ImageWithFallback'
import { HeartIcon, BookmarkIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

interface Place {
  id: string
  title: string
  images: string[]
  genre: string
  purpose_tags: number[]
  demand_tags: number[]
  budget_option: number
  date_start: string
  date_end: string
  owner: string
}

export default function HomePage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      const { user, isAuthenticated } = await checkAuthStatus()
      
      if (!isAuthenticated) {
        router.push('/auth')
        return
      }
      
      setUser(user)
      // Pass user directly instead of relying on state
      if (user) {
        fetchPlacesWithUser(user)
      }
    }

    initAuth()
  }, [router])

  const fetchPlacesWithUser = async (currentUser: { id: string; email?: string }) => {
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .neq('owner', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(30)

      if (error) throw error
      setPlaces(data || [])
    } catch (error) {
      console.error('Error fetching places:', error)
      setPlaces([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleReaction = async (type: 'like' | 'keep' | 'pass') => {
    if (!user || currentIndex >= places.length) return

    const currentPlace = places[currentIndex]

    try {
      const { error } = await supabase
        .from('reactions')
        .upsert({
          place_id: currentPlace.id,
          from_uid: user.id,
          type: type
        }, {
          onConflict: 'place_id,from_uid'
        })

      if (error) {
        console.error('Error saving reaction:', error)
        // 409エラーでも次のカードに進む
        if (error.code === '23505' || error.message.includes('duplicate')) {
          console.log('Reaction already exists, updating...')
        } else {
          throw error
        }
      }

      // Move to next card
      setCurrentIndex(prev => prev + 1)
    } catch (error) {
      console.error('Error saving reaction:', error)
      // エラーでも次のカードに進む（UXを優先）
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handleCardClick = () => {
    if (currentIndex < places.length) {
      router.push(`/place/${places[currentIndex].id}`)
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

  if (currentIndex >= places.length) {
    return (
      <div className="min-h-screen pb-20">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center px-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              すべてのカードを確認しました！
            </h2>
            <p className="text-gray-600 mb-8">
              新しい投稿があるまでしばらくお待ちください
            </p>
            <button
              onClick={() => {
                setCurrentIndex(0)
                if (user) {
                  fetchPlacesWithUser(user)
                }
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              再読み込み
            </button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  const currentPlace = places[currentIndex]

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold text-blue-600">Journey</h1>
        <div className="text-sm text-gray-500">
          {currentIndex + 1} / {places.length}
        </div>
      </div>

      {/* Card */}
      <div className="p-4">
        <div 
          className="relative bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
          onClick={handleCardClick}
        >
          {/* Image */}
          <div className="aspect-[4/3] bg-gradient-to-br from-blue-400 to-purple-500 relative">
            {currentPlace.images && currentPlace.images.length > 0 ? (
              <ImageWithFallback
                src={currentPlace.images[0]}
                alt={currentPlace.title || '場所の画像'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-lg font-medium">
                {currentPlace.title || '画像なし'}
              </div>
            )}
            
            {/* Match percentage */}
            <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full">
              <span className="text-sm font-bold text-gray-800">--%</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {currentPlace.title || '場所名未設定'}
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              {currentPlace.genre || 'ジャンル未設定'}
            </p>
            
            {/* Tags - will be populated from database */}
            <div className="flex flex-wrap gap-2 mb-4">
              {/* Dynamic tags will be rendered here */}
            </div>

            {/* Date */}
            {currentPlace.date_start && (
              <p className="text-sm text-gray-500">
                📅 {new Date(currentPlace.date_start).toLocaleDateString('ja-JP')}
                {currentPlace.date_end && ` ～ ${new Date(currentPlace.date_end).toLocaleDateString('ja-JP')}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
        <div className="flex justify-center space-x-6">
          <button
            onClick={() => handleReaction('pass')}
            className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <button
            onClick={() => handleReaction('keep')}
            className="bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-full shadow-lg transition-colors"
          >
            <BookmarkIcon className="h-6 w-6" />
          </button>
          <button
            onClick={() => handleReaction('like')}
            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-colors"
          >
            <HeartIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="flex justify-center space-x-6 mt-2 text-xs text-gray-600">
          <span>興味ない</span>
          <span>キープ</span>
          <span>行きたい</span>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}