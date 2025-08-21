# 共通化コメント戦略ガイド

## 🎯 **コメント戦略の目的**

ユーザーの要求：**「呼び出し元の記載を必ずコメントで付近に残すようにしてほしい。理由は後から見たときに、共通化されているんだっていうのがわかりやすくするためです。」**

この要求に完全対応するため、以下の情報を必ずコメントに含めます：

1. **共通化元の具体的な場所**（ファイルパス：行番号）
2. **どのような関数・機能として共通化したか**
3. **共通化による効果・理由**
4. **移行日時**
5. **後方互換性の配慮**

---

## 📝 **コメントテンプレートと具体例**

### **テンプレート1: 設定・定数配列の共通化**

```typescript
/**
 * 共通化対応: [データ名]を統一定数に移行
 * 
 * 共通化元:
 * - src/app/profile/edit/page.tsx:20-24 の budgetOptions 配列定義
 * - src/app/place/create/page.tsx:20-24 の budgetOptions 配列定義
 * 
 * 共通化方法:
 * - 共通定数: src/shared/constants/options.ts の BUDGET_OPTIONS として統一
 * - 呼び出し方法: import + 型エイリアスによる後方互換性保持
 * 
 * 共通化効果:
 * - 重複削減: 8行削除（各ファイル4行×2箇所）
 * - データ一貫性: 予算オプションの統一管理
 * - 保守性向上: 1箇所修正で全体に反映
 * 
 * 移行日: 2025-01-08
 * 移行者: Claude Code (重複コード統一プロジェクト)
 */
import { BUDGET_OPTIONS } from '@/shared/constants/options'

// 後方互換性のための型エイリアス
// 元の実装: const budgetOptions = [{ id: 1, label: '低 (〜3万円)' }, ...]
const budgetOptions = BUDGET_OPTIONS
```

### **テンプレート2: 状態管理フックの共通化**

```typescript
/**
 * 共通化対応: ページ基本状態管理を統一カスタムフックに移行
 * 
 * 共通化元の重複パターン:
 * - src/app/chat/page.tsx:46-47
 *   └── const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
 *   └── const [isLoading, setIsLoading] = useState(true)
 * - src/app/profile/page.tsx:30,34
 *   └── const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
 *   └── const [isLoading, setIsLoading] = useState(true)
 * - src/app/place/[id]/page.tsx (類似パターン)
 * - 他3ファイルで同様のuseStateパターンが重複
 * 
 * 共通化方法:
 * - 統一フック: src/shared/hooks/useBasePageState.ts
 * - 機能: user, isLoading, error の基本状態管理を提供
 * - 型安全性: BaseUser インターface による型統一
 * 
 * 共通化効果:
 * - 重複削減: 12行削除（各ファイル2行×6箇所）
 * - 状態管理一貫性: 全ページで統一された状態管理パターン
 * - 型安全性向上: BaseUser型による統一
 * - 保守性向上: 状態管理ロジックの単一箇所管理
 * 
 * 使用方法:
 * - import { useBasePageState } from '@/shared/hooks/useBasePageState'
 * - const { user, setUser, isLoading, setIsLoading } = useBasePageState()
 * 
 * 移行日: 2025-01-08
 * 移行者: Claude Code (重複コード統一プロジェクト)
 */
import { useBasePageState } from '@/shared/hooks/useBasePageState'

export default function ChatListPage() {
  const router = useRouter()
  
  // 統一された基本状態管理（元の個別useState実装を置換）
  const { user, setUser, isLoading, setIsLoading, error, setError } = useBasePageState()
  
  // ページ固有の状態はそのまま維持
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  
  // ... 以下既存ロジック
}
```

### **テンプレート3: UIコンポーネントの共通化**

