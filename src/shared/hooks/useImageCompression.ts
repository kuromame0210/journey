import { useState, useCallback } from 'react'
import { compressImage, compressImages, CompressionOptions, CompressionResult } from '@/shared/utils/imageCompression'

interface UseImageCompressionState {
  isCompressing: boolean
  progress: number
  error: string | null
}

interface UseImageCompressionReturn extends UseImageCompressionState {
  compressSingleImage: (file: File, options?: CompressionOptions) => Promise<CompressionResult | null>
  compressMultipleImages: (files: File[], options?: CompressionOptions) => Promise<CompressionResult[]>
  reset: () => void
}

/**
 * 画像圧縮用のカスタムフック
 */
export const useImageCompression = (): UseImageCompressionReturn => {
  const [state, setState] = useState<UseImageCompressionState>({
    isCompressing: false,
    progress: 0,
    error: null
  })

  const reset = useCallback(() => {
    setState({
      isCompressing: false,
      progress: 0,
      error: null
    })
  }, [])

  const compressSingleImage = useCallback(async (
    file: File, 
    options?: CompressionOptions
  ): Promise<CompressionResult | null> => {
    setState(prev => ({ ...prev, isCompressing: true, progress: 0, error: null }))
    
    try {
      setState(prev => ({ ...prev, progress: 20 }))
      
      const result = await compressImage(file, options)
      
      setState(prev => ({ ...prev, progress: 100 }))
      
      // 圧縮完了後少し待ってからリセット
      setTimeout(() => {
        setState(prev => ({ ...prev, isCompressing: false, progress: 0 }))
      }, 500)
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '画像圧縮に失敗しました'
      setState(prev => ({ 
        ...prev, 
        isCompressing: false, 
        progress: 0, 
        error: errorMessage 
      }))
      return null
    }
  }, [])

  const compressMultipleImages = useCallback(async (
    files: File[], 
    options?: CompressionOptions
  ): Promise<CompressionResult[]> => {
    setState(prev => ({ ...prev, isCompressing: true, progress: 0, error: null }))
    
    try {
      const results: CompressionResult[] = []
      const totalFiles = files.length
      
      for (let i = 0; i < files.length; i++) {
        setState(prev => ({ 
          ...prev, 
          progress: Math.round(((i + 0.5) / totalFiles) * 100) 
        }))
        
        const result = await compressImage(files[i], options)
        results.push(result)
      }
      
      setState(prev => ({ ...prev, progress: 100 }))
      
      // 圧縮完了後少し待ってからリセット
      setTimeout(() => {
        setState(prev => ({ ...prev, isCompressing: false, progress: 0 }))
      }, 500)
      
      return results
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '画像圧縮に失敗しました'
      setState(prev => ({ 
        ...prev, 
        isCompressing: false, 
        progress: 0, 
        error: errorMessage 
      }))
      return []
    }
  }, [])

  return {
    ...state,
    compressSingleImage,
    compressMultipleImages,
    reset
  }
}