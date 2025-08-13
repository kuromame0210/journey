/**
 * 認証管理の統一カスタムフック
 * 
 * 共通化の経緯:
 * - src/app/chat/page.tsx:35-47 の checkAuth 関数
 * - src/app/chat/[id]/page.tsx:77-87 の checkAuth 関数  
 * - src/app/profile/page.tsx:46-58 の checkAuth 関数
 * - src/app/profile/edit/page.tsx:98-118 の checkAuth 関数
 * - src/app/place/create/page.tsx:64-73 の checkAuth 関数
 * - src/app/place/[id]/page.tsx:66-76 の checkAuth 関数
 * - 6箇所で全く同じパターンの認証チェックが重複していたため統一
 * 
 * vs src/lib/auth-helpers.ts:
 * - auth-helpers.tsは汎用的なステートレス関数
 * - このフックは React コンポーネント向けの状態管理付き
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User, AuthState, AuthCheckResult } from '@/shared/types/auth';

interface UseAuthOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  onAuthSuccess?: (user: User) => void;
  onAuthFailure?: () => void;
}

export const useAuth = (options: UseAuthOptions = {}) => {
  const {
    redirectTo = '/auth',
    requireAuth = true,
    onAuthSuccess,
    onAuthFailure
  } = options;

  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  /**
   * 認証状態をチェックする関数
   * 元の実装: 各ページの checkAuth 関数パターンを統一
   */
  const checkAuth = useCallback(async (): Promise<AuthCheckResult> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });

        if (requireAuth) {
          onAuthFailure?.();
          router.push(redirectTo);
        }

        return { user: null, isAuthenticated: false };
      }

      const user: User = {
        id: session.user.id,
        email: session.user.email,
        phone: session.user.phone,
        email_confirmed_at: session.user.email_confirmed_at,
        phone_confirmed_at: session.user.phone_confirmed_at,
        created_at: session.user.created_at,
        updated_at: session.user.updated_at
      };

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false
      });

      onAuthSuccess?.(user);
      return { user, isAuthenticated: true };

    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });

      if (requireAuth) {
        onAuthFailure?.();
        router.push(redirectTo);
      }

      return { user: null, isAuthenticated: false };
    }
  }, [requireAuth, redirectTo, router, onAuthSuccess, onAuthFailure]);

  /**
   * 認証ガード（要認証ページでの使用）
   * 元の実装: useEffectでのcheckAuth呼び出しパターンを統合
   */
  const executeAuthGuard = useCallback(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * ログアウト処理
   */
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });

      router.push('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, [router]);

  /**
   * 認証状態の変更を監視
   */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const user: User = {
            id: session.user.id,
            email: session.user.email,
            phone: session.user.phone,
          };
          
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    ...authState,
    checkAuth,
    executeAuthGuard,
    signOut,
    // 後方互換性のためのエイリアス
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading
  };
};