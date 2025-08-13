/**
 * 選択肢関連の定数定義
 * 
 * 共通化の経緯:
 * - src/app/profile/edit/page.tsx:12-16 の budgetOptions
 * - src/app/place/create/page.tsx:12-16 の budgetOptions  
 * - 両ファイルで完全に同じ定義だったため統一
 */

export const BUDGET_OPTIONS = [
  { id: 1, label: '低 (〜3万円)' },
  { id: 2, label: '中 (3〜10万円)' },
  { id: 3, label: '高 (10万円〜)' }
] as const;

/**
 * MBTI性格タイプの定数定義
 * 
 * 共通化の経緯:
 * - src/app/profile/edit/page.tsx:44-66 の mbtiTypes
 * - プロフィール編集でのみ使用されていたが、将来的な拡張を考慮して共通化
 */
export const MBTI_TYPES = [
  { 
    category: '分析家', 
    types: [
      { value: 'INTJ', label: 'INTJ (建築家)' },
      { value: 'INTP', label: 'INTP (論理学者)' },
      { value: 'ENTJ', label: 'ENTJ (指揮官)' },
      { value: 'ENTP', label: 'ENTP (討論者)' }
    ] 
  },
  { 
    category: '外交官', 
    types: [
      { value: 'INFJ', label: 'INFJ (提唱者)' },
      { value: 'INFP', label: 'INFP (仲介者)' },
      { value: 'ENFJ', label: 'ENFJ (主人公)' },
      { value: 'ENFP', label: 'ENFP (運動家)' }
    ] 
  },
  { 
    category: '番人', 
    types: [
      { value: 'ISTJ', label: 'ISTJ (管理者)' },
      { value: 'ISFJ', label: 'ISFJ (擁護者)' },
      { value: 'ESTJ', label: 'ESTJ (幹部)' },
      { value: 'ESFJ', label: 'ESFJ (領事)' }
    ] 
  },
  { 
    category: '探検家', 
    types: [
      { value: 'ISTP', label: 'ISTP (巨匠)' },
      { value: 'ISFP', label: 'ISFP (冒険家)' },
      { value: 'ESTP', label: 'ESTP (起業家)' },
      { value: 'ESFP', label: 'ESFP (エンターテイナー)' }
    ] 
  }
] as const;

/**
 * 旅の目的タグの定数定義
 * 
 * 共通化の経緯:
 * - src/app/profile/edit/page.tsx:26-37 の purposeTags
 * - src/app/place/create/page.tsx:26-31 の purposeTags (簡略版)
 * - 基本版(6項目)と完全版(10項目)が重複していたため統一
 */
export const PURPOSE_TAGS_FULL = [
  { id: 1, label: '観光' },
  { id: 2, label: 'グルメ' },
  { id: 3, label: '写真撮影' },
  { id: 4, label: 'アクティビティ' },
  { id: 5, label: 'ショッピング' },
  { id: 6, label: '温泉・リラックス' },
  { id: 7, label: '自然' },
  { id: 8, label: '歴史・文化' },
  { id: 9, label: 'テーマパーク' },
  { id: 10, label: 'スポーツ' }
] as const;

// 基本版（場所作成ページで使用されていた6項目版）
export const PURPOSE_TAGS_BASIC = PURPOSE_TAGS_FULL.slice(0, 6);

// 後方互換性のためのデフォルトエクスポート（完全版を使用）
export const PURPOSE_TAGS = PURPOSE_TAGS_FULL;

/**
 * 相手に求めることタグの定数定義
 * 
 * 共通化の経緯:
 * - src/app/profile/edit/page.tsx:39-50 の demandTags
 * - src/app/place/create/page.tsx:33-37 の demandTags (簡略版)  
 * - 基本版(5項目)と完全版(10項目)が重複していたため統一
 */
export const DEMAND_TAGS_FULL = [
  { id: 1, label: '写真を撮ってくれる人' },
  { id: 2, label: '一緒に食事を楽しめる人' },
  { id: 3, label: '体力がある人' },
  { id: 4, label: '計画性がある人' },
  { id: 5, label: '語学ができる人' },
  { id: 6, label: '運転ができる人' },
  { id: 7, label: '現地に詳しい人' },
  { id: 8, label: '同年代の人' },
  { id: 9, label: '話しやすい人' },
  { id: 10, label: '時間に余裕がある人' }
] as const;

// 基本版（場所作成ページで使用されていた5項目版）
export const DEMAND_TAGS_BASIC = DEMAND_TAGS_FULL.slice(0, 5);

// 後方互換性のためのデフォルトエクスポート（完全版を使用）
export const DEMAND_TAGS = DEMAND_TAGS_FULL;

// 型定義
export type BudgetOption = typeof BUDGET_OPTIONS[number];
export type MBTIType = typeof MBTI_TYPES[number]['types'][number];
export type MBTICategory = typeof MBTI_TYPES[number];
export type PurposeTag = typeof PURPOSE_TAGS_FULL[number];
export type DemandTag = typeof DEMAND_TAGS_FULL[number];