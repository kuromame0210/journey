/**
 * チャット関連のAPI呼び出し関数
 * 
 * 共通化の経緯:
 * - src/app/chat/page.tsx:52-142 の fetchChatRooms 関数
 * - src/app/chat/[id]/page.tsx:101-118 の fetchChatRoom 関数
 * - src/app/chat/[id]/page.tsx:120-138 の fetchMessages 関数
 * - src/app/chat/[id]/page.tsx:189-211 の sendMessage 関数
 * - src/app/place/[id]/page.tsx:163-188 の createChatRoom 処理
 * - 5箇所でチャット関連のAPI呼び出しが重複していたため統一
 */

import { supabase } from '@/lib/supabase';
import type { 
  ChatRoom, 
  ChatRoomListItem, 
  ChatRoomDetail, 
  Message 
} from '@/shared/types/database';

/**
 * ユーザーのチャットルーム一覧を取得する（チャット一覧画面用）
 * 
 * @param userId - 現在のユーザーID
 * @returns Promise<ChatRoomListItem[]> - チャットルーム一覧
 * 
 * 元の実装: src/app/chat/page.tsx:52-142 の fetchChatRooms 関数
 * 統一方針: place・other_user・latest_message・unread_countを含む複雑なJOIN
 */
export async function fetchChatRoomsList(userId: string): Promise<ChatRoomListItem[]> {
  try {
    // チャットルーム基本情報を取得
    const { data: rooms, error: roomsError } = await supabase
      .from('chat_rooms')
      .select(`
        id,
        place_id,
        user_a,
        user_b,
        created_at,
        places!inner(title, date_start, images)
      `)
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (roomsError) {
      throw new Error(`Chat rooms fetch failed: ${roomsError.message}`);
    }

    if (!rooms || rooms.length === 0) {
      return [];
    }

    // 各ルームの詳細情報を並行して取得
    const roomsWithDetails = await Promise.all(
      rooms.map(async (room) => {
        const otherUserId = room.user_a === userId ? room.user_b : room.user_a;

        // 相手ユーザー情報を取得
        const { data: otherUser } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .eq('id', otherUserId)
          .single();

        // 最新メッセージを取得
        const { data: latestMessage } = await supabase
          .from('messages')
          .select('body, sent_at')
          .eq('room_id', room.id)
          .order('sent_at', { ascending: false })
          .limit(1)
          .single();

        // 未読メッセージ数を取得（相手からのメッセージで未読のもの）
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', room.id)
          .neq('sender', userId)
          .eq('is_read', false);

        return {
          id: room.id,
          place_id: room.place_id,
          user_a: room.user_a,
          user_b: room.user_b,
          created_at: room.created_at,
          place: {
            title: Array.isArray(room.places) ? (room.places[0] as unknown as { title: string })?.title : (room.places as unknown as { title: string })?.title,
            date_start: Array.isArray(room.places) ? (room.places[0] as unknown as { date_start: string })?.date_start : (room.places as unknown as { date_start: string })?.date_start,
            date_end: Array.isArray(room.places) ? (room.places[0] as unknown as { date_end: string })?.date_end || null : (room.places as unknown as { date_end: string })?.date_end || null,
            images: Array.isArray(room.places) ? (room.places[0] as unknown as { images: string[] })?.images : (room.places as unknown as { images: string[] })?.images
          },
          other_user: {
            id: otherUser?.id || otherUserId,
            name: otherUser?.name || '不明なユーザー',
            avatar_url: otherUser?.avatar_url || null
          },
          latest_message: latestMessage ? {
            body: latestMessage.body,
            sent_at: latestMessage.sent_at
          } : undefined,
          unread_count: unreadCount || 0
        } as ChatRoomListItem;
      })
    );

    return roomsWithDetails;
  } catch (error) {
    console.error('チャットルーム一覧の取得エラー:', error);
    throw error;
  }
}

/**
 * 特定のチャットルーム詳細情報を取得する
 * 
 * @param roomId - チャットルームID
 * @param userId - 現在のユーザーID（権限確認用）
 * @returns Promise<ChatRoomDetail | null> - チャットルーム詳細またはnull
 * 
 * 元の実装: src/app/chat/[id]/page.tsx:101-118 の fetchChatRoom 関数
 * 統一方針: 権限確認付き、place・other_user情報を含む
 */
