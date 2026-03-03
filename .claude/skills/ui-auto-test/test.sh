#!/bin/bash

# UI検証スクリプト（Admin・Web両対応）
# agent-browserを使用して自動ログイン→任意のページのスクリーンショット撮影

set -e

# カラー出力用
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# デフォルト設定
PORT="4022"
PAGE_PATH="/event"
PAGE_NAME=""
TEST_EMAIL="test@example.com"
TEST_PASSWORD="password123"
SCREENSHOT_DIR="./.screenshots"
SESSION_NAME="ticket-app-test"
HEADED=""

# オプション解析
while [[ $# -gt 0 ]]; do
  case $1 in
    --page)
      PAGE_PATH="$2"
      shift 2
      ;;
    --name)
      PAGE_NAME="$2"
      shift 2
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    --headed)
      HEADED="--headed"
      shift
      ;;
    -h|--help)
      echo "使い方: $0 [オプション]"
      echo ""
      echo "オプション:"
      echo "  --page <path>    スクリーンショットを撮影するページ (デフォルト: /event)"
      echo "  --name <name>    スクリーンショットのファイル名 (デフォルト: ページパスから自動生成)"
      echo "  --port <port>    開発サーバーのポート番号 (デフォルト: 4022=Admin, 4021=Web)"
      echo "  --headed         ブラウザを表示して実行"
      echo "  -h, --help       このヘルプを表示"
      echo ""
      echo "使用例:"
      echo "  # Admin (4022)"
      echo "  $0 --port 4022 --page /event"
      echo "  $0 --port 4022 --page /sales --name sales"
      echo ""
      echo "  # Web (4021)"
      echo "  $0 --port 4021 --page /"
      echo "  $0 --port 4021 --page /search --headed"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use -h or --help for usage information"
      exit 1
      ;;
  esac
done

# ページ名が指定されていない場合、パスから自動生成
if [ -z "$PAGE_NAME" ]; then
  # パスから / を - に置換してファイル名を生成
  PAGE_NAME=$(echo "$PAGE_PATH" | sed 's/^\/*//' | sed 's/\//-/g')
  # 空の場合は "home" を使用
  [ -z "$PAGE_NAME" ] && PAGE_NAME="home"
fi

# アプリケーション種別を判定
APP_TYPE="Admin"
LOGIN_PATH="/signIn"
if [ "$PORT" = "4021" ]; then
  APP_TYPE="Web"
  LOGIN_PATH="/sign-in"
fi

# URL設定
BASE_URL="http://localhost:${PORT}"
LOGIN_URL="${BASE_URL}${LOGIN_PATH}"
TARGET_URL="${BASE_URL}${PAGE_PATH}"

echo -e "${BLUE}=== ${APP_TYPE} UI検証開始 ===${NC}"
echo -e "${BLUE}ページ: ${PAGE_PATH}${NC}"
echo -e "${BLUE}ポート: ${PORT}${NC}"

# スクリーンショットディレクトリ作成
mkdir -p "$SCREENSHOT_DIR"

# タイムスタンプ
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# 開発サーバーが起動しているか確認
echo -e "${BLUE}開発サーバー確認中...${NC}"
if ! lsof -ti:${PORT} > /dev/null; then
  echo -e "${RED}エラー: ポート ${PORT} で開発サーバーが起動していません${NC}"
  echo -e "${BLUE}以下のコマンドで開発サーバーを起動してください:${NC}"
  echo "  pnpm dev"
  exit 1
fi
echo -e "${GREEN}✓ 開発サーバー起動確認 (ポート: ${PORT})${NC}"

# セッション名を指定してブラウザ起動して直接対象ページを開く
echo -e "${BLUE}ブラウザを起動して${PAGE_NAME}ページを開きます...${NC}"
agent-browser ${HEADED} --session-name "${SESSION_NAME}" open "${TARGET_URL}"

# ページ読み込み待機
agent-browser --session-name "${SESSION_NAME}" wait --load networkidle
sleep 2

# 現在のURLを確認（ログインが必要な場合はログインページにリダイレクトされる）
CURRENT_URL=$(agent-browser --session-name "${SESSION_NAME}" get url)
echo -e "${BLUE}現在のURL: ${CURRENT_URL}${NC}"

