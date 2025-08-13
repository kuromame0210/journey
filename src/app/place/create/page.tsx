'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeftIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
// セキュリティ強化のためのエラーハンドリング統一
// 参考: 他のページの改修に合わせてalert()を置き換え
import ErrorToast from '@/components/ErrorToast'
import useErrorHandler from '@/hooks/useErrorHandler'

/**
 * 共通化対応: フォームハンドラーを統一ユーティリティに移行
 * 元の実装: src/app/place/create/page.tsx:76-87 の handleInputChange・handleTagToggle 関数
 * 移行日: 2025-01-08
 * 共通化により約12行のコード削減、一貫したフォーム操作
 */
import { useInputChangeHandler, useArrayToggleHandler } from '@/shared/hooks/useFormHandlers'

/**
 * 共通化対応: 設定・定数配列を統一定数に移行
 * 
 * 共通化元:
 * - src/app/place/create/page.tsx:20-24 の budgetOptions 配列定義（基本版・3項目）
 * - src/app/place/create/page.tsx:26-33 の purposeTags 配列定義（基本版・6項目）
 * - src/app/place/create/page.tsx:35-41 の demandTags 配列定義（基本版・5項目）
 * 
 * 共通化方法:
 * - 共通定数: src/shared/constants/options.ts の各種OPTIONS として統一
 * - 呼び出し方法: import + BASIC版を使用し後方互換性を保持
 * 
 * 共通化効果:
 * - 重複削減: 22行削除（budgetOptions:4行 + purposeTags:8行 + demandTags:6行 + 空行:4行）
 * - データ一貫性: profile/edit/page.tsxとのオプション配列統一
 * - 保守性向上: 1箇所修正で全体に反映
 * 
 * 注意: このページでは簡略版を使用していたが、統一性のためBASIC版を使用
 * - purposeTags: 6項目のまま維持
 * - demandTags: 5項目のまま維持
 * UXに影響なし
 * 
 * 移行日: 2025-01-08
 * 移行者: Claude Code (重複コード統一プロジェクト)
 */
import { 
  BUDGET_OPTIONS,
  PURPOSE_TAGS_BASIC as PURPOSE_TAGS,
  DEMAND_TAGS_BASIC as DEMAND_TAGS
} from '@/shared/constants'

// 後方互換性のための型エイリアス
// 元の実装: const budgetOptions = [{ id: 1, label: '低 (〜3万円)' }, ...]
const budgetOptions = BUDGET_OPTIONS
const purposeTags = PURPOSE_TAGS   // 基本6項目版を使用  
const demandTags = DEMAND_TAGS     // 基本5項目版を使用

