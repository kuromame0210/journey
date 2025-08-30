'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNavigation from '@/components/BottomNavigation'
import { PencilIcon, Cog6ToothIcon, HeartIcon, BookmarkIcon, XMarkIcon } from '@heroicons/react/24/outline'
import HelpIcon from '@/components/HelpIcon'
import ContextHint from '@/components/ContextHint'

/**
 * 共通化対応: 型定義を統一型に移行
 * 元の実装: src/app/profile/page.tsx:9-21 の Profile interface
 * 移行日: 2025-01-08
 * 共通化により型の一貫性を確保、他ファイルとの重複を解消
 */
import { Profile, PlaceListItem } from '@/shared/types/database'

/**
 * 共通化対応: 重複していたローディングUIを統一コンポーネントに移行
 * 元の実装: src/app/profile/page.tsx:148-157 のローディング画面
 * 移行日: 2025-01-08
 * 共通化により約10行のコード削減、一貫したUX提供
 */
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'

/**
 * 共通化対応: 基本状態管理を統一フックに移行
 * 元の実装: src/app/profile/page.tsx:30,34 の user, isLoading useState
 * 移行日: 2025-01-08  
 * 共通化により約2行のコード削減、状態管理の一貫性確保
 */
import { useBasePageState } from '@/shared/hooks/useBasePageState'

// 後方互換性のための型エイリアス
type Place = PlaceListItem

function ProfilePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // 統一された基本状態管理（元の個別useState実装を置換）
  const { user, setUser, isLoading, setIsLoading, error, setError } = useBasePageState()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState<'posted' | 'liked' | 'kept' | 'passed'>('posted')
  const [places, setPlaces] = useState<Place[]>([])
  const [placeReactions, setPlaceReactions] = useState<Record<string, string>>({})

  const [tabCounts, setTabCounts] = useState({
    posted: 0,
    liked: 0,
    kept: 0,
    passed: 0
  })

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }
      setUser(session.user)
      fetchProfile(session.user.id)
      fetchAllCounts(session.user.id)
      
      // Check for tab parameter from URL
      const tabParam = searchParams.get('tab') as 'posted' | 'liked' | 'kept' | 'passed'
      const initialTab = tabParam && ['posted', 'liked', 'kept', 'passed'].includes(tabParam) ? tabParam : 'posted'
      setActiveTab(initialTab)
      fetchPlaces(session.user.id, initialTab)
    }

    checkAuth()
  }, [router, searchParams])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.log('Profile not found, user needs to create one')
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPlaces = async (userId: string, type: 'posted' | 'liked' | 'kept' | 'passed') => {
    try {
      let query = supabase.from('places').select('*')
      
      if (type === 'posted') {
        query = query.eq('owner', userId)
        
        // Get reactions for own posts to show current status
        const { data: placesData, error } = await query.order('created_at', { ascending: false })
        if (error) throw error
        
        const placeIds = placesData?.map(p => p.id) || []
        if (placeIds.length > 0) {
          const { data: reactionsData } = await supabase
            .from('reactions')
            .select('place_id, type')
            .eq('from_uid', userId)
            .in('place_id', placeIds)
          
          const reactionMap: Record<string, string> = {}
          reactionsData?.forEach(r => {
            reactionMap[r.place_id] = r.type
          })
          setPlaceReactions(reactionMap)
        }
        
        setPlaces(placesData || [])
        return
      } else {
        // For reactions, we'd need to join with reactions table
        const { data: reactionData, error: reactionError } = await supabase
          .from('reactions')
          .select('place_id')
          .eq('from_uid', userId)
          .eq('type', type === 'liked' ? 'like' : type === 'kept' ? 'keep' : 'pass')
        
        if (reactionError) throw reactionError
        
        const placeIds = reactionData?.map(r => r.place_id) || []
        if (placeIds.length === 0) {
          setPlaces([])
          return
        }
        
        // Exclude own posts from reaction lists
        query = query.in('id', placeIds).neq('owner', userId)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      setPlaces(data || [])
    } catch (error) {
      console.error('Error fetching places:', error)
      setPlaces([])
    }
  }

  const fetchAllCounts = async (userId: string) => {
    try {
      // 投稿数を取得
      const { count: postedCount } = await supabase
        .from('places')
        .select('*', { count: 'exact', head: true })
        .eq('owner', userId)

      // リアクション数を取得（自分の投稿を除外）
      const { data: reactions } = await supabase
        .from('reactions')
        .select(`
          type,
          places!inner(owner)
        `)
        .eq('from_uid', userId)
        .neq('places.owner', userId)

      const likedCount = reactions?.filter(r => r.type === 'like').length || 0
      const keptCount = reactions?.filter(r => r.type === 'keep').length || 0
      const passedCount = reactions?.filter(r => r.type === 'pass').length || 0

      setTabCounts({
        posted: postedCount || 0,
        liked: likedCount,
        kept: keptCount,
        passed: passedCount
      })
    } catch (error) {
      console.error('Error fetching counts:', error)
      setTabCounts({ posted: 0, liked: 0, kept: 0, passed: 0 })
    }
  }

  const handleTabChange = (tab: 'posted' | 'liked' | 'kept' | 'passed') => {
    setActiveTab(tab)
    if (user) {
      fetchPlaces(user.id, tab)
    }
  }

  const handleSettingsClick = () => {
    router.push('/settings')
  }

  const handleReactionChange = async (placeId: string, newReactionType: 'like' | 'keep' | 'pass') => {
    if (!user) return

    try {
      // Try upsert first
      const { error } = await supabase
        .from('reactions')
        .upsert({
          place_id: placeId,
          from_uid: user.id,
          type: newReactionType
        })

      if (error) {
        // If duplicate key error, try update instead
        if (error.code === '23505') {
          console.log('Duplicate detected, updating existing reaction...')
          const { error: updateError } = await supabase
            .from('reactions')
            .update({ type: newReactionType })
            .eq('place_id', placeId)
            .eq('from_uid', user.id)
          
          if (updateError) throw updateError
        } else {
          throw error
        }
      }

      // 相互いいね判定とチャットルーム自動作成（typeが'like'の場合のみ）
      if (newReactionType === 'like') {
        const place = places.find(p => p.id === placeId)
        if (place) {
          await checkMutualLikeAndCreateChatRoom(place, user)
        }
      }

      // Update local reaction state for immediate UI feedback
      if (activeTab === 'posted') {
        setPlaceReactions(prev => ({
          ...prev,
          [placeId]: newReactionType
        }))
      }

      // Refresh current tab and update counts
      if (user) {
        await fetchAllCounts(user.id)
        await fetchPlaces(user.id, activeTab)
      }
    } catch (error) {
      console.error('Error updating reaction:', error)
    }
  }

  /**
   * 相互いいね判定とチャットルーム自動作成
   */
  const checkMutualLikeAndCreateChatRoom = async (place: { id: string; owner: string }, currentUser: { id: string; email?: string }) => {
    try {
      // 現在のユーザーの投稿を取得
      const { data: currentUserPlaces, error: placesError } = await supabase
        .from('places')
        .select('id')
        .eq('owner', currentUser.id)

      if (placesError) {
        console.error('Error fetching current user places:', placesError)
        return
      }

      if (!currentUserPlaces || currentUserPlaces.length === 0) {
        return // 現在のユーザーが投稿していない場合は相互いいね不可
      }

      // 投稿者が現在のユーザーの投稿にいいねしているかチェック
      const { data: mutualReaction, error: mutualError } = await supabase
        .from('reactions')
        .select('*')
        .eq('from_uid', place.owner)
        .eq('type', 'like')
        .in('place_id', currentUserPlaces.map(p => p.id))

      if (mutualError) {
        console.error('Error checking mutual reaction:', mutualError)
        return
      }

      // 相互いいねが成立している場合
      if (mutualReaction && mutualReaction.length > 0) {
        console.log('Mutual like detected! Creating chat room...')
        
        // 既存のチャットルームをチェック（同じ場所・同じユーザーペア）
        const { data: existingRoom, error: roomCheckError } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('place_id', place.id)
          .or(`and(user_a.eq.${currentUser.id},user_b.eq.${place.owner}),and(user_a.eq.${place.owner},user_b.eq.${currentUser.id})`)

        if (roomCheckError) {
          console.error('Error checking existing chat room:', roomCheckError)
          return
        }

        // チャットルームが存在しない場合のみ作成
        if (!existingRoom || existingRoom.length === 0) {
          const { data: newRoom, error: createRoomError } = await supabase
            .from('chat_rooms')
            .insert({
              place_id: place.id,
              user_a: currentUser.id,
              user_b: place.owner
            })
            .select()
            .single()

          if (createRoomError) {
            console.error('Error creating chat room:', createRoomError)
            return
          }

          console.log('Chat room created successfully:', newRoom.id)
        } else {
          console.log('Chat room already exists:', existingRoom[0].id)
        }
      }
    } catch (error) {
      console.error('Error in mutual like check:', error)
    }
  }

  if (isLoading) {
    return <LoadingSpinner message="プロフィールデータを読み込み中..." />
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


  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">マイページ</h1>
        <div className="flex items-center space-x-2">
          <HelpIcon
            title="プロフィールについて"
            content={
              <div className="space-y-3">
                <p>👤 <strong>プロフィール機能</strong></p>
                <div className="space-y-2 text-sm">
                  <p>• 自己紹介と写真でアピールしましょう</p>
                  <p>• 投稿した場所が一覧で確認できます</p>
                  <p>• 他のユーザーからの反応が見られます</p>
                  <p>• 設定から各種機能を変更できます</p>
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm">📍 <strong>重要：</strong> 場所を投稿していないとマッチングできません。まずは場所を投稿してみましょう！</p>
                </div>
              </div>
            }
            size="md"
          />
          <button
            onClick={handleSettingsClick}
            className="p-2 -mr-2"
          >
            <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`${profile.name}のプロフィール画像`}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {(profile.name || '?').charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">{profile.name || '名前未設定'}</h2>
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
                {profile.budget_pref && profile.budget_pref.length > 0 ? (
                  profile.budget_pref.map((budgetId: number) => {
                    const budgetLabel = budgetId === 1 ? '低 (〜3万円)' : 
                                       budgetId === 2 ? '中 (3〜10万円)' : 
                                       budgetId === 3 ? '高 (10万円〜)' : 
                                       budgetId === 4 ? '低 (〜3万円)' : 
                                       budgetId === 5 ? '中 (3〜10万円)' : 
                                       budgetId === 6 ? '高 (10万円〜)' : '不明'
                    return (
                      <span key={budgetId} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {budgetLabel}
                      </span>
                    )
                  })
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    未設定
                  </span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">旅の目的</h4>
              <div className="flex flex-wrap gap-2">
                {profile.purpose_tags && profile.purpose_tags.length > 0 ? (
                  profile.purpose_tags.map((tagId: number) => {
                    const purposeLabels: { [key: number]: string } = {
                      1: '観光', 2: 'グルメ', 3: '写真撮影', 
                      4: 'アクティビティ', 5: 'ショッピング', 6: '温泉・リラックス',
                      7: '自然', 8: '歴史・文化', 9: 'テーマパーク', 10: 'スポーツ'
                    }
                    return (
                      <span key={tagId} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {purposeLabels[tagId] || '不明'}
                      </span>
                    )
                  })
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    未設定
                  </span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">相手に求めること</h4>
              <div className="flex flex-wrap gap-2">
                {profile.demand_tags && profile.demand_tags.length > 0 ? (
                  profile.demand_tags.map((tagId: number) => {
                    const demandLabels: { [key: number]: string } = {
                      1: '写真を撮ってくれる人', 2: '一緒に食事を楽しめる人', 
                      3: '体力がある人', 4: '計画性がある人', 5: '語学ができる人',
                      6: '運転ができる人', 7: '現地に詳しい人', 8: '同年代の人',
                      9: '話しやすい人', 10: '時間に余裕がある人'
                    }
                    return (
                      <span key={tagId} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                        {demandLabels[tagId] || '不明'}
                      </span>
                    )
                  })
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    未設定
                  </span>
                )}
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
              <p className="text-gray-500 mb-4">
                {activeTab === 'posted' && 'まだ投稿がありません'}
                {activeTab === 'liked' && 'まだ行きたい場所がありません'}
                {activeTab === 'kept' && 'まだキープした場所がありません'}
                {activeTab === 'passed' && 'パスした場所はありません'}
              </p>
              
              {activeTab === 'posted' && (
                <ContextHint type="info">
                  <strong>場所を投稿</strong>してマッチングを始めましょう！投稿がないとマッチングできません。
                </ContextHint>
              )}
              
              {activeTab === 'liked' && (
                <ContextHint type="tip">
                  ホーム画面で気になる場所に<strong>「いいね」</strong>してみましょう
                </ContextHint>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {places.map((place) => (
                <div
                  key={place.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <div className="flex">
                    {/* Image */}
                    <div 
                      className="w-24 h-24 flex-shrink-0 cursor-pointer"
                      onClick={() => router.push(`/place/${place.id}?from=profile&tab=${activeTab}`)}
                    >
                      <img
                        src={place.images?.[0] || '/placeholder.jpg'}
                        alt={place.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-3 flex flex-col justify-between">
                      <div 
                        className="cursor-pointer"
                        onClick={() => router.push(`/place/${place.id}?from=profile&tab=${activeTab}`)}
                      >
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                          {place.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {place.genre}
                        </p>
                      </div>
                      
                      {/* Reaction Buttons */}
                      <div className="flex space-x-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReactionChange(place.id, 'like')
                            }}
                            className={`p-1 rounded-full text-xs ${
                              (activeTab === 'liked') || (activeTab === 'posted' && placeReactions[place.id] === 'like')
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'
                            }`}
                            title="行きたい"
                          >
                            <HeartIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReactionChange(place.id, 'keep')
                            }}
                            className={`p-1 rounded-full text-xs ${
                              (activeTab === 'kept') || (activeTab === 'posted' && placeReactions[place.id] === 'keep')
                                ? 'bg-yellow-100 text-yellow-600' 
                                : 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-600'
                            }`}
                            title="キープ"
                          >
                            <BookmarkIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReactionChange(place.id, 'pass')
                            }}
                            className={`p-1 rounded-full text-xs ${
                              (activeTab === 'passed') || (activeTab === 'posted' && placeReactions[place.id] === 'pass')
                                ? 'bg-red-100 text-red-600' 
                                : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                            }`}
                            title="興味ない"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                    </div>
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

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingSpinner message="プロフィールページを読み込み中..." />}>
      <ProfilePageContent />
    </Suspense>
  )
}