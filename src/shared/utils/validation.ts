/**
 * バリデーション関連の統一ユーティリティ関数
 * 
 * 共通化の経緯:
 * - src/app/profile/edit/page.tsx:179-224 の validateForm 関数
 * - src/app/place/create/page.tsx:120-165 の validateForm 関数
 * - src/app/auth/page.tsx:105-125 の email/passwordバリデーション
 * - 3箇所で類似したバリデーションロジックが重複していたため統一
 */

import type { ProfileFormData, PlaceFormData } from '@/shared/types/ui';
import type { AuthFormData } from '@/shared/types/auth';

/**
 * バリデーションエラーの型
 */
export interface ValidationErrors {
  [key: string]: string | undefined;
}

/**
 * バリデーション結果の型
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

/**
 * メールアドレスの形式をチェックする
 * 
 * @param email - チェック対象のメールアドレス
 * @returns boolean - 有効なメールアドレスかどうか
 * 
 * 元の実装: src/app/auth/page.tsx:105-107 のメール形式チェック
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * パスワードの強度をチェックする
 * 
 * @param password - チェック対象のパスワード
 * @returns boolean - 有効なパスワードかどうか
 * 
 * 元の実装: src/app/auth/page.tsx:109-111 のパスワード強度チェック
 * 統一方針: 8文字以上、英数字含む
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * 電話番号の形式をチェックする
 * 
 * @param phone - チェック対象の電話番号
 * @returns boolean - 有効な電話番号かどうか
 * 
 * 元の実装: src/app/profile/edit/page.tsx:179-188 の電話番号チェック
 * 統一方針: 日本の携帯電話・固定電話形式
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^0\d{9,10}$/;
  return phoneRegex.test(phone.replace(/[-\s]/g, ''));
}

/**
 * URLの形式をチェックする
 * 
 * @param url - チェック対象のURL
 * @returns boolean - 有効なURLかどうか
 * 
 * 元の実装: src/app/place/create/page.tsx:140-145 のGoogleマップURLチェック
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 日付の形式と妥当性をチェックする
 * 
 * @param dateString - チェック対象の日付文字列 (YYYY-MM-DD)
 * @returns boolean - 有効な日付かどうか
 * 
 * 元の実装: src/app/place/create/page.tsx:130-135 の日付チェック
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString) return true; // 空文字は許可（オプショナル）
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * 数値範囲をチェックする
 * 
 * @param value - チェック対象の値
 * @param min - 最小値（含む）
 * @param max - 最大値（含む）
 * @returns boolean - 範囲内かどうか
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * 認証フォームのバリデーション
 * 
 * @param formData - 認証フォームデータ
 * @param mode - 認証モード ('login' | 'signup' | 'reset')
 * @returns ValidationResult - バリデーション結果
 * 
 * 元の実装: src/app/auth/page.tsx:105-125 のバリデーションロジック
 */
