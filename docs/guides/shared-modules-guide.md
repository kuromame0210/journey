# 共通モジュール使用ガイド

## 概要

このガイドでは、Jurnyアプリケーションで重複コードを共通化するために作成された共通モジュールの使用方法を説明します。

## ディレクトリ構成

```
src/shared/
├── constants/          # 定数・設定値
│   ├── options.ts      # 選択肢データ（予算、MBTI等）
│   ├── tags.ts         # タグ関連の定数と関数
│   └── app.ts          # アプリケーション全体の設定
├── types/              # 型定義
│   ├── database.ts     # データベース関連の型
│   ├── auth.ts         # 認証関連の型
│   └── ui.ts           # UI関連の型
├── hooks/              # カスタムフック
│   ├── useAuth.ts      # 認証管理フック
│   └── useForm.ts      # フォーム管理フック
├── services/           # API関連の処理
│   └── api/
│       ├── profiles.ts # プロフィールAPI
│       ├── places.ts   # 場所API
│       └── chat.ts     # チャットAPI
└── utils/              # ユーティリティ関数
    └── validation.ts   # バリデーション関数
```

## 使用方法

### 1. 認証管理（useAuth）

**目的**: 各ページで重複していた認証チェックロジックを統一

**元の重複実装箇所**:
- `src/app/chat/page.tsx:35-47`
- `src/app/place/[id]/page.tsx:66-76`
- `src/app/profile/edit/page.tsx:98-118`
- など6箇所

**使用例**:
```typescript
// 移行前（重複していたパターン）
const [user, setUser] = useState<User | null>(null);
const [isLoading, setIsLoading] = useState(true);

const checkAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    router.push('/auth');
    return;
  }
  setUser(session.user);
  setIsLoading(false);
};

useEffect(() => {
  checkAuth();
}, []);

// 移行後（共通化されたフック使用）
import { useAuth } from '@/shared/hooks/useAuth';

const { user, isAuthenticated, isLoading } = useAuth({
  requireAuth: true,
  redirectTo: '/auth'
});

// 共通化により認証状態は自動管理される
```

**コメント記載例**:
```typescript
/**
 * 共通化対応: 重複していた認証チェックロジックを useAuth フックに統一
 * 元の実装: src/app/profile/edit/page.tsx:98-118 の checkAuth 関数
 * 移行日: 2025-01-XX
 * 共通化により約15行のコード削減、認証エラーハンドリングも統一
 */
import { useAuth } from '@/shared/hooks/useAuth';
```

### 2. API呼び出し（services/api）

**目的**: データベース操作の重複ロジックを統一

**プロフィール関連API例**:
```typescript
// 移行前（重複していたパターン）
const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
};

// 移行後（共通関数使用）
import { fetchProfile } from '@/shared/services/api/profiles';

/**
 * 共通化対応: プロフィール取得ロジックを統一API関数に移行
 * 元の実装: src/app/profile/page.tsx:61-75 の fetchProfile 関数
 * 共通化により約18行のコード削減、エラーハンドリングも統一
 */
const profile = await fetchProfile(userId);
```

**場所関連API例**:
```typescript
// 移行前（ホーム画面での重複実装）
const fetchPlaces = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];
  
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .neq('owner', session.user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  
  return data || [];
};

// 移行後（共通関数使用）
import { fetchPlacesList } from '@/shared/services/api/places';

/**
 * 共通化対応: 場所一覧取得ロジックを統一API関数に移行
 * 元の実装: src/app/home/page.tsx:53-91 の fetchPlaces 関数
 * 共通化により約25行のコード削減、認証チェック込みで安全性向上
 */
const places = await fetchPlacesList(user?.id, 50);
```

### 3. フォーム管理（useForm）

**目的**: フォーム状態管理とバリデーションの重複を統一

