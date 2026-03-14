# iOS Simulator Skill

Claude Code から iOS シミュレータを操作するためのスキル。

## できること

- シミュレータの起動・終了
- デバイス一覧の確認
- Expo アプリの起動
- スクリーンショット取得
- アプリのインストール・起動

---

## 前提条件

- macOS + Xcode インストール済み（`xcrun simctl` が使えること）
- `open -a Simulator` で Simulator.app が起動できること
- Expo アプリの場合は `bun` インストール済み

PATH の設定（Bash ツール使用時は必須）:

```bash
export PATH="/opt/homebrew/bin:$HOME/.local/share/mise/shims:$PATH"
```

---

## デバイス一覧を確認する

```bash
# 利用可能な iOS デバイス一覧（名前・状態・UDID）
xcrun simctl list devices available -j | python3 -c "
import json, sys
data = json.load(sys.stdin)
for runtime, devices in data['devices'].items():
    if 'iOS' not in runtime:
        continue
    ios_version = runtime.split('iOS-')[-1].replace('-', '.')
    for d in devices:
        print(f\"{d['name']} (iOS {ios_version}) [{d['state']}] - {d['udid']}\")
"
```

出力例:

```
iPhone 16 Pro (iOS 18.2) [Shutdown] - F77BD3E9-8C51-4911-A69A-BDD887DA94E1
iPhone 16 (iOS 18.1) [Booted] - 7F3B7F11-8C8A-4AB8-8A2F-DBC3820E82C3
```

---

## シミュレータを起動する

### Simulator.app を開く（UI付き）

```bash
open -a Simulator
```

### 特定デバイスを起動する

```bash
# UDID を指定して起動
xcrun simctl boot "F77BD3E9-8C51-4911-A69A-BDD887DA94E1"

# 起動後に Simulator.app を開く（UIを表示するため必要）
open -a Simulator
```

### 現在起動中のデバイスを確認

```bash
xcrun simctl list devices booted
```

---

## Expo アプリをシミュレータで起動する

### 方法1: expo start（Metro + Expo Go）

```bash
cd apps/native
export PATH="/opt/homebrew/bin:$HOME/.local/share/mise/shims:$PATH"

# シミュレータで開く（デフォルト：起動中のシミュレータに接続）
bun run dev
# → 起動後に `i` キーを押すか、自動的に iOS シミュレータに転送される
```

### 方法2: expo run:ios（ネイティブビルド）

```bash
cd apps/native
export PATH="/opt/homebrew/bin:$HOME/.local/share/mise/shims:$PATH"

# デフォルトシミュレータでビルド＆起動
bun expo run:ios

# 特定デバイス指定
bun expo run:ios --udid "F77BD3E9-8C51-4911-A69A-BDD887DA94E1"
```

### 方法3: ルートから turbo 経由

```bash
export PATH="/opt/homebrew/bin:$HOME/.local/share/mise/shims:$PATH"
bun run dev:native
```

---

## スクリーンショットを撮る

```bash
# 起動中のシミュレータ（booted）からスクリーンショット
xcrun simctl io booted screenshot /tmp/screenshot.png

# UDID 指定
xcrun simctl io "7F3B7F11-8C8A-4AB8-8A2F-DBC3820E82C3" screenshot /tmp/screenshot.png

# タイムスタンプ付き
xcrun simctl io booted screenshot /tmp/screenshot-$(date +%Y%m%d-%H%M%S).png
```

---

## シミュレータを終了する

```bash
# 起動中のすべてのシミュレータを終了
xcrun simctl shutdown all

# 特定デバイスのみ終了
xcrun simctl shutdown "F77BD3E9-8C51-4911-A69A-BDD887DA94E1"
```

---

## アプリをインストール・起動する

```bash
# .app ファイルからインストール（ビルド済みの場合）
xcrun simctl install booted /path/to/YourApp.app

# バンドルIDでアプリを起動
xcrun simctl launch booted com.example.yourapp

# バンドルIDでアプリを終了
xcrun simctl terminate booted com.example.yourapp
```

---

## このプロジェクトでの典型的なワークフロー

```bash
# 1. シミュレータが起動しているか確認
xcrun simctl list devices booted

# 2. 起動していなければ起動（iPhone 16 Pro iOS 18.2 を使う場合）
xcrun simctl boot "F77BD3E9-8C51-4911-A69A-BDD887DA94E1"
open -a Simulator

# 3. バックエンドサーバーを起動（別ターミナルで）
export PATH="/opt/homebrew/bin:$HOME/.local/share/mise/shims:$PATH"
bun run dev:server

# 4. Expo アプリをシミュレータで起動
export PATH="/opt/homebrew/bin:$HOME/.local/share/mise/shims:$PATH"
bun run dev:native
```

---

## よく使うデバイス UDID（このマシン）

| デバイス        | iOS  | UDID                                 | 状態                 |
| --------------- | ---- | ------------------------------------ | -------------------- |
| iPhone 16 Pro   | 18.2 | F77BD3E9-8C51-4911-A69A-BDD887DA94E1 | Shutdown             |
| iPhone 16       | 18.2 | 0B514317-3261-4850-B0EA-2EA2A15A75A4 | Shutdown             |
| iPhone 16       | 18.1 | 7F3B7F11-8C8A-4AB8-8A2F-DBC3820E82C3 | Booted（デフォルト） |
| iPhone SE (3rd) | 18.2 | 46D6D6A5-2A05-45D8-B48C-356B5BB4B23F | Shutdown             |

> UDID は `xcrun simctl list devices available` で最新情報を確認すること。

---

## トラブルシューティング

### `xcrun: error: unable to find utility "simctl"` が出る

Xcode がインストールされていないか、Command Line Tools が設定されていない。

```bash
xcode-select --install
# または
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### シミュレータが起動しない

```bash
# CoreSimulator サービスをリセット
xcrun simctl shutdown all
killall -9 com.apple.CoreSimulator.CoreSimulatorService 2>/dev/null || true
xcrun simctl list  # 再起動のトリガー
```

### Expo アプリがシミュレータに転送されない

- シミュレータが起動しているか確認: `xcrun simctl list devices booted`
- Expo Go がシミュレータにインストールされているか確認
- Metro バンドラーのキャッシュをクリア: `bun run dev -- --clear`

### ポート競合（Metro bundler）

```bash
lsof -i :8081 | awk 'NR>1 {print $2}' | xargs kill -9
```
