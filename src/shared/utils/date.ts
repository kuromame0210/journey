/**
 * 日付フォーマット関連の統一ユーティリティ関数
 * 
 * 共通化の経緯:
 * - src/app/chat/page.tsx:75-91 の時刻フォーマット関数
 * - src/app/chat/[id]/page.tsx:128-139 の日付フォーマット関数
 * - src/app/home/page.tsx:205-206 の直接的な日付フォーマット
 * - src/app/place/[id]/page.tsx:195-196 の直接的な日付フォーマット
 * - src/app/chat/[id]/page.tsx:189-190 の直接的な日付フォーマット
 * - 5箇所で類似した日付フォーマット処理が重複していたため統一
 */

/**
 * 日本語ロケールでの日付フォーマット
 * 
 * @param date - フォーマット対象の日付（Date | string）
 * @param options - フォーマットオプション
 * @returns フォーマットされた日付文字列
 * 
 * 元の実装: 各ページで直接 toLocaleDateString('ja-JP') を呼び出し
 * 統一方針: 一貫したフォーマット、エラーハンドリング付き
 */
export function formatDate(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // 無効な日付をチェック
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    return dateObj.toLocaleDateString('ja-JP', options || defaultOptions);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return '';
  }
}

/**
 * 日付範囲のフォーマット（開始日〜終了日）
 * 
 * @param startDate - 開始日
 * @param endDate - 終了日
 * @returns フォーマットされた日付範囲文字列
 * 
 * 元の実装: 
 * - src/app/home/page.tsx:205-206
 * - src/app/place/[id]/page.tsx:195-196
 * - src/app/chat/[id]/page.tsx:189-190
 * 統一方針: 開始日のみ・範囲・無効日付を適切に処理
 */
export function formatDateRange(
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): string {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  if (!start && !end) return '';
  if (!start) return end;
  if (!end) return start;
  if (start === end) return start;
  
  return `${start} ～ ${end}`;
}

/**
 * 相対時間フォーマット（何分前、何時間前など）
 * 
 * @param date - 対象の日付
 * @returns 相対時間文字列
 * 
 * 元の実装: src/app/chat/page.tsx:75-91 の formatTime 関数
 * 統一方針: より正確な時間計算、日本語での自然な表現
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) {
      return 'たった今';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分前`;
    } else if (diffHours < 24) {
      return `${diffHours}時間前`;
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      // 1週間以上前は日付表示
      return formatDate(dateObj, { month: 'short', day: 'numeric' });
    }
  } catch (error) {
    console.warn('Relative time formatting error:', error);
    return '';
  }
}

/**
 * 時刻のみのフォーマット（HH:MM）
 * 
 * @param date - 対象の日付
 * @returns HH:MM形式の時刻文字列
 * 
 * 元の実装: src/app/chat/[id]/page.tsx:128-133
 * 統一方針: 24時間形式、ゼロパディング
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.warn('Time formatting error:', error);
    return '';
  }
}

/**
 * 日付と時刻のフル表示
 * 
 * @param date - 対象の日付
 * @returns YYYY年MM月DD日 HH:MM形式の文字列
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.warn('DateTime formatting error:', error);
    return '';
  }
}

/**
 * メッセージ表示用の日付フォーマット
 * 
 * 今日・昨日・それ以前を適切に表示
 * 
 * @param date - 対象の日付
 * @returns 適切なフォーマットの日付文字列
 * 
 * 元の実装: src/app/chat/[id]/page.tsx:135-139 の formatDate 関数
 * 統一方針: より直感的な日付表示
 */
export function formatMessageDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    
    const diffMs = today.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今日';
    } else if (diffDays === 1) {
      return '昨日';
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return formatDate(dateObj, { month: 'short', day: 'numeric' });
    }
  } catch (error) {
    console.warn('Message date formatting error:', error);
    return '';
  }
}

/**
 * 日付の妥当性をチェックする
 * 
 * @param date - チェック対象の日付
 * @returns 有効な日付かどうか
 */
export function isValidDate(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return !isNaN(dateObj.getTime());
  } catch {
    return false;
  }
}

/**
 * 日付文字列からDateオブジェクトを安全に作成
 * 
 * @param dateString - 日付文字列
 * @returns Dateオブジェクトまたはnull
 */
export function safeParseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    return isValidDate(date) ? date : null;
  } catch {
    return null;
  }
}

/**
 * 現在の日本時間を取得
 * 
 * @returns 現在の日本時間のDateオブジェクト
 */
export function getCurrentJST(): Date {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
}