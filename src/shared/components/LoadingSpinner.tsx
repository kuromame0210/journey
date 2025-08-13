/**
 * ローディング画面の統一コンポーネント
 * 
 * 共通化の経緯:
 * - src/app/chat/page.tsx:93-102 のローディング画面
 * - src/app/chat/[id]/page.tsx:142-151 のローディング画面
 * - src/app/place/[id]/page.tsx:103-112 のローディング画面
 * - src/app/home/page.tsx:110-119 のローディング画面
 * - src/app/profile/page.tsx:159-168 のローディング画面
 * - 5箇所で全く同一のローディングUIが重複していたため統一
 */

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

/**
 * 統一ローディングスピナーコンポーネント
 * 
 * @param message - 表示メッセージ（デフォルト: "読み込み中..."）
 * @param size - スピナーのサイズ
 * @param fullScreen - フルスクリーン表示するかどうか
 * 
 * 元の実装: 各ページで同一のローディングUI
 * 統一方針: サイズ・メッセージカスタマイズ可能、アクセシビリティ対応
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = '読み込み中...',
  size = 'medium',
  fullScreen = true
}) => {
  // スピナーサイズの設定
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12', 
    large: 'h-16 w-16'
  };

  const spinnerContent = (
    <div className="text-center">
      <div 
        className={`animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4 ${sizeClasses[size]}`}
        role="status"
        aria-label="読み込み中"
      />
      <p className="text-gray-600" aria-live="polite">
        {message}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen"
        role="main"
        aria-busy="true"
      >
        {spinnerContent}
      </div>
    );
  }

  return (
    <div 
      className="flex items-center justify-center py-8"
      role="status"
      aria-busy="true"
    >
      {spinnerContent}
    </div>
  );
};

/**
 * インライン用の小さなローディングスピナー
 * 
 * ボタンやフォーム内で使用する小さなスピナー
 */
export const InlineSpinner: React.FC<{ className?: string }> = ({ 
  className = "h-4 w-4" 
}) => (
  <div 
    className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${className}`}
    role="status"
    aria-label="処理中"
  />
);

/**
 * コンテンツローダー（部分的なローディング用）
 * 
 * 特定のセクションのみをローディング状態にする場合に使用
 */
export const ContentLoader: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
}> = ({ isLoading, children, message = '読み込み中...' }) => {
  if (isLoading) {
    return (
      <LoadingSpinner 
        message={message} 
        size="medium" 
        fullScreen={false} 
      />
    );
  }

  return <>{children}</>;
};