```typescript
/**
 * 共通化対応: プライマリボタンを統一UIコンポーネントに移行
 * 
 * 共通化元の重複classNameパターン:
 * - src/app/auth/page.tsx:252
 *   └── "w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
 * - src/app/auth/reset-password/page.tsx:146
 *   └── [同一のclassName文字列 140文字]
 * - src/app/place/create/page.tsx:441
 *   └── [同一のclassName文字列 140文字] 
 * - src/app/profile/edit/page.tsx:584
 *   └── [同一のclassName文字列 140文字]
 * - src/app/auth/page.tsx:335,355 (部分的に類似)
 * 
 * 共通化方法:
 * - 統一コンポーネント: src/shared/components/ui/Button.tsx
 * - バリアントシステム: class-variance-authority による variant/size/fullWidth 管理
 * - 機能統合: ローディング状態、無効状態、アクセシビリティ対応
 * 
 * 使用方法:
 * - <Button variant="primary" size="lg" fullWidth isLoading={loading}>送信</Button>
 * - 元の実装: <button className="[140文字の長いclassName]">送信</button>
 * 
 * 共通化効果:
 * - 重複削減: 560文字削除（140文字×4箇所）
 * - UI一貫性: デザインシステム確立
 * - アクセシビリティ: 統一されたフォーカス管理
 * - 保守性: 1箇所の修正で全ボタンスタイル更新
 * - 開発効率: 新規ページでの即座利用可能
 * 
 * バリアント設計:
 * - variant: primary(青), secondary(灰), outline(枠線), destructive(赤)
 * - size: sm, md, lg (元のpy-3 px-4はlgサイズに対応)
 * - fullWidth: true(w-full対応), false
 * 
 * 移行日: 2025-01-08
 * 移行者: Claude Code (重複コード統一プロジェクト)
 */
import { Button } from '@/shared/components/ui/Button'

// 元の長いclassName実装を1行の統一コンポーネントに置換
<Button 
  type="submit" 
  variant="primary"
  size="lg"
  fullWidth 
  isLoading={isLoading}
  disabled={!isFormValid}
>
  {isLogin ? 'ログイン' : '新規登録'}
</Button>
```

### **テンプレート4: API関数の共通化**

```typescript
/**
 * 共通化対応: プロフィール取得処理を統一APIサービスに移行
 * 
 * 共通化元の重複パターン:
 * - src/app/profile/page.tsx:58-78
 *   └── const fetchProfile = async (userId: string) => {
 *   └──   const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
 *   └──   [エラーハンドリングとsetProfile処理]
 * - src/app/profile/edit/page.tsx:127-147  
 *   └── [類似のfetchProfile関数、微妙に異なるエラーハンドリング]
 * - src/app/settings/page.tsx (類似パターン)
 * 
 * 共通化方法:
 * - 統一サービス: src/shared/services/ProfileService.ts
 * - 基底クラス: BaseService<Profile> による共通CRUD操作
 * - エラーハンドリング: 統一されたエラー処理とログ出力
 * - 型安全性: Profile型による戻り値保証
 * 
 * 使用方法:
 * - import { ProfileService } from '@/shared/services/ProfileService'
 * - const profile = await ProfileService.findById(userId)
 * - 元の実装: 個別のfetchProfile関数 (20行)
 * 
 * 共通化効果:
 * - 重複削減: 60行削除（各ファイル20行×3箇所）
 * - エラー処理統一: 一貫したエラーハンドリング
 * - 型安全性向上: Profile型の戻り値保証
 * - 保守性向上: API変更時の単一修正点
 * - テスタビリティ: サービス層でのモック化が容易
 * 
 * BaseServiceパターン:
 * - findById(id): 単一レコード取得
 * - findMany(filters): 複数レコード取得 
 * - create(data): 新規作成
 * - update(id, data): 更新
 * - delete(id): 削除
 * 
 * 移行日: 2025-01-08
 * 移行者: Claude Code (重複コード統一プロジェクト)
 */
import { ProfileService } from '@/shared/services/ProfileService'

export default function ProfilePage() {
  // ... 状態管理

  const fetchProfile = async (userId: string) => {
    try {
      setIsLoading(true)
      
      // 統一されたプロフィール取得サービス
      // 元の実装: 個別のSupabaseクエリとエラーハンドリング (20行)
      const profile = await ProfileService.findById(userId)
      
      if (profile) {
        setProfile(profile)
      } else {
        setError('プロフィールが見つかりません')
      }
    } catch (error) {
      // 統一されたエラーハンドリング
      console.error('Profile fetch error:', error)
      setError('プロフィールの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }
  
  // ... 以下既存ロジック
}
```

