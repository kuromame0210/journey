'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNavigation from '@/components/BottomNavigation'
import { PencilIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

interface Profile {
  id: string
  name: string
  gender: 'male' | 'female' | 'other'
  age: number
  partner_gender: 'male' | 'female' | 'either'
  must_condition: string
  mbti: string
  budget_pref: number[]
  purpose_tags: number[]
  demand_tags: number[]
}

interface Place {
  id: string
  title: string
  images: string[]
  genre: string
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState<'posted' | 'liked' | 'kept' | 'passed'>('posted')
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }
      setUser(session.user)
      fetchProfile(session.user.id)
      fetchPlaces(session.user.id, 'posted')
    }

    checkAuth()
  }, [router])

  const fetchProfile = async (userId: string) => {
    try {
      // Mock profile data
      const mockProfile: Profile = {
        id: userId,
        name: '山田太郎',
        gender: 'male',
        age: 28,
        partner_gender: 'either',
        must_condition: '一緒に楽しく旅行できる方を探しています！写真撮影が好きで、美味しいものを食べるのも大好きです。',
        mbti: 'ENFP',
        budget_pref: [1, 2],
        purpose_tags: [1, 2, 3],
        demand_tags: [1, 2]
      }

      setProfile(mockProfile)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPlaces = async (userId: string, type: 'posted' | 'liked' | 'kept' | 'passed') => {
    try {
      // Mock places data based on tab
      let mockPlaces: Place[] = []

      if (type === 'posted') {
        mockPlaces = [
          {
            id: '1',
            title: '京都の清水寺',
            images: ['https://via.placeholder.com/300x200?text=Kyoto'],
            genre: '観光地',
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            title: '沖縄の美ら海水族館',
            images: ['https://via.placeholder.com/300x200?text=Okinawa'],
            genre: '水族館',
            created_at: new Date().toISOString()
          }
        ]
      } else if (type === 'liked') {
        mockPlaces = [
          {
            id: '3',
            title: '北海道のラベンダー畑',
            images: ['https://via.placeholder.com/300x200?text=Hokkaido'],
            genre: '自然',
            created_at: new Date().toISOString()
          }
        ]
      } else if (type === 'kept') {
        mockPlaces = [
          {
            id: '4',
            title: '富士山五合目',
            images: ['https://via.placeholder.com/300x200?text=Fuji'],
            genre: '登山',
            created_at: new Date().toISOString()
          }
        ]
      }

      setPlaces(mockPlaces)
    } catch (error) {
      console.error('Error fetching places:', error)
    }
  }

  const handleTabChange = (tab: 'posted' | 'liked' | 'kept' | 'passed') => {
    setActiveTab(tab)
    if (user) {
      fetchPlaces(user.id, tab)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/auth')
    } catch (error) {
      console.error('Error signing out:', error)
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">プロフィールが見つかりません</h2>
            <button
              onClick={() => router.push('/profile/edit')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              プロフィールを作成
            </button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  const tabLabels = {
    posted: '投稿済',
    liked: '行きたい',
    kept: 'キープ',
    passed: '興味ない'
  }

  const tabCounts = {
    posted: 2,
    liked: 1,
    kept: 1,
    passed: 0
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">マイページ</h1>
        <button
          onClick={handleSignOut}
          className="p-2"
        >
          <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-gray-600">
                  {profile.age}歳 • {profile.gender === 'male' ? '男性' : profile.gender === 'female' ? '女性' : 'その他'}
                </p>
                {profile.mbti && (
                  <span className="inline-block mt-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                    {profile.mbti}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => router.push('/profile/edit')}
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Must Condition */}
          {profile.must_condition && (
            <div className="mb-4">
              <p className="text-gray-700 text-sm leading-relaxed">
                {profile.must_condition}
              </p>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">予算帯</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  低・中
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">旅の目的</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  観光
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  グルメ
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  写真撮影
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">相手に求めること</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  写真を撮ってくれる人
                </span>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  一緒に食事を楽しめる人
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <div className="bg-white border-b">
          <div className="flex">
            {Object.entries(tabLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleTabChange(key as 'liked' | 'kept' | 'posted' | 'passed')}
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
                <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {tabCounts[key as keyof typeof tabCounts]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {places.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">
                {activeTab === 'posted' && '📝'}
                {activeTab === 'liked' && '❤️'}
                {activeTab === 'kept' && '📌'}
                {activeTab === 'passed' && '❌'}
              </div>
              <p className="text-gray-500">
                {activeTab === 'posted' && 'まだ投稿がありません'}
                {activeTab === 'liked' && 'まだ行きたい場所がありません'}
                {activeTab === 'kept' && 'まだキープした場所がありません'}
                {activeTab === 'passed' && 'パスした場所はありません'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {places.map((place) => (
                <div
                  key={place.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/place/${place.id}`)}
                >
                  <div className="aspect-[4/3]">
                    <img
                      src={place.images[0]}
                      alt={place.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 text-sm truncate">
                      {place.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {place.genre}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}