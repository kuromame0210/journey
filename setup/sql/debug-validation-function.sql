-- バリデーション関数の動作を詳しくテストするクエリ

-- 1. 現在のバリデーション関数の動作テスト
-- 空配列の場合
SELECT 
    'EMPTY_ARRAY_TEST' as test_type,
    unnest(ARRAY[]::int[]) as id_value
WHERE false; -- これは行を返さない

-- 2. unnest関数の動作確認
SELECT 'UNNEST_BEHAVIOR' as test_type, 'empty_array' as case_name, unnest(ARRAY[]::int[]) as result
UNION ALL
SELECT 'UNNEST_BEHAVIOR', 'normal_array', unnest(ARRAY[1,2,3]) as result;

-- 3. バリデーション関数のロジックをステップバイステップで確認
-- 空配列の場合のLEFT JOINの結果
SELECT 
    'VALIDATION_LOGIC_TEST' as test_type,
    'empty_array_join' as case_name,
    t.id as unnest_id,
    m.id as master_id,
    CASE WHEN m.id IS NULL THEN 'NULL_FOUND' ELSE 'ID_EXISTS' END as join_result
FROM unnest(ARRAY[]::int[]) t(id)
LEFT JOIN budget_options m USING(id);

-- 4. 実際のバリデーション関数を使ったテスト
DO $$
BEGIN
    -- 空配列のテスト
    RAISE NOTICE 'Testing empty array for budget_options...';
    PERFORM _check_tag_array_valid(ARRAY[]::int[], 'budget_options');
    RAISE NOTICE 'Empty array test passed';
    
    -- 有効な値のテスト
    RAISE NOTICE 'Testing valid values [1,2,3] for budget_options...';
    PERFORM _check_tag_array_valid(ARRAY[1,2,3], 'budget_options');
    RAISE NOTICE 'Valid values test passed';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error occurred: %', SQLERRM;
END $$;

-- 5. 現在のbudget_optionsテーブルの内容確認
SELECT 'BUDGET_OPTIONS_CURRENT' as test_type, * FROM budget_options ORDER BY id;

-- 6. プロフィールの実際のデータと期待値の比較
SELECT 
    'PROFILE_ARRAYS' as test_type,
    id,
    budget_pref,
    cardinality(budget_pref) as budget_count,
    purpose_tags,
    cardinality(purpose_tags) as purpose_count,
    demand_tags,
    cardinality(demand_tags) as demand_count
FROM profiles 
WHERE id = '4309fdd0-1e5c-47b4-b65e-7b3aa8ad28d0';