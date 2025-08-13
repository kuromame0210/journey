/**
 * アプリケーション全体で使用される定数
 * 
 * 共通化の経緯:
 * - src/app/profile/edit/page.tsx:15-20 の画像アップロード設定
 * - src/app/place/create/page.tsx:25-30 の画像アップロード設定
 * - 各ページでハードコーディングされていた設定値を統一
 */

/**
 * 画像アップロード関連の設定
 * 
 * 元の実装: 各ページで個別に定義されていた画像制限を統一
 */
export const IMAGE_UPLOAD = {
  // 最大ファイルサイズ（5MB）
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  
  // 最大アップロード数
  MAX_FILES: {
    PROFILE: 1,
    PLACE: 5
  },
  
  // 許可する画像形式
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  
  // 許可する画像形式（表示用）
  ALLOWED_TYPES_TEXT: 'JPEG, PNG, WebP',
  
  // 画像品質設定
  QUALITY: 0.8,
  
  // リサイズ設定
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1080
} as const;

/**
 * バリデーション関連の設定
 * 
 * 元の実装: 各ページのバリデーション関数内でハードコーディングされていた値を統一
 */
export const VALIDATION_LIMITS = {
  // 文字数制限
  TEXT_LENGTH: {
    NAME_MAX: 50,
    TITLE_MAX: 100,
    DESCRIPTION_MAX: 500,
    CONDITION_MAX: 200,
    CHOICE_MAX: 200
  },
  
  // 数値範囲
  NUMBER_RANGE: {
    AGE_MIN: 18,
    AGE_MAX: 100,
    RECRUIT_MIN: 1,
    RECRUIT_MAX: 100,
    BUDGET_MIN: 0,
    BUDGET_MAX: 1000000 // 100万円
  },
  
  // 配列の要素数制限
  ARRAY_LIMITS: {
    PURPOSE_TAGS_MIN: 1,
    DEMAND_TAGS_MIN: 1,
    BUDGET_PREF_MIN: 1
  }
} as const;

/**
 * UI表示関連の設定
 * 
 * 元の実装: 各ページで個別に定義されていたUI設定を統一
 */
export const UI_CONFIG = {
  // ページネーション
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    HOME_PLACES_LIMIT: 50,
    CHAT_MESSAGES_LIMIT: 50
  },
  
  // 表示形式
  DATE_FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm',
  
  // トースト表示時間（ミリ秒）
  TOAST_DURATION: {
    SUCCESS: 3000,
    WARNING: 4000,
    ERROR: 5000
  },
  
  // ローディング表示の最小時間（UX向上のため）
  MIN_LOADING_TIME: 500
} as const;

/**
 * Supabase関連の設定
 * 
 * 元の実装: 各ページのSupabaseクエリで個別に設定されていた値を統一
 */
export const SUPABASE_CONFIG = {
  // Storage bucket names
  STORAGE_BUCKETS: {
    AVATARS: 'avatars',
    PLACE_IMAGES: 'place-images'
  },
  
  // RLS (Row Level Security) related
  RLS_ERRORS: {
    UNAUTHORIZED: 'PGRST301',
    NOT_FOUND: 'PGRST116',
    FORBIDDEN: 'PGRST406'
  },
  
  // Default query options
  QUERY_OPTIONS: {
    HEAD_ONLY: { count: 'exact', head: true },
    WITH_COUNT: { count: 'exact' }
  }
} as const;

/**
 * 認証関連の設定
 * 
 * 元の実装: src/app/auth/page.tsx で個別に定義されていた認証設定を統一
 */
export const AUTH_CONFIG = {
  // パスワード要件
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: false,
    REQUIRE_LOWERCASE: false,
    REQUIRE_NUMBERS: false,
    REQUIRE_SYMBOLS: false
  },
  
  // セッション設定
  SESSION: {
    REFRESH_THRESHOLD: 5 * 60, // 5分前にリフレッシュ
    AUTO_REFRESH: true
  },
  
  // リダイレクト設定
  REDIRECTS: {
    AFTER_LOGIN: '/home',
    AFTER_LOGOUT: '/auth',
    REQUIRE_AUTH: '/auth',
    REQUIRE_PROFILE: '/profile/edit'
  }
} as const;