export async function fetchChatRoomDetail(roomId: string, userId: string): Promise<ChatRoomDetail | null> {
  try {
    // チャットルーム基本情報を取得
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select(`
        id,
        place_id,
        user_a,
        user_b,
        places!inner(title, date_start, images)
      `)
      .eq('id', roomId)
      .single();

    if (roomError) {
      if (roomError.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Chat room fetch failed: ${roomError.message}`);
    }

    // 権限確認：参加者でない場合はアクセス拒否
    if (room.user_a !== userId && room.user_b !== userId) {
      throw new Error('権限がありません：あなたはこのチャットルームの参加者ではありません');
    }

    const otherUserId = room.user_a === userId ? room.user_b : room.user_a;

    // 相手ユーザー情報を取得
    const { data: otherUser } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .eq('id', otherUserId)
      .single();

    return {
      id: room.id,
      place_id: room.place_id,
      place: {
        title: (room.places as unknown as { title: string })?.title,
        date_start: (room.places as unknown as { date_start: string })?.date_start,
        date_end: (room.places as unknown as { date_end: string })?.date_end || null,
        images: (room.places as unknown as { images: string[] })?.images
      },
      other_user: {
        id: otherUser?.id || otherUserId,
        name: otherUser?.name || '不明なユーザー',
        avatar_url: otherUser?.avatar_url || null
      }
    };
  } catch (error) {
    console.error('チャットルーム詳細の取得エラー:', error);
    throw error;
  }
}

/**
 * チャットルームのメッセージ一覧を取得する
 * 
 * @param roomId - チャットルームID
 * @param limit - 取得件数の上限（デフォルト50件）
 * @returns Promise<Message[]> - メッセージ一覧
 * 
 * 元の実装: src/app/chat/[id]/page.tsx:120-138 の fetchMessages 関数
 * 統一方針: sent_at昇順、limit指定可能
 */
export async function fetchMessages(roomId: string, limit: number = 50): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('sent_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Messages fetch failed: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('メッセージの取得エラー:', error);
    throw error;
  }
}

/**
 * メッセージを送信する
 * 
 * @param roomId - チャットルームID
 * @param senderId - 送信者のユーザーID
 * @param message - メッセージ内容
 * @returns Promise<Message> - 送信されたメッセージ
 * 
 * 元の実装: src/app/chat/[id]/page.tsx:189-211 の sendMessage 関数
 * 統一方針: upsert使用、戻り値は完全なMessageオブジェクト
 */
export async function sendMessage(roomId: string, senderId: string, message: string): Promise<Message> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        room_id: roomId,
        sender: senderId,
        body: message,
        is_read: false
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Message send failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('メッセージ送信エラー:', error);
    throw error;
  }
}

/**
 * チャットルームを作成する
 * 
 * @param placeId - 対象の場所ID
 * @param userA - ユーザーAのID（通常は場所の投稿者）
 * @param userB - ユーザーBのID（通常はリアクションしたユーザー）
 * @returns Promise<ChatRoom> - 作成されたチャットルーム
 * 
 * 元の実装: src/app/place/[id]/page.tsx:163-188 の createChatRoom 処理
 * 統一方針: 重複チェック付きの安全な作成処理
 */
export async function createChatRoom(placeId: string, userA: string, userB: string): Promise<ChatRoom> {
  try {
    // 自己チャット防止チェック
    if (userA === userB) {
      throw new Error('Cannot create chat room with the same user (self-chat prevention)');
    }

    // 既存のチャットルームをチェック
    const { data: existingRoom } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('place_id', placeId)
      .or(`and(user_a.eq.${userA},user_b.eq.${userB}),and(user_a.eq.${userB},user_b.eq.${userA})`)
      .single();

    // 既存のルームがある場合はそれを返す
    if (existingRoom) {
      return existingRoom;
    }

    // 新しいルームを作成
    const { data: newRoom, error } = await supabase
      .from('chat_rooms')
      .insert([{
        place_id: placeId,
        user_a: userA,
        user_b: userB
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Chat room creation failed: ${error.message}`);
    }

    return newRoom;
  } catch (error) {
    console.error('チャットルーム作成エラー:', error);
    throw error;
  }
}

/**
 * メッセージを既読にする
 * 
 * @param messageIds - 既読にするメッセージIDの配列
 * @returns Promise<void>
 * 
 * 元の実装: 現状では個別に実装されていないが、今後の拡張に備えて統一APIを提供
 */
export async function markMessagesAsRead(messageIds: string[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', messageIds);

    if (error) {
      throw new Error(`Mark messages as read failed: ${error.message}`);
    }
  } catch (error) {
    console.error('メッセージ既読マークエラー:', error);
    throw error;
  }
}

/**
 * チャットルーム内の未読メッセージを全て既読にする
 * 
 * @param roomId - チャットルームID
 * @param userId - 現在のユーザーID（自分以外のメッセージのみ既読にする）
 * @returns Promise<void>
 * 
 * 元の実装: 現状では個別に実装されていないが、今後の拡張に備えて統一APIを提供
 */
export async function markRoomMessagesAsRead(roomId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('room_id', roomId)
      .neq('sender', userId)
      .eq('is_read', false);

    if (error) {
      throw new Error(`Mark room messages as read failed: ${error.message}`);
    }
  } catch (error) {
    console.error('ルームメッセージ既読マークエラー:', error);
    throw error;
  }
}

/**
 * チャットルームを削除する
 * 
 * @param roomId - 削除対象のチャットルームID
 * @param userId - 削除権限確認のためのユーザーID
 * @returns Promise<void>
 * 
 * 元の実装: 現状では個別に実装されていないが、今後の拡張に備えて統一APIを提供
 * 統一方針: 参加者確認付きの安全な削除処理
 */
export async function deleteChatRoom(roomId: string, userId: string): Promise<void> {
  try {
    // まず参加者権限を確認
    const { data: room, error: fetchError } = await supabase
      .from('chat_rooms')
      .select('user_a, user_b')
      .eq('id', roomId)
      .single();

    if (fetchError) {
      throw new Error(`Chat room authorization check failed: ${fetchError.message}`);
    }

    if (room.user_a !== userId && room.user_b !== userId) {
      throw new Error('権限がありません：参加しているチャットルームのみ削除できます');
    }

    // 関連するメッセージを先に削除
    const { error: messagesDeleteError } = await supabase
      .from('messages')
      .delete()
      .eq('room_id', roomId);

    if (messagesDeleteError) {
      throw new Error(`Messages deletion failed: ${messagesDeleteError.message}`);
    }

    // チャットルームを削除
    const { error: roomDeleteError } = await supabase
      .from('chat_rooms')
      .delete()
      .eq('id', roomId);

    if (roomDeleteError) {
      throw new Error(`Chat room deletion failed: ${roomDeleteError.message}`);
    }
  } catch (error) {
    console.error('チャットルーム削除エラー:', error);
    throw error;
  }
}