-- 電話番号重複問題の解決方法
-- 実行前に必ずcheck-phone-duplicates.sqlで現状を確認してください

-- ================================================================
-- 解決方法1: 重複した電話番号をNULLに設定（古いユーザーを優先）
-- ================================================================
-- 注意: このクエリは実際に実行する前にバックアップを取ってください

-- 重複する電話番号のうち、作成日時が新しいユーザーの電話番号をNULLに設定
WITH duplicate_phones AS (
  SELECT 
    phone,
    id,
    name,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at ASC) as rn
  FROM profiles 
  WHERE phone IS NOT NULL
),
phones_to_clear AS (
  SELECT id, phone, name
  FROM duplicate_phones 
  WHERE rn > 1
)
SELECT 
  'UPDATE profiles SET phone = NULL WHERE id = ''' || id || '''; -- ' || name || ' (' || phone || ')'
FROM phones_to_clear;

-- ================================================================
-- 解決方法2: 重複した電話番号に連番を追加
-- ================================================================
-- 例: +818034417624 → +818034417624-1, +818034417624-2

WITH duplicate_phones AS (
  SELECT 
    phone,
    id,
    name,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at ASC) as rn
  FROM profiles 
  WHERE phone IS NOT NULL
),
phones_to_modify AS (
  SELECT 
    id, 
    phone, 
    name,
    phone || '-' || (rn - 1) as new_phone
  FROM duplicate_phones 
  WHERE rn > 1
)
SELECT 
  'UPDATE profiles SET phone = ''' || new_phone || ''' WHERE id = ''' || id || '''; -- ' || name || ' (元: ' || phone || ')'
FROM phones_to_modify;

-- ================================================================
-- 解決方法3: 制約を一時的に無効化してから手動で修正
-- ================================================================

-- Step 1: UNIQUE制約を削除（注意: 制約名は実際の名前に置き換えてください）
-- ALTER TABLE profiles DROP CONSTRAINT profiles_phone_key;

-- Step 2: 重複データを手動で修正
-- 例:
-- UPDATE profiles SET phone = '+818034417625' WHERE id = 'user-id-2';
-- UPDATE profiles SET phone = NULL WHERE id = 'user-id-3';

-- Step 3: 制約を再追加
-- ALTER TABLE profiles ADD CONSTRAINT profiles_phone_key UNIQUE (phone);

-- ================================================================
-- 解決方法4: 電話番号の正規化とクリーニング
-- ================================================================

-- 電話番号フォーマットの統一
-- 例: 0901234567 → +819012345678, 090-1234-5678 → +819012345678

-- 日本の携帯電話番号を国際番号形式に統一
UPDATE profiles 
SET phone = '+81' || SUBSTRING(phone FROM 2)
WHERE phone ~ '^0[789]0[0-9]{8}$'  -- 090, 080, 070で始まる11桁
  AND phone NOT LIKE '+81%';

-- ハイフンや空白を削除
UPDATE profiles 
SET phone = REGEXP_REPLACE(phone, '[^+0-9]', '', 'g')
WHERE phone ~ '[^+0-9]';

-- ================================================================
-- 推奨解決手順
-- ================================================================

-- 1. 現状確認
-- \i check-phone-duplicates.sql

-- 2. バックアップ作成
-- pg_dump -h your-host -U your-user -d your-db -t profiles > profiles_backup.sql

-- 3. 重複ユーザーの詳細確認
-- SELECT * FROM profiles WHERE phone = '+818034417624' ORDER BY created_at;

-- 4. 解決方法の選択と実行
-- 以下のいずれかを選択:
-- - 新しいユーザーの電話番号をNULLに設定
-- - 重複する電話番号に連番を追加
-- - 手動で適切な電話番号に変更

-- 5. 制約の確認と必要に応じて再追加
-- ALTER TABLE profiles ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);