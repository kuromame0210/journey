# データベース構造分析 & 改善提案

## 🔍 分析結果

### 💡 問題点と改善提案

#### 1. **チャットルーム設計の問題**
**現在の問題:**
```sql
UNIQUE(place_id, user_a, user_b)  -- user_a < user_b の順序が保証されない
```

**改善案:**
- チャットルーム作成時にuser_a < user_bの順序を強制
- または、チャットルーム検索の複雑化を避けるため別のアプローチを検討

#### 2. **外部キー制約の欠如**
**問題:** 配列フィールドの整合性チェックなし
```sql
purpose_tags INTEGER[],  -- purpose_tags.idとの整合性チェックなし
demand_tags INTEGER[],   -- demand_tags.idとの整合性チェックなし
budget_pref INTEGER[],   -- budget_options.idとの整合性チェックなし
```

**改善案:** バリデーション関数またはトリガーの追加

#### 3. **マッチングロジックのサポート不足**
**問題:** マッチ度計算に必要なデータ構造が不完全
- 地理的情報（位置情報）が欠如
- 年齢範囲の設定ができない
- アクティブ状態の管理なし

#### 4. **スケーラビリティの懸念**
**問題:**
- 全リアクション履歴の保存（pass含む）
- メッセージの論理削除機能なし
- 画像ストレージパスの管理が簡素

#### 5. **ビジネスロジックの不備**
**問題:**
- 募集期限の管理なし
- 場所の状態管理なし（募集中/締切など）
- 通報・ブロック機能の考慮なし

## 🛠️ 改善版スキーマ提案

### 追加すべきテーブル・カラム

```sql
-- 地理情報追加
ALTER TABLE places ADD COLUMN 
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name TEXT,
  prefecture TEXT,
  city TEXT;

-- プロフィール改善
ALTER TABLE profiles ADD COLUMN
  age_min INTEGER,
  age_max INTEGER,
  location_pref TEXT[],  -- 希望地域
  is_active BOOLEAN DEFAULT true,
  last_active_at TIMESTAMPTZ DEFAULT NOW();

-- 場所投稿改善
ALTER TABLE places ADD COLUMN
  status TEXT CHECK (status IN ('active', 'closed', 'cancelled')) DEFAULT 'active',
  application_deadline DATE,
  max_applications INTEGER;

-- 通報・ブロック機能
CREATE TABLE user_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_place_id UUID REFERENCES places(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'resolved', 'dismissed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- 通知テーブル
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- 'match', 'message', 'application' など
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,  -- 追加データ
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### インデックス追加
```sql
-- 地理検索用
CREATE INDEX ON places (latitude, longitude);
CREATE INDEX ON places (prefecture, city);

-- アクティブユーザー検索用
CREATE INDEX ON profiles (is_active, last_active_at);

-- 通知検索用
CREATE INDEX ON notifications (user_id, is_read, created_at);
```

## 📊 パフォーマンス考慮事項

### 1. **データ分割戦略**
- 古いメッセージの別テーブル移行
- リアクション履歴のアーカイブ化

### 2. **キャッシュ戦略**
- ユーザープロフィールのRedisキャッシュ
- 人気場所の結果キャッシュ

### 3. **検索最適化**
- 全文検索インデックス（タイトル、説明）
- 地理的検索のGiSTインデックス

## 🔒 セキュリティ強化

### 1. **RLS改善**
```sql
-- ブロック機能を考慮したポリシー
CREATE POLICY "Hide blocked users content" ON places
  FOR SELECT USING (
    NOT EXISTS (
      SELECT 1 FROM user_blocks 
      WHERE blocked_id = places.owner 
      AND blocker_id = auth.uid()
    )
  );
```

### 2. **データバリデーション**
- 年齢の妥当性チェック
- 画像ファイルサイズ制限
- メッセージ長制限

## 🎯 実装優先度

### Phase 1 (必須)
1. チャットルーム設計修正
2. 基本的なバリデーション追加
3. 地理情報の追加

### Phase 2 (重要)
1. 通報・ブロック機能
2. 通知システム
3. 状態管理の改善

### Phase 3 (拡張)
1. 高度な検索機能
2. 分析・レポート機能
3. 管理者機能

## 💡 結論

現在のスキーマは基本機能には十分ですが、本格運用には改善が必要です。特に：

1. **即座に修正すべき:** チャットルーム設計
2. **早期に追加すべき:** 地理情報、状態管理
3. **将来的に検討:** 通報機能、高度な検索

段階的な改善により、スケーラブルで安全なマッチングアプリを構築できます。