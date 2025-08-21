-- 電話番号の重複確認と解決方法
-- 電話番号 +818034417624 の使用状況を調査

-- 1. 指定した電話番号を使用しているユーザーを特定
SELECT 
  id,
  name,
  phone,
  email,
  created_at,
  gender,
  age
FROM profiles 
WHERE phone = '+818034417624';

-- 2. 電話番号が重複しているすべてのケースを確認
SELECT 
  phone,
  COUNT(*) as count,
  ARRAY_AGG(id) as user_ids,
  ARRAY_AGG(name) as user_names
FROM profiles 
WHERE phone IS NOT NULL 
GROUP BY phone 
HAVING COUNT(*) > 1;

-- 3. 全体的な電話番号の使用状況
SELECT 
  phone,
  id,
  name,
  email,
  created_at
FROM profiles 
WHERE phone IS NOT NULL 
ORDER BY phone, created_at;

-- 4. 電話番号が NULL または空文字列のユーザー数
SELECT 
  COUNT(*) as total_users,
  COUNT(phone) as users_with_phone,
  COUNT(*) - COUNT(phone) as users_without_phone
FROM profiles;

-- 5. 電話番号のフォーマット一覧（重複除く）
SELECT DISTINCT 
  phone,
  LENGTH(phone) as phone_length,
  CASE 
    WHEN phone LIKE '+81%' THEN '日本国際番号'
    WHEN phone LIKE '0%' THEN '国内番号'
    ELSE 'その他'
  END as format_type
FROM profiles 
WHERE phone IS NOT NULL 
ORDER BY phone;

-- 6. 制約情報の確認
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
  AND conname LIKE '%phone%';