-- budget_optionsテーブルにデータを挿入
-- 安全に既存データを更新または挿入

-- まず参照されているIDを確認
SELECT DISTINCT budget_option FROM places WHERE budget_option IS NOT NULL;

-- 外部キー制約を一時的に無効化（必要に応じて）
-- ALTER TABLE places DROP CONSTRAINT IF EXISTS places_budget_option_fkey;

-- 既存のデータがある場合は更新、ない場合は挿入
INSERT INTO budget_options (id, label) VALUES 
  (1, '低 (〜3万円)'),
  (2, '中 (3〜10万円)'),
  (3, '高 (10万円〜)')
ON CONFLICT (id) DO UPDATE SET 
  label = EXCLUDED.label;

-- 不要なIDがあれば、まずplacesテーブルを更新してから削除
UPDATE places SET budget_option = NULL WHERE budget_option > 3;
DELETE FROM budget_options WHERE id > 3;

-- 外部キー制約を再追加（無効化した場合）
-- ALTER TABLE places ADD CONSTRAINT places_budget_option_fkey 
--   FOREIGN KEY (budget_option) REFERENCES budget_options(id);

-- 確認用クエリ
SELECT * FROM budget_options ORDER BY id;
SELECT DISTINCT budget_option FROM places WHERE budget_option IS NOT NULL;