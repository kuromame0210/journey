'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeftIcon, MapPinIcon, CalendarDaysIcon, UserGroupIcon, HeartIcon, BookmarkIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Place {
  id: string
  title: string
  images: string[]
  genre: string
  purpose_tags: number[]
  demand_tags: number[]
  budget_option: number
  purpose_text: string
  budget_min: number
  budget_max: number
  date_start: string
  date_end: string
  recruit_num: number
  first_choice: string
  second_choice: string
  gmap_url: string
  owner: string
}

export default function PlaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [place, setPlace] = useState<Place | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const fetchPlace = async () => {
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error fetching place:', error)
        setPlace(null)
      } else {
        setPlace(data)
      }
    } catch (error) {
      console.error('Error fetching place:', error)
      setPlace(null)
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
      fetchPlace()
    }

    checkAuth()
  }, [params.id, router])

  const handleReaction = async (type: 'like' | 'keep' | 'pass') => {
    if (!user || !place) return

    try {
      const { error } = await supabase
        .from('reactions')
        .upsert({
          place_id: place.id,
          from_uid: user.id,
          type: type
        })

      if (error) throw error
      
      // Navigate back to home
      router.push('/home')
    } catch (error) {
      console.error('Error saving reaction:', error)
      alert('エラーが発生しました')
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

  if (!place) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">場所が見つかりません</h2>
          <button
            onClick={() => router.push('/home')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="relative">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
        </button>
        
        {/* Image Carousel */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-blue-400 to-purple-500">
          {place.images && place.images.length > 0 ? (
            <>
              <img
                src={place.images[currentImageIndex]}
                alt={place.title}
                className="w-full h-full object-cover"
              />
              {place.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {place.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-lg font-medium">
              {place.title || '画像なし'}
            </div>
          )}

          {/* Match percentage */}
          <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full">
            <span className="text-sm font-bold text-gray-800">--%</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pb-24">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {place.title || '場所名未設定'}
        </h1>

        {/* Genre */}
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {place.genre || 'ジャンル未設定'}
          </span>
        </div>

        {/* Date */}
        {place.date_start && (
          <div className="flex items-center mb-4 text-gray-600">
            <CalendarDaysIcon className="h-5 w-5 mr-2" />
            <span>
              {new Date(place.date_start).toLocaleDateString('ja-JP')}
              {place.date_end && ` ～ ${new Date(place.date_end).toLocaleDateString('ja-JP')}`}
            </span>
          </div>
        )}

        {/* Recruit number */}
        {place.recruit_num && (
          <div className="flex items-center mb-4 text-gray-600">
            <UserGroupIcon className="h-5 w-5 mr-2" />
            <span>募集人数: {place.recruit_num}人</span>
          </div>
        )}

        {/* Budget */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">予算</h3>
          {place.budget_min && place.budget_max ? (
            <p className="text-gray-600">
              ¥{place.budget_min.toLocaleString()} ～ ¥{place.budget_max.toLocaleString()}
            </p>
          ) : (
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              予算帯: 中
            </span>
          )}
        </div>

        {/* Purpose */}
        {place.purpose_text && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">旅の目的・やりたいこと</h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
              {place.purpose_text}
            </p>
          </div>
        )}

        {/* Tags */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">タグ</h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              観光
            </span>
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
              グルメ
            </span>
            <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
              写真撮影
            </span>
          </div>
        </div>

        {/* Choices */}
        {(place.first_choice || place.second_choice) && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">相手に求めること</h3>
            <div className="space-y-2">
              {place.first_choice && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <span className="text-blue-800 font-medium">第一希望: </span>
                  <span className="text-gray-700">{place.first_choice}</span>
                </div>
              )}
              {place.second_choice && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600 font-medium">第二希望: </span>
                  <span className="text-gray-700">{place.second_choice}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Google Maps Link */}
        {place.gmap_url && (
          <div className="mb-6">
            <a
              href={place.gmap_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <MapPinIcon className="h-5 w-5 mr-2" />
              Google Mapsで見る
            </a>
          </div>
        )}
      </div>

      {/* Fixed Action Buttons */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 p-4">
        <div className="flex justify-center space-x-6 mb-2">
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
        <div className="flex justify-center space-x-6 text-xs text-gray-600">
          <span>興味ない</span>
          <span>キープ</span>
          <span>行きたい</span>
        </div>
      </div>
    </div>
  )
}