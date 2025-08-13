# 重複コード共通化アーキテクチャ設計書

## 1. 推奨ディレクトリ構造

```
src/
├── shared/                          # 共通機能ディレクトリ
│   ├── types/                       # 型定義の統一
│   │   ├── index.ts                 # 全型のエクスポート
│   │   ├── database.ts              # DB関連型（Place, Profile等）
│   │   ├── ui.ts                    # UI関連型（Toast, Form等）
│   │   └── auth.ts                  # 認証関連型
│   ├── constants/                   # 定数・設定値
│   │   ├── index.ts                 # 全定数のエクスポート
│   │   ├── tags.ts                  # タグ関連定数
│   │   ├── options.ts               # 選択肢定数（budget等）
│   │   └── validation.ts            # バリデーション定数
│   ├── hooks/                       # 共通カスタムフック
│   │   ├── useAuth.ts               # 認証管理
│   │   ├── useApi.ts                # API呼び出し管理
│   │   ├── useValidation.ts         # バリデーション処理
│   │   └── useCommon.ts             # 汎用ロジック
│   ├── services/                    # ビジネスロジック層
│   │   ├── api/                     # API呼び出し関数
│   │   │   ├── profiles.ts          # プロフィール関連API
│   │   │   ├── places.ts            # 場所関連API
│   │   │   ├── reactions.ts         # リアクション関連API
│   │   │   └── auth.ts              # 認証関連API
│   │   ├── validation/              # バリデーション関数
│   │   │   ├── auth.ts              # 認証バリデーション
│   │   │   ├── file.ts              # ファイルバリデーション
│   │   │   └── form.ts              # フォームバリデーション
│   │   └── utils/                   # ユーティリティ関数
│   │       ├── date.ts              # 日付処理
│   │       ├── format.ts            # データフォーマット
│   │       └── storage.ts           # ストレージ関連
│   └── components/                  # 共通UIコンポーネント
│       └── (既存のErrorToast等)
```

## 2. コメント戦略と規約

### 2.1 共通化元の明示コメント

**パターンA: 完全に共通化された場合**
```typescript
// 共通化: この関数は shared/services/api/profiles.ts の fetchProfile() を使用
// 元の実装: src/app/profile/page.tsx:61-67, src/app/profile/edit/page.tsx:121-127
const profile = await fetchProfile(userId);
```

**パターンB: 共通ロジック + 個別処理の場合**
```typescript
// 共通化: 認証チェック部分を shared/hooks/useAuth.ts の useAuthGuard() で統一
// 元の実装: 各ページの checkAuth 関数パターンを共通化
// カスタム処理: このページ固有のデータ取得処理は維持
const { user, isAuthenticated } = useAuthGuard();
if (isAuthenticated) {
  // ページ固有の処理
}
```

**パターンC: 定数の共通化**
```typescript
import { BUDGET_OPTIONS } from '@/shared/constants/options';

// 共通化: 予算選択肢を shared/constants/options.ts に統一
// 元の実装: src/app/profile/edit/page.tsx:12-16, src/app/place/create/page.tsx:12-16
const budgetOptions = BUDGET_OPTIONS;
```

### 2.2 共通ファイルでのコメント規約

**API関数のコメント例:**
```typescript
/**
 * プロフィール情報を取得する共通関数
 * 
 * 共通化の経緯:
 * - src/app/profile/page.tsx:61-67 の fetchProfile 関数
 * - src/app/profile/edit/page.tsx:121-127 の fetchProfile 関数
 * - 両方とも同じクエリパターンだったため統一
 * 
 * @param userId - 取得対象のユーザーID
 * @returns Profile情報またはnull
 * @throws データベースエラーの場合は例外をスロー
 */
export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  // 元々の実装: supabase.from('profiles').select('*').eq('id', userId).single()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Profile fetch error:', error);
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return data;
};
```

### 2.3 型定義のコメント規約

