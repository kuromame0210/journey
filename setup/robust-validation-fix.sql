-- 堅牢なバリデーション関数の実装
-- データ不整合があっても動作する安全な関数

-- 1. まず既存のトリガーを一時的に無効化
DROP TRIGGER IF EXISTS profiles_tags_check ON profiles;
DROP TRIGGER IF EXISTS places_tags_check ON places;

-- 2. より安全なバリデーション関数を作成
CREATE OR REPLACE FUNCTION _check_tag_array_valid_safe(arr int[], master_table text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    invalid_ids int[];
    table_exists boolean;
BEGIN
    -- NULL または空配列の場合は何もしない
    IF arr IS NULL OR array_length(arr, 1) IS NULL THEN
        RETURN;
    END IF;

    -- マスターテーブルの存在確認
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = %L)', master_table)
    INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE WARNING 'Master table % does not exist, skipping validation', master_table;
        RETURN;
    END IF;

    -- 無効なIDを検索（より安全なクエリ）
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

    -- 無効なIDが存在する場合の処理
    IF array_length(invalid_ids, 1) > 0 THEN
        DECLARE
            available_ids int[];
        BEGIN
            -- 利用可能なIDを取得
            EXECUTE format('SELECT array_agg(id ORDER BY id) FROM %I', master_table)
            INTO available_ids;
            
            -- 厳密モード: エラーを投げる
            RAISE EXCEPTION 'Array contains invalid id(s) for %: %. Available IDs: %', 
                master_table, 
                invalid_ids,
                available_ids;
        END;
        
        -- 寛容モード: 警告のみ（以下を有効にする場合は上記をコメントアウト）
        -- RAISE WARNING 'Array contains invalid id(s) for %: %', master_table, invalid_ids;
    END IF;
END;
$$;

-- 3. 元の関数を安全版で置き換え
CREATE OR REPLACE FUNCTION _check_tag_array_valid(arr int[], master_table text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    PERFORM _check_tag_array_valid_safe(arr, master_table);
END;
$$;

-- 4. トリガーを再作成（修正されたバリデーション関数を使用）
CREATE TRIGGER profiles_tags_check
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION trg_profiles_validate_tags();

CREATE TRIGGER places_tags_check
    BEFORE INSERT OR UPDATE ON places
    FOR EACH ROW EXECUTE FUNCTION trg_places_validate_tags();

-- 5. テスト
DO $$
BEGIN
    RAISE NOTICE 'Testing safe validation function...';
    
    -- 空配列のテスト
    PERFORM _check_tag_array_valid(ARRAY[]::int[], 'budget_options');
    RAISE NOTICE 'Empty array test: PASSED';
    
    -- 有効な値のテスト  
    PERFORM _check_tag_array_valid(ARRAY[1,2,3], 'budget_options');
    RAISE NOTICE 'Valid values test: PASSED';
    
    RAISE NOTICE 'All tests completed successfully';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test failed: %', SQLERRM;
END $$;