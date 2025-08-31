import { IMAGE_UPLOAD } from '@/shared/constants/app'

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxFileSize?: number
  outputFormat?: 'jpeg' | 'webp' | 'png' | 'original'
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

/**
 * 画像をキャンバスを使って圧縮する
 */
export const compressImage = async (
  file: File, 
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const {
    maxWidth = IMAGE_UPLOAD.MAX_WIDTH,
    maxHeight = IMAGE_UPLOAD.MAX_HEIGHT,
    quality = IMAGE_UPLOAD.QUALITY,
    maxFileSize = IMAGE_UPLOAD.MAX_FILE_SIZE,
    outputFormat = 'original'
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      try {
        // キャンバスを作成
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('キャンバスがサポートされていません'))
          return
        }

        // 元のアスペクト比を保持してリサイズ計算
        const { width, height } = calculateDimensions(
          img.width, 
          img.height, 
          maxWidth, 
          maxHeight
        )

        canvas.width = width
        canvas.height = height

        // 高品質な画像描画設定
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // 画像をキャンバスに描画
        ctx.drawImage(img, 0, 0, width, height)

        // 出力形式を決定
        const mimeType = determineOutputFormat(file, outputFormat)

        // キャンバスからBlobを生成
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('画像の圧縮に失敗しました'))
              return
            }

            // ファイルサイズチェック
            if (blob.size > maxFileSize) {
              // サイズが大きすぎる場合はより低い品質で再圧縮
              compressWithLowerQuality(canvas, mimeType, maxFileSize, file.name)
                .then(resolve)
                .catch(reject)
              return
            }

            // 圧縮されたファイルを作成
            const compressedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now()
            })

            const result: CompressionResult = {
              file: compressedFile,
              originalSize: file.size,
              compressedSize: blob.size,
              compressionRatio: Math.round((1 - blob.size / file.size) * 100)
            }

            resolve(result)
          },
          mimeType,
          quality
        )
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('画像の読み込みに失敗しました'))
    }

    // 画像を読み込み
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 複数の画像を並行して圧縮
 */
export const compressImages = async (
  files: File[], 
  options: CompressionOptions = {}
): Promise<CompressionResult[]> => {
  const compressionPromises = files.map(file => compressImage(file, options))
  return Promise.all(compressionPromises)
}

/**
 * アスペクト比を保持してサイズを計算
 */
function calculateDimensions(
  originalWidth: number, 
  originalHeight: number, 
  maxWidth: number, 
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight }

  // 最大幅を超えている場合
  if (width > maxWidth) {
    height = (height * maxWidth) / width
    width = maxWidth
  }

  // 最大高さを超えている場合
  if (height > maxHeight) {
    width = (width * maxHeight) / height
    height = maxHeight
  }

  return { 
    width: Math.round(width), 
    height: Math.round(height) 
  }
}

/**
 * 出力形式を決定
 */
function determineOutputFormat(file: File, outputFormat: CompressionOptions['outputFormat']): string {
  if (outputFormat === 'original') {
    return file.type
  }
  
  switch (outputFormat) {
    case 'jpeg':
      return 'image/jpeg'
    case 'webp':
      return 'image/webp'
    case 'png':
      return 'image/png'
    default:
      return file.type
  }
}

/**
 * より低い品質で再圧縮
 */
async function compressWithLowerQuality(
  canvas: HTMLCanvasElement, 
  mimeType: string, 
  maxFileSize: number,
  fileName: string
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    let quality = 0.7
    
    const tryCompress = () => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('低品質での圧縮に失敗しました'))
            return
          }

          if (blob.size <= maxFileSize || quality <= 0.1) {
            const compressedFile = new File([blob], fileName, {
              type: mimeType,
              lastModified: Date.now()
            })

            resolve({
              file: compressedFile,
              originalSize: blob.size, // 元サイズは不明なのでblob.sizeを使用
              compressedSize: blob.size,
              compressionRatio: 0
            })
            return
          }

          // 品質を下げて再試行
          quality -= 0.1
          tryCompress()
        },
        mimeType,
        quality
      )
    }

    tryCompress()
  })
}

/**
 * 画像情報を取得
 */
export const getImageInfo = (file: File): Promise<{ width: number; height: number; size: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: file.size
      })
      URL.revokeObjectURL(img.src)
    }

    img.onerror = () => {
      reject(new Error('画像情報の読み込みに失敗しました'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * ファイルサイズを人間が読める形式に変換
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}