/**
 * API関連の設定
 * 
 * 元の実装: 各ページで個別に設定されていたAPI関連の設定を統一
 */
export const API_CONFIG = {
  // タイムアウト設定（ミリ秒）
  TIMEOUT: {
    DEFAULT: 10000,   // 10秒
    UPLOAD: 30000,    // 30秒
    LONG_RUNNING: 60000  // 60秒
  },
  
  // リトライ設定
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000,  // 1秒
    BACKOFF_MULTIPLIER: 2
  },
  
  // レート制限
  RATE_LIMIT: {
    MESSAGE_SEND: 10,  // 10メッセージ/分
    IMAGE_UPLOAD: 5,   // 5回/分
    PLACE_CREATE: 3    // 3回/分
  }
} as const;

/**
 * 正規表現パターン
 * 
 * 元の実装: 各バリデーション関数で個別に定義されていた正規表現を統一
 */
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^0\d{9,10}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  GOOGLE_MAPS_URL: /^https:\/\/(www\.)?google\.com\/maps/,
  
  // 日本語文字チェック用
  JAPANESE_CHARACTERS: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,
  
  // 半角数字のみ
  NUMBERS_ONLY: /^\d+$/,
  
  // 半角英数字のみ
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/
} as const;

/**
 * エラーメッセージテンプレート
 * 
 * 元の実装: 各バリデーション関数で個別に定義されていたエラーメッセージを統一
 */
export const ERROR_MESSAGES = {
  REQUIRED: (field: string) => `${field}は必須です`,
  MAX_LENGTH: (field: string, max: number) => `${field}は${max}文字以下で入力してください`,
  MIN_LENGTH: (field: string, min: number) => `${field}は${min}文字以上で入力してください`,
  INVALID_EMAIL: 'メールアドレスの形式が正しくありません',
  INVALID_PHONE: '電話番号の形式が正しくありません（例: 09012345678）',
  INVALID_URL: 'URLの形式が正しくありません',
  PASSWORD_TOO_SHORT: `パスワードは${AUTH_CONFIG.PASSWORD.MIN_LENGTH}文字以上で入力してください`,
  PASSWORD_MISMATCH: 'パスワードが一致しません',
  INVALID_RANGE: (field: string, min: number, max: number) => 
    `${field}は${min}から${max}の範囲で入力してください`,
  FILE_TOO_LARGE: `ファイルサイズは${IMAGE_UPLOAD.MAX_FILE_SIZE / 1024 / 1024}MB以下にしてください`,
  INVALID_FILE_TYPE: `サポートされていないファイル形式です。${IMAGE_UPLOAD.ALLOWED_TYPES_TEXT}のみ対応しています`,
  TOO_MANY_FILES: (max: number) => `ファイルは最大${max}個まで選択できます`,
  
  // API エラー
  NETWORK_ERROR: 'ネットワークエラーが発生しました。再試行してください',
  SERVER_ERROR: 'サーバーエラーが発生しました。しばらくしてから再試行してください',
  UNAUTHORIZED: 'ログインが必要です',
  FORBIDDEN: 'この操作を実行する権限がありません',
  NOT_FOUND: 'データが見つかりませんでした'
} as const;

/**
 * 成功メッセージテンプレート
 */
export const SUCCESS_MESSAGES = {
  SAVE: '保存しました',
  UPDATE: '更新しました',
  CREATE: '作成しました',
  DELETE: '削除しました',
  SEND: '送信しました',
  UPLOAD: 'アップロードしました'
} as const;

/**
 * アプリケーション情報
 */
export const APP_INFO = {
  NAME: 'Jurny',
  VERSION: '1.0.0',
  DESCRIPTION: 'マッチング＆トラベルプラットフォーム',
  
  // お問い合わせ情報
  CONTACT: {
    EMAIL: 'support@jurny.app',
    WEBSITE: 'https://jurny.app'
  },
  
  // ソーシャル情報
  SOCIAL: {
    TWITTER: '@jurny_app',
    INSTAGRAM: '@jurny_app'
  }
} as const;