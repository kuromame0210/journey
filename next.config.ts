import type { NextConfig } from "next";

/**
 * Next.js Configuration with Security Enhancements
 * 
 * CSRF保護とセキュリティヘッダーの強化
 * 参考: セキュリティ調査結果に基づく改善実装
 * 関連: middleware.ts（削除済み）の代替としてNext.js設定でセキュリティ強化
 */
const nextConfig: NextConfig = {
  // セキュリティヘッダーの設定
  async headers() {
    return [
      {
        // 全てのルートに適用
        source: '/(.*)',
        headers: [
          // CSRF攻撃防止
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // XSS攻撃防止
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // XSS保護機能の有効化
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // リファラー情報の制限
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // 権限ポリシーの設定
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  },
  
  // 開発時の設定
  experimental: {
    // セキュリティ関連の実験的機能
  }
};

export default nextConfig;
