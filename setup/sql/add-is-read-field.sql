-- メッセージテーブルにis_readフィールドを追加
-- チャット機能の既読機能を実装するために必要

-- is_readフィールドを追加（デフォルトはfalse）
ALTER TABLE messages 
ADD COLUMN is_read BOOLEAN DEFAULT FALSE NOT NULL;

-- 既読機能のためのインデックスを追加
-- 未読メッセージをすばやく検索するために必要
CREATE INDEX idx_messages_unread ON messages (room_id, is_read) WHERE is_read = FALSE;

-- 送信者別の既読状況を確認するためのインデックス
CREATE INDEX idx_messages_sender_read ON messages (sender, is_read);

-- パフォーマンス最適化: room_id と sent_at の複合インデックス
-- メッセージの時系列取得を高速化
CREATE INDEX idx_messages_room_time ON messages (room_id, sent_at DESC);

-- 既読ステータス更新のためのRLSポリシーを追加
-- メッセージの受信者が既読ステータスを更新できるようにする
CREATE POLICY "Users can update read status for messages in their chat rooms" ON messages
  FOR UPDATE USING (
    -- 送信者以外（受信者）が既読ステータスを更新可能
    auth.uid() != sender AND
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE chat_rooms.id = messages.room_id 
      AND (chat_rooms.user_a = auth.uid() OR chat_rooms.user_b = auth.uid())
    )
  );

-- パフォーマンス情報表示（開発時のデバッグ用）
-- EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM messages WHERE room_id = 'sample-room-id' AND is_read = FALSE;