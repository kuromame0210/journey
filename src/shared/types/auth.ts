/**
 * 認証関連の型定義
 * 
 * 共通化の経緯:
 * - src/lib/auth-helpers.ts:3-7 の DemoUser interface
 * - 各ページで使用されている user 状態の型（{ id: string; email?: string }）
 * - 認証関連の型を統一し、一貫性を向上
 */

export interface User {
  id: string;
  email?: string;
  phone?: string;
  // Supabase Auth User の基本的なプロパティ
  aud?: string;
  role?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 認証状態の型
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * ログイン・サインアップフォームの型
 * 
 * 共通化の経緯:
 * - src/app/auth/page.tsx の各種 useState で管理されていた状態
 * - 認証関連のフォーム状態を統一
 */
export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

export type AuthMode = 'login' | 'signup' | 'reset';
export type AuthStep = 'form' | 'email_sent' | 'reset_sent';

/**
 * 認証フォームの状態管理型
 */
export interface AuthFormState {
  data: AuthFormData;
  mode: AuthMode;
  step: AuthStep;
  isLoading: boolean;
  error: string | null;
}

/**
 * 認証チェックの結果型
 * 
 * 共通化の経緯:
 * - src/lib/auth-helpers.ts:10-15 の checkAuthStatus 戻り値
 * - 各ページの認証チェック関数の戻り値を統一
 */
export interface AuthCheckResult {
  user: User | null;
  isAuthenticated: boolean;
}

/**
 * 認証エラーの型
 */
export interface AuthError {
  code: string;
  message: string;
  details?: {
    email?: string;
    password?: string;
  };
}

/**
 * セッション情報の型
 */
export interface SessionInfo {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  token_type: string;
  user: User;
}