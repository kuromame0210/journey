/**
 * バリデーション関連の定数定義
 * 
 * 共通化の経緯:
 * - src/app/auth/page.tsx:72 のパスワード最小長チェック
 * - src/app/auth/reset-password/page.tsx:57 のパスワード最小長チェック
 * - src/app/profile/edit/page.tsx:192 のファイルサイズ制限
 * - 各所でマジックナンバーとして散らばっていた値を統一
 */

// パスワード関連
export const PASSWORD_MIN_LENGTH = 6;

// ファイルアップロード関連  
export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 5MB in bytes

// サポートされるファイル形式
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;

// 画像アップロード関連
export const MAX_IMAGES_PER_PLACE = 5; // 場所投稿での最大画像数

// エラーメッセージ（多言語対応の準備）
export const VALIDATION_MESSAGES = {
  PASSWORD_TOO_SHORT: `パスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください`,
  PASSWORD_MISMATCH: 'パスワードが一致しません',
  FILE_TOO_LARGE: `ファイルサイズは${MAX_FILE_SIZE_MB}MB以下にしてください`,
  FILE_TYPE_INVALID: '画像ファイルを選択してください',
  EMAIL_ALREADY_EXISTS: 'このメールアドレスは既に登録されています',
  REQUIRED_FIELD: '必須項目が入力されていません'
} as const;

// 型定義
export type SupportedImageType = typeof SUPPORTED_IMAGE_TYPES[number];
export type ValidationMessage = typeof VALIDATION_MESSAGES[keyof typeof VALIDATION_MESSAGES];