**基本的なフォーム使用例**:
```typescript
// 移行前（重複していたパターン）
const [formData, setFormData] = useState({
  name: '',
  email: '',
  // ...
});
const [errors, setErrors] = useState({});
const [isLoading, setIsLoading] = useState(false);

const handleInputChange = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  if (errors[field]) {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }
};

const validateForm = () => {
  const newErrors = {};
  // バリデーションロジック...
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// 移行後（共通フック使用）
import { useForm } from '@/shared/hooks/useForm';
import { validateProfileForm } from '@/shared/utils/validation';

/**
 * 共通化対応: フォーム状態管理を useForm フックに統一
 * 元の実装: src/app/profile/edit/page.tsx:79-170 のフォーム管理ロジック
 * 共通化により約45行のコード削減、バリデーション統一により安全性向上
 */
const form = useForm({
  initialData: profileData,
  validate: validateProfileForm,
  onSubmit: handleSave
});

// フォーム操作は統一された関数で実行
form.updateField('name', value);
const isValid = form.validateForm();
await form.submit();
```

**画像アップロード付きフォーム例**:
```typescript
// 移行前（場所作成での重複実装）
const [images, setImages] = useState<File[]>([]);
const [imagePreviews, setImagePreviews] = useState<string[]>([]);
const [formData, setFormData] = useState(/* ... */);

const handleImageAdd = (files: File[]) => {
  // 画像管理ロジック...
};

// 移行後（共通フック使用）
import { useFormWithImages } from '@/shared/hooks/useForm';

/**
 * 共通化対応: 画像アップロード付きフォーム管理を統一フックに移行
 * 元の実装: src/app/place/create/page.tsx:46-119 のフォーム・画像管理ロジック
 * 共通化により約60行のコード削減、画像プレビュー機能も統一
 */
const form = useFormWithImages({
  initialData: placeData,
  validate: validatePlaceForm,
  onSubmit: handleCreate
}, 5); // 最大5枚

// 画像操作は統一された関数で実行
form.addImages(files);
form.removeImage(index);
```

### 4. バリデーション（validation.ts）

**目的**: 各ページで重複していたバリデーションロジックを統一

**使用例**:
```typescript
// 移行前（重複していたバリデーション）
const validateForm = () => {
  const errors: any = {};
  
  if (!formData.name || formData.name.trim().length === 0) {
    errors.name = 'お名前は必須です';
  }
  if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = '有効なメールアドレスを入力してください';
  }
  // ...
  return { isValid: Object.keys(errors).length === 0, errors };
};

// 移行後（共通バリデーション使用）
import { validateProfileForm } from '@/shared/utils/validation';

/**
 * 共通化対応: バリデーションロジックを統一関数に移行
 * 元の実装: src/app/profile/edit/page.tsx:179-224 の validateForm 関数
 * 共通化により約30行のコード削減、バリデーション精度も向上
 */
const result = validateProfileForm(formData);
```

### 5. 定数・設定値（constants）

**目的**: ハードコーディングされた値や重複した定数を統一

**使用例**:
```typescript
// 移行前（各ページでハードコーディング）
const budgetOptions = [
  { id: 1, label: '低 (〜3万円)' },
  { id: 2, label: '中 (3〜10万円)' },
  { id: 3, label: '高 (10万円〜)' }
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// 移行後（共通定数使用）
import { BUDGET_OPTIONS } from '@/shared/constants/options';
import { IMAGE_UPLOAD } from '@/shared/constants/app';

/**
 * 共通化対応: 重複していた定数を統一定数ファイルに移行
 * 元の実装: 各ページで個別に定義されていた定数
 * 共通化により設定値の一元管理を実現、変更時の影響範囲を最小化
 */
const options = BUDGET_OPTIONS;
const maxSize = IMAGE_UPLOAD.MAX_FILE_SIZE;
```

## コメント戦略

### 必須コメントパターン

共通化移行時には以下の形式でコメントを**必ず**記載してください：

```typescript
/**
 * 共通化対応: [何を共通化したか]
 * 元の実装: [元のファイルパス:行番号] の [関数名/ロジック名]
 * 移行日: [実際の移行日]
 * [共通化により得られた効果]
 */
```

### 実際のコメント例

**認証関連**:
```typescript
/**
 * 共通化対応: 重複していた認証チェックロジックを useAuth フックに統一
 * 元の実装: src/app/chat/[id]/page.tsx:77-87 の checkAuth 関数
 * 移行日: 2025-01-15
 * 共通化により約12行のコード削減、認証エラーハンドリングも統一
 */
import { useAuth } from '@/shared/hooks/useAuth';
```

