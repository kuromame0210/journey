/**
 * UI関連の型定義
 * 
 * 共通化の経緯:
 * - src/hooks/useErrorHandler.ts:29-35 の MessageType と ToastState
 * - src/components/ErrorToast.tsx:26-32 の ErrorToastProps
 * - UI関連の型を統一し、再利用性を向上
 */

export type MessageType = 'error' | 'success' | 'warning' | 'info';

export interface ToastState {
  message: string;
  type: MessageType;
  isVisible: boolean;
}

export interface ErrorToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: MessageType;
  duration?: number;
}

/**
 * バリデーションエラーの型
 */
export interface ValidationErrors {
  [key: string]: string | undefined;
}

/**
 * フォーム関連の型定義
 * 
 * 共通化の経緯:
 * - src/app/profile/edit/page.tsx:79-92 の formData 構造
 * - src/app/place/create/page.tsx:46-62 の formData 構造
 * - よく使われるフォームパターンを型として定義
 */

// プロフィール編集フォーム用
export interface ProfileFormData {
  name: string;
  gender: 'male' | 'female' | 'other' | '';
  age: string;
  partner_gender: 'male' | 'female' | 'either';
  must_condition: string;
  mbti: string;
  budget_pref: number[];
  purpose_tags: number[];
  demand_tags: number[];
  phone: string;
  email: string;
}

// 場所作成フォーム用
export interface PlaceFormData {
  title: string;
  genre: string;
  purpose_tags: number[];
  demand_tags: number[];
  purpose_text: string;
  budget_option: number | '';
  budget_min: string;
  budget_max: string;
  date_start: string;
  date_end: string;
  recruit_num: string;
  first_choice: string;
  second_choice: string;
  gmap_url: string;
}

/**
 * 汎用的なフォーム状態管理型
 */
export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isLoading: boolean;
  isValid: boolean;
}

/**
 * API呼び出し結果の型
 * 
 * 共通化の経緯:
 * - 各ページで非統一だったAPI呼び出し結果の型を統一
 * - エラーハンドリングの一貫性を向上
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * ページネーション関連の型
 */
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 汎用的なリストアイテムの型
 */
export interface ListItem {
  id: string | number;
  label: string;
  value?: unknown;
}

/**
 * モーダル・ダイアログ関連の型
 */
export interface ModalState {
  isOpen: boolean;
  title?: string;
  content?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}