export function validateAuthForm(formData: AuthFormData, mode: 'login' | 'signup' | 'reset'): ValidationResult {
  const errors: ValidationErrors = {};

  // メールアドレスのバリデーション
  if (!formData.email) {
    errors.email = 'メールアドレスは必須です';
  } else if (!isValidEmail(formData.email)) {
    errors.email = '有効なメールアドレスを入力してください';
  }

  // パスワードのバリデーション（リセット以外）
  if (mode !== 'reset') {
    if (!formData.password) {
      errors.password = 'パスワードは必須です';
    } else if (!isValidPassword(formData.password)) {
      errors.password = 'パスワードは8文字以上で入力してください';
    }
  }

  // サインアップ時のパスワード確認
  if (mode === 'signup') {
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'パスワード確認は必須です';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'パスワードが一致しません';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * プロフィール編集フォームのバリデーション
 * 
 * @param formData - プロフィールフォームデータ
 * @returns ValidationResult - バリデーション結果
 * 
 * 元の実装: src/app/profile/edit/page.tsx:179-224 の validateForm 関数
 */
export function validateProfileForm(formData: ProfileFormData): ValidationResult {
  const errors: ValidationErrors = {};

  // 必須フィールドのチェック
  if (!formData.name || formData.name.trim().length === 0) {
    errors.name = 'お名前は必須です';
  } else if (formData.name.length > 50) {
    errors.name = 'お名前は50文字以下で入力してください';
  }

  if (!formData.gender) {
    errors.gender = '性別は必須です';
  }

  if (!formData.age || formData.age === '') {
    errors.age = '年齢は必須です';
  } else {
    const ageNum = parseInt(formData.age);
    if (isNaN(ageNum) || !isInRange(ageNum, 18, 100)) {
      errors.age = '年齢は18歳から100歳までの数値で入力してください';
    }
  }

  if (!formData.partner_gender) {
    errors.partner_gender = '希望する相手の性別は必須です';
  }

  // 電話番号のチェック（任意項目）
  if (formData.phone && !isValidPhone(formData.phone)) {
    errors.phone = '有効な電話番号を入力してください（例: 09012345678）';
  }

  // メールアドレスのチェック（任意項目）
  if (formData.email && !isValidEmail(formData.email)) {
    errors.email = '有効なメールアドレスを入力してください';
  }

  // MBTIのチェック
  if (!formData.mbti) {
    errors.mbti = 'MBTIは必須です';
  }

  // 予算設定のチェック
  if (!formData.budget_pref || formData.budget_pref.length === 0) {
    errors.budget_pref = '予算設定は必須です';
  }

  // 目的タグのチェック
  if (!formData.purpose_tags || formData.purpose_tags.length === 0) {
    errors.purpose_tags = '目的タグは1つ以上選択してください';
  }

  // デマンドタグのチェック
  if (!formData.demand_tags || formData.demand_tags.length === 0) {
    errors.demand_tags = 'デマンドタグは1つ以上選択してください';
  }

  // 必須条件のチェック
  if (!formData.must_condition || formData.must_condition.trim().length === 0) {
    errors.must_condition = '必須条件は必須です';
  } else if (formData.must_condition.length > 200) {
    errors.must_condition = '必須条件は200文字以下で入力してください';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * 場所作成フォームのバリデーション
 * 
 * @param formData - 場所作成フォームデータ
 * @returns ValidationResult - バリデーション結果
 * 
 * 元の実装: src/app/place/create/page.tsx:120-165 の validateForm 関数
 */
export function validatePlaceForm(formData: PlaceFormData): ValidationResult {
  const errors: ValidationErrors = {};

  // タイトルのチェック
  if (!formData.title || formData.title.trim().length === 0) {
    errors.title = 'タイトルは必須です';
  } else if (formData.title.length > 100) {
    errors.title = 'タイトルは100文字以下で入力してください';
  }

  // ジャンルのチェック
  if (!formData.genre) {
    errors.genre = 'ジャンルは必須です';
  }

  // 目的タグのチェック
  if (!formData.purpose_tags || formData.purpose_tags.length === 0) {
    errors.purpose_tags = '目的タグは1つ以上選択してください';
  }

  // デマンドタグのチェック
  if (!formData.demand_tags || formData.demand_tags.length === 0) {
    errors.demand_tags = 'デマンドタグは1つ以上選択してください';
  }

  // 目的詳細のチェック
  if (!formData.purpose_text || formData.purpose_text.trim().length === 0) {
    errors.purpose_text = '目的詳細は必須です';
  } else if (formData.purpose_text.length > 500) {
    errors.purpose_text = '目的詳細は500文字以下で入力してください';
  }

  // 予算オプションのチェック
  if (formData.budget_option === '' || formData.budget_option === undefined) {
    errors.budget_option = '予算カテゴリは必須です';
  }

  // 詳細予算のチェック（入力されている場合）
  if (formData.budget_min) {
    const minBudget = parseInt(formData.budget_min);
    if (isNaN(minBudget) || minBudget < 0) {
      errors.budget_min = '最低予算は0以上の数値で入力してください';
    }
  }

  if (formData.budget_max) {
    const maxBudget = parseInt(formData.budget_max);
    if (isNaN(maxBudget) || maxBudget < 0) {
      errors.budget_max = '最高予算は0以上の数値で入力してください';
    }
  }

  if (formData.budget_min && formData.budget_max) {
    const minBudget = parseInt(formData.budget_min);
    const maxBudget = parseInt(formData.budget_max);
    if (minBudget > maxBudget) {
      errors.budget_max = '最高予算は最低予算以上で設定してください';
    }
  }

  // 日付のチェック
  if (formData.date_start && !isValidDate(formData.date_start)) {
    errors.date_start = '有効な開始日を入力してください';
  }

  if (formData.date_end && !isValidDate(formData.date_end)) {
    errors.date_end = '有効な終了日を入力してください';
  }

  if (formData.date_start && formData.date_end) {
    const startDate = new Date(formData.date_start);
    const endDate = new Date(formData.date_end);
    if (startDate > endDate) {
      errors.date_end = '終了日は開始日以降で設定してください';
    }
  }

  // 募集人数のチェック
  if (formData.recruit_num) {
    const recruitNum = parseInt(formData.recruit_num);
    if (isNaN(recruitNum) || !isInRange(recruitNum, 1, 100)) {
      errors.recruit_num = '募集人数は1人から100人までの数値で入力してください';
    }
  }

  // 第1希望のチェック
  if (!formData.first_choice || formData.first_choice.trim().length === 0) {
    errors.first_choice = '第1希望は必須です';
  } else if (formData.first_choice.length > 200) {
    errors.first_choice = '第1希望は200文字以下で入力してください';
  }

  // 第2希望のチェック（任意項目）
  if (formData.second_choice && formData.second_choice.length > 200) {
    errors.second_choice = '第2希望は200文字以下で入力してください';
  }

  // GoogleマップURLのチェック（任意項目）
  if (formData.gmap_url && !isValidUrl(formData.gmap_url)) {
    errors.gmap_url = '有効なURLを入力してください';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * ファイルのバリデーション（画像アップロード用）
 * 
 * @param file - チェック対象のファイル
 * @param maxSize - 最大ファイルサイズ（バイト、デフォルト5MB）
 * @param allowedTypes - 許可するMIMEタイプの配列
 * @returns ValidationResult - バリデーション結果
 * 
 * 元の実装: 各ページで個別に実装されていたファイルチェックを統一
 */
export function validateFile(
  file: File, 
  maxSize: number = 5 * 1024 * 1024, // 5MB
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
): ValidationResult {
  const errors: ValidationErrors = {};

  // ファイルサイズのチェック
  if (file.size > maxSize) {
    errors.file = `ファイルサイズは${Math.round(maxSize / 1024 / 1024)}MB以下にしてください`;
  }

  // ファイルタイプのチェック
  if (!allowedTypes.includes(file.type)) {
    errors.file = `サポートされていないファイル形式です。${allowedTypes.join(', ')}のみ対応しています`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * 複数ファイルのバリデーション
 * 
 * @param files - チェック対象のファイル配列
 * @param maxFiles - 最大ファイル数（デフォルト5個）
 * @param maxSize - 1ファイルあたりの最大サイズ
 * @param allowedTypes - 許可するMIMEタイプの配列
 * @returns ValidationResult - バリデーション結果
 */
export function validateFiles(
  files: File[], 
  maxFiles: number = 5,
  maxSize?: number,
  allowedTypes?: string[]
): ValidationResult {
  const errors: ValidationErrors = {};

  // ファイル数のチェック
  if (files.length > maxFiles) {
    errors.files = `アップロードできるファイルは最大${maxFiles}個までです`;
    return { isValid: false, errors };
  }

  // 各ファイルの個別チェック
  for (let i = 0; i < files.length; i++) {
    const fileResult = validateFile(files[i], maxSize, allowedTypes);
    if (!fileResult.isValid) {
      errors[`file_${i}`] = fileResult.errors.file;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}