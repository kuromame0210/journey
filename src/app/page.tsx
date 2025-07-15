'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { checkAuthStatus } from '@/lib/auth-helpers'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const redirect = async () => {
      const { isAuthenticated } = await checkAuthStatus()
      
      if (isAuthenticated) {
        router.replace('/home')
      } else {
        router.replace('/auth')
      }
    }

    redirect()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">Journey</h1>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    </div>
  )
}