export default function PlaceCreatePage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  
  // セキュリティ強化: alert()をErrorToastに置き換え
  const { message, type, isVisible, handleError, clearMessage } = useErrorHandler()
  
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    purpose_text: '',
    budget_option: 0,
    purpose_tags: [] as number[],
    demand_tags: [] as number[],
    budget_min: '',
    budget_max: '',
    date_start: '',
    date_end: '',
    recruit_num: '',
    first_choice: '',
    second_choice: '',
    gmap_url: ''
  })

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }
      setUser(session.user)
    }

    checkAuth()
  }, [router])

  // 共通化されたフォームハンドラー使用
  const handleInputChange = useInputChangeHandler(setFormData)
  const handleTagToggle = useArrayToggleHandler(setFormData)

  const handleImageAdd = () => {
    if (images.length < 5) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.multiple = true
      input.onchange = (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || [])
        const remainingSlots = 5 - images.length
        const filesToAdd = files.slice(0, remainingSlots)
        
        if (filesToAdd.length > 0) {
          handleImageUpload(filesToAdd)
        }
      }
      input.click()
    }
  }

  const handleImageUpload = async (files: File[]) => {
    if (!user) return
    
    setUploadingImages(true)
    
    try {
      const uploadPromises = files.map(async (file, index) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${index}.${fileExt}`
        
        const { error } = await supabase.storage
          .from('place-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (error) throw error
        
        const { data: { publicUrl } } = supabase.storage
          .from('place-images')
          .getPublicUrl(fileName)
        
        return publicUrl
      })
      
      const uploadedUrls = await Promise.all(uploadPromises)
      setImages(prev => [...prev, ...uploadedUrls])
      setImageFiles(prev => [...prev, ...files])
    } catch (error) {
      console.error('Error uploading images:', error)
      // セキュリティ強化: 技術的詳細を隠したエラーメッセージ表示
      // 旧実装: alert('画像のアップロードに失敗しました')
      handleError(error, '画像のアップロードに失敗しました')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleImageRemove = async (index: number) => {
    const imageUrl = images[index]
    
    // Remove from storage if it was uploaded
    if (imageUrl && user) {
      try {
        const fileName = imageUrl.split('/').pop()
        if (fileName) {
          await supabase.storage
            .from('place-images')
            .remove([`${user.id}/${fileName}`])
        }
      } catch (error) {
        console.error('Error removing image from storage:', error)
      }
    }
    
    setImages(images.filter((_, i) => i !== index))
    setImageFiles(imageFiles.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)

    try {
      const placeData = {
        owner: user.id,
        title: formData.title,
        genre: formData.genre,
        images: images,
        budget_option: formData.budget_option || null,
        purpose_tags: formData.purpose_tags,
        demand_tags: formData.demand_tags,
        purpose_text: formData.purpose_text,
        budget_min: formData.budget_min ? parseInt(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseInt(formData.budget_max) : null,
        date_start: formData.date_start || null,
        date_end: formData.date_end || null,
        recruit_num: formData.recruit_num ? parseInt(formData.recruit_num) : null,
        first_choice: formData.first_choice,
        second_choice: formData.second_choice,
        gmap_url: formData.gmap_url
      }

      const { error } = await supabase
        .from('places')
        .insert([placeData])

      if (error) throw error

      router.push('/home')
    } catch (error) {
      console.error('Error creating place:', error)
      // セキュリティ強化: 技術的詳細を隠したエラーメッセージ表示
      // 旧実装: alert('投稿の作成中にエラーが発生しました')
      handleError(error, '投稿の作成中にエラーが発生しました')
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
        <h1 className="text-lg font-semibold text-gray-900">新しい場所を投稿</h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="p-4 pb-8 space-y-6">
        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            画像 (最大5枚)
          </label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {images.map((image, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={image}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleImageRemove(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button
                type="button"
                onClick={handleImageAdd}
                disabled={uploadingImages}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingImages ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                ) : (
                  <PhotoIcon className="h-8 w-8 text-gray-400" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            場所名 *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="行きたい場所の名前を入力"
          />
        </div>

        {/* Genre */}
        <div>
          <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
            ジャンル
          </label>
          <input
            type="text"
            id="genre"
            value={formData.genre}
            onChange={(e) => handleInputChange('genre', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="ジャンルを入力"
          />
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
                onClick={() => handleTagToggle('purpose_tags', tag.id)}
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

        {/* Budget Option */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            予算帯
          </label>
          <div className="space-y-2">
            {budgetOptions.map(option => (
              <label key={option.id} className="flex items-center">
                <input
                  type="radio"
                  name="budget_option"
                  value={option.id}
                  checked={formData.budget_option === option.id}
                  onChange={(e) => handleInputChange('budget_option', parseInt(e.target.value))}
                  className="mr-2"
                />
                {option.label}
              </label>
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
                onClick={() => handleTagToggle('demand_tags', tag.id)}
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

        {/* Purpose Text */}
        <div>
          <label htmlFor="purpose_text" className="block text-sm font-medium text-gray-700 mb-2">
            何を見たい・したいか
          </label>
          <textarea
            id="purpose_text"
            rows={3}
            value={formData.purpose_text}
            onChange={(e) => handleInputChange('purpose_text', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="この場所で何をしたいか、どんな体験をしたいかを詳しく教えてください"
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date_start" className="block text-sm font-medium text-gray-700 mb-2">
              開始日
            </label>
            <input
              type="date"
              id="date_start"
              value={formData.date_start}
              onChange={(e) => handleInputChange('date_start', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="date_end" className="block text-sm font-medium text-gray-700 mb-2">
              終了日
            </label>
            <input
              type="date"
              id="date_end"
              value={formData.date_end}
              onChange={(e) => handleInputChange('date_end', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Recruit Number */}
        <div>
          <label htmlFor="recruit_num" className="block text-sm font-medium text-gray-700 mb-2">
            募集人数
          </label>
          <input
            type="number"
            id="recruit_num"
            min="1"
            value={formData.recruit_num}
            onChange={(e) => handleInputChange('recruit_num', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="例: 2"
          />
        </div>

        {/* Google Maps URL */}
        <div>
          <label htmlFor="gmap_url" className="block text-sm font-medium text-gray-700 mb-2">
            Google Maps URL
          </label>
          <input
            type="url"
            id="gmap_url"
            value={formData.gmap_url}
            onChange={(e) => handleInputChange('gmap_url', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://maps.google.com/..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !formData.title}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '投稿中...' : '投稿する'}
        </button>
      </form>
      
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