# ログインページにリダイレクトされた場合はログイン処理を実行
if [[ "$CURRENT_URL" == *"/sign"* ]]; then
  echo -e "${BLUE}ログインが必要です。ログイン処理を開始します...${NC}"

  # ログインページの要素を取得
  agent-browser --session-name "${SESSION_NAME}" snapshot -i > /dev/null

  # ログイン情報入力
  echo -e "${BLUE}ログイン情報を入力中...${NC}"
  if [ "$APP_TYPE" = "Web" ]; then
    # Webアプリのログインフォーム
    agent-browser --session-name "${SESSION_NAME}" find placeholder "ticketdive@example.com" fill "${TEST_EMAIL}"
    agent-browser --session-name "${SESSION_NAME}" find placeholder "半角英数字6文字以上" fill "${TEST_PASSWORD}"
  else
    # Adminアプリのログインフォーム
    agent-browser --session-name "${SESSION_NAME}" find placeholder "メールアドレス" fill "${TEST_EMAIL}"
    agent-browser --session-name "${SESSION_NAME}" find placeholder "パスワード" fill "${TEST_PASSWORD}"
  fi

  # ログインボタンをクリック
  echo -e "${BLUE}ログインボタンをクリック...${NC}"
  agent-browser --session-name "${SESSION_NAME}" find text "ログイン" click

  # ログイン処理待機
  sleep 3
  agent-browser --session-name "${SESSION_NAME}" wait --load networkidle

  # 対象ページに再度移動
  echo -e "${BLUE}${PAGE_NAME}ページに移動...${NC}"
  agent-browser --session-name "${SESSION_NAME}" open "${TARGET_URL}"
  agent-browser --session-name "${SESSION_NAME}" wait --load networkidle
  sleep 3

  # URLを再確認
  CURRENT_URL=$(agent-browser --session-name "${SESSION_NAME}" get url)
  if [[ "$CURRENT_URL" == *"/sign"* ]]; then
    echo -e "${RED}エラー: ログインに失敗しました${NC}"
    agent-browser --session-name "${SESSION_NAME}" close
    exit 1
  fi

  echo -e "${GREEN}✓ ログイン成功${NC}"
else
  echo -e "${GREEN}✓ 既にログイン済み（セッション再利用）${NC}"
fi

echo -e "${GREEN}✓ ${PAGE_NAME}ページ到達${NC}"

# 対象ページのスクリーンショット撮影
echo -e "${BLUE}${PAGE_NAME}ページのスクリーンショットを撮影中...${NC}"
SCREENSHOT_PATH="${SCREENSHOT_DIR}/${PAGE_NAME}-${TIMESTAMP}.png"
agent-browser --session-name "${SESSION_NAME}" screenshot --full > /tmp/screenshot-output.txt
ACTUAL_PATH=$(grep -o '/[^ ]*\.png' /tmp/screenshot-output.txt | head -1)

if [ -n "$ACTUAL_PATH" ]; then
  cp "$ACTUAL_PATH" "$SCREENSHOT_PATH"
  echo -e "${GREEN}✓ スクリーンショット保存: ${SCREENSHOT_PATH}${NC}"
else
  echo -e "${RED}エラー: スクリーンショットの保存に失敗しました${NC}"
fi

# 完了メッセージ
echo -e "${GREEN}=== 検証完了 ===${NC}"
echo -e "${BLUE}保存されたスクリーンショット:${NC}"
ls -lh "${SCREENSHOT_DIR}"/${PAGE_NAME}-${TIMESTAMP}.png 2>/dev/null || echo "  (スクリーンショットなし)"

# ブラウザを閉じる（セッションは保存される）
echo -e "${BLUE}ブラウザを閉じます...${NC}"
agent-browser --session-name "${SESSION_NAME}" close

echo -e "${GREEN}✓ 完了${NC}"
echo ""
echo -e "${BLUE}次回は保存されたセッションを使用して高速にアクセスできます:${NC}"
echo "  agent-browser --session-name ${SESSION_NAME} open ${TARGET_URL}"