```typescript
/**
 * Place型の統一定義
 * 
 * 共通化の経緯:
 * - src/app/home/page.tsx:11-22 (基本版)
 * - src/app/place/[id]/page.tsx:12-23 (拡張版)
 * - src/app/profile/page.tsx:23-30 (最小版)
 * 
 * 設計方針:
 * - 基本型をベースに、用途に応じて Pick/Omit を使用
 * - データベースの places テーブルと完全同期
 */
export interface Place {
  // 基本情報 - 全ての画面で使用
  id: string;
  title: string;
  images: string[];
  genre: string;
  
  // 詳細情報 - 詳細画面・作成画面で使用  
  purpose_tags: number[];
  demand_tags: number[];
  budget_option: number;
  // ... 他のフィールド
}

// 用途別の型定義
export type PlaceCard = Pick<Place, 'id' | 'title' | 'images' | 'genre'>;          // カード表示用
export type PlaceDetail = Place;                                                    // 詳細表示用  
export type PlaceList = Pick<Place, 'id' | 'title' | 'images' | 'genre' | 'created_at'>; // リスト表示用
```

## 3. 段階的移行戦略

### Phase 1: 低リスク共通化 (Week 1-2)
1. **定数の統一**
   - BUDGET_OPTIONS, PURPOSE_TAGS, DEMAND_TAGS
   - MBTI_TYPES, VALIDATION_RULES

2. **型定義の統一**  
   - Place, Profile, ChatRoom, Message等の基本型

### Phase 2: 中リスク共通化 (Week 3-4)
1. **認証関連の統一**
   - useAuthGuard フック作成
   - 認証チェックパターンの統一

2. **基本的なAPI関数**
   - fetchProfile, fetchPlace等の単純なデータ取得

### Phase 3: 高リスク共通化 (Week 5-6)
1. **複雑なビジネスロジック**
   - リアクション処理（エラーハンドリング戦略の統一）
   - フォームバリデーション（エラーメッセージの調整）

2. **パフォーマンス最適化**
   - データキャッシュ戦略
   - 共通フックの最適化

## 4. 品質保証戦略

### 4.1 移行チェックリスト
- [ ] 元のコメントが適切に記載されている
- [ ] 型安全性が保たれている  
- [ ] エラーハンドリングが統一されている
- [ ] 既存機能に影響がない
- [ ] パフォーマンスが低下していない

### 4.2 テスト戦略
```typescript
// 共通化前後の動作確認テスト例
describe('Profile API Migration', () => {
  test('fetchProfile returns same result as old implementation', async () => {
    // 旧実装の結果
    const oldResult = await oldFetchProfile(userId);
    
    // 新実装の結果
    const newResult = await fetchProfile(userId);
    
    expect(newResult).toEqual(oldResult);
  });
});
```

## 5. ドキュメント管理

### 5.1 共通化追跡表
| 機能 | 元の場所 | 新しい場所 | 移行日 | 影響範囲 | 備考 |
|------|----------|-----------|--------|----------|------|
| BUDGET_OPTIONS | profile/edit, place/create | shared/constants/options | 2024-XX-XX | 2ファイル | 完全一致 |
| fetchProfile | profile/page, profile/edit | shared/services/api/profiles | 2024-XX-XX | 2ファイル | エラーハンドリング統一 |

### 5.2 破壊的変更の管理
```typescript
// BREAKING CHANGES ログ
/**
 * [2024-XX-XX] BREAKING: Place型の統一
 * 
 * 変更内容:
 * - src/app/home/page.tsx の Place型を統一型に変更
 * - owner フィールドを追加（nullable）
 * 
 * 影響:
 * - 既存のPlace型を使用している全てのコンポーネント
 * - TypeScriptのコンパイルエラーが発生する可能性
 * 
 * 移行方法:
 * - PlaceCard 型を使用していた箇所は引き続き使用可能
 * - 新しいフィールドアクセス時はnullチェックが必要
 */
```

この設計により、段階的かつ安全に重複コードを共通化し、将来の保守性を大幅に向上させることができます。