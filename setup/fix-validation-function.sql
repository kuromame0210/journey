-- バリデーション関数の修正版

-- 1. 問題の分析と修正版の関数
CREATE OR REPLACE FUNCTION _check_tag_array_valid_fixed(arr int[], master_table text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    invalid_ids int[];
    bad_exists boolean := false;
BEGIN
    -- NULL または空配列の場合は何もしない
    IF arr IS NULL OR array_length(arr, 1) IS NULL THEN
        RETURN;
    END IF;

    -- より明確なクエリで無効なIDを検索
    EXECUTE format(
        'SELECT ARRAY(
            SELECT t.id 
            FROM unnest($1::int[]) t(id) 
            WHERE NOT EXISTS (
                SELECT 1 FROM %I m WHERE m.id = t.id
            )
        )', master_table)
    USING arr
    INTO invalid_ids;

    -- 無効なIDが存在する場合はエラー
    IF array_length(invalid_ids, 1) > 0 THEN
        RAISE EXCEPTION 'array contains invalid id(s) for %: %', master_table, invalid_ids;
    END IF;
END;
$$;

-- 2. テスト用のクエリ（実行前に確認）
-- まず budget_options テーブルの状態を確認
SELECT 'MASTER_TABLE_CHECK' as check_type, 'budget_options' as table_name, id, label 
FROM budget_options ORDER BY id;

-- 3. 修正版関数のテスト
DO $$
BEGIN
    -- 空配列のテスト
    RAISE NOTICE 'Testing empty array with fixed function...';
    PERFORM _check_tag_array_valid_fixed(ARRAY[]::int[], 'budget_options');
    RAISE NOTICE 'Empty array test: PASSED';
    
    -- NULL配列のテスト  
    RAISE NOTICE 'Testing NULL array with fixed function...';
    PERFORM _check_tag_array_valid_fixed(NULL::int[], 'budget_options');
    RAISE NOTICE 'NULL array test: PASSED';
    
    -- 有効な値のテスト
    RAISE NOTICE 'Testing valid values [1,2,3] with fixed function...';
    PERFORM _check_tag_array_valid_fixed(ARRAY[1,2,3], 'budget_options');
    RAISE NOTICE 'Valid values test: PASSED';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in fixed function: %', SQLERRM;
END $$;

-- 4. 元の関数をバックアップして置き換え
-- 元の関数をバックアップ
CREATE OR REPLACE FUNCTION _check_tag_array_valid_original(arr int[], master_table text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  bad_exists boolean;
BEGIN
  IF arr IS NULL THEN
    RETURN;
  END IF;

  EXECUTE format(
    'SELECT EXISTS (
       SELECT 1
         FROM unnest($1::int[]) t(id)
         LEFT JOIN %I m USING(id)
        WHERE m.id IS NULL
     )', master_table)
  USING arr
  INTO bad_exists;

  IF bad_exists THEN
     RAISE EXCEPTION 'array contains invalid id(s) for %', master_table;
  END IF;
END;
$$;

-- 修正版で元の関数を置き換え
CREATE OR REPLACE FUNCTION _check_tag_array_valid(arr int[], master_table text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    invalid_ids int[];
BEGIN
    -- NULL または空配列の場合は何もしない
    IF arr IS NULL OR array_length(arr, 1) IS NULL THEN
        RETURN;
    END IF;

    -- 無効なIDを検索
    EXECUTE format(
        'SELECT ARRAY(
            SELECT t.id 
            FROM unnest($1::int[]) t(id) 
            WHERE NOT EXISTS (
                SELECT 1 FROM %I m WHERE m.id = t.id
            )
        )', master_table)
    USING arr
    INTO invalid_ids;

    -- 無効なIDが存在する場合はエラー
    IF array_length(invalid_ids, 1) > 0 THEN
        RAISE EXCEPTION 'array contains invalid id(s) for %: %', master_table, invalid_ids;
    END IF;
END;
$$;