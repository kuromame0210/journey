-- 古いモックデータのクリーンアップ

-- 古いvia.placeholder.comを使用している場所データを削除
DELETE FROM places WHERE 
  images IS NOT NULL AND 
  array_to_string(images, ',') LIKE '%via.placeholder.com%';

-- 古いリアクションデータを削除（409エラーの原因になる可能性）
DELETE FROM reactions;

-- 古いチャットデータを削除
DELETE FROM messages;
DELETE FROM chat_rooms;

-- 確認用クエリ
SELECT 'places' as table_name, count(*) as count FROM places
UNION ALL
SELECT 'reactions' as table_name, count(*) as count FROM reactions
UNION ALL
SELECT 'profiles' as table_name, count(*) as count FROM profiles;