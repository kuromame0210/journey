# 残存する重複コードの詳細状況

## 📊 完了 vs 未完了の現状

### ✅ Phase 1完了項目（110行削減）
- **型定義統一**: 5ファイル完了
- **Loading UI統一**: 5ファイル完了

### 🚨 **未完了の重複コード（推定800+行）**

## 1. 認証処理の重複（最重要・未完了）

**対象**: **6ファイルで全く同じ認証チェック**

**重複箇所**:
- `src/app/chat/page.tsx:34-48`
- `src/app/chat/[id]/page.tsx:76-85` 
- `src/app/place/create/page.tsx:63-73`
- `src/app/profile/page.tsx:45-58`
- `src/app/place/[id]/page.tsx:65-75`
- `src/app/profile/edit/page.tsx:97-110`

**重複コード例**:
```typescript
// これと同じコードが6箇所に存在
useEffect(() => {
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
      return
    }
    setUser(session.user)
    setIsLoading(false)
  }
  checkAuth()
}, [router])
```

**削減予定**: 約90行（6ファイル × 15行）

**共通モジュール**: ✅ `src/shared/hooks/useAuth.ts` **作成済み・未使用**

---

## 2. API関数の重複（超高優先・未完了）

**対象**: **10ファイル以上で類似したSupabaseクエリ**

### プロフィール関連API（3箇所で重複）
```typescript
// 重複パターン例
const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  // エラーハンドリングとログ出力...
}
```

**削減予定**: 約180行

**共通モジュール**: ✅ `src/shared/services/api/profiles.ts` **作成済み・未使用**

### 場所関連API（4箇所で重複）
```typescript
// 重複パターン例  
const fetchPlaces = async () => {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .neq('owner', userId)
    // ... 
}
```

**削減予定**: 約200行

**共通モジュール**: ✅ `src/shared/services/api/places.ts` **作成済み・未使用**

### チャット関連API（5箇所で重複）
```typescript
// 重複パターン例
const fetchChatRooms = async () => {
  // 複雑なJOINクエリ...
}
```

**削減予定**: 約250行

**共通モジュール**: ✅ `src/shared/services/api/chat.ts` **作成済み・未使用**

---

## 3. 日付フォーマット関数の重複（高優先・未完了）

**対象**: **5ファイルで類似した日付処理**

**重複箇所**:
- `src/app/chat/page.tsx:75-91` - 相対時間フォーマット
- `src/app/chat/[id]/page.tsx:128-139` - 日付フォーマット
- `src/app/home/page.tsx:205-206` - 直接日付フォーマット
- `src/app/place/[id]/page.tsx:195-196` - 直接日付フォーマット
- `src/app/chat/[id]/page.tsx:189-190` - 直接日付フォーマット

**重複コード例**:
```typescript
// パターン1: 相対時間表示
const formatTime = (timestamp) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
  // ...
};

// パターン2: 日付範囲表示
📅 {new Date(date_start).toLocaleDateString('ja-JP')}
{date_end && ` ～ ${new Date(date_end).toLocaleDateString('ja-JP')}`}
```

**削減予定**: 約40行

**共通モジュール**: ✅ `src/shared/utils/date.ts` **作成済み・未使用**

---

## 4. フォームハンドラーの重複（中優先・未完了）

**対象**: **2ファイルで同じフォーム操作関数**

**重複箇所**:
- `src/app/place/create/page.tsx:76-87`
- `src/app/profile/edit/page.tsx:166-178`

**重複コード例**:
```typescript
// 完全に同一の関数が2箇所に存在
const handleInputChange = (field: string, value: string | number | number[]) => {
  setFormData(prev => ({ ...prev, [field]: value }))
}

const handleTagToggle = (field: 'purpose_tags' | 'demand_tags', tagId: number) => {
  setFormData(prev => ({
    ...prev,
    [field]: prev[field].includes(tagId)
      ? prev[field].filter(id => id !== tagId)
      : [...prev[field], tagId]
  }))
}
```

**削減予定**: 約30行

**共通モジュール**: ✅ `src/shared/hooks/useFormHandlers.ts` **作成済み・未使用**

---

## 5. リアクション処理の重複（中優先・未完了）

**対象**: **2ファイルで類似したリアクション処理**

**重複箇所**:
- `src/app/home/page.tsx:148-175`
- `src/app/place/[id]/page.tsx:138-188`

**削減予定**: 約40行

**共通モジュール**: ✅ `src/shared/services/api/reactions.ts` **作成済み・未使用**

---

## 📊 **残存重複コードサマリー**

| カテゴリ | 対象ファイル数 | 削減予定行数 | 共通モジュール状態 |
|----------|----------------|--------------|-------------------|
| 認証処理 | 6ファイル | 90行 | ✅作成済み・未使用 |
| プロフィールAPI | 3ファイル | 180行 | ✅作成済み・未使用 |
| 場所API | 4ファイル | 200行 | ✅作成済み・未使用 |
| チャットAPI | 5ファイル | 250行 | ✅作成済み・未使用 |
| 日付フォーマット | 5ファイル | 40行 | ✅作成済み・未使用 |
| フォームハンドラー | 2ファイル | 30行 | ✅作成済み・未使用 |
| リアクション処理 | 2ファイル | 40行 | ✅作成済み・未使用 |

**合計**: **約830行の重複コード残存**

## 🚨 **重要な状況**

### 問題: 共通モジュールは完成済みだが未使用

**すべての共通化モジュールは作成完了済み**ですが、**実際の各ファイルではまだ個別実装を使用中**です。

### 必要な作業: 実際の置換作業

Phase 1のように、各ファイルで：
1. 共通モジュールのインポート追加
2. 個別実装コードの削除
3. 共通モジュール呼び出しに置換
4. 詳細コメントの記載

## 🎯 **結論**

**Phase 1完了**: 110行削減  
**残存作業**: 830行の重複コード削減が可能

**全体進捗率**: 約12%完了（110行/940行）

**残りの88%の重複コード削減**により、ユーザーの要求「すべての重複コードを共通化」が完全に実現されます。