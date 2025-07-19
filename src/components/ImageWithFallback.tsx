'use client'

import { useState, useEffect } from 'react'

interface ImageWithFallbackProps {
  src: string
  alt: string
  className?: string
  fallback?: string
}

export default function ImageWithFallback({ 
  src, 
  alt, 
  className = '',
  fallback = '/placeholder-image.jpg'
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  // srcが変更されたときにstateをリセット
  useEffect(() => {
    setImgSrc(src)
    setHasError(false)
  }, [src])

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      // フォールバック画像を試す
      setImgSrc(fallback)
    } else {
      // フォールバックも失敗した場合、プレースホルダーを表示
      setImgSrc('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDE0NVYxNzVIMTc1VjEyNVoiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTIyNSAxMjVIMTk1VjE3NUgyMjVWMTI1WiIgZmlsbD0iIzlDQTRBRiIvPgo8L3N2Zz4K')
    }
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  )
}