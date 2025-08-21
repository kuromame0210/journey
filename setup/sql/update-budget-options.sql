-- 予算感の選択肢を具体的な金額範囲に更新

-- 既存のbudget_optionsを削除して新しいものに置き換え
DELETE FROM budget_options;

-- 新しい予算選択肢を挿入
INSERT INTO budget_options (label) VALUES 
  ('〜5,000円'),
  ('5,000〜15,000円'),
  ('15,000〜30,000円'),
  ('30,000〜50,000円'),
  ('50,000円〜');

-- 確認用クエリ
SELECT * FROM budget_options ORDER BY id;