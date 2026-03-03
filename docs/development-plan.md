# 開発計画書：近隣インシデントレポート

> **プロダクトコンセプト**：「人を晒す地図」ではなく「地域の傾向を可視化する統計アプリ」

---

## 技術スタック

| 層         | 技術                                                            |
| ---------- | --------------------------------------------------------------- |
| Monorepo   | Bun workspace + Turborepo                                       |
| Backend    | Hono v4.8 + oRPC + Prisma 7 + Neon PostgreSQL                   |
| Frontend   | React Native 0.83 + Expo 55 + HeroUI Native + TanStack Query v5 |
| Auth       | Better Auth v1.4                                                |
| Validation | Zod                                                             |
| Linting    | OxLint + OxFmt                                                  |

---

## フェーズ進捗

| フェーズ | 内容                                 | 状態      |
| -------- | ------------------------------------ | --------- |
| Phase 0  | AI エージェントインフラ整備          | ✅ 完了   |
| Phase 1  | バックエンドコア（インシデント管理） | ✅ 完了   |
| Phase 2  | バックエンド モデレーション          | ✅ 完了   |
| Phase 3  | ネイティブアプリ コアスクリーン      | ✅ 完了   |
| Phase 4  | ヒートマップ可視化                   | 🔲 未着手 |
| Phase 5  | モデレーター管理 UI                  | 🔲 未着手 |
| Phase 6  | テスト・堅牢化                       | 🔲 未着手 |

---

## Phase 0：AI エージェントインフラ整備 ✅

| タスク                                | 作成ファイル                          | 状態 |
| ------------------------------------- | ------------------------------------- | ---- |
| 0-1 CLAUDE.md 作成                    | `/CLAUDE.md`                          | ✅   |
| 0-2 Claude Code Hooks 設定            | `.claude/settings.json`               | ✅   |
| 0-3 DB スキーマ確定・マイグレーション | `packages/db/prisma/`                 | ✅   |
| 0-4 Incident Category シード          | `packages/db/src/seeds/categories.ts` | ✅   |
| 0-5 API ルーター骨格作成              | `packages/api/src/routers/`           | ✅   |

---

## Phase 1：バックエンドコア ✅

| タスク                         | 作成ファイル                                     | 状態 |
| ------------------------------ | ------------------------------------------------ | ---- |
| 1-1 メッシュコード変換         | `packages/api/src/lib/mesh/convert.ts`           | ✅   |
| 1-2 NGワード・個人情報フィルタ | `packages/api/src/lib/moderation/text-filter.ts` | ✅   |
| 1-3 レートリミット（1日5件）   | `packages/api/src/middleware/rate-limit.ts`      | ✅   |
| 1-4 `incident.create`          | `packages/api/src/routers/incident/incident.router.ts`  | ✅   |
| 1-5 `incident.list`            | 同上                                                    | ✅   |
| 1-6 `incident.getHeatmap`      | 同上                                                    | ✅   |

**実装済みの主要仕様：**

- 緯度経度 → JIS X 0410 3次メッシュコード（8桁、約1km精度）に変換、生座標は即時破棄
- NGワード検出（8種）＋個人情報パターン検出（電話番号・メール・番地）
- 1ユーザーあたり1日5件までのレートリミット
- `incident.create`：認証必須、メッシュ変換・フィルタ・レートリミット適用後に `PENDING` で保存
- `incident.list`：公開済み（`PUBLISHED`）のみ返す、cursor ページネーション、プライバシー配慮フィールドのみ返却
- `incident.getHeatmap`：6時間遅延保証、メッシュコード単位の集計
- `incident.reportAbuse`：通報3件で `status: HIDDEN` 自動変更

**テスト：** 20テスト全パス（mesh: 8件、text-filter: 12件）

---

## Phase 2：バックエンド モデレーション ✅

| タスク                                                     | 作成ファイル                             | 優先度 |
| ---------------------------------------------------------- | ---------------------------------------- | ------ |
| 2-1 画像処理パイプライン（顔・ナンバーモザイク、EXIF除去） | `packages/api/src/lib/image/process.ts`  | 高     |
| 2-2 トラストスコア計算                                     | `packages/api/src/lib/trust/scoring.ts`  | 高     |
| 2-3 `moderation.listPending`（モデレーター限定）           | `packages/api/src/routers/moderation/moderation.router.ts` | 高     |
| 2-4 `moderation.approve` / `moderation.reject`             | 同上                                                       | 高     |
| 2-5 `incident.reportAbuse` の拡充                          | `packages/api/src/routers/incident/incident.router.ts`     | 中     |

**自動制御フロー：**

```
投稿 → PENDING
  ↓ NGワードチェック（text-filter.ts）
  ├─ 検出 → 差し戻し（エラー返却）
  └─ 通過 → 画像処理（process.ts）
        ↓
   trust_score ≥ 80 → 自動 PUBLISHED（publishedAt = now + 6h）
   trust_score < 80  → 手動審査待ち
```

