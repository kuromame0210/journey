'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
// セキュリティ強化のためのエラーハンドリング統一
// 参考: 他のページの改修に合わせてalert()を置き換え
import ErrorToast from '@/components/ErrorToast'
import useErrorHandler from '@/hooks/useErrorHandler'

/**
 * 共通化対応: フォームハンドラーを統一ユーティリティに移行
 * 元の実装: src/app/profile/edit/page.tsx:166-178 の handleInputChange・handleMultiSelectToggle 関数
 * 移行日: 2025-01-08
 * 共通化により約13行のコード削減、一貫したフォーム操作
 */
import { useInputChangeHandler, useArrayToggleHandler } from '@/shared/hooks/useFormHandlers'

/**
 * 共通化対応: 設定・定数配列を統一定数に移行
 * 
 * 共通化元:
 * - src/app/profile/edit/page.tsx:20-24 の budgetOptions 配列定義（完全版・3項目）
 * - src/app/profile/edit/page.tsx:26-37 の purposeTags 配列定義（完全版・10項目）  
 * - src/app/profile/edit/page.tsx:39-50 の demandTags 配列定義（完全版・10項目）
 * 
 * 共通化方法:
 * - 共通定数: src/shared/constants/options.ts の各種OPTIONS として統一
 * - 呼び出し方法: import + 後方互換性のための型エイリアス
 * 
 * 共通化効果:
 * - 重複削減: 31行削除（budgetOptions:4行 + purposeTags:12行 + demandTags:12行 + 空行:3行）
 * - データ一貫性: オプション配列の統一管理
 * - 保守性向上: 1箇所修正で全体に反映
 * 
 * 移行日: 2025-01-08
 * 移行者: Claude Code (重複コード統一プロジェクト)
 */
import { 
  BUDGET_OPTIONS,
  PURPOSE_TAGS_FULL as PURPOSE_TAGS,
  DEMAND_TAGS_FULL as DEMAND_TAGS,
  MBTI_TYPES
} from '@/shared/constants'
import { useImageCompression } from '@/shared/hooks/useImageCompression'
import { formatFileSize } from '@/shared/utils/imageCompression'

// 後方互換性のための型エイリアス
// 元の実装: const budgetOptions = [{ id: 1, label: '低 (〜3万円)' }, ...]
const budgetOptions = BUDGET_OPTIONS
const purposeTags = PURPOSE_TAGS  
const demandTags = DEMAND_TAGS

// 統一されたMBTI定数使用（元の個別mbtiTypes配列定義を置換）
const mbtiTypes = MBTI_TYPES

