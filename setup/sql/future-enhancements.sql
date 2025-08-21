-- Future Database Enhancements for Journey App
-- 将来的に適用する拡張機能用SQL

-- =====================================
-- 1. 位置情報機能（地理的マッチング用）
-- =====================================

-- 緯度経度追加（PostGIS無しの簡易版）
ALTER TABLE places 
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_name TEXT,
  ADD COLUMN IF NOT EXISTS prefecture TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT;

-- 地理検索用インデックス
CREATE INDEX IF NOT EXISTS places_location_idx 
  ON places USING gist (point(lng, lat))
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- 都道府県・市区町村検索用
CREATE INDEX IF NOT EXISTS places_prefecture_city_idx 
  ON places (prefecture, city)
  WHERE prefecture IS NOT NULL;

-- =====================================
-- 2. 募集状態管理
-- =====================================

-- 募集状態のENUM定義
DO $$ BEGIN
  CREATE TYPE place_status AS ENUM ('open','full','closed','expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 募集状態と期限追加
ALTER TABLE places 
  ADD COLUMN IF NOT EXISTS status place_status DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_applications INTEGER;

-- 募集期限の自動更新用（将来的にcronジョブで実行）
CREATE OR REPLACE FUNCTION update_expired_places()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE places 
  SET status = 'expired' 
  WHERE status = 'open' 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$;

-- =====================================
-- 3. 正規化テーブル方式（配列からリレーショナルへ）
-- =====================================

-- places × purpose_tags 中間テーブル
CREATE TABLE IF NOT EXISTS place_purpose_tags (
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  tag_id   INT  REFERENCES purpose_tags(id) ON DELETE RESTRICT,
  PRIMARY KEY(place_id, tag_id)
);

-- places × demand_tags 中間テーブル
CREATE TABLE IF NOT EXISTS place_demand_tags (
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  tag_id   INT  REFERENCES demand_tags(id) ON DELETE RESTRICT,
  PRIMARY KEY(place_id, tag_id)
);

-- profiles × purpose_tags 中間テーブル
CREATE TABLE IF NOT EXISTS profile_purpose_tags (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tag_id     INT  REFERENCES purpose_tags(id) ON DELETE RESTRICT,
  PRIMARY KEY(profile_id, tag_id)
);

-- profiles × demand_tags 中間テーブル
CREATE TABLE IF NOT EXISTS profile_demand_tags (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tag_id     INT  REFERENCES demand_tags(id) ON DELETE RESTRICT,
  PRIMARY KEY(profile_id, tag_id)
);

-- profiles × budget_options 中間テーブル
CREATE TABLE IF NOT EXISTS profile_budget_options (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  budget_id  INT  REFERENCES budget_options(id) ON DELETE RESTRICT,
  PRIMARY KEY(profile_id, budget_id)
);

-- 配列から正規化テーブルへのデータ移行関数
CREATE OR REPLACE FUNCTION migrate_arrays_to_normalized()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- places の purpose_tags 移行
  INSERT INTO place_purpose_tags(place_id, tag_id)
  SELECT id, unnest(purpose_tags) 
  FROM places 
  WHERE purpose_tags IS NOT NULL
  ON CONFLICT DO NOTHING;

  -- places の demand_tags 移行
  INSERT INTO place_demand_tags(place_id, tag_id)
  SELECT id, unnest(demand_tags) 
  FROM places 
  WHERE demand_tags IS NOT NULL
  ON CONFLICT DO NOTHING;

  -- profiles の purpose_tags 移行
  INSERT INTO profile_purpose_tags(profile_id, tag_id)
  SELECT id, unnest(purpose_tags) 
  FROM profiles 
  WHERE purpose_tags IS NOT NULL
  ON CONFLICT DO NOTHING;

  -- profiles の demand_tags 移行
  INSERT INTO profile_demand_tags(profile_id, tag_id)
  SELECT id, unnest(demand_tags) 
  FROM profiles 
  WHERE demand_tags IS NOT NULL
  ON CONFLICT DO NOTHING;

  -- profiles の budget_pref 移行
  INSERT INTO profile_budget_options(profile_id, budget_id)
  SELECT id, unnest(budget_pref) 
  FROM profiles 
  WHERE budget_pref IS NOT NULL
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Array to normalized table migration completed';
END;
$$;

-- =====================================
-- 4. 通報・ブロック機能
-- =====================================

-- 通報テーブル
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_place_id UUID REFERENCES places(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'resolved', 'dismissed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ブロック機能テーブル
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- ブロック機能を考慮したRLSポリシー
CREATE OR REPLACE FUNCTION create_block_aware_policies()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- places のブロック対応ポリシー
  DROP POLICY IF EXISTS "Hide blocked users content" ON places;
  CREATE POLICY "Hide blocked users content" ON places
    FOR SELECT USING (
      NOT EXISTS (
        SELECT 1 FROM user_blocks 
        WHERE blocked_id = places.owner 
        AND blocker_id = auth.uid()
      )
    );

  -- profiles のブロック対応ポリシー
  DROP POLICY IF EXISTS "Hide blocked profiles" ON profiles;
  CREATE POLICY "Hide blocked profiles" ON profiles
    FOR SELECT USING (
      auth.uid() = id OR
      NOT EXISTS (
        SELECT 1 FROM user_blocks 
        WHERE blocked_id = profiles.id 
        AND blocker_id = auth.uid()
      )
    );
END;
$$;

-- =====================================
-- 5. 通知システム
-- =====================================

-- 通知テーブル
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- 'match', 'message', 'application', 'system'
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,  -- 追加データ（リンク先情報など）
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- 通知検索用インデックス
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx 
  ON notifications (user_id, is_read, created_at)
  WHERE is_read = false;

-- 通知作成ヘルパー関数
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (p_user_id, p_type, p_title, p_body, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- =====================================
-- 6. 使用統計・分析用テーブル
-- =====================================

-- ユーザーアクティビティログ
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,  -- 'login', 'view_place', 'create_place', 'send_message'
  target_type TEXT,      -- 'place', 'user', 'message'
  target_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- アクティビティ分析用インデックス
CREATE INDEX IF NOT EXISTS activity_logs_user_action_idx 
  ON user_activity_logs (user_id, action, created_at);

CREATE INDEX IF NOT EXISTS activity_logs_daily_stats_idx 
  ON user_activity_logs (date_trunc('day', created_at), action);

-- =====================================
-- インストール確認用
-- =====================================

-- 拡張機能の適用状況確認クエリ
CREATE OR REPLACE FUNCTION check_enhancements_status()
RETURNS TABLE(feature TEXT, status TEXT) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 'Location Support'::TEXT, 
         CASE WHEN EXISTS(
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'places' AND column_name = 'lat'
         ) THEN 'Installed' ELSE 'Not Installed' END;
  
  RETURN QUERY
  SELECT 'Status Management'::TEXT,
         CASE WHEN EXISTS(
           SELECT 1 FROM pg_type WHERE typname = 'place_status'
         ) THEN 'Installed' ELSE 'Not Installed' END;
  
  RETURN QUERY
  SELECT 'Normalized Tables'::TEXT,
         CASE WHEN EXISTS(
           SELECT 1 FROM information_schema.tables 
           WHERE table_name = 'place_purpose_tags'
         ) THEN 'Installed' ELSE 'Not Installed' END;
  
  RETURN QUERY
  SELECT 'Block System'::TEXT,
         CASE WHEN EXISTS(
           SELECT 1 FROM information_schema.tables 
           WHERE table_name = 'user_blocks'
         ) THEN 'Installed' ELSE 'Not Installed' END;
  
  RETURN QUERY
  SELECT 'Notification System'::TEXT,
         CASE WHEN EXISTS(
           SELECT 1 FROM information_schema.tables 
           WHERE table_name = 'notifications'
         ) THEN 'Installed' ELSE 'Not Installed' END;
END;
$$;