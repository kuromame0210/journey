-- データ不整合の解決
-- places テーブルが budget_options に存在しないID（5,6,8）を参照している問題を修正

-- 1. 現在の問題状況を確認
SELECT 'BEFORE_FIX' as status, 'places_invalid_refs' as table_info, budget_option, COUNT(*) as count
FROM places 
WHERE budget_option NOT IN (SELECT id FROM budget_options WHERE id IS NOT NULL)
GROUP BY budget_option
ORDER BY budget_option;

-- 2. budget_options テーブルを拡張して既存の参照に対応
INSERT INTO budget_options (id, label) VALUES 
    (5, 'カスタム予算1'),
    (6, 'カスタム予算2'), 
    (8, 'カスタム予算3')
ON CONFLICT (id) DO UPDATE SET 
    label = EXCLUDED.label;

-- または、places テーブルの不正な参照を修正する場合：
-- 5 → 3 (高予算にマッピング)
-- 6 → 3 (高予算にマッピング) 
-- 8 → 3 (高予算にマッピング)

-- オプション1: 既存データを保持して budget_options を拡張（上記のINSERT実行）

-- オプション2: places の不正な参照を正規化（下記のUPDATE実行）
/*
UPDATE places SET budget_option = 3 WHERE budget_option IN (5, 6, 8);
*/

-- 3. 修正後の状況確認
SELECT 'AFTER_FIX' as status, 'budget_options' as table_info, id, label 
FROM budget_options 
ORDER BY id;

SELECT 'AFTER_FIX' as status, 'places_budget_usage' as table_info, budget_option, COUNT(*) as count
FROM places 
WHERE budget_option IS NOT NULL
GROUP BY budget_option
ORDER BY budget_option;

-- 4. 不整合がないことを確認
SELECT 'VALIDATION' as status, 
       CASE 
           WHEN COUNT(*) = 0 THEN 'NO_INVALID_REFERENCES'
           ELSE CONCAT(COUNT(*), '_INVALID_REFERENCES_FOUND')
       END as result
FROM places p
LEFT JOIN budget_options b ON p.budget_option = b.id
WHERE p.budget_option IS NOT NULL AND b.id IS NULL;