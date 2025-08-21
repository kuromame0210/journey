-- 電話番号のユニーク制約についての詳細分析と改善提案

-- ================================================================
-- 現在の制約状況の確認
-- ================================================================

-- テーブル構造の確認
\d profiles;

-- 電話番号関連の制約を詳細確認
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  tc.table_name,
  kcu.column_name,
  tc.is_deferrable,
  tc.initially_deferred
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles' 
  AND kcu.column_name = 'phone';

-- インデックスの確認
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'profiles' 
  AND indexdef LIKE '%phone%';

-- ================================================================
-- 電話番号データの品質分析
-- ================================================================

-- 電話番号の形式別統計
SELECT 
  CASE 
    WHEN phone IS NULL THEN 'NULL値'
    WHEN phone = '' THEN '空文字'
    WHEN phone ~ '^\+81[789]0[0-9]{8}$' THEN '正しい国際形式(+81)'
    WHEN phone ~ '^0[789]0[0-9]{8}$' THEN '国内形式(090/080/070)'
    WHEN phone ~ '^\+81' THEN '国際形式(不正)'
    WHEN phone ~ '^[0-9]' THEN '数字のみ'
    ELSE 'その他'
  END as format_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM profiles), 2) as percentage
FROM profiles 
GROUP BY 1
ORDER BY count DESC;

-- 長さ別統計
SELECT 
  LENGTH(phone) as phone_length,
  COUNT(*) as count,
  MIN(phone) as example_min,
  MAX(phone) as example_max
FROM profiles 
WHERE phone IS NOT NULL 
GROUP BY LENGTH(phone)
ORDER BY phone_length;

-- ================================================================
-- 重複検出と影響分析
-- ================================================================

-- 重複している電話番号の詳細
WITH phone_duplicates AS (
  SELECT 
    phone,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id ORDER BY created_at) as user_ids,
    ARRAY_AGG(name ORDER BY created_at) as user_names,
    ARRAY_AGG(created_at ORDER BY created_at) as created_dates
  FROM profiles 
  WHERE phone IS NOT NULL 
  GROUP BY phone 
  HAVING COUNT(*) > 1
)
SELECT 
  phone,
  duplicate_count,
  user_ids,
  user_names,
  created_dates
FROM phone_duplicates
ORDER BY duplicate_count DESC, phone;

-- ================================================================
-- 制約改善の提案
-- ================================================================

-- 提案1: 部分的ユニーク制約（NULL値を除外）
-- CREATE UNIQUE INDEX profiles_phone_unique_not_null 
-- ON profiles (phone) 
-- WHERE phone IS NOT NULL AND phone != '';

-- 提案2: 正規化された電話番号用の計算列
-- ALTER TABLE profiles 
-- ADD COLUMN phone_normalized TEXT 
-- GENERATED ALWAYS AS (
--   CASE 
--     WHEN phone IS NULL OR phone = '' THEN NULL
--     WHEN phone ~ '^0[789]0[0-9]{8}$' THEN '+81' || SUBSTRING(phone FROM 2)
--     WHEN phone ~ '^\+81[789]0[0-9]{8}$' THEN phone
--     ELSE REGEXP_REPLACE(phone, '[^+0-9]', '', 'g')
--   END
-- ) STORED;

-- 提案3: 正規化列にユニーク制約
-- CREATE UNIQUE INDEX profiles_phone_normalized_unique 
-- ON profiles (phone_normalized) 
-- WHERE phone_normalized IS NOT NULL;

-- ================================================================
-- データクリーニング用のクエリ
-- ================================================================

-- 不正な形式の電話番号を特定
SELECT 
  id,
  name,
  phone,
  CASE 
    WHEN phone ~ '^0[789]0[0-9]{8}$' THEN '+81' || SUBSTRING(phone FROM 2)
    WHEN phone ~ '^\+81[789]0[0-9]{8}$' THEN phone
    ELSE 'INVALID: ' || phone
  END as suggested_format
FROM profiles 
WHERE phone IS NOT NULL 
  AND phone != ''
  AND NOT phone ~ '^\+81[789]0[0-9]{8}$'
ORDER BY created_at;

-- ================================================================
-- 制約違反の事前チェック
-- ================================================================

-- 制約を追加する前に重複をチェック
SELECT 
  'CONSTRAINT VIOLATION: 以下の電話番号が重複しています' as warning
WHERE EXISTS (
  SELECT phone 
  FROM profiles 
  WHERE phone IS NOT NULL 
  GROUP BY phone 
  HAVING COUNT(*) > 1
);

-- 重複が解決された後の確認用クエリ
-- SELECT 
--   'OK: 電話番号の重複はありません' as status
-- WHERE NOT EXISTS (
--   SELECT phone 
--   FROM profiles 
--   WHERE phone IS NOT NULL 
--   GROUP BY phone 
--   HAVING COUNT(*) > 1
-- );