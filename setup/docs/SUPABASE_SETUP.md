# Supabase セットアップガイド

## 1. プロジェクト作成
1. [supabase.com](https://supabase.com) でプロジェクト作成
2. プロジェクト名: `journey`
3. データベースパスワードを設定
4. リージョンを選択

## 2. 環境変数設定
Settings > API から以下をコピーして `.env.local` に設定：
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- Anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. データベース設定
SQL Editor で `supabase-setup.sql` の内容を実行

## 4. 認証設定
Authentication > Settings で以下を設定：

### Phone認証
1. Authentication > Settings > Phone Auth
2. Enable phone confirmations: ON
3. SMS Provider を設定（Twilio推奨）

### Apple認証 (オプション)
1. Authentication > Settings > Auth Providers
2. Apple を有効化
3. Apple Developer アカウントで設定

### LINE認証 (オプション)
1. Authentication > Settings > Auth Providers
2. カスタムプロバイダーとして設定

## 5. ストレージ設定 (画像アップロード用)
1. Storage でバケット作成: `place-images`
2. ポリシー設定:
   - Public read access
   - Authenticated users can upload

## 6. URL設定
Authentication > Settings > URL Configuration:
- Site URL: `http://localhost:3000` (開発時)
- Redirect URLs: `http://localhost:3000/auth/callback`

## 7. テスト
1. 開発サーバー再起動: `npm run dev`
2. `/auth` でSMS認証をテスト
3. プロフィール作成をテスト
4. 場所投稿をテスト

## トラブルシューティング
- RLS エラー → ポリシー設定を確認
- 認証エラー → URL設定とプロバイダー設定を確認
- 画像アップロードエラー → ストレージのポリシー設定を確認