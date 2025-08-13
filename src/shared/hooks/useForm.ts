/**
 * フォーム状態管理の統一カスタムフック
 * 
 * 共通化の経緯:
 * - src/app/profile/edit/page.tsx:79-170 のフォーム状態管理
 * - src/app/place/create/page.tsx:46-100 のフォーム状態管理  
 * - src/app/auth/page.tsx:52-95 のフォーム状態管理
 * - 3箇所で類似したフォーム管理ロジックが重複していたため統一
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import type { FormState, ValidationErrors } from '@/shared/types/ui';

interface UseFormOptions<T> {
  initialData: T;
  validate?: (data: T) => { isValid: boolean; errors: ValidationErrors };
  onSubmit?: (data: T) => Promise<void> | void;
}

/**
 * 汎用的なフォーム状態管理フック
 * 
 * @param options - フォーム設定オプション
 * @returns フォーム状態と操作関数
 * 
 * 元の実装: 各ページのuseStateとフォーム操作ロジックを統合
 * 統一方針: 型安全、バリデーション統合、エラーハンドリング統一
 */
export function useForm<T extends Record<string, unknown>>(options: UseFormOptions<T>) {
  const { initialData, validate, onSubmit } = options;

  const [formState, setFormState] = useState<FormState<T>>({
    data: initialData,
    errors: {},
    isLoading: false,
    isValid: true
  });

  /**
   * フォームフィールドの値を更新する
   * 
   * 元の実装: 各ページのhandleInputChangeパターンを統合
   */
  const updateField = useCallback(<K extends keyof T>(
    field: K,
    value: T[K]
  ) => {
    setFormState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value
      },
      errors: {
        ...prev.errors,
        [field]: undefined // フィールド更新時にエラーをクリア
      }
    }));
  }, []);

  /**
   * 複数のフィールドを一括更新する
   */
  const updateFields = useCallback((updates: Partial<T>) => {
    setFormState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        ...updates
      }
    }));
  }, []);

  /**
   * フォームデータを初期値にリセットする
   * 
   * 元の実装: 各ページのresetFormパターンを統合
   */
  const reset = useCallback(() => {
    setFormState({
      data: initialData,
      errors: {},
      isLoading: false,
      isValid: true
    });
  }, [initialData]);

  /**
   * 特定のフィールドのエラーを設定する
   */
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setFormState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error
      },
      isValid: false
    }));
  }, []);

  /**
   * エラーをクリアする
   */
  const clearErrors = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      errors: {},
      isValid: true
    }));
  }, []);

  /**
   * バリデーションを実行する
   * 
   * 元の実装: 各ページのvalidateFormパターンを統合
   */
  const validateForm = useCallback(() => {
    if (!validate) return true;

    const result = validate(formState.data);
    // ValidationErrors型をFormState.errors型に変換
    const convertedErrors: Partial<Record<keyof T, string>> = {};
    Object.entries(result.errors).forEach(([key, value]) => {
      if (value !== undefined) {
        convertedErrors[key as keyof T] = value;
      }
    });
    
    setFormState(prev => ({
      ...prev,
      errors: convertedErrors,
      isValid: result.isValid
    }));

    return result.isValid;
  }, [validate, formState.data]);

  /**
   * フォームを送信する
   * 
   * 元の実装: 各ページのhandleSubmitパターンを統合
   * 統一方針: バリデーション → ローディング → 送信 → エラーハンドリング
   */
  const submit = useCallback(async () => {
    if (!onSubmit) return false;

    // バリデーション実行
    const isValid = validateForm();
    if (!isValid) return false;

    try {
      setFormState(prev => ({ ...prev, isLoading: true }));
      await onSubmit(formState.data);
      return true;
    } catch (error) {
      console.error('Form submission error:', error);
      
      // エラーメッセージを適切に設定
      if (error instanceof Error) {
        setFormState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            submit: error.message
          },
          isValid: false
        }));
      }
      return false;
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  }, [validateForm, onSubmit, formState.data]);

  /**
   * ローディング状態を手動で制御する
   */
  const setLoading = useCallback((loading: boolean) => {
    setFormState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  // データ変更時に自動バリデーション（オプション）
  useEffect(() => {
    if (validate && Object.keys(formState.errors).length === 0) {
      const result = validate(formState.data);
      if (!result.isValid && Object.keys(result.errors).length > 0) {
        // ValidationErrors型をFormState.errors型に変換
        const convertedErrors: Partial<Record<keyof T, string>> = {};
        Object.entries(result.errors).forEach(([key, value]) => {
          if (value !== undefined) {
            convertedErrors[key as keyof T] = value;
          }
        });
        
        setFormState(prev => ({
          ...prev,
          errors: convertedErrors,
          isValid: false
        }));
      }
    }
  }, [formState.data, validate, formState.errors]);

  return {
    // 状態
    data: formState.data,
    errors: formState.errors,
    isLoading: formState.isLoading,
    isValid: formState.isValid,
    
    // 操作関数
    updateField,
    updateFields,
    reset,
    setFieldError,
    clearErrors,
    validateForm,
    submit,
    setLoading,
    
    // 便利なヘルパー
    hasError: (field: keyof T) => Boolean(formState.errors[field as string]),
    getError: (field: keyof T) => formState.errors[field as string],
    isDirty: JSON.stringify(formState.data) !== JSON.stringify(initialData)
  };
}

/**
 * 画像アップロード機能付きフォームフック
 * 
 * @param options - フォーム設定オプション
 * @returns フォーム状態と画像アップロード機能
 * 
 * 元の実装: src/app/place/create/page.tsx:102-119 の画像管理ロジック
 * 統一方針: ファイル管理、プレビュー、アップロード統合
 */
export function useFormWithImages<T extends Record<string, unknown>>(
  options: UseFormOptions<T>,
  maxImages: number = 5
) {
  const form = useForm(options);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);

  /**
   * 画像を追加する
   */
  const addImages = useCallback((newImages: File[]) => {
    const totalImages = images.length + newImages.length;
    if (totalImages > maxImages) {
      form.setFieldError('images' as keyof T, `画像は最大${maxImages}枚までアップロードできます`);
      return;
    }

    // プレビュー生成
    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    
    setImages(prev => [...prev, ...newImages]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  }, [images.length, maxImages, form]);

  /**
   * 画像を削除する
   */
  const removeImage = useCallback((index: number) => {
    // プレビューURLを解放
    if (imagePreviews[index]) {
      URL.revokeObjectURL(imagePreviews[index]);
    }

    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }, [imagePreviews]);

  /**
   * 全画像をクリアする
   */
  const clearImages = useCallback(() => {
    // 全プレビューURLを解放
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    
    setImages([]);
    setImagePreviews([]);
  }, [imagePreviews]);

  /**
   * 画像アップロード状態を設定
   */
  const setImageUploadLoading = useCallback((loading: boolean) => {
    setImageUploading(loading);
  }, []);

  // クリーンアップ: コンポーネントアンマウント時にプレビューURLを解放
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  return {
    ...form,
    
    // 画像関連の状態
    images,
    imagePreviews,
    imageUploading,
    hasImages: images.length > 0,
    canAddMoreImages: images.length < maxImages,
    
    // 画像操作関数
    addImages,
    removeImage,
    clearImages,
    setImageUploadLoading
  };
}