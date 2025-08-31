# Journey アプリケーション エラーメッセージ・UI メッセージ一覧

> **作成日**: 2025-08-31  
> **バージョン**: v1.0  
> **対象システム**: Journey - 旅の仲間を見つけるマッチングアプリ

## 概要

このドキュメントは、Journey アプリケーション内で使用されているすべてのエラーメッセージ、成功メッセージ、警告メッセージ、UI メッセージを網羅的にまとめたリファレンスです。

**メッセージ総数**: 145 個（全て日本語統一済み）
- エラーメッセージ: 40 個
- 警告メッセージ: 6 個
- 成功メッセージ: 7 個
- 情報メッセージ: 3 個
- バリデーションメッセージ: 30 個
- ローディングメッセージ: 13 個
- その他（UI ラベル、プレースホルダーなど）: 46 個

## 目次

1. [エラーメッセージ](#1-エラーメッセージ)
   - [認証関連エラー](#認証関連エラー)
   - [データベース・API エラー](#データベースapi-エラー)
   - [ファイルアップロードエラー](#ファイルアップロードエラー)
   - [フォーム送信エラー](#フォーム送信エラー)
   - [バリデーションエラー](#バリデーションエラー)
   - [サービス API エラー](#サービス-api-エラー)
2. [警告メッセージ](#2-警告メッセージ)
3. [成功メッセージ](#3-成功メッセージ)
4. [情報メッセージ](#4-情報メッセージ)
5. [フォームバリデーションメッセージ](#5-フォームバリデーションメッセージ)
6. [ローディングメッセージ](#6-ローディングメッセージ)
7. [アクションボタンテキスト](#7-アクションボタンテキスト)
8. [プレースホルダーテキスト](#8-プレースホルダーテキスト)
9. [UI ラベル](#9-ui-ラベル)
10. [空データ状態メッセージ](#10-空データ状態メッセージ)
11. [フォールバックテキスト](#11-フォールバックテキスト)
12. [エラーハンドリング設計](#12-エラーハンドリング設計)

---

## 1. エラーメッセージ

### 認証関連エラー

| メッセージ | 使用場所 | 発生条件 | 種別 |
|-----------|----------|----------|------|
| `メールアドレスまたはパスワードが間違っています` | `src/hooks/useErrorHandler.ts:71` | ログイン失敗 | Error |
| `現在、新規登録を一時停止しています` | `src/hooks/useErrorHandler.ts:73` | サインアップ無効化 | Error |
| `このメールアドレスでの登録は許可されていません` | `src/hooks/useErrorHandler.ts:75` | 未許可メールアドレス | Error |
| `パスワードが弱すぎます。より複雑なパスワードを設定してください` | `src/hooks/useErrorHandler.ts:77` | パスワード強度不足 | Error |
| `有効なメールアドレスを入力してください` | `src/hooks/useErrorHandler.ts:79` | メールアドレス形式エラー | Error |
| `アクセス回数が上限に達しました。しばらく時間をおいてから再試行してください` | `src/hooks/useErrorHandler.ts:81` | レート制限 | Error |
| `アカウント作成に失敗しました` | `src/app/auth/page.tsx:130` | サインアップ失敗フォールバック | Error |
| `パスワードリセットの送信に失敗しました` | `src/app/auth/page.tsx:151` | パスワードリセット失敗 | Error |
| `Apple認証でエラーが発生しました` | `src/app/auth/page.tsx:168` | Apple 認証失敗 | Error |
| `無効なリセットリンクです。もう一度パスワードリセットを行ってください。` | `src/app/auth/reset-password/page.tsx:42` | 無効なリセットリンク | Error |
| `パスワードの更新に失敗しました` | `src/app/auth/reset-password/page.tsx:85` | パスワード更新失敗 | Error |

### データベース・API エラー

| メッセージ | 使用場所 | 発生条件 | 種別 |
|-----------|----------|----------|------|
| `この情報は既に登録されています` | `src/hooks/useErrorHandler.ts:83,92` | 重複キー制約違反 | Error |
| `通信エラーが発生しました。しばらく時間をおいてから再試行してください` | `src/hooks/useErrorHandler.ts:95` | ネットワーク・接続エラー | Error |
| `システムエラーが発生しました。しばらく時間をおいてから再試行してください` | `src/hooks/useErrorHandler.ts:96` | サーバーエラー | Error |
| `権限がありません` | `src/hooks/useErrorHandler.ts:85` | 未認可アクセス | Error |
| `アクセス権限がありません` | `src/hooks/useErrorHandler.ts:94` | アクセス拒否 | Error |
| `データが見つかりませんでした` | `src/shared/constants/app.ts:230` | データ未発見 | Error |
| `予期しないエラーが発生しました` | `src/hooks/useErrorHandler.ts:50` | デフォルトフォールバックエラー | Error |

### ファイルアップロードエラー

| メッセージ | 使用場所 | 発生条件 | 種別 |
|-----------|----------|----------|------|
| `ファイルサイズが大きすぎます` | `src/hooks/useErrorHandler.ts:105` | ファイルサイズ超過 | Error |
| `サポートされていないファイル形式です` | `src/hooks/useErrorHandler.ts:106` | 無効なファイル形式 | Error |
| `画像のアップロードに失敗しました` | `src/app/place/create/page.tsx:189` | 画像アップロード失敗 | Error |
| `画像の圧縮に失敗しました` | `src/app/place/create/page.tsx:148` | 画像圧縮失敗 | Error |
| `画像の処理に失敗しました` | `src/app/profile/edit/page.tsx:215` | 画像処理失敗 | Error |
| `画像圧縮に失敗しました` | `src/shared/hooks/useImageCompression.ts:54,94` | 画像圧縮エラー | Error |

### フォーム送信エラー

| メッセージ | 使用場所 | 発生条件 | 種別 |
|-----------|----------|----------|------|
| `投稿の作成中にエラーが発生しました` | `src/app/place/create/page.tsx:254` | 場所投稿作成失敗 | Error |
| `プロフィールの保存中にエラーが発生しました` | `src/app/profile/edit/page.tsx:312` | プロフィール保存失敗 | Error |
| `メッセージの送信に失敗しました` | `src/app/chat/[id]/page.tsx:300` | メッセージ送信失敗 | Error |
| `リアクションの保存に失敗しました` | `src/app/place/[id]/page.tsx:134` | リアクション保存失敗 | Error |
| `ログアウトに失敗しました` | `src/app/settings/page.tsx:53` | ログアウト失敗 | Error |

### バリデーションエラー

| メッセージ | 使用場所 | 発生条件 | 種別 |
|-----------|----------|----------|------|
| `必須項目が入力されていません` | `src/hooks/useErrorHandler.ts:109` | 必須フィールド未入力 | Error |
| `入力形式が正しくありません` | `src/hooks/useErrorHandler.ts:110,93` | 不正な入力形式 | Error |
| `パスワードが間違っています` | `src/hooks/useErrorHandler.ts:99` | パスワード不正 | Error |
| `メールアドレスが見つかりません` | `src/hooks/useErrorHandler.ts:100` | メールアドレス未発見 | Error |
| `アカウントが見つかりません` | `src/hooks/useErrorHandler.ts:101` | アカウント未発見 | Error |
| `セッションが切れました。再度ログインしてください` | `src/hooks/useErrorHandler.ts:102` | セッション期限切れ | Error |

### サービス API エラー

| メッセージ | 使用場所 | 発生条件 | 種別 |
|-----------|----------|----------|------|
| `キャンバスがサポートされていません` | `src/shared/utils/imageCompression.ts:43` | Canvas API 利用不可 | Error |
| `画像の圧縮に失敗しました` | `src/shared/utils/imageCompression.ts:72` | 画像圧縮失敗 | Error |
| `画像の読み込みに失敗しました` | `src/shared/utils/imageCompression.ts:109` | 画像読み込み失敗 | Error |
| `低品質での圧縮に失敗しました` | `src/shared/utils/imageCompression.ts:193` | 低品質圧縮失敗 | Error |
| `画像情報の読み込みに失敗しました` | `src/shared/utils/imageCompression.ts:242` | 画像情報読み込み失敗 | Error |
| `権限がありません：自分の投稿のみ削除できます` | `src/shared/services/api/places.ts` | 場所削除権限エラー | Error |
| `権限がありません：あなたはこのチャットルームの参加者ではありません` | `src/shared/services/api/chat.ts` | チャットルーム参加権限エラー | Error |
| `権限がありません：参加しているチャットルームのみ削除できます` | `src/shared/services/api/chat.ts` | チャットルーム削除権限エラー | Error |
| `未読数の取得に失敗しました` | `src/shared/hooks/useUnreadCount.ts:67` | 未読数取得失敗 | Error |

---

## 2. 警告メッセージ

| メッセージ | 使用場所 | 発生条件 | 種別 |
|-----------|----------|----------|------|
| `パスワードが一致しません` | `src/app/auth/page.tsx:68` | パスワード確認不一致 | Warning |
| `パスワードは6文字以上で入力してください` | `src/app/auth/page.tsx:75` | パスワード長不足 | Warning |
| `このメールアドレスは既に登録されています` | `src/app/auth/page.tsx:115` | メールアドレス重複 | Warning |
| `画像ファイルを選択してください` | `src/app/profile/edit/page.tsx:173` | 画像ファイル未選択 | Warning |
| `ファイルサイズは5MB以下にしてください` | `src/app/profile/edit/page.tsx:181` | ファイルサイズ超過 | Warning |
| `LINE認証は準備中です` | `src/app/auth/page.tsx:175` | LINE 認証未実装 | Warning |

---

## 3. 成功メッセージ

| メッセージ | 使用場所 | 発生条件 | 種別 |
|-----------|----------|----------|------|
| `パスワードが正常に更新されました` | `src/app/auth/reset-password/page.tsx:74` | パスワード更新成功 | Success |
| `保存しました` | `src/shared/constants/app.ts:237` | 一般的な保存成功 | Success |
| `更新しました` | `src/shared/constants/app.ts:238` | 一般的な更新成功 | Success |
| `作成しました` | `src/shared/constants/app.ts:239` | 一般的な作成成功 | Success |
| `削除しました` | `src/shared/constants/app.ts:240` | 一般的な削除成功 | Success |
| `送信しました` | `src/shared/constants/app.ts:241` | 一般的な送信成功 | Success |
| `アップロードしました` | `src/shared/constants/app.ts:242` | アップロード成功 | Success |

---

## 4. 情報メッセージ

| メッセージ | 使用場所 | 発生条件 | 種別 |
|-----------|----------|----------|------|
| `通知設定は後で実装予定です` | `src/app/settings/page.tsx:77` | 機能未実装 | Info |
| `プライバシー設定は後で実装予定です` | `src/app/settings/page.tsx:86` | 機能未実装 | Info |
| `ヘルプページは後で実装予定です` | `src/app/settings/page.tsx:95` | 機能未実装 | Info |

---

## 5. フォームバリデーションメッセージ

### 認証フォーム

| メッセージ | 使用場所 | 検証内容 | 種別 |
|-----------|----------|----------|------|
| `メールアドレスは必須です` | `src/shared/utils/validation.ts:127` | メール必須 | Validation |
| `有効なメールアドレスを入力してください` | `src/shared/utils/validation.ts:129,198` | メール形式 | Validation |
| `パスワードは必須です` | `src/shared/utils/validation.ts:135` | パスワード必須 | Validation |
| `パスワードは8文字以上で入力してください` | `src/shared/utils/validation.ts:137` | パスワード長 | Validation |
| `パスワード確認は必須です` | `src/shared/utils/validation.ts:144` | パスワード確認必須 | Validation |

### プロフィールフォーム

| メッセージ | 使用場所 | 検証内容 | 種別 |
|-----------|----------|----------|------|
| `お名前は必須です` | `src/shared/utils/validation.ts:169` | 氏名必須 | Validation |
| `お名前は50文字以下で入力してください` | `src/shared/utils/validation.ts:171` | 氏名長制限 | Validation |
| `性別は必須です` | `src/shared/utils/validation.ts:175` | 性別必須 | Validation |
| `年齢は必須です` | `src/shared/utils/validation.ts:179` | 年齢必須 | Validation |
| `年齢は18歳から100歳までの数値で入力してください` | `src/shared/utils/validation.ts:183` | 年齢範囲 | Validation |
| `希望する相手の性別は必須です` | `src/shared/utils/validation.ts:188` | 相手性別必須 | Validation |
| `有効な電話番号を入力してください（例: 09012345678）` | `src/shared/utils/validation.ts:193` | 電話番号形式 | Validation |
| `MBTIは必須です` | `src/shared/utils/validation.ts:203` | MBTI 必須 | Validation |
| `予算設定は必須です` | `src/shared/utils/validation.ts:208` | 予算設定必須 | Validation |
| `目的タグは1つ以上選択してください` | `src/shared/utils/validation.ts:213,259` | 目的タグ必須 | Validation |
| `デマンドタグは1つ以上選択してください` | `src/shared/utils/validation.ts:218,264` | デマンドタグ必須 | Validation |
| `必須条件は必須です` | `src/shared/utils/validation.ts:223` | 必須条件必須 | Validation |
| `必須条件は200文字以下で入力してください` | `src/shared/utils/validation.ts:225` | 必須条件長制限 | Validation |

### 場所投稿フォーム

| メッセージ | 使用場所 | 検証内容 | 種別 |
|-----------|----------|----------|------|
| `タイトルは必須です` | `src/shared/utils/validation.ts:247` | タイトル必須 | Validation |
| `タイトルは100文字以下で入力してください` | `src/shared/utils/validation.ts:249` | タイトル長制限 | Validation |
| `ジャンルは必須です` | `src/shared/utils/validation.ts:254` | ジャンル必須 | Validation |
| `目的詳細は必須です` | `src/shared/utils/validation.ts:269` | 目的詳細必須 | Validation |
| `目的詳細は500文字以下で入力してください` | `src/shared/utils/validation.ts:271` | 目的詳細長制限 | Validation |
| `予算カテゴリは必須です` | `src/shared/utils/validation.ts:276` | 予算カテゴリ必須 | Validation |
| `最低予算は0以上の数値で入力してください` | `src/shared/utils/validation.ts:283` | 最低予算範囲 | Validation |
| `最高予算は0以上の数値で入力してください` | `src/shared/utils/validation.ts:290` | 最高予算範囲 | Validation |
| `最高予算は最低予算以上で設定してください` | `src/shared/utils/validation.ts:298` | 予算範囲整合性 | Validation |
| `有効な開始日を入力してください` | `src/shared/utils/validation.ts:304` | 開始日有効性 | Validation |
| `有効な終了日を入力してください` | `src/shared/utils/validation.ts:308` | 終了日有効性 | Validation |
| `終了日は開始日以降で設定してください` | `src/shared/utils/validation.ts:315` | 日付範囲整合性 | Validation |
| `募集人数は1人から100人までの数値で入力してください` | `src/shared/utils/validation.ts:323` | 募集人数範囲 | Validation |
| `第1希望は必須です` | `src/shared/utils/validation.ts:329` | 第1希望必須 | Validation |
| `第1希望は200文字以下で入力してください` | `src/shared/utils/validation.ts:331` | 第1希望長制限 | Validation |
| `第2希望は200文字以下で入力してください` | `src/shared/utils/validation.ts:336` | 第2希望長制限 | Validation |
| `有効なURLを入力してください` | `src/shared/utils/validation.ts:341` | URL 形式 | Validation |

---

## 6. ローディングメッセージ

| メッセージ | 使用場所 | 表示タイミング | 種別 |
|-----------|----------|----------------|------|
| `読み込み中...` | `src/shared/components/LoadingSpinner.tsx:30,101` | デフォルトローディング | Loading |
| `チャット履歴を読み込み中...` | `src/app/chat/page.tsx:205` | チャット履歴取得 | Loading |
| `場所データを読み込み中...` | `src/app/home/page.tsx:234` | 場所データ取得 | Loading |
| `プロフィールデータを読み込み中...` | `src/app/profile/page.tsx:335` | プロフィールデータ取得 | Loading |
| `プロフィールページを読み込み中...` | `src/app/profile/page.tsx:669` | プロフィールページ読み込み | Loading |
| `チャットルームを読み込み中...` | `src/app/chat/[id]/page.tsx:350` | チャットルーム読み込み | Loading |
| `場所の詳細を読み込み中...` | `src/app/place/[id]/page.tsx:228` | 場所詳細読み込み | Loading |

---

## 7. アクションボタンテキスト

| ローディング状態 | 通常状態 | 使用場所 | アクション |
|-----------------|----------|----------|-----------|
| `投稿中...` | `投稿する` | `src/app/place/create/page.tsx:498` | 場所投稿作成 |
| `保存中...` | `保存する` | `src/app/profile/edit/page.tsx:604` | プロフィール保存 |
| `ログイン中...` | `ログイン` | `src/app/auth/page.tsx:287,291` | ログイン |
| `登録中...` | `アカウント作成` | `src/app/auth/page.tsx:288,292` | サインアップ |
| `送信中...` | `リセットメールを送信` | `src/app/auth/page.tsx:289,293` | パスワードリセット |
| `パスワード更新中...` | `パスワードを更新` | `src/app/auth/reset-password/page.tsx:150` | パスワード更新 |
| `ログアウト中...` | `ログアウト` | `src/app/settings/page.tsx:193` | ログアウト |

---

## 8. プレースホルダーテキスト

| プレースホルダーテキスト | 使用場所 | 入力フィールド |
|-------------------------|----------|----------------|
| `行きたい場所の名前を入力` | `src/app/place/create/page.tsx:331` | 場所タイトル |
| `ジャンルを入力` | `src/app/place/create/page.tsx:346` | ジャンル |
| `この場所で何をしたいか、どんな体験をしたいかを詳しく教えてください` | `src/app/place/create/page.tsx:429` | 目的詳細 |
| `your-email@example.com` | `src/app/auth/page.tsx:240` | メールアドレス |
| `6文字以上で入力` | `src/app/auth/page.tsx:257` | パスワード |
| `パスワードを再入力` | `src/app/auth/page.tsx:275` | パスワード確認 |
| `お名前を入力` | `src/app/profile/edit/page.tsx:388` | 氏名 |
| `年齢を入力` | `src/app/profile/edit/page.tsx:431` | 年齢 |
| `自己紹介や一緒に旅行する相手に求める条件などを自由に記述してください` | `src/app/profile/edit/page.tsx:562` | プロフィール説明 |
| `+81 90-1234-5678` | `src/app/profile/edit/page.tsx:593` | 電話番号 |
| `例: 2` | `src/app/place/create/page.tsx:473` | 募集人数 |
| `https://maps.google.com/...` | `src/app/place/create/page.tsx:488` | Google マップ URL |
| `メッセージを入力...` | `src/app/chat/[id]/page.tsx:499` | チャットメッセージ |

---

## 9. UI ラベル

### ナビゲーション

| ラベル | 使用場所 | 用途 |
|--------|----------|------|
| `ホーム` | `src/components/BottomNavigation.tsx:12` | タブナビゲーション |
| `チャット` | `src/components/BottomNavigation.tsx:13` | タブナビゲーション |
| `マイページ` | `src/components/BottomNavigation.tsx:14` | タブナビゲーション |
| `設定` | `src/components/BottomNavigation.tsx:15` | タブナビゲーション |

### 設定画面

| ラベル | 使用場所 | 用途 |
|--------|----------|------|
| `プロフィール設定` | `src/app/settings/page.tsx:66` | 設定オプション |
| `通知設定` | `src/app/settings/page.tsx:73` | 設定オプション |
| `プライバシー設定` | `src/app/settings/page.tsx:82` | 設定オプション |
| `ヘルプ・サポート` | `src/app/settings/page.tsx:91` | 設定オプション |

---

## 10. 空データ状態メッセージ

| メッセージ | 使用場所 | 表示条件 |
|-----------|----------|----------|
| `まだ投稿がありません` | `src/app/profile/page.tsx:556` | 投稿した場所なし |
| `まだ行きたい場所がありません` | `src/app/profile/page.tsx:557` | いいねした場所なし |
| `まだキープした場所がありません` | `src/app/profile/page.tsx:558` | キープした場所なし |
| `パスした場所はありません` | `src/app/profile/page.tsx:559` | パスした場所なし |

---

## 11. フォールバックテキスト

| フォールバックテキスト | 使用場所 | 使用条件 |
|-----------------------|----------|----------|
| `名前未設定` | `src/shared/hooks/useUserProfile.ts:63,72,83` | ユーザー名未設定時 |
| `場所名未設定` | `src/app/home/page.tsx:327` | 場所タイトル未設定時 |
| `ジャンル未設定` | `src/app/home/page.tsx:330` | ジャンル未設定時 |
| `場所未設定` | `src/app/chat/[id]/page.tsx:397` | チャットルーム場所未設定時 |
| `不明なユーザー` | `src/shared/services/api/chat.ts:97` | ユーザー情報不明時 |
| `画像なし` | `src/app/home/page.tsx:314` | 画像未設定時 |

---

## 12. エラーハンドリング設計

### アーキテクチャ概要

Journey アプリケーションでは、統一されたエラーハンドリングシステムを採用しています：

#### 主要コンポーネント

1. **useErrorHandler Hook** (`src/hooks/useErrorHandler.ts`)
   - 全てのエラーハンドリングを集約
   - エラーメッセージのサニタイゼーション
   - 技術的詳細の隠蔽（セキュリティ向上）
   - 統一されたトースト表示

2. **ErrorToast Component** (`src/components/ErrorToast.tsx`)
   - 統一されたエラー表示 UI
   - `alert()` の完全置き換え
   - アクセシビリティ対応

3. **共通定数** (`src/shared/constants/app.ts`)
   - エラーメッセージテンプレート
   - 成功メッセージテンプレート
   - バリデーションメッセージ

### エラーサニタイゼーション機能

#### Supabase エラーコード対応

| エラーコード | ユーザー向けメッセージ |
|-------------|------------------------|
| `invalid_credentials` | メールアドレスまたはパスワードが間違っています |
| `email_not_confirmed` | メールアドレスまたはパスワードが間違っています |
| `signup_disabled` | 現在、新規登録を一時停止しています |
| `weak_password` | パスワードが弱すぎます。より複雑なパスワードを設定してください |
| `too_many_requests` | アクセス回数が上限に達しました。しばらく時間をおいてから再試行してください |
| `23505` | この情報は既に登録されています |
| `PGRST301` | 権限がありません |

#### パターンマッチング機能

システムは以下のパターンで機密情報を含むエラーメッセージを検出・変換します：

- **データベース関連**: `duplicate key`, `unique constraint`, `permission denied` など
- **認証関連**: `invalid password`, `session expired`, `token expired` など
- **ファイルアップロード関連**: `file too large`, `invalid file type` など
- **バリデーション関連**: `required field`, `invalid format` など

### セキュリティ考慮事項

1. **技術的詳細の隠蔽**: データベースエラー、スタックトレース情報の漏洩防止
2. **HTMLタグ除去**: XSS攻撃防止のためのメッセージサニタイゼーション
3. **開発環境での詳細ログ**: 開発時のみ詳細なエラー情報をコンソール出力

### メッセージ表示設定

| メッセージ種別 | 表示時間 | 色・スタイル |
|---------------|----------|-------------|
| Success | 3秒 | 緑色背景 |
| Warning | 4秒 | 黄色背景 |
| Error | 5秒 | 赤色背景 |
| Info | 3秒 | 青色背景 |

---

## 更新履歴

| 日付 | バージョン | 変更内容 |
|------|------------|----------|
| 2025-08-31 | v1.0 | 初回作成 - 全メッセージ網羅調査完了 |
| 2025-08-31 | v1.1 | 英語エラーメッセージを日本語に統一（40個のメッセージを更新） |

---

## メンテナンス指針

### 新しいメッセージを追加する際の注意点

1. **一貫性の保持**: 既存メッセージの口調・表現に合わせる
2. **セキュリティ**: 技術的詳細を含めない
3. **ユーザビリティ**: ユーザーが次に取るべきアクションを明確にする
4. **国際化対応**: 将来的な多言語対応を考慮した設計

### 推奨される更新プロセス

1. 新しいメッセージは `src/shared/constants/app.ts` に定数として定義
2. `useErrorHandler` フックを使用してエラーハンドリング
3. このドキュメントの更新
4. テストケースの追加・更新

---

*このドキュメントは Journey アプリケーションの開発・保守において、メッセージの一貫性とユーザー体験の向上を目的として作成されました。*