-- Supabaseの認証設定を確認するSQL
-- SQL Editor で実行してください

-- 現在の認証設定を確認
SELECT 
  raw_app_meta_data,
  raw_user_meta_data,
  email_confirmed_at,
  phone_confirmed_at,
  confirmation_sent_at
FROM auth.users 
WHERE email = 'crow0210kuro@gmail.com'
LIMIT 1;

-- 重複ユーザーの存在確認
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  phone_confirmed_at
FROM auth.users 
WHERE email = 'crow0210kuro@gmail.com';