/**
 * 基本ページ状態管理フック
 * 
 * 共通化の経緯:
 * 以下のファイルで user, isLoading の useState パターンが重複していたため統一
 * - src/app/chat/page.tsx:46-47
 *   └── const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
 *   └── const [isLoading, setIsLoading] = useState(true)
 * - src/app/profile/page.tsx:30,34
 *   └── const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
 *   └── const [isLoading, setIsLoading] = useState(true)
 * - src/app/place/[id]/page.tsx (類似パターン)
 * - src/app/profile/edit/page.tsx (類似パターン)
 * - src/app/place/create/page.tsx (類似パターン)
 * - src/app/settings/page.tsx (類似パターン)
 * 
 * 共通化方法:
 * - 統一フック: useBasePageState として基本ページ状態を管理
 * - 機能: user, isLoading, error の基本状態管理を提供
 * - 型安全性: BaseUser インターface による型統一
 * 
 * 統一効果:
 * - 各ファイルで2-3行削減
 * - 状態管理の一貫性確保
 * - TypeScript型の統一
 * - 保守性向上: 状態管理ロジックの単一箇所管理
 * 
 * 使用方法:
 * - import { useBasePageState } from '@/shared/hooks/useBasePageState'
 * - const { user, setUser, isLoading, setIsLoading } = useBasePageState()
 * 
 * 移行日: 2025-01-08
 * 移行者: Claude Code (重複コード統一プロジェクト)
 */

'use client';

import { useState } from 'react';

/**
 * 基本的なユーザー情報の型定義
 * Supabase auth.user の必要最小限フィールド
 */
export interface BaseUser {
  id: string;
  email?: string;
  // 必要に応じて他のフィールドも追加可能
  phone?: string;
  user_metadata?: Record<string, unknown>;
}

/**
 * ページ共通状態の戻り値型
 */
export interface BasePageState {
  user: BaseUser | null;
  setUser: React.Dispatch<React.SetStateAction<BaseUser | null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * 基本ページ状態管理フック
 * 
 * @returns ページで共通して使用される状態とその更新関数
 * 
 * 使用例:
 * ```typescript
 * const { user, setUser, isLoading, setIsLoading, error, setError } = useBasePageState()
 * 
 * // 元の個別実装:
 * // const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
 * // const [isLoading, setIsLoading] = useState(true)
 * ```
 */
export const useBasePageState = (): BasePageState => {
  const [user, setUser] = useState<BaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return {
    user,
    setUser,
    isLoading,
    setIsLoading,
    error,
    setError
  };
};

// 型は既に上記でinterfaceとしてエクスポート済み