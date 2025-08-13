/**
 * フォームハンドラーの統一カスタムフック
 * 
 * 共通化の経緯:
 * - src/app/place/create/page.tsx:76-87 のフォーム処理関数
 * - src/app/profile/edit/page.tsx:166-178 のフォーム処理関数
 * - 2箇所で全く同じパターンのフォーム操作関数が重複していたため統一
 */

'use client';

import { useCallback } from 'react';

/**
 * 基本的なフォーム入力変更ハンドラー
 * 
 * @param setFormData - フォームデータのセッター関数
 * @returns 入力変更ハンドラー関数
 * 
 * 元の実装:
 * - src/app/place/create/page.tsx:76-78 の handleInputChange
 * - src/app/profile/edit/page.tsx:166-168 の handleInputChange
 * 統一方針: 型安全性向上、再レンダリング最適化
 */
export function useInputChangeHandler<T extends Record<string, unknown>>(
  setFormData: React.Dispatch<React.SetStateAction<T>>
) {
  const handleInputChange = useCallback((
    field: keyof T,
    value: T[keyof T]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [setFormData]);

  return handleInputChange;
}

/**
 * 配列フィールドのトグル操作ハンドラー（タグ選択等）
 * 
 * @param setFormData - フォームデータのセッター関数
 * @returns タグトグルハンドラー関数
 * 
 * 元の実装:
 * - src/app/place/create/page.tsx:80-87 の handleTagToggle
 * - src/app/profile/edit/page.tsx:170-178 の handleMultiSelectToggle
 * 統一方針: 汎用的な配列操作、デバッグログ除去
 */
export function useArrayToggleHandler<T extends Record<string, unknown>>(
  setFormData: React.Dispatch<React.SetStateAction<T>>
) {
  const handleArrayToggle = useCallback((
    field: keyof T,
    id: number,
    debugLog?: boolean
  ) => {
    setFormData(prev => {
      const currentArray = prev[field] as number[];
      const newArray = currentArray.includes(id)
        ? currentArray.filter(item => item !== id)
        : [...currentArray, id];
      
      if (debugLog) {
        console.log(`Toggling ${String(field)}, ID: ${id}, Current:`, currentArray, '-> New:', newArray);
      }
      
      return {
        ...prev,
        [field]: newArray
      };
    });
  }, [setFormData]);

  return handleArrayToggle;
}

/**
 * フォーム全体のハンドラーを統合したフック
 * 
 * @param setFormData - フォームデータのセッター関数
 * @returns 統合されたフォームハンドラーオブジェクト
 * 
 * 使用例:
 * ```typescript
 * const handlers = useFormHandlers(setFormData);
 * handlers.handleInputChange('name', value);
 * handlers.handleArrayToggle('tags', tagId);
 * ```
 */
export function useFormHandlers<T extends Record<string, unknown>>(
  setFormData: React.Dispatch<React.SetStateAction<T>>
) {
  const handleInputChange = useInputChangeHandler(setFormData);
  const handleArrayToggle = useArrayToggleHandler(setFormData);

  /**
   * ファイル選択ハンドラー
   */
  const handleFileChange = useCallback((
    field: keyof T,
    files: File[] | File | null
  ) => {
    setFormData(prev => ({ ...prev, [field]: files }));
  }, [setFormData]);

  /**
   * 数値入力ハンドラー（文字列から数値に変換）
   */
  const handleNumberChange = useCallback((
    field: keyof T,
    value: string,
    defaultValue: number = 0
  ) => {
    const numValue = value === '' ? defaultValue : parseInt(value, 10);
    setFormData(prev => ({ ...prev, [field]: isNaN(numValue) ? defaultValue : numValue }));
  }, [setFormData]);

  /**
   * チェックボックスハンドラー
   */
  const handleCheckboxChange = useCallback((
    field: keyof T,
    checked: boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  }, [setFormData]);

  /**
   * 複数フィールド一括更新ハンドラー
   */
  const handleMultipleFieldsUpdate = useCallback((
    updates: Partial<T>
  ) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, [setFormData]);

  return {
    handleInputChange,
    handleArrayToggle,
    handleFileChange,
    handleNumberChange,
    handleCheckboxChange,
    handleMultipleFieldsUpdate,
    
    // 旧来の名前との互換性のためのエイリアス
    handleTagToggle: handleArrayToggle,
    handleMultiSelectToggle: handleArrayToggle
  };
}

/**
 * イベントハンドラーを自動で処理するヘルパーフック
 * 
 * React イベントオブジェクトから自動で値を抽出してフォームを更新
 */
export function useEventHandlers<T extends Record<string, unknown>>(
  setFormData: React.Dispatch<React.SetStateAction<T>>
) {
  const handlers = useFormHandlers(setFormData);

  /**
   * 入力要素のchangeイベントハンドラー
   */
  const createChangeHandler = useCallback((field: keyof T) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { type, value } = e.target;
      
      if (type === 'checkbox') {
        const checkbox = e.target as HTMLInputElement;
        handlers.handleCheckboxChange(field, checkbox.checked);
      } else if (type === 'number') {
        handlers.handleNumberChange(field, value);
      } else {
        handlers.handleInputChange(field, value as T[keyof T]);
      }
    };
  }, [handlers]);

  /**
   * ファイル入力のchangeイベントハンドラー
   */
  const createFileChangeHandler = useCallback((field: keyof T, multiple = false) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        const fileArray = Array.from(files);
        handlers.handleFileChange(field, multiple ? fileArray : fileArray[0] || null);
      }
    };
  }, [handlers]);

  /**
   * ラジオボタンのchangeイベントハンドラー
   */
  const createRadioHandler = useCallback((field: keyof T) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      handlers.handleInputChange(field, e.target.value as T[keyof T]);
    };
  }, [handlers]);

  return {
    ...handlers,
    createChangeHandler,
    createFileChangeHandler,
    createRadioHandler
  };
}