**API関連**:
```typescript
/**
 * 共通化対応: チャットルーム一覧取得の複雑なJOINクエリを統一API関数に移行
 * 元の実装: src/app/chat/page.tsx:52-142 の fetchChatRooms 関数
 * 移行日: 2025-01-15
 * 共通化により約65行のコード削減、パフォーマンスも最適化
 */
import { fetchChatRoomsList } from '@/shared/services/api/chat';
```

**バリデーション関連**:
```typescript
/**
 * 共通化対応: 場所作成フォームのバリデーション処理を統一関数に移行
 * 元の実装: src/app/place/create/page.tsx:120-165 の validateForm 関数
 * 移行日: 2025-01-15
 * 共通化により約35行のコード削減、エラーメッセージも統一
 */
import { validatePlaceForm } from '@/shared/utils/validation';
```

## トラブルシューティング

### よくある問題と解決方法

**1. 型エラーが発生する**
```typescript
// 問題: 古い型を使用している
interface OldPlace {
  // 古い定義...
}

// 解決: 統一された型を使用
import { Place } from '@/shared/types/database';

/**
 * 共通化対応: Place型定義を統一型に移行
 * 元の実装: src/app/home/page.tsx:11-22 の Place interface
 */
```

**2. バリデーションが動作しない**
```typescript
// 問題: 個別のバリデーション関数を使用
const isValid = validateLocalForm(data);

// 解決: 統一されたバリデーション関数を使用
import { validatePlaceForm } from '@/shared/utils/validation';

/**
 * 共通化対応: バリデーション関数を統一関数に移行
 * 元の実装: 個別実装のvalidateLocalForm関数
 */
const result = validatePlaceForm(data);
```

**3. API関数が見つからない**
```typescript
// 問題: 古いAPI関数を使用
import { fetchOldProfile } from './local-api';

// 解決: 統一されたAPI関数を使用
import { fetchProfile } from '@/shared/services/api/profiles';

/**
 * 共通化対応: プロフィール取得APIを統一関数に移行
 * 元の実装: ./local-api の fetchOldProfile関数
 */
```

## 移行チェックリスト

各ページ移行時には以下をチェックしてください：

### ✅ 移行前チェック
- [ ] 移行対象の重複コード箇所を特定
- [ ] 現在の動作を記録
- [ ] バックアップ用のブランチ作成

### ✅ 移行実装チェック
- [ ] 共通モジュールのインポート
- [ ] 古いコードの削除
- [ ] 必須コメントの記載
- [ ] 型エラーの解消

### ✅ 移行後チェック
- [ ] 基本機能の動作確認
- [ ] エラーハンドリングの動作確認
- [ ] TypeScript コンパイル成功
- [ ] ESLint 警告解消
- [ ] 意図しない副作用がないか確認

## パフォーマンス考慮事項

### Bundle Size最適化
```typescript
// 良い例: 必要な関数のみインポート
import { fetchProfile } from '@/shared/services/api/profiles';

// 悪い例: すべてをインポート
import * as ProfileAPI from '@/shared/services/api/profiles';
```

### Re-render最適化
```typescript
// useAuthフックは内部でuseMemoを使用してre-renderを最適化
const { user, isAuthenticated } = useAuth();

// useFormフックもuseCallbackで最適化済み
const form = useForm({ /* options */ });
```

## 今後の開発指針

### 新機能開発時の注意事項
1. **重複チェック**: 似たような機能を実装する前に、既存の共通モジュールを確認
2. **共通化検討**: 2回目の類似実装時には共通化を検討
3. **コメント必須**: 共通モジュールを使用する際は必ずコメント記載

### コードレビューポイント
1. 共通モジュールの適切な使用
2. 重複コードの早期発見
3. コメント記載の確認
4. 型安全性の確認

---

**このガイドの更新責任者**: 開発チーム  
**最終更新日**: 2025-01-XX  
**次回見直し予定**: 3ヶ月後