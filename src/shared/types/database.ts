/**
 * データベース関連の統一型定義
 * 
 * 共通化の経緯:
 * - src/app/home/page.tsx:11-22 の Place interface (基本版)
 * - src/app/place/[id]/page.tsx:12-23 の Place interface (拡張版)  
 * - src/app/profile/page.tsx:23-30 の Place interface (最小版)
 * - 3つの異なる定義を統一し、用途別の型エイリアスを提供
 */

// 基本的なPlace型（データベーステーブルと完全同期）
export interface Place {
  // 基本情報 - 全画面で使用
  id: string;
  title: string;
  images: string[];
  genre: string;
  owner: string;
  created_at: string;
  
  // 分類・タグ情報
  purpose_tags: number[];
  demand_tags: number[];
  budget_option: number;
  
  // 詳細情報 - 詳細画面・作成画面で使用
  purpose_text: string | null;
  budget_min: number | null;
  budget_max: number | null;
  date_start: string | null;
  date_end: string | null;
  recruit_num: number | null;
  first_choice: string | null;
  second_choice: string | null;
  gmap_url: string | null;
}

/**
 * プロフィール型の統一定義
 * 
 * 共通化の経緯:
 * - src/app/profile/page.tsx:9-21 の Profile interface
 * - src/lib/supabase.ts:20-34 の Database型のprofiles
 * - データベーススキーマと完全同期した統一型
 */
export interface Profile {
  id: string;
  name: string | null;
  gender: 'male' | 'female' | 'other' | null;
  age: number | null;
  partner_gender: 'male' | 'female' | 'either' | null;
  must_condition: string | null;
  mbti: string | null;
  budget_pref: number[] | null;
  purpose_tags: number[] | null;
  demand_tags: number[] | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

/**
 * チャットルーム型の統一定義
 * 
 * 共通化の経緯:
 * - src/app/chat/page.tsx:8-25 の ChatRoom interface (詳細版)
 * - src/app/chat/[id]/page.tsx:20-32 の ChatRoom interface (基本版)
 * - 2つの定義を統一し、必要に応じてジョインデータを含む
 */
export interface ChatRoom {
  // 基本情報
  id: string;
  place_id: string;
  user_a: string;
  user_b: string;
  created_at: string;
  
  // ジョインされるデータ（オプショナル）
  place?: {
    title: string;
    date_start: string | null;
    date_end: string | null;
    images: string[];
    recruit_num?: number | null;
  };
  other_user?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  latest_message?: {
    body: string;
    sent_at: string;
  };
  unread_count?: number;
}

/**
 * メッセージ型の統一定義
 * 
 * 共通化の経緯:
 * - src/app/chat/[id]/page.tsx:12-18 の Message interface
 * - シンプルな構造なので、そのまま統一型として採用
 * - is_readフィールドを追加（既読機能のため）
 */
export interface Message {
  id: string;
  room_id: string;
  sender: string;
  body: string;
  sent_at: string;
  is_read?: boolean; // 既読フラグ（オプショナル - 既存データとの互換性のため）
}

/**
 * リアクション型の統一定義
 * 
 * 共通化の経緯:
 * - src/lib/supabase.ts:132-152 の Database型のreactions
 * - データベーススキーマと完全同期
 */
export interface Reaction {
  id: string;
  place_id: string;
  from_uid: string;
  type: 'like' | 'keep' | 'pass';
  created_at: string;
}

// 用途別の型エイリアス
// 元の実装: src/app/home/page.tsx で使用されていたカード表示用の最小限情報
export type PlaceCard = Pick<Place, 'id' | 'title' | 'images' | 'genre' | 'purpose_tags' | 'demand_tags' | 'budget_option' | 'date_start' | 'date_end' | 'owner'>;

// 元の実装: src/app/profile/page.tsx で使用されていたリスト表示用情報  
export type PlaceListItem = Pick<Place, 'id' | 'title' | 'images' | 'genre' | 'created_at' | 'owner'>;

// 元の実装: src/app/place/[id]/page.tsx で使用されていた詳細表示用（全情報）
export type PlaceDetail = Place;

// チャット関連の用途別型
export type ChatRoomListItem = Pick<ChatRoom, 'id' | 'place_id' | 'user_a' | 'user_b' | 'created_at'> & {
  place: NonNullable<ChatRoom['place']>;
  other_user: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  latest_message?: ChatRoom['latest_message'];
  unread_count?: number;
};

export type ChatRoomDetail = Pick<ChatRoom, 'id' | 'place_id'> & {
  place: {
    title: string;
    date_start: string | null;
    date_end: string | null;
    images: string[];
    recruit_num?: number | null;
  };
  other_user: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
};