---

## Phase 3：ネイティブアプリ コアスクリーン ✅

| タスク                                      | 作成ファイル                              | 優先度 |
| ------------------------------------------- | ----------------------------------------- | ------ |
| 3-1 ナビゲーション構造整理（Drawer + Tabs） | `apps/native/app/_layout.tsx`             | 高     |
| 3-2 認証ガード（未ログインリダイレクト）    | `apps/native/lib/auth-guard.ts`           | 高     |
| 3-3 マップ画面（地図表示のみ）              | `apps/native/app/(drawer)/map.tsx`        | 高     |
| 3-4 インシデント詳細画面                    | `apps/native/screens/incident-detail.tsx` | 高     |
| 3-5 投稿フォーム画面                        | `apps/native/screens/post-incident.tsx`   | 高     |
| 3-6 通報導線画面                            | `apps/native/screens/report-guide.tsx`    | 中     |

**重要設計方針：**

- 投稿フォームでは GPS 座標取得後すぐメッシュコード変換し、生座標はサーバーに送らない
- 詳細画面はユーザー情報・正確な位置を一切表示しない

---

## Phase 4：ヒートマップ可視化 🔲

| タスク                               | 作成ファイル                                | 優先度 |
| ------------------------------------ | ------------------------------------------- | ------ |
| 4-1 ヒートマップデータ集計ロジック   | `packages/api/src/lib/heatmap/aggregate.ts` | 中     |
| 4-2 カテゴリ・期間フィルター UI      | `apps/native/components/map-filters.tsx`    | 中     |
| 4-3 マップ画面にヒートマップ描画統合 | `apps/native/app/(drawer)/map.tsx`（更新）  | 中     |

**非リアルタイム保証：**

- API: キャッシュ制御ヘッダで最低6時間遅延
- クライアント: TanStack Query の `staleTime: 6 * 60 * 60 * 1000`

---

## Phase 5：モデレーター管理 UI 🔲

| タスク                                     | 作成ファイル                                       | 優先度 |
| ------------------------------------------ | -------------------------------------------------- | ------ |
| 5-1 モデレーター権限ミドルウェア           | `packages/api/src/middleware/require-moderator.ts` | 中     |
| 5-2 モデレーションキュー画面               | `apps/native/screens/moderation-queue.tsx`         | 中     |
| 5-3 UserRestriction 登録・解除プロシージャ | `packages/api/src/routers/moderation/moderation.router.ts` | 中     |

---

## Phase 6：テスト・堅牢化 🔲

| タスク                                                | 優先度 |
| ----------------------------------------------------- | ------ |
| 6-1 単体テストスイート（カバレッジ 80%+）             | 高     |
| 6-2 統合テスト（API × DB）                            | 高     |
| 6-3 セキュリティ確認（SQLi, XSS, CORS, Rate Limit）   | 高     |
| 6-4 監査ログ実装（IP ハッシュ、端末 ID ハッシュ保存） | 中     |

---

## 開発順序

```
Phase 0（インフラ）✅ → Phase 1（投稿・閲覧 API）✅
                                    ↓                    ↘
                          Phase 2（モデレーション）   Phase 3（ネイティブ画面）
                                    ↓                    ↓
                          Phase 5（管理 UI）         Phase 4（ヒートマップ）
                                    ↘               ↙
                                   Phase 6（テスト・堅牢化）
```

Phase 2 と Phase 3 は並列実行可能（API が確定していれば）。

---

## プライバシー設計のポイント

| 項目           | 実装方針                                               |
| -------------- | ------------------------------------------------------ |
| 緯度経度       | DB に保存しない。meshCode のみ保存                     |
| 投稿者         | API レスポンスに userId / email / name を含めない      |
| 時刻           | TimeRange（時間帯）のみ保存。正確な時刻は保存しない    |
| 画像           | EXIF 除去・顔/ナンバーモザイク後の処理済み画像のみ保存 |
| 公開タイミング | 最低 6 時間遅延（リアルタイム拡散防止）                |
| 通報           | 3 件で自動非表示                                       |

---

## よく使うコマンド

```bash
# 開発サーバー起動
bun run dev:server      # API サーバー
bun run dev:native      # React Native (Expo)

# DB 操作
bun run db:push         # スキーマを DB に反映（開発時）
bun run db:generate     # Prisma Client を再生成
bun run db:seed         # カテゴリシードデータ投入

# コード品質
bun run check           # OxLint + OxFmt（自動整形）
bun run check-types     # TypeScript 型チェック（turbo tsc -b）

# テスト
bun test                # 全テスト実行
bun test --coverage     # カバレッジ付き
```
