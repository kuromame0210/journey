# Setup フォルダ

このフォルダには、Journeyアプリのセットアップに必要なファイルが含まれています。

## ファイル一覧

### `supabase-setup.sql`
- Supabaseデータベースの初期設定SQLスクリプト
- テーブル作成、RLS設定、マスターデータ投入
- Supabase SQL Editorで実行してください

### `SUPABASE_SETUP.md`
- Supabaseの詳細なセットアップガイド
- 認証設定、ストレージ設定、URL設定などの手順

## セットアップ手順

1. **Supabaseプロジェクト作成**
   - [supabase.com](https://supabase.com) でプロジェクト作成

2. **環境変数設定**
   - プロジェクトのURLとAPIキーを `.env.local` に設定

3. **データベース設定**
   - `supabase-setup.sql` をSupabase SQL Editorで実行

4. **認証設定**
   - `SUPABASE_SETUP.md` の手順に従って認証プロバイダーを設定

5. **テスト**
   - アプリを再起動して動作確認

## 注意事項

- `.env.local` には実際の認証情報が含まれるため、Git管理対象外です
- 本番環境では適切なセキュリティ設定を行ってください