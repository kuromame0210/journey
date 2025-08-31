/**
 * プロフィール関連のAPI呼び出し関数
 * 
 * 共通化の経緯:
 * - src/app/profile/page.tsx:61-75 の fetchProfile 関数
 * - src/app/profile/edit/page.tsx:121-140 の fetchProfile 関数
 * - src/app/auth/page.tsx:38-42 のプロフィールチェック処理
 * - 3箇所でほぼ同じプロフィール取得処理が重複していたため統一
 */

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/shared/types/database';
import type { ProfileFormData } from '@/shared/types/ui';

/**
 * ユーザーのプロフィール情報を取得する
 * 
 * @param userId - 取得対象のユーザーID
 * @returns Promise<Profile | null> - プロフィール情報またはnull
 * @throws エラー時は例外をスロー（呼び出し元でキャッチ必要）
 * 
 * 元の実装との差分:
 * - profile/page: エラー時にnullを返すが、ログ出力のみ
 * - profile/edit: エラー時にnullを返すが、詳細ログ + データ変換処理
 * - auth/page: プロフィール存在チェックのみ
 * 
 * 統一方針: エラーはスローし、呼び出し元で適切にハンドリング
 */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // PGRST116 は「レコードが見つからない」エラー
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Profile fetch failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('プロフィールの取得エラー:', error);
    throw error;
  }
}

/**
 * プロフィール情報を作成または更新する
 * 
 * @param userId - 対象ユーザーID
 * @param profileData - プロフィールデータ
 * @returns Promise<Profile> - 作成/更新されたプロフィール
 * 
 * 元の実装: src/app/profile/edit/page.tsx:282-285 の upsert 処理
 */
export async function upsertProfile(userId: string, profileData: Partial<Profile>): Promise<Profile> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert([{
        id: userId,
        ...profileData,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Profile upsert failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('プロフィールの保存エラー:', error);
    throw error;
  }
}

/**
 * プロフィールの存在をチェックする（軽量版）
 * 
 * @param userId - チェック対象のユーザーID  
 * @returns Promise<boolean> - プロフィールが存在するかどうか
 * 
 * 元の実装: src/app/auth/page.tsx:38-42 のプロフィール存在チェック
 * 統一方針: 軽量化のためidのみ取得
 */
export async function checkProfileExists(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false;
      }
      throw new Error(`Profile existence check failed: ${error.message}`);
    }

    return !!data;
  } catch (error) {
    console.error('プロフィール存在確認エラー:', error);
    return false; // エラー時はfalseを返す（安全側）
  }
}

/**
 * プロフィールの統計情報を取得する
 * 
 * @param userId - 対象ユーザーID
 * @returns Promise<ProfileStats> - 統計情報
 * 
 * 元の実装: src/app/profile/page.tsx:120-138 の統計取得処理
 */
export interface ProfileStats {
  postedCount: number;
  likedCount: number;
  keptCount: number;
  passedCount: number;
}

export async function fetchProfileStats(userId: string): Promise<ProfileStats> {
  try {
    // 投稿数を取得
    const { count: postedCount } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .eq('owner', userId);

    // リアクション別の統計を取得
    const { data: reactions } = await supabase
      .from('reactions')
      .select('type')
      .eq('from_uid', userId);

    const stats = {
      postedCount: postedCount || 0,
      likedCount: 0,
      keptCount: 0,
      passedCount: 0
    };

    // リアクションタイプ別にカウント
    reactions?.forEach(reaction => {
      switch (reaction.type) {
        case 'like':
          stats.likedCount++;
          break;
        case 'keep':
          stats.keptCount++;
          break;
        case 'pass':
          stats.passedCount++;
          break;
      }
    });

    return stats;
  } catch (error) {
    console.error('プロフィール統計の取得エラー:', error);
    // エラー時はゼロ統計を返す
    return {
      postedCount: 0,
      likedCount: 0,
      keptCount: 0,
      passedCount: 0
    };
  }
}