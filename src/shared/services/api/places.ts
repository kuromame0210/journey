/**
 * 場所（Places）関連のAPI呼び出し関数
 * 
 * 共通化の経緯:
 * - src/app/home/page.tsx:53-91 の fetchPlaces 関数
 * - src/app/place/[id]/page.tsx:88-108 の fetchPlace 関数
 * - src/app/profile/page.tsx:78-97 の fetchUserPlaces 関数
 * - src/app/place/create/page.tsx:225-242 の createPlace 処理
 * - 4箇所で類似したplace関連のAPI呼び出しが重複していたため統一
 */

import { supabase } from '@/lib/supabase';
import type { Place, PlaceCard, PlaceDetail, PlaceListItem } from '@/shared/types/database';
import type { PlaceFormData } from '@/shared/types/ui';

/**
 * 全場所のリストを取得する（ホーム画面用）
 * 
 * @param userId - 現在のユーザーID（自分の投稿を除外するため）
 * @param limit - 取得件数の上限（デフォルト50件）
 * @returns Promise<PlaceCard[]> - カード表示用の場所データ
 * 
 * 元の実装: src/app/home/page.tsx:53-91 の fetchPlaces 関数
 * 統一方針: 自分の投稿除外、created_at降順、limit指定可能
 */
export async function fetchPlacesList(userId?: string, limit: number = 50): Promise<PlaceCard[]> {
  try {
    let query = supabase
      .from('places')
      .select(`
        id,
        title,
        images,
        genre,
        purpose_tags,
        demand_tags,
        budget_option,
        date_start,
        date_end,
        owner
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // 自分の投稿を除外（ログイン時のみ）
    if (userId) {
      query = query.neq('owner', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Places list fetch failed: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching places list:', error);
    throw error;
  }
}

/**
 * 特定の場所の詳細情報を取得する
 * 
 * @param placeId - 取得対象の場所ID
 * @returns Promise<PlaceDetail | null> - 詳細情報またはnull
 * 
 * 元の実装: src/app/place/[id]/page.tsx:88-108 の fetchPlace 関数
 * 統一方針: 全フィールド取得、存在しない場合はnull
 */
export async function fetchPlaceDetail(placeId: string): Promise<PlaceDetail | null> {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .eq('id', placeId)
      .single();

    if (error) {
      // PGRST116 は「レコードが見つからない」エラー
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Place detail fetch failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching place detail:', error);
    throw error;
  }
}

/**
 * 特定ユーザーの投稿場所一覧を取得する（プロフィール画面用）
 * 
 * @param userId - 対象ユーザーID
 * @param limit - 取得件数の上限（デフォルト20件）
 * @returns Promise<PlaceListItem[]> - リスト表示用の場所データ
 * 
 * 元の実装: src/app/profile/page.tsx:78-97 の fetchUserPlaces 関数
 * 統一方針: 基本情報のみ、created_at降順
 */
export async function fetchUserPlaces(userId: string, limit: number = 20): Promise<PlaceListItem[]> {
  try {
    const { data, error } = await supabase
      .from('places')
      .select(`
        id,
        title,
        images,
        genre,
        created_at
      `)
      .eq('owner', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`User places fetch failed: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user places:', error);
    throw error;
  }
}

/**
 * 新しい場所を作成する
 * 
 * @param ownerId - 投稿者のユーザーID
 * @param placeData - 場所のフォームデータ
 * @param images - アップロードされた画像URL配列
 * @returns Promise<Place> - 作成された場所データ
 * 
 * 元の実装: src/app/place/create/page.tsx:225-242 の createPlace 処理
 * 統一方針: upsert使用、全フィールド指定、戻り値は完全なPlaceオブジェクト
 */
export async function createPlace(
  ownerId: string, 
  placeData: PlaceFormData, 
  images: string[] = []
): Promise<Place> {
  try {
    // フォームデータをPlace型に変換
    const placeRecord: Omit<Place, 'id' | 'created_at'> = {
      title: placeData.title,
      images: images,
      genre: placeData.genre,
      owner: ownerId,
      purpose_tags: placeData.purpose_tags,
      demand_tags: placeData.demand_tags,
      purpose_text: placeData.purpose_text || null,
      budget_option: typeof placeData.budget_option === 'number' ? placeData.budget_option : 0,
      budget_min: placeData.budget_min ? parseInt(placeData.budget_min) : null,
      budget_max: placeData.budget_max ? parseInt(placeData.budget_max) : null,
      date_start: placeData.date_start || null,
      date_end: placeData.date_end || null,
      recruit_num: placeData.recruit_num ? parseInt(placeData.recruit_num) : null,
      first_choice: placeData.first_choice || null,
      second_choice: placeData.second_choice || null,
      gmap_url: placeData.gmap_url || null,
    };

    const { data, error } = await supabase
      .from('places')
      .insert([placeRecord])
      .select()
      .single();

    if (error) {
      throw new Error(`Place creation failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error creating place:', error);
    throw error;
  }
}

/**
 * 場所情報を更新する
 * 
 * @param placeId - 更新対象の場所ID
 * @param placeData - 更新するデータ
 * @returns Promise<Place> - 更新された場所データ
 * 
 * 元の実装: 現状では個別に実装されていないが、今後の拡張に備えて統一APIを提供
 */
export async function updatePlace(placeId: string, placeData: Partial<Place>): Promise<Place> {
  try {
    const { data, error } = await supabase
      .from('places')
      .update(placeData)
      .eq('id', placeId)
      .select()
      .single();

    if (error) {
      throw new Error(`Place update failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error updating place:', error);
    throw error;
  }
}

/**
 * 場所を削除する
 * 
 * @param placeId - 削除対象の場所ID
 * @param ownerId - 削除権限確認のためのオーナーID
 * @returns Promise<void>
 * 
 * 元の実装: 現状では個別に実装されていないが、今後の拡張に備えて統一APIを提供
 * 統一方針: オーナー確認付きの安全な削除処理
 */
export async function deletePlace(placeId: string, ownerId: string): Promise<void> {
  try {
    // まずオーナー権限を確認
    const { data: place, error: fetchError } = await supabase
      .from('places')
      .select('owner')
      .eq('id', placeId)
      .single();

    if (fetchError) {
      throw new Error(`Place ownership check failed: ${fetchError.message}`);
    }

    if (place.owner !== ownerId) {
      throw new Error('Unauthorized: You can only delete your own places');
    }

    // 削除実行
    const { error: deleteError } = await supabase
      .from('places')
      .delete()
      .eq('id', placeId);

    if (deleteError) {
      throw new Error(`Place deletion failed: ${deleteError.message}`);
    }
  } catch (error) {
    console.error('Error deleting place:', error);
    throw error;
  }
}

/**
 * 場所の検索を行う
 * 
 * @param searchParams - 検索パラメータ
 * @returns Promise<PlaceCard[]> - 検索結果の場所データ
 * 
 * 元の実装: 現状では個別に実装されていないが、今後の拡張に備えて統一APIを提供
 */
export interface PlaceSearchParams {
  query?: string;
  genre?: string;
  purposeTags?: number[];
  demandTags?: number[];
  budgetOption?: number;
  dateStart?: string;
  dateEnd?: string;
  limit?: number;
  excludeUserId?: string;
}

export async function searchPlaces(params: PlaceSearchParams): Promise<PlaceCard[]> {
  try {
    let query = supabase
      .from('places')
      .select(`
        id,
        title,
        images,
        genre,
        purpose_tags,
        demand_tags,
        budget_option,
        date_start,
        date_end,
        owner
      `)
      .order('created_at', { ascending: false });

    // 検索条件を適用
    if (params.query) {
      query = query.ilike('title', `%${params.query}%`);
    }
    if (params.genre) {
      query = query.eq('genre', params.genre);
    }
    if (params.purposeTags && params.purposeTags.length > 0) {
      query = query.overlaps('purpose_tags', params.purposeTags);
    }
    if (params.demandTags && params.demandTags.length > 0) {
      query = query.overlaps('demand_tags', params.demandTags);
    }
    if (params.budgetOption !== undefined) {
      query = query.eq('budget_option', params.budgetOption);
    }
    if (params.dateStart) {
      query = query.gte('date_start', params.dateStart);
    }
    if (params.dateEnd) {
      query = query.lte('date_end', params.dateEnd);
    }
    if (params.excludeUserId) {
      query = query.neq('owner', params.excludeUserId);
    }
    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Place search failed: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error searching places:', error);
    throw error;
  }
}