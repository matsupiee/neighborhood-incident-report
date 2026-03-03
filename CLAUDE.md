# CLAUDE.md — 近隣インシデントレポート

AI エージェントへのドメイン知識注入ファイル。実装前に必ず通読すること。

---

## パッケージ責任範囲

| パッケージ                             | パス               | 役割                                                         |
| -------------------------------------- | ------------------ | ------------------------------------------------------------ |
| `@neighborhood-incident-report/db`     | `packages/db/`     | Prisma スキーマ、Prisma Client、シードデータ                 |
| `@neighborhood-incident-report/api`    | `packages/api/`    | Hono サーバー、oRPC ルーター、ミドルウェア、ビジネスロジック |
| `@neighborhood-incident-report/auth`   | `packages/auth/`   | Better Auth 設定（セッション、アカウント管理）               |
| `@neighborhood-incident-report/env`    | `packages/env/`    | 環境変数定義（t3-env）                                       |
| `@neighborhood-incident-report/config` | `packages/config/` | 共有 TypeScript / OxLint 設定                                |
| `native`                               | `apps/native/`     | React Native (Expo) アプリ                                   |
| `server`                               | `apps/server/`     | Hono サーバーエントリポイント                                |

---

## プライバシー重要パターン（CRITICAL）

### 位置情報の扱い

**緯度経度は絶対にデータベースに保存しない。** ハンドラ内でメッシュコードに変換してから即時破棄する。

```typescript
// ✅ CORRECT: メッシュコードに変換してから保存
import { toMeshCode } from "../lib/mesh/convert";

const meshCode = toMeshCode(input.latitude, input.longitude);
// input.latitude, input.longitude はここで終わり（DBには渡さない）
await prisma.post.create({ data: { meshCode, ... } });

// ❌ WRONG: 生緯度経度を保存
await prisma.post.create({ data: { lat: input.latitude, lng: input.longitude } });
```

### レスポンスからの除外フィールド

以下のフィールドを API レスポンスに含めてはならない：

- `userId`（投稿者の特定に繋がる）
- `user.email`
- `user.name`
- 生の緯度経度（`meshCode` のみ返す）

```typescript
// ✅ CORRECT: select で必要なフィールドのみ返す
const post = await prisma.post.findUnique({
  where: { id },
  select: {
    id: true,
    meshCode: true,
    description: true,
    timeRange: true,
    status: true,
    publishedAt: true,
    incidentCategoryPosts: {
      select: { incidentCategory: { select: { id: true, name: true } } },
    },
  },
});
```

### 画像の扱い

- 顔・ナンバープレートはアップロード時に自動モザイク処理
- EXIF メタデータを除去
- 原本（処理前画像）をストレージに保存しない
- `imageUrl` には処理済み画像の URL のみ格納する

---

## Prisma モデル一覧

```prisma
// --- incident.prisma ---
model Post           // DB table: "incident"（インシデント投稿）
model IncidentCategory        // DB table: "incident_category"（カテゴリマスタ）
model IncidentCategoryPost    // DB table: "incident_category_post"（Post ↔ Category の中間テーブル）
model AbuseReport             // DB table: "abuse_report"（投稿への通報）

// --- auth.prisma ---
model User           // DB table: "user"
model UserRestriction // DB table: "user_restriction"
model Session        // DB table: "session"
model Account        // DB table: "account"
model Verification   // DB table: "verification"
```

### 主要な enum

```typescript
// IncidentStatus
"PENDING"; // 投稿直後（非公開）
"PUBLISHED"; // 公開済み
"HIDDEN"; // 非公開化済み

// TimeRange（時間帯をぼかす）
"MIDNIGHT"; // 0:00〜6:00
"MORNING"; // 6:00〜10:00
"DAYTIME"; // 10:00〜16:00
"EVENING"; // 16:00〜20:00
"NIGHT_EARLY"; // 20:00〜22:00
"NIGHT_LATE"; // 22:00〜24:00

// AbuseReportReason
"PERSONAL_INFO" | "FALSE_REPORT" | "HARASSMENT" | "OTHER";
```

---

## oRPC プロシージャパターン

### インポート

```typescript
import prisma from "@neighborhood-incident-report/db";
import z from "zod";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
```

### 公開エンドポイント（認証不要）

```typescript
export const exampleRouter = {
  getAll: publicProcedure
    .input(z.object({ cursor: z.string().optional() }))
    .handler(async ({ input }) => {
      return await prisma.post.findMany({
        /* ... */
      });
    }),
};
```

### 認証必須エンドポイント

```typescript
export const exampleRouter = {
  create: protectedProcedure
    .input(z.object({ description: z.string().min(1).max(200) }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      return await prisma.post.create({ data: { userId, ...input } });
    }),
};
```

### エラーの投げ方

```typescript
throw new ORPCError("NOT_FOUND", { message: "Post not found" });
throw new ORPCError("UNAUTHORIZED");
throw new ORPCError("FORBIDDEN", { message: "Rate limit exceeded" });
throw new ORPCError("BAD_REQUEST", { message: "Invalid input" });
```

### ルーターの登録（packages/api/src/routers/index.ts）

```typescript
import { incidentRouter } from "./incident";
import { moderationRouter } from "./moderation";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  incident: incidentRouter,
  moderation: moderationRouter,
};
```

---

## Zod バリデーションパターン

