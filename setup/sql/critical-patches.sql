-- Critical Database Patches for Journey App
-- すぐに適用すべき重要なバグ修正パッチ

-- =====================================
-- 1. チャットルーム重複防止（最重要）
-- =====================================

-- 1-1) 既存 UNIQUE 制約を削除
ALTER TABLE chat_rooms
  DROP CONSTRAINT IF EXISTS chat_rooms_place_id_user_a_user_b_key;

-- 1-2) user_a と user_b を順序無視で一意にする Index を作成
CREATE UNIQUE INDEX chat_rooms_unique_pair
  ON chat_rooms
  ( place_id
  , LEAST(user_a, user_b)     -- 小さい方
  , GREATEST(user_a, user_b)  -- 大きい方
  );

-- =====================================
-- 2. タグ配列の整合性チェック
-- =====================================

-- 2-1) 共通ヘルパー関数
CREATE OR REPLACE FUNCTION _check_tag_array_valid(arr int[], master_table text)
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

-- 2-2) places 用トリガー
CREATE OR REPLACE FUNCTION trg_places_validate_tags()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM _check_tag_array_valid(NEW.purpose_tags, 'purpose_tags');
  PERFORM _check_tag_array_valid(NEW.demand_tags , 'demand_tags' );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS places_tags_check ON places;
CREATE TRIGGER places_tags_check
  BEFORE INSERT OR UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION trg_places_validate_tags();

-- 2-3) profiles 用トリガー
CREATE OR REPLACE FUNCTION trg_profiles_validate_tags()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM _check_tag_array_valid(NEW.purpose_tags, 'purpose_tags');
  PERFORM _check_tag_array_valid(NEW.demand_tags , 'demand_tags' );
  PERFORM _check_tag_array_valid(NEW.budget_pref , 'budget_options');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_tags_check ON profiles;
CREATE TRIGGER profiles_tags_check
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trg_profiles_validate_tags();

-- =====================================
-- 3. 基本的なデータバリデーション追加
-- =====================================

-- 年齢の妥当性チェック
ALTER TABLE profiles 
  ADD CONSTRAINT profiles_age_check 
  CHECK (age IS NULL OR (age >= 18 AND age <= 100));

-- 募集人数の妥当性チェック
ALTER TABLE places 
  ADD CONSTRAINT places_recruit_num_check 
  CHECK (recruit_num IS NULL OR (recruit_num >= 1 AND recruit_num <= 20));

-- 予算の妥当性チェック
ALTER TABLE places 
  ADD CONSTRAINT places_budget_check 
  CHECK (
    (budget_min IS NULL AND budget_max IS NULL) OR
    (budget_min IS NOT NULL AND budget_max IS NOT NULL AND budget_min <= budget_max)
  );

-- 日程の妥当性チェック
ALTER TABLE places 
  ADD CONSTRAINT places_date_check 
  CHECK (
    (date_start IS NULL AND date_end IS NULL) OR
    (date_start IS NOT NULL AND (date_end IS NULL OR date_start <= date_end))
  );

-- =====================================
-- 4. パフォーマンス向上のための追加インデックス
-- =====================================

-- プロフィール検索用
CREATE INDEX IF NOT EXISTS profiles_age_gender_idx 
  ON profiles (age, gender) 
  WHERE age IS NOT NULL;

-- 場所の日付検索用
CREATE INDEX IF NOT EXISTS places_date_range_idx 
  ON places (date_start, date_end) 
  WHERE date_start IS NOT NULL;

-- リアクション分析用
CREATE INDEX IF NOT EXISTS reactions_type_created_idx 
  ON reactions (type, created_at);

-- =====================================
-- 5. RLSポリシーの微調整
-- =====================================

-- プロフィールの表示制限（年齢などの条件）
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view active profiles" ON profiles
  FOR SELECT USING (
    -- 自分のプロフィールは常に見える
    auth.uid() = id OR 
    -- 他人のプロフィールは基本情報のみ
    (name IS NOT NULL AND age IS NOT NULL)
  );

-- =====================================
-- パッチ適用確認用クエリ
-- =====================================

-- 適用確認用：以下のクエリで制約とインデックスの存在を確認
/*
-- チャットルーム重複防止の確認
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'chat_rooms' AND indexname = 'chat_rooms_unique_pair';

-- トリガーの確認
SELECT tgname, tgtype 
FROM pg_trigger 
WHERE tgrelid = 'places'::regclass AND tgname = 'places_tags_check';

-- 制約の確認
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass AND conname LIKE '%_check';
*/