### **テンプレート5: 認証処理の共通化**

```typescript
/**
 * 共通化対応: 認証チェック処理を統一カスタムフックに移行
 * 
 * 共通化元の重複パターン (95%同一のuseEffectロジック):
 * - src/app/chat/page.tsx:49-63
 *   └── useEffect(() => {
 *   └──   const checkAuth = async () => {
 *   └──     const { data: { session } } = await supabase.auth.getSession()
 *   └──     if (!session) { router.push('/auth'); return }
 *   └──     setUser(session.user)
 *   └──     fetchChatRooms(session.user.id)  // ←ここだけページ固有
 *   └── }, [router])
 * 
 * - src/app/profile/page.tsx:42-56 [同様の15行パターン]
 * - src/app/place/[id]/page.tsx:73-85 [同様の13行パターン]
 * - src/app/place/create/page.tsx:71-82 [同様の12行パターン]
 * - src/app/profile/edit/page.tsx:106-118 [同様の13行パターン]
 * - src/app/settings/page.tsx:27-42 [同様の16行パターン]
 * 
 * 共通化方法:
 * - 統一フック: src/shared/hooks/useAuth.ts
 * - 機能: 認証状態管理、自動リダイレクト、コールバック実行
 * - オプション: requireAuth, redirectTo, onAuthSuccess, onAuthFailure
 * 
 * 使用方法:
 * - const { user, isAuthenticated, isLoading } = useAuth({
 *     requireAuth: true,
 *     redirectTo: '/auth',
 *     onAuthSuccess: (user) => fetchPageData(user.id)
 *   })
 * - 元の実装: useEffect + checkAuth関数 (13-16行)
 * 
 * 共通化効果:
 * - 重複削減: 84行削除（各ファイル14行平均×6箇所）
 * - セキュリティ向上: 統一された認証ガード
 * - 保守性向上: 認証ロジックの単一管理
 * - 一貫性確保: 全ページで同じ認証フロー
 * - エラー処理統一: 認証エラー時の統一ハンドリング
 * 
 * フック設計:
 * - requireAuth: 認証必須ページかどうか
 * - redirectTo: 未認証時のリダイレクト先
 * - onAuthSuccess: 認証成功時のコールバック
 * - onAuthFailure: 認証失敗時のコールバック
 * 
 * 移行日: 2025-01-08
 * 移行者: Claude Code (重複コード統一プロジェクト)
 */
import { useAuth } from '@/shared/hooks/useAuth'

export default function ChatListPage() {
  const router = useRouter()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  
  // 統一された認証管理（元の個別checkAuth実装を置換）
  const { user, isAuthenticated, isLoading } = useAuth({
    requireAuth: true,
    redirectTo: '/auth',
    onAuthSuccess: (user) => {
      // 認証成功時に実行される処理（元はcheckAuth内に記述）
      fetchChatRooms(user.id)
    }
  })
  
  // 元の重複していたuseEffect + checkAuth関数を削除
  // Before (15行):
  // useEffect(() => {
  //   const checkAuth = async () => {
  //     const { data: { session } } = await supabase.auth.getSession()
  //     if (!session) {
  //       router.push('/auth')
  //       return
  //     }
  //     setUser(session.user)
  //     fetchChatRooms(session.user.id)
  //   }
  //   checkAuth()
  // }, [router])
  
  // ... 以下既存ロジック
}
```

---

## 🏷️ **コメント配置の詳細ルール**

### **1. Import文のコメント**
```typescript
// ❌ Bad: コメントなし
import { BUDGET_OPTIONS } from '@/shared/constants'

// ✅ Good: 共通化経緯を明記
/**
 * 共通化対応: 予算オプション定数を統一定数に移行
 * 元の実装: src/app/profile/edit/page.tsx:20-24 の budgetOptions 配列
 * 移行日: 2025-01-08
 * 共通化により4行のコード削減、データの一貫性確保
 */
import { BUDGET_OPTIONS } from '@/shared/constants/options'
```

