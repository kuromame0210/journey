-- Journey App Database Schema
-- 仕様書v1.mdに基づくデータベース設計

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- マスタテーブル
CREATE TABLE budget_options (
  id SERIAL PRIMARY KEY,
  label TEXT UNIQUE NOT NULL
);

CREATE TABLE purpose_tags (
  id SERIAL PRIMARY KEY,
  label TEXT UNIQUE NOT NULL
);

CREATE TABLE demand_tags (
  id SERIAL PRIMARY KEY,
  label TEXT UNIQUE NOT NULL
);

-- プロフィールテーブル
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  age INTEGER,
  partner_gender TEXT CHECK (partner_gender IN ('male', 'female', 'either')),
  must_condition TEXT,
  mbti TEXT,
  budget_pref INTEGER[],
  purpose_tags INTEGER[],
  demand_tags INTEGER[],
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 場所投稿テーブル
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  genre TEXT,
  title TEXT,
  images TEXT[],
  budget_option INTEGER REFERENCES budget_options(id),
  purpose_tags INTEGER[],
  demand_tags INTEGER[],
  purpose_text TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  date_start DATE,
  date_end DATE,
  recruit_num INTEGER,
  first_choice TEXT,
  second_choice TEXT,
  gmap_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- リアクションテーブル
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  from_uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('like', 'keep', 'pass')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(place_id, from_uid)
);

-- チャットルームテーブル
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  user_a UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(place_id, user_a, user_b)
);

-- メッセージテーブル
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX ON places USING GIN (purpose_tags);
CREATE INDEX ON places USING GIN (demand_tags);
CREATE INDEX ON places (budget_option);
CREATE INDEX ON places (created_at);
CREATE INDEX ON reactions (place_id);
CREATE INDEX ON reactions (from_uid);
CREATE INDEX ON messages (room_id);
CREATE INDEX ON messages (sent_at);

-- RLS (Row Level Security) 設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- プロフィールのポリシー
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 場所投稿のポリシー
CREATE POLICY "Anyone can view places" ON places
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own places" ON places
  FOR INSERT WITH CHECK (auth.uid() = owner);

CREATE POLICY "Users can update their own places" ON places
  FOR UPDATE USING (auth.uid() = owner);

CREATE POLICY "Users can delete their own places" ON places
  FOR DELETE USING (auth.uid() = owner);

-- リアクションのポリシー
CREATE POLICY "Users can view all reactions" ON reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own reactions" ON reactions
  FOR ALL USING (auth.uid() = from_uid);

-- チャットルームのポリシー
CREATE POLICY "Users can view their own chat rooms" ON chat_rooms
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Users can create chat rooms" ON chat_rooms
  FOR INSERT WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

-- メッセージのポリシー
CREATE POLICY "Users can view messages in their chat rooms" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE chat_rooms.id = messages.room_id 
      AND (chat_rooms.user_a = auth.uid() OR chat_rooms.user_b = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their chat rooms" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender AND
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE chat_rooms.id = messages.room_id 
      AND (chat_rooms.user_a = auth.uid() OR chat_rooms.user_b = auth.uid())
    )
  );

-- マスターデータの初期挿入
INSERT INTO budget_options (label) VALUES 
  ('低 (〜3万円)'),
  ('中 (3〜10万円)'),
  ('高 (10万円〜)');

INSERT INTO purpose_tags (label) VALUES 
  ('観光'),
  ('グルメ'),
  ('写真撮影'),
  ('アクティビティ'),
  ('ショッピング'),
  ('温泉・リラックス'),
  ('自然'),
  ('歴史・文化'),
  ('テーマパーク'),
  ('スポーツ');

INSERT INTO demand_tags (label) VALUES 
  ('写真を撮ってくれる人'),
  ('一緒に食事を楽しめる人'),
  ('体力がある人'),
  ('計画性がある人'),
  ('語学ができる人'),
  ('運転ができる人'),
  ('現地に詳しい人'),
  ('同年代の人'),
  ('話しやすい人'),
  ('時間に余裕がある人');