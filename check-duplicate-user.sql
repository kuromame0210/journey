-- 重複ユーザーの存在確認
-- Supabase SQL Editorで実行してください

-- 1. 該当メールアドレスのユーザー情報を確認
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  phone_confirmed_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'crow0210kuro@gmail.com';

-- 2. 全体のユーザー数確認（参考用）
SELECT COUNT(*) as total_users FROM auth.users;

-- 3. プロフィールテーブルでの重複確認
SELECT 
  p.id,
  p.email,
  p.name,
  p.created_at
FROM profiles p
WHERE p.email = 'crow0210kuro@gmail.com';