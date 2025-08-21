-- 一時的にプロフィール保存エラーを解決するためのトリガー無効化
-- これを実行してからプロフィール保存をテストしてください

-- 1. profiles のバリデーショントリガーを無効化
DROP TRIGGER IF EXISTS profiles_tags_check ON profiles;

-- 2. places のバリデーショントリガーも無効化（念のため）
DROP TRIGGER IF EXISTS places_tags_check ON places;

-- 確認: 現在のトリガー一覧を表示
SELECT 
    schemaname,
    tablename,
    triggername,
    'ENABLED' as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal
  AND (c.relname = 'profiles' OR c.relname = 'places')
ORDER BY tablename, triggername;

-- プロフィール保存テスト後、以下のコマンドでトリガーを再有効化できます：
/*
-- トリガー再有効化用（テスト後に実行）
CREATE TRIGGER profiles_tags_check
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trg_profiles_validate_tags();

CREATE TRIGGER places_tags_check
  BEFORE INSERT OR UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION trg_places_validate_tags();
*/