'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

const budgetOptions = [
  { id: 1, label: '低 (〜3万円)' },
  { id: 2, label: '中 (3〜10万円)' },
  { id: 3, label: '高 (10万円〜)' }
]

const purposeTags = [
  { id: 1, label: '観光' },
  { id: 2, label: 'グルメ' },
  { id: 3, label: '写真撮影' },
  { id: 4, label: 'アクティビティ' },
  { id: 5, label: 'ショッピング' },
  { id: 6, label: '温泉・リラックス' }
]

const demandTags = [
  { id: 1, label: '写真を撮ってくれる人' },
  { id: 2, label: '一緒に食事を楽しめる人' },
  { id: 3, label: '体力がある人' },
  { id: 4, label: '計画性がある人' },
  { id: 5, label: '語学ができる人' }
]

export default function ProfileEditPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
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
    email: ''
  })

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }
      setUser(session.user)
      
      // Pre-fill email and phone from auth
      setFormData(prev => ({
        ...prev,
        email: session.user.email || '',
        phone: session.user.phone || ''
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
        setFormData({
          name: data.name || '',
          gender: data.gender || 'other',
          age: data.age?.toString() || '',
          partner_gender: data.partner_gender || 'either',
          must_condition: data.must_condition || '',
          mbti: data.mbti || '',
          budget_pref: data.budget_pref || [],
          purpose_tags: data.purpose_tags || [],
          demand_tags: data.demand_tags || [],
          phone: data.phone || '',
          email: data.email || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const handleInputChange = (field: string, value: string | number | number[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleMultiSelectToggle = (field: 'budget_pref' | 'purpose_tags' | 'demand_tags', id: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(id)
        ? prev[field].filter(item => item !== id)
        : [...prev[field], id]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)

    try {
      const profileData = {
        id: user.id,
        name: formData.name,
        gender: formData.gender,
        age: formData.age ? parseInt(formData.age) : null,
        partner_gender: formData.partner_gender,
        must_condition: formData.must_condition,
        mbti: formData.mbti,
        budget_pref: formData.budget_pref,
        purpose_tags: formData.purpose_tags,
        demand_tags: formData.demand_tags,
        phone: formData.phone,
        email: formData.email
      }

      const { error } = await supabase
        .from('profiles')
        .upsert([profileData])

      if (error) throw error

      router.push('/profile')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('プロフィールの保存中にエラーが発生しました')
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
            placeholder="例: 山田太郎"
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
            placeholder="例: 25"
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
          <input
            type="text"
            id="mbti"
            value={formData.mbti}
            onChange={(e) => handleInputChange('mbti', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="例: ENFP"
            maxLength={4}
          />
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
    </div>
  )
}