```typescript
// 投稿入力のバリデーション例
const createPostInput = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  description: z.string().min(1).max(200),
  timeRange: z.enum(["MIDNIGHT", "MORNING", "DAYTIME", "EVENING", "NIGHT_EARLY", "NIGHT_LATE"]),
  categoryIds: z.array(z.string().cuid()).min(1).max(5),
  imageUrl: z.string().url().optional(),
});

// ページネーション
const paginationInput = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});
```

---

## ファイル構成ルール

- **1ドメイン1ルーターファイル**（`incident.ts`, `moderation.ts` 等）
- **ファイルは400行以内**（超えたらドメイン分割を検討）
- **ユーティリティは `lib/` 以下**に配置（`lib/mesh/`, `lib/moderation/`, `lib/image/`）
- **テストは `__tests__/` 以下**に配置（`unit/`, `integration/` サブディレクトリあり）

```
packages/api/src/
├── index.ts              # publicProcedure, protectedProcedure の定義
├── context.ts            # Hono context → auth session 取得
├── routers/
│   ├── index.ts          # appRouter のエントリポイント
│   ├── incident/
│   │   ├── incident.router.ts   # プロシージャ定義（認証・入力スキーマのみ）
│   │   ├── incident.service.ts  # ビジネスロジック
│   │   └── _schemas/
│   │       ├── index.ts
│   │       ├── incident-create.schema.ts
│   │       ├── incident-list.schema.ts
│   │       ├── incident-heatmap.schema.ts
│   │       └── incident-report-abuse.schema.ts
│   ├── moderation/
│   │   ├── moderation.router.ts
│   │   ├── moderation.service.ts
│   │   └── _schemas/
│   │       ├── index.ts
│   │       ├── moderation-approve.schema.ts
│   │       └── moderation-reject.schema.ts
│   └── todo/
│       ├── todo.router.ts
│       ├── todo.service.ts
│       └── _schemas/
│           ├── index.ts
│           ├── todo-create.schema.ts
│           ├── todo-toggle.schema.ts
│           └── todo-delete.schema.ts
├── middleware/
│   ├── rate-limit.ts     # 投稿レートリミット（1日5件）
│   └── require-moderator.ts
├── lib/
│   ├── mesh/
│   │   └── convert.ts    # 緯度経度 → メッシュコード変換
│   ├── moderation/
│   │   └── text-filter.ts # NGワード・個人情報フィルタ
│   ├── image/
│   │   └── process.ts    # 顔・ナンバーモザイク、EXIF除去
│   └── trust/
│       └── scoring.ts    # トラストスコア計算
└── __tests__/
    ├── unit/
    └── integration/
```

---

## テスト要件

- **カバレッジ 80% 以上**を維持する
- **TDD 必須**：テストを先に書いて RED → GREEN → REFACTOR
- テストファイルのパターン：`*.test.ts`

```typescript
// テストの書き方例（vitest / bun test）
import { describe, it, expect } from "vitest";
import { toMeshCode } from "../../lib/mesh/convert";

describe("toMeshCode", () => {
  it("渋谷区座標を正しいメッシュコードに変換する", () => {
    const code = toMeshCode(35.6762, 139.6503);
    expect(code).toBe("53393599"); // 8桁の日本標準地域メッシュ
  });

  it("境界値: 緯度-90を処理できる", () => {
    expect(() => toMeshCode(-90, 0)).not.toThrow();
  });
});
```

---

## ビジネスルール

### 投稿フロー

```
1. ユーザーが緯度経度 + 時間帯 + カテゴリ + 本文を送信
2. バックエンドで緯度経度 → meshCode に変換（生座標は即時破棄）
3. NGワード・個人情報フィルタを通す（引っかかったらエラー返却）
4. 画像があれば処理パイプライン（モザイク + EXIF除去）
5. Post を status: PENDING で作成
6. trust_score が高い (≥ 80) → publishedAt = now() + 6h で自動公開予定
7. trust_score が低い (< 80) → モデレーター手動確認待ち
```

### レートリミット

- **1ユーザーあたり1日5件まで投稿可能**
- `AbuseReport` が 3件以上 → 当該 Post を `status: HIDDEN` に自動変更

### モデレーター操作

- `moderation.listPending`: status が PENDING の Post 一覧
- `moderation.approve(postId)`: status → PUBLISHED、publishedAt → now()
- `moderation.reject(postId)`: status → HIDDEN

---

## よく使うコマンド

```bash
# 開発サーバー起動
bun run dev:server      # APIサーバー
bun run dev:native      # React Native (Expo)

# DB 操作
bun run db:push         # スキーマを DB に反映（開発時）
bun run db:generate     # Prisma Client を再生成
bun run db:migrate      # マイグレーションファイルを作成して適用
bun run db:studio       # Prisma Studio を開く

# コード品質
bun run check           # OxLint + OxFmt（自動整形）
bun run check-types     # TypeScript 型チェック（turbo tsc -b）

# テスト
bun test                # 全テスト実行
bun test --coverage     # カバレッジ付き
bun test packages/api/src/__tests__/unit/mesh.test.ts  # ファイル指定

# ビルド
bun run build           # 全パッケージビルド
```

---

## 実装チェックリスト（各タスク完了前に確認）

- [ ] 生の緯度経度をDBに保存していないか
- [ ] レスポンスに `userId`, `email`, `name` を含めていないか
- [ ] 入力バリデーションを Zod で行っているか
- [ ] エラーは `ORPCError` で投げているか
- [ ] `protectedProcedure` を使うべきエンドポイントに認証がかかっているか
- [ ] テストのカバレッジが 80% 以上か
- [ ] `bun run check` が通るか
- [ ] `bun run check-types` が通るか
