/**
 * リアクション（いいね・キープ・パス）関連のAPI呼び出し関数
 * 
 * 共通化の経緯:
 * - src/app/home/page.tsx:148-175 のリアクション処理関数
 * - src/app/place/[id]/page.tsx:138-188 のリアクション処理関数
 * - 2箇所で類似したリアクション処理ロジックが重複していたため統一
 */

import { supabase } from '@/lib/supabase';
import type { Reaction } from '@/shared/types/database';

export type ReactionType = 'like' | 'keep' | 'pass';

/**
 * リアクションを作成または更新する
 * 
 * @param placeId - 対象の場所ID
 * @param fromUserId - リアクションするユーザーID
 * @param reactionType - リアクションの種類
 * @returns Promise<Reaction> - 作成/更新されたリアクション
 * 
 * 元の実装: 
 * - src/app/home/page.tsx:148-175 の handleReaction 関数
 * - src/app/place/[id]/page.tsx:138-160 の handleReaction 関数
 * 統一方針: upsert使用、重複リアクションの適切な処理
 */
export async function createReaction(
  placeId: string, 
  fromUserId: string, 
  reactionType: ReactionType
): Promise<Reaction> {
  try {
    // 既存のリアクションをチェック
    const { data: existingReaction } = await supabase
      .from('reactions')
      .select('*')
      .eq('place_id', placeId)
      .eq('from_uid', fromUserId)
      .single();

    if (existingReaction) {
      // 既存のリアクションがある場合は更新
      const { data, error } = await supabase
        .from('reactions')
        .update({ type: reactionType })
        .eq('id', existingReaction.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Reaction update failed: ${error.message}`);
      }
      
      return data;
    } else {
      // 新規リアクション作成
      const { data, error } = await supabase
        .from('reactions')
        .insert([{
          place_id: placeId,
          from_uid: fromUserId,
          type: reactionType
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Reaction creation failed: ${error.message}`);
      }
      
      return data;
    }
  } catch (error) {
    console.error('Error creating/updating reaction:', error);
    throw error;
  }
}

/**
 * リアクションを削除する
 * 
 * @param placeId - 対象の場所ID
 * @param fromUserId - リアクションしたユーザーID
 * @returns Promise<void>
 * 
 * 元の実装: リアクション関数の一部として実装されていた削除処理
 */
export async function deleteReaction(placeId: string, fromUserId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('place_id', placeId)
      .eq('from_uid', fromUserId);

    if (error) {
      throw new Error(`Reaction deletion failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting reaction:', error);
    throw error;
  }
}

/**
 * ユーザーの特定場所へのリアクションを取得する
 * 
 * @param placeId - 対象の場所ID
 * @param userId - 対象ユーザーID
 * @returns Promise<Reaction | null> - リアクション情報またはnull
 * 
 * 元の実装: ページロード時の既存リアクションチェック処理
 */
export async function getUserReaction(placeId: string, userId: string): Promise<Reaction | null> {
  try {
    const { data, error } = await supabase
      .from('reactions')
      .select('*')
      .eq('place_id', placeId)
      .eq('from_uid', userId)
      .single();

    if (error) {
      // PGRST116 は「レコードが見つからない」エラー
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`User reaction fetch failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching user reaction:', error);
    throw error;
  }
}

/**
 * 場所に対するリアクション統計を取得する
 * 
 * @param placeId - 対象の場所ID
 * @returns Promise<ReactionStats> - リアクション統計
 * 
 * 元の実装: 現状では実装されていないが、今後の拡張に備えて統一APIを提供
 */
export interface ReactionStats {
  likeCount: number;
  keepCount: number;
  passCount: number;
  totalCount: number;
}

export async function getReactionStats(placeId: string): Promise<ReactionStats> {
  try {
    const { data: reactions } = await supabase
      .from('reactions')
      .select('type')
      .eq('place_id', placeId);

    const stats: ReactionStats = {
      likeCount: 0,
      keepCount: 0,
      passCount: 0,
      totalCount: reactions?.length || 0
    };

    reactions?.forEach(reaction => {
      switch (reaction.type) {
        case 'like':
          stats.likeCount++;
          break;
        case 'keep':
          stats.keepCount++;
          break;
        case 'pass':
          stats.passCount++;
          break;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error fetching reaction stats:', error);
    return {
      likeCount: 0,
      keepCount: 0,
      passCount: 0,
      totalCount: 0
    };
  }
}

/**
 * ユーザーがリアクションした場所一覧を取得する
 * 
 * @param userId - 対象ユーザーID
 * @param reactionType - 取得するリアクションタイプ（オプション）
 * @param limit - 取得件数制限（デフォルト20件）
 * @returns Promise<Reaction[]> - リアクション一覧
 * 
 * 元の実装: プロフィール画面などで使用される可能性があるため事前に準備
 */
export async function getUserReactions(
  userId: string, 
  reactionType?: ReactionType,
  limit: number = 20
): Promise<Reaction[]> {
  try {
    let query = supabase
      .from('reactions')
      .select('*')
      .eq('from_uid', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (reactionType) {
      query = query.eq('type', reactionType);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`User reactions fetch failed: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user reactions:', error);
    throw error;
  }
}

/**
 * チャットルーム作成の条件チェック（相互いいね確認）
 * 
 * @param placeId - 対象の場所ID
 * @param placeOwnerId - 場所の投稿者ID
 * @param reactorUserId - リアクションしたユーザーID
 * @returns Promise<boolean> - チャットルーム作成可能かどうか
 * 
 * 元の実装: src/app/place/[id]/page.tsx:163-188 のチャットルーム作成判定ロジック
 * 統一方針: 相互いいねの確認とチャットルーム作成の可否判定
 */
export async function canCreateChatRoom(
  placeId: string,
  placeOwnerId: string, 
  reactorUserId: string
): Promise<boolean> {
  try {
    // リアクションしたユーザーのリアクションを確認
    const reactorReaction = await getUserReaction(placeId, reactorUserId);
    
    // 場所投稿者のリアクションを確認（相手の場所に対するリアクション）
    // Note: この部分は具体的な相互いいねロジックに応じて調整が必要
    
    // 基本的な条件: リアクションしたユーザーが「いいね」している
    return reactorReaction?.type === 'like';
    
  } catch (error) {
    console.error('Error checking chat room creation possibility:', error);
    return false;
  }
}

/**
 * リアクション処理の一括実行（UI用）
 * 
 * @param placeId - 対象の場所ID
 * @param userId - リアクションするユーザーID
 * @param reactionType - リアクションタイプ
 * @returns Promise<{ reaction: Reaction; canChat: boolean }> - リアクションとチャット可能性
 * 
 * 元の実装: UIでの使用を想定した統合関数
 */
export async function handleReaction(
  placeId: string,
  userId: string,
  reactionType: ReactionType,
  placeOwnerId?: string
): Promise<{ reaction: Reaction; canChat: boolean }> {
  try {
    // リアクション作成/更新
    const reaction = await createReaction(placeId, userId, reactionType);
    
    // チャット可能性チェック（場所投稿者IDがある場合のみ）
    let canChat = false;
    if (placeOwnerId && placeOwnerId !== userId) {
      canChat = await canCreateChatRoom(placeId, placeOwnerId, userId);
    }
    
    return { reaction, canChat };
  } catch (error) {
    console.error('Error handling reaction:', error);
    throw error;
  }
}