export default function ProfileEditPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // セキュリティ強化: alert()をErrorToastに置き換え
  const { message, type, isVisible, handleError, showWarning, showSuccess, clearMessage } = useErrorHandler()
  
  const [formData, setFormData] = useState({
    name: '',
    gender: 'other' as 'male' | 'female' | 'other',
    age: '',
    partner_gender: 'either' as 'male' | 'female' | 'either',
    must_condition: '',
    mbti: '',
    budget_pref: [] as number[],
    purpose_tags: [] as number[],
    demand_tags: [] as number[],
    phone: '',
    email: '',
    avatar_url: ''
  })
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  
  // 画像圧縮機能
  const { 
    isCompressing, 
    progress: compressionProgress, 
    error: compressionError, 
    compressSingleImage,
    reset: resetCompression
  } = useImageCompression()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }
      setUser(session.user)
      
      // Pre-fill email and phone from auth
      console.log('Session user:', session.user)
      setFormData(prev => ({
        ...prev,
        email: session.user.email || '',
        phone: session.user.phone || session.user.user_metadata?.phone || ''
      }))

      // Try to fetch existing profile
      fetchProfile(session.user.id)
    }

    checkAuth()
  }, [router])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (data) {
        console.log('Fetched profile data:', data)
        console.log('Budget pref from DB:', data.budget_pref, 'Type:', typeof data.budget_pref)
        
        setFormData({
          name: data.name || '',
          gender: data.gender || 'other',
          age: data.age?.toString() || '',
          partner_gender: data.partner_gender || 'either',
          must_condition: data.must_condition || '',
          mbti: data.mbti || '',
          budget_pref: Array.isArray(data.budget_pref) 
            ? data.budget_pref.map((id: number) => {
                // 旧ID(4,5,6)を新ID(1,2,3)に変換
                if (id === 4) return 1
                if (id === 5) return 2 
                if (id === 6) return 3
                return id
              })
            : [],
          purpose_tags: Array.isArray(data.purpose_tags) ? data.purpose_tags : [],
          demand_tags: Array.isArray(data.demand_tags) ? data.demand_tags : [],
          phone: data.phone || '',
          email: data.email || '',
          avatar_url: data.avatar_url || ''
        })
        
        // Set avatar preview if exists
        if (data.avatar_url) {
          setAvatarPreview(data.avatar_url)
        }
      }
    } catch (fetchError) {
      console.error('Error fetching profile:', fetchError)
    }
  }

  // 共通化されたフォームハンドラー使用
  const handleInputChange = useInputChangeHandler(setFormData)
  const handleMultiSelectToggle = useArrayToggleHandler(setFormData)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        // セキュリティ強化: alert()をshowWarning()に置き換え
        // 旧実装: alert('画像ファイルを選択してください')
        showWarning('画像ファイルを選択してください')
        return
      }
      
      // Validate file size (max 5MB before compression)
      if (file.size > 5 * 1024 * 1024) {
        // セキュリティ強化: alert()をshowWarning()に置き換え
        // 旧実装: alert('ファイルサイズは5MB以下にしてください')
        showWarning('ファイルサイズは5MB以下にしてください')
        return
      }
      
      resetCompression()
      
      try {
        // 画像を圧縮
        const compressionResult = await compressSingleImage(file, {
          maxWidth: 800,  // アバターは小さくて良い
          maxHeight: 800,
          quality: 0.9,   // アバターは高品質を保つ
          outputFormat: 'jpeg'
        })
        
        if (compressionResult) {
          // 圧縮結果をログ出力
          console.log('Avatar compression:', {
            originalSize: formatFileSize(compressionResult.originalSize),
            compressedSize: formatFileSize(compressionResult.compressedSize),
            ratio: `${compressionResult.compressionRatio}% reduced`
          })
          
          setAvatarFile(compressionResult.file)
          
          // Create preview from compressed image
          const reader = new FileReader()
          reader.onload = (e) => {
            setAvatarPreview(e.target?.result as string)
          }
          reader.readAsDataURL(compressionResult.file)
        }
      } catch (error) {
        console.error('Avatar compression failed:', error)
        const errorMessage = compressionError || '画像の処理に失敗しました'
        handleError(error, errorMessage)
      }
    }
  }

  const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = 'jpg' // 圧縮後はJPEGに統一
      const fileName = `${userId}/avatar.${fileExt}`
      
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading avatar:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)

    try {
      let avatarUrl = formData.avatar_url

      // Upload avatar if a new file is selected
      if (avatarFile) {
        console.log('Uploading avatar...')
        const uploadedUrl = await uploadAvatar(avatarFile, user.id)
        if (uploadedUrl) {
          avatarUrl = uploadedUrl
          console.log('Avatar uploaded:', uploadedUrl)
          // Update formData to reflect the new avatar URL
          setFormData(prev => ({ ...prev, avatar_url: uploadedUrl }))
        }
      }

      // Debug: Log current form data
      console.log('Current form data:', formData)
      
      // Filter out invalid IDs before saving
      const validBudgetIds = formData.budget_pref.filter(id => id >= 1 && id <= 3)
      const validPurposeIds = formData.purpose_tags.filter(id => id >= 1 && id <= 10)
      const validDemandIds = formData.demand_tags.filter(id => id >= 1 && id <= 10)

      const profileData = {
        id: user.id,
        name: formData.name,
        gender: formData.gender,
        age: formData.age ? parseInt(formData.age) : null,
        partner_gender: formData.partner_gender,
        must_condition: formData.must_condition || null,
        mbti: formData.mbti || null,
        budget_pref: validBudgetIds.length > 0 ? validBudgetIds : [],
        purpose_tags: validPurposeIds.length > 0 ? validPurposeIds : [],
        demand_tags: validDemandIds.length > 0 ? validDemandIds : [],
        phone: formData.phone || null,
        email: formData.email || user.email || null,
        avatar_url: avatarUrl || null
      }

      console.log('Saving profile data:', profileData)
      
      const { error } = await supabase
        .from('profiles')
        .upsert([profileData])

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Profile saved successfully')
      
      // Reset avatar file after successful save
      setAvatarFile(null)
      
      router.push('/profile')
    } catch (error: unknown) {
      console.error('Error saving profile:', error)
      // セキュリティ強化: 技術的詳細を隠したエラーメッセージ表示
      // 旧実装: alert(`プロフィールの保存中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`)
      handleError(error, 'プロフィールの保存中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">プロフィール編集</h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="p-4 pb-8 space-y-6">
        {/* Avatar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            プロフィール画像
          </label>
          <div className="flex items-center space-x-4">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-gray-300">
                  {formData.name.charAt(0) || '?'}
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <div className="text-sm text-gray-600">
              <p>JPG、PNG形式 (最大5MB)</p>
              <p>正方形の画像が推奨です</p>
              {isCompressing && (
                <p className="text-blue-600 font-medium">
                  圧縮中... {compressionProgress}%
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            名前 *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="お名前を入力"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            性別 *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'male', label: '男性' },
              { value: 'female', label: '女性' },
              { value: 'other', label: 'その他' }
            ].map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value={option.value}
                  checked={formData.gender === option.value}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="mr-2"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* Age */}
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
            年齢
          </label>
          <input
            type="number"
            id="age"
            min="18"
            max="100"
            value={formData.age}
            onChange={(e) => handleInputChange('age', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="年齢を入力"
          />
        </div>

        {/* Partner Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            一緒に旅行したい相手の性別
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'male', label: '男性' },
              { value: 'female', label: '女性' },
              { value: 'either', label: 'どちらでも' }
            ].map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="partner_gender"
                  value={option.value}
                  checked={formData.partner_gender === option.value}
                  onChange={(e) => handleInputChange('partner_gender', e.target.value)}
                  className="mr-2"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* MBTI */}
        <div>
          <label htmlFor="mbti" className="block text-sm font-medium text-gray-700 mb-2">
            MBTI
          </label>
          <select
            id="mbti"
            value={formData.mbti}
            onChange={(e) => handleInputChange('mbti', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">選択してください</option>
            {mbtiTypes.map((category) => (
              <optgroup key={category.category} label={category.category}>
                {category.types.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Budget Preference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            予算感 (複数選択可)
          </label>
          <div className="space-y-2">
            {budgetOptions.map(option => (
              <label key={option.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.budget_pref.includes(option.id)}
                  onChange={() => handleMultiSelectToggle('budget_pref', option.id)}
                  className="mr-2"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* Purpose Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            旅の目的 (複数選択可)
          </label>
          <div className="flex flex-wrap gap-2">
            {purposeTags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleMultiSelectToggle('purpose_tags', tag.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  formData.purpose_tags.includes(tag.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Demand Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            相手に求めること (複数選択可)
          </label>
          <div className="flex flex-wrap gap-2">
            {demandTags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleMultiSelectToggle('demand_tags', tag.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  formData.demand_tags.includes(tag.id)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Must Condition */}
        <div>
          <label htmlFor="must_condition" className="block text-sm font-medium text-gray-700 mb-2">
            自己紹介・その他条件
          </label>
          <textarea
            id="must_condition"
            rows={4}
            value={formData.must_condition}
            onChange={(e) => handleInputChange('must_condition', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="自己紹介や一緒に旅行する相手に求める条件などを自由に記述してください"
          />
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">認証時のメールアドレスが表示されます</p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              電話番号
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="+81 90-1234-5678"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !formData.name}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '保存中...' : '保存する'}
        </button>
      </form>
      
      {/* セキュリティ強化: 統一されたエラー表示UIコンポーネント */}
      {/* 旧実装のalert()を全て置き換え */}
      <ErrorToast
        message={message}
        type={type}
        isVisible={isVisible}
        onClose={clearMessage}
      />
    </div>
  )
}