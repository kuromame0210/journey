#!/bin/bash
# GitHub リポジトリにプッシュするスクリプト
# 使用方法: ./push-to-github.sh YOUR_GITHUB_USERNAME

if [ -z "$1" ]; then
    echo "使用方法: $0 YOUR_GITHUB_USERNAME"
    echo "例: $0 john-doe"
    exit 1
fi

USERNAME=$1
REPO_URL="https://github.com/$USERNAME/journey.git"

echo "🚀 GitHubリポジトリにプッシュ中..."
echo "Repository URL: $REPO_URL"

# リモートリポジトリを追加
git remote add origin $REPO_URL

# ブランチ名を main に設定
git branch -M main

# プッシュ実行
git push -u origin main

echo "✅ プッシュ完了！"
echo "🌐 リポジトリURL: $REPO_URL"