### **2. 削除箇所のマーカーコメント**
```typescript
// ===== 共通化により削除された元の実装 =====
// Before (2025-01-08以前):
// const budgetOptions = [
//   { id: 1, label: '低 (〜3万円)' },
//   { id: 2, label: '中 (3〜10万円)' },
//   { id: 3, label: '高 (10万円〜)' }
// ]
// ↑ 上記4行を src/shared/constants/options.ts の BUDGET_OPTIONS に統一

// After (2025-01-08以降):
const budgetOptions = BUDGET_OPTIONS  // 後方互換性のための型エイリアス
```

### **3. 使用箇所のコメント**
```typescript
// 統一されたフック使用（元の個別useState実装を置換）
const { user, setUser, isLoading, setIsLoading } = useBasePageState()

// 統一されたボタンコンポーネント（元の長いclassName実装を置換）
<Button variant="primary" fullWidth>
  送信
</Button>

// 統一されたAPIサービス（元の個別fetchProfile関数を置換）  
const profile = await ProfileService.findById(userId)
```

### **4. 共通モジュール側のコメント**
```typescript
// src/shared/constants/options.ts
/**
 * 予算オプション定数定義
 * 
 * 共通化元:
 * - src/app/profile/edit/page.tsx:20-24 の budgetOptions (完全版・10項目)
 * - src/app/place/create/page.tsx:20-24 の budgetOptions (同一実装)
 * 
 * 共通化理由:
 * - 2ファイルで完全に同じ配列定義が重複していた
 * - データの一貫性確保が必要
 * - 予算オプション追加時の修正箇所統一
 * 
 * 使用方法:
 * - import { BUDGET_OPTIONS } from '@/shared/constants/options'
 * - const budgetOptions = BUDGET_OPTIONS  // 後方互換性
 * 
 * 共通化日: 2025-01-08
 * 共通化者: Claude Code
 */
export const BUDGET_OPTIONS = [
  { id: 1, label: '低 (〜3万円)' },
  { id: 2, label: '中 (3〜10万円)' },
  { id: 3, label: '高 (10万円〜)' }
] as const
```

---

## 📊 **コメント効果の測定**

### **可読性向上の確認**
```typescript
// Before: コメントなし
import { Button } from '@/shared/components/ui/Button'
<Button>送信</Button>

// After: 共通化の経緯が明確
/**
 * 共通化対応: プライマリボタンを統一UIコンポーネントに移行
 * 元の実装: src/app/auth/page.tsx:252 の140文字className
 * 移行日: 2025-01-08
 * 共通化により長いclassName削減、一貫したボタンスタイル確立
 */
import { Button } from '@/shared/components/ui/Button'

<Button variant="primary" fullWidth>送信</Button>
```

### **保守性向上の確認**
- 🔍 **修正時**: コメントを見れば元の実装と共通化内容が即座に理解できる
- 🔍 **レビュー時**: 共通化の妥当性とスコープが明確
- 🔍 **新メンバー**: 共通化の歴史と理由が把握しやすい

---

## ✅ **コメント品質チェックリスト**

各共通化実装時に以下を確認：

### **必須項目**
- [ ] **共通化元の具体的場所**（ファイルパス:行番号）を記載
- [ ] **共通化方法**（どのような関数・機能として統一したか）を記載  
- [ ] **共通化効果**（削減行数、改善内容）を記載
- [ ] **移行日**を記載
- [ ] **使用方法**の例を記載

### **推奨項目**
- [ ] **後方互換性**への配慮を明記
- [ ] **元の実装**をコメントアウトで残す（参考用）
- [ ] **共通化理由**（なぜ統一が必要だったか）を記載
- [ ] **設計思想**（バリアント、オプション等）を記載

### **品質基準**
- [ ] **一目で理解できる**：コメントだけで共通化内容が把握できる
- [ ] **検索しやすい**：「共通化対応」で検索可能
- [ ] **具体的**：ファイルパス・行番号が正確
- [ ] **効果明示**：削減行数や改善効果が定量的

---

この詳細なコメント戦略により、ユーザーの要求「後から見たときに、共通化されているんだっていうのがわかりやすくするため」を完全に満たし、**保守性の高い共通化**が実現できます。