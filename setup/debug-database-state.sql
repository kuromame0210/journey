-- データベースの状態を詳しく調査するためのクエリ集

-- 1. マスターテーブルのデータ確認
SELECT 'budget_options' as table_name, id, label FROM budget_options ORDER BY id;
SELECT 'purpose_tags' as table_name, id, label FROM purpose_tags ORDER BY id;
SELECT 'demand_tags' as table_name, id, label FROM demand_tags ORDER BY id;

-- 2. 現在のトリガー一覧
SELECT 
    'TRIGGERS' as info_type,
    n.nspname as schemaname,
    c.relname as tablename,
    t.tgname as triggername,
    t.tgtype,
    p.prosrc
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE NOT t.tgisinternal
  AND (c.relname = 'profiles' OR c.relname = 'places')
ORDER BY c.relname, t.tgname;

-- 3. バリデーション関数の定義確認
SELECT 
    'FUNCTIONS' as info_type,
    proname,
    prosrc
FROM pg_proc 
WHERE proname LIKE '%validate%' OR proname LIKE '%check%';

-- 4. プロフィールテーブルの構造確認
SELECT 
    'PROFILE_COLUMNS' as info_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 5. 外部キー制約の確認
SELECT 
    'CONSTRAINTS' as info_type,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('profiles', 'places');

-- 6. 実際のプロフィールデータのサンプル（配列の値確認）
SELECT 
    'PROFILE_DATA' as info_type,
    id,
    name,
    budget_pref,
    purpose_tags,
    demand_tags,
    pg_typeof(budget_pref) as budget_pref_type,
    pg_typeof(purpose_tags) as purpose_tags_type,
    pg_typeof(demand_tags) as demand_tags_type
FROM profiles 
WHERE budget_pref IS NOT NULL OR purpose_tags IS NOT NULL OR demand_tags IS NOT NULL
LIMIT 5;

-- 7. places テーブルでの budget_option 使用状況
SELECT 
    'PLACES_BUDGET_USAGE' as info_type,
    budget_option,
    COUNT(*) as usage_count
FROM places 
WHERE budget_option IS NOT NULL
GROUP BY budget_option
ORDER BY budget_option;