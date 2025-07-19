-- 既存のbudget_pref配列内のIDを1-3に変換
-- プロフィール編集画面とのID統一のため

-- ID 4→1, 5→2, 6→3に変換
UPDATE profiles 
SET budget_pref = ARRAY(
  SELECT CASE 
    WHEN unnest = 4 THEN 1
    WHEN unnest = 5 THEN 2  
    WHEN unnest = 6 THEN 3
    ELSE unnest
  END
  FROM unnest(budget_pref)
)
WHERE budget_pref IS NOT NULL 
  AND (4 = ANY(budget_pref) OR 5 = ANY(budget_pref) OR 6 = ANY(budget_pref));

-- 確認用クエリ
SELECT id, name, budget_pref 
FROM profiles 
WHERE budget_pref IS NOT NULL
ORDER BY created_at DESC;