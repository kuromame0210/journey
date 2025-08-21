# 重複コード共通化 移行プラン

## 概要

このドキュメントでは、Jurnyアプリケーション内で特定された重複コードを共通化するための段階的移行プランを詳述します。

## 移行戦略

### フェーズ 1: 基盤整備（完了済み）
- ✅ 共通型定義の作成
- ✅ 定数・設定値の統一
- ✅ 共通API関数の作成
- ✅ バリデーション・フォームフック の作成

### フェーズ 2: 段階的移行
各ページ/コンポーネントを個別に移行し、一つずつテスト・検証を行います。

## 詳細移行計画

### 2.1 認証関連の移行

**対象ファイル:** `src/app/auth/page.tsx`

**移行手順:**
1. `useAuth` フックのインポート
2. 既存の認証チェックロジックを `useAuth` に置換
3. バリデーション関数を `validateAuthForm` に置換
4. フォーム管理を `useForm` に置換

**移行コード例:**
```typescript
// 移行前
const [user, setUser] = useState<User | null>(null);
const [isLoading, setIsLoading] = useState(true);

const checkAuth = async () => {
  // 既存のロジック...
};

// 移行後
// 共通化された認証フックを使用
import { useAuth } from '@/shared/hooks/useAuth';
import { validateAuthForm } from '@/shared/utils/validation';

const { user, isAuthenticated, isLoading, checkAuth } = useAuth({
  requireAuth: false // 認証ページなので認証不要
});
```

**リスク評価:**
- **低リスク**: 認証ロジックは既に安定している
- **検証項目**: ログイン・サインアップ・パスワードリセット機能

### 2.2 プロフィール関連の移行

**対象ファイル:** 
- `src/app/profile/page.tsx`
- `src/app/profile/edit/page.tsx`

**移行手順:**
1. API関数を `profiles.ts` からインポート
2. 認証チェックを `useAuth` に置換
3. プロフィール取得ロジックを共通関数に置換
4. フォーム管理を `useForm` + バリデーションに置換

**移行コード例:**
```typescript
// 移行前
const fetchProfile = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  // 重複していたロジック...
};

// 移行後
import { fetchProfile, fetchProfileStats } from '@/shared/services/api/profiles';
import { useAuth } from '@/shared/hooks/useAuth';
import { useForm } from '@/shared/hooks/useForm';
import { validateProfileForm } from '@/shared/utils/validation';

// 共通化された認証・API・フォーム管理を使用
const { user, isAuthenticated } = useAuth();
const form = useForm({
  initialData: profileData,
  validate: validateProfileForm,
  onSubmit: handleSubmit
});
```

**リスク評価:**
- **中リスク**: フォーム状態管理の変更が大きい
- **検証項目**: プロフィール表示・編集・統計表示機能

### 2.3 場所関連の移行

**対象ファイル:**
- `src/app/home/page.tsx`
- `src/app/place/[id]/page.tsx`
- `src/app/place/create/page.tsx`

**移行手順:**
1. API関数を `places.ts` からインポート
2. 場所データ取得を共通関数に置換
3. 画像アップロード付きフォーム管理に移行
4. バリデーションを統一関数に置換

**移行コード例:**
```typescript
// 移行前
const fetchPlaces = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  // 重複していたロジック...
};

// 移行後
import { fetchPlacesList, createPlace } from '@/shared/services/api/places';
import { useFormWithImages } from '@/shared/hooks/useForm';
import { validatePlaceForm } from '@/shared/utils/validation';

// 共通化された機能を使用
const form = useFormWithImages({
  initialData: placeData,
  validate: validatePlaceForm,
  onSubmit: handleSubmit
}, 5); // 最大5枚の画像
```

**リスク評価:**
- **高リスク**: 画像アップロード機能が複雑
- **検証項目**: 場所一覧表示・詳細表示・作成機能・画像アップロード

### 2.4 チャット関連の移行

**対象ファイル:**
- `src/app/chat/page.tsx`
- `src/app/chat/[id]/page.tsx`

**移行手順:**
1. API関数を `chat.ts` からインポート
2. チャット関連データ取得を共通関数に置換
3. リアルタイム機能との統合確認

**移行コード例:**
```typescript
// 移行前
const fetchChatRooms = async () => {
  // 複雑なJOINクエリロジック...
};

// 移行後
import { fetchChatRoomsList, fetchMessages, sendMessage } from '@/shared/services/api/chat';

// 共通化されたAPI関数を使用
const chatRooms = await fetchChatRoomsList(userId);
```

**リスク評価:**
- **中リスク**: リアルタイム機能との統合が必要
- **検証項目**: チャットルーム一覧・メッセージ送受信・リアルタイム更新

## 移行時の注意事項とコメント戦略

### コメント記載方針
移行時には必ず以下の形式でコメントを残します：

```typescript
/**
 * 共通化対応: 元の実装から shared/services/api/profiles.ts の fetchProfile に移行
 * 移行日: 2025-01-XX
 * 移行理由: 重複していた認証チェック + プロフィール取得ロジックを統一
 */
import { fetchProfile } from '@/shared/services/api/profiles';
```

### 段階的テスト戦略

**各移行後の検証項目:**
1. 基本機能テスト
2. エラーハンドリングテスト
3. ローディング状態の確認
4. レスポンシブ表示の確認
5. 既存データとの互換性確認

**テストコマンド例:**
```bash
# 型チェック
npm run typecheck

# Linting
npm run lint

# テスト実行（実装されている場合）
npm run test

# ビルドテスト
npm run build
```

## 詳細リスク分析

### 高リスク項目

**1. 画像アップロード機能**
- **リスク**: ファイル管理とプレビュー機能の複雑性
- **対策**: 移行前後でアップロード機能の詳細テスト
- **ロールバック**: 元のコンポーネント単位での個別実装に戻す

**2. リアルタイム機能（チャット）**
- **リスク**: Supabase Realtime との統合
- **対策**: WebSocket接続とイベントハンドリングの確認
- **ロールバック**: 既存のSubscription管理ロジックを保持

**3. 認証フロー**
- **リスク**: ユーザーセッション管理の変更
- **対策**: 全認証関連画面での動作確認
- **ロールバック**: 個別の認証チェック関数に戻す

### 中リスク項目

**1. フォーム状態管理**
- **リスク**: useForm フックの状態管理が既存と異なる
- **対策**: 各フォームでのバリデーション・送信処理確認
- **ロールバック**: 個別のuseState管理に戻す

**2. API エラーハンドリング**
- **リスク**: 共通化したエラーハンドリングが既存UIと合わない
- **対策**: エラー表示とユーザーフィードバックの確認
- **ロールバック**: 個別のtry-catch処理に戻す

### 低リスク項目

**1. 型定義の統一**
- **リスク**: TypeScript コンパイルエラー
- **対策**: tsc --noEmit での型チェック
- **ロールバック**: インライン型定義に戻す

**2. 定数の統一**
- **リスク**: 設定値の不整合
- **対策**: 各機能での定数値確認
- **ロールバック**: ハードコーディング値に戻す

## ロールバック戦略

### Git ベースのロールバック
各移行をコミット単位で実行し、問題がある場合は即座にrevertできるようにします。

```bash
# コミット単位での移行
git add src/app/auth/page.tsx
git commit -m "migrate: auth page to shared hooks and validation"

# 問題がある場合の即座のロールバック
git revert HEAD
```

### 段階的ロールバック
共通モジュール単位でのロールバックが可能な設計にします。

```typescript
// 緊急時は個別実装に一時的に戻せるような設計
// import { useAuth } from '@/shared/hooks/useAuth';  // 共通版
import { useLocalAuth } from './local-auth';  // 個別実装（バックアップ）
```

## パフォーマンス考慮事項

### バンドルサイズ
- 共通モジュールの tree shaking 対応
- 未使用関数のインポート削除

### 実行時パフォーマンス
- API呼び出しの最適化確認
- 無駄な re-render の防止確認

### メモリ使用量
- フック内のメモ化確認
- イベントリスナーのクリーンアップ確認

## 成功指標

### 技術指標
- [ ] 重複コード行数の削減: 推定 800+ 行削減
- [ ] TypeScript エラーゼロ
- [ ] ESLint警告ゼロ
- [ ] ビルド成功率 100%

### 機能指標
- [ ] 全ページの基本機能動作確認
- [ ] 認証フローの完全動作確認
- [ ] データ CRUD 操作の確認
- [ ] リアルタイム機能の確認

### 保守性指標
- [ ] 新規開発者のコード理解しやすさ向上
- [ ] バグ修正時の影響範囲の明確化
- [ ] 機能追加時の再利用性向上

## 移行完了後の継続的改善

### コードレビュー基準の更新
- 重複コード検出の自動化
- 共通モジュール使用の強制

### ドキュメント整備
- 共通モジュールの使用ガイド
- トラブルシューティングガイド

### 定期的なリファクタリング
- 共通モジュールの利用状況監視
- 新たな重複パターンの早期発見

---

**移行実施責任者:** Claude Code  
**レビュー必要項目:** 全機能テスト、パフォーマンステスト  
**緊急連絡先:** 開発チーム  
**予定完了日:** 移行開始から1週間以内