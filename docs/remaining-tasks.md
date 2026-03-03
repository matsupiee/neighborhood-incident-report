# 残り作業・課題一覧

> 作成日: 2026-03-03
> フェーズ 2（バックエンドモデレーション）・フェーズ 3（ネイティブアプリコア画面）完了後の残課題

---

## 2. TypeScript エラー（`bun --cwd apps/native tsc --noEmit` の結果）

### 2-1. `app/(drawer)/index.tsx`

| 行  | エラー内容                                                      | 修正方法                     |
| --- | --------------------------------------------------------------- | ---------------------------- |
| 14  | `orpc.privateData` が存在しない                                 | `privateData` クエリを削除   |
| 84  | `privateData.data?.message` — `{}` 型に `.message` が存在しない | 当該 Card セクションごと削除 |

### 2-2. `app/screens/incident-detail.tsx`

| 行       | エラー内容                                                                     | 修正方法                                             |
| -------- | ------------------------------------------------------------------------------ | ---------------------------------------------------- |
| 87       | `queryOptions({ limit: 50 })` — input ラッパーが必要                           | `queryOptions({ input: { limit: 50 } })`             |
| 92       | `IncidentPost` 型に `status` フィールドを含めているが API レスポンスに含まない | 型から `status` を削除（CLAUDE.md プライバシー要件） |
| 111, 134 | `Button color="primary"` — `color` prop 不存在                                 | `variant="primary"` に変更                           |
| 170, 233 | `variant="light"` — 有効な ButtonVariant でない                                | `variant="ghost"` に変更                             |
| 183, 209 | `Card.Divider` — 存在しない                                                    | `<Separator />` (heroui-native) に変更               |
| 220      | `variant="bordered"` — 有効でない                                              | `variant="outline"` に変更                           |

### 2-3. `app/screens/post-incident.tsx`

| 行  | エラー内容                                                          | 修正方法                                                                                                                                             |
| --- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10  | `ScrollView` が heroui-native から export されていない              | `import { ScrollView } from "react-native"` に変更                                                                                                   |
| 74  | `useForm<PostFormData>` — 12 個の型引数が必要なのに 1 個            | 明示的な型引数を削除（型推論に任せる）: `useForm(`                                                                                                   |
| 93  | `parsed.error.errors` — ZodError の API が違う                      | `parsed.error.issues` に変更                                                                                                                         |
| 319 | `Button color="primary"` + `isLoading` + `fullWidth` — 無効な props | `variant="primary"` のみ残し、他を削除（`isLoading` の代替はボタン内に `<ActivityIndicator />` を入れる、`fullWidth` の代替は `className="w-full"`） |
| 331 | `variant="light"`                                                   | `variant="ghost"` に変更                                                                                                                             |

### 2-4. `app/screens/report-guide.tsx`

| 行  | エラー内容                                          | 修正方法                              |
| --- | --------------------------------------------------- | ------------------------------------- |
| 76  | `Button color="primary"`                            | `variant="primary"` に変更            |
| 133 | `Card.Divider`                                      | `<Separator />` に変更                |
| 186 | `Button color="danger"` + `isLoading` + `fullWidth` | `variant="danger"` のみ残し、他を削除 |
| 197 | `variant="light"`                                   | `variant="ghost"` に変更              |

### 2-5. `lib/auth-guard.tsx`

| 行  | エラー内容                                                   | 修正方法                                                       |
| --- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| 21  | `router.replace("/sign-in")` — `/sign-in` ルートが存在しない | `router.replace("/(drawer)")` に変更（認証はホーム画面で処理） |

---

## 3. heroui-native API リファレンス（修正時の参考）

### Button

```typescript
// 有効な variant
type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "outline"
  | "ghost"
  | "danger"
  | "danger-soft";

// 存在しない props（削除すること）
// color, isLoading, fullWidth

// 有効な props（使用可能）
// isDisabled, onPress, className, variant, size, children
```

### Card サブコンポーネント

```typescript
// 存在するもの: Header, Body, Footer, Title, Description
// 存在しないもの: Divider → 代わりに <Separator /> を使う
import { Separator } from "heroui-native";
```

### ScrollView

```typescript
// heroui-native からは export されていない
// react-native から import すること
import { ScrollView } from "react-native";
```

---

## 4. バックエンド確認事項

### `packages/api/src/index.ts` — moderatorProcedure 型チェック

`requireModerator` ミドルウェアは `protectedProcedure` のコンテキスト（`session` が非 nullable）を受け取るが、
`context.ts` の型定義によっては型エラーが出る可能性がある。

```typescript
// 確認コマンド
bun --cwd packages/api tsc --noEmit
```

エラーがあれば `requireModerator` のシグネチャを `protectedProcedure` のコンテキスト型に合わせて修正する。

---

## 5. テスト

| 対象                                      | 状況   | 目標カバレッジ |
| ----------------------------------------- | ------ | -------------- |
| `packages/api/src/__tests__/unit/`        | 未確認 | 80% 以上       |
| `packages/api/src/__tests__/integration/` | 未確認 | 80% 以上       |

```bash
bun test --coverage
```

---

## 6. 開発計画ドキュメント更新

- `docs/development-plan.md` のフェーズ 2・フェーズ 3 を ✅ 完了に更新する

---

## 7. 優先度順タスクリスト

2. **[HIGH]** `app/(drawer)/index.tsx` の `privateData` 削除
3. **[HIGH]** `app/screens/incident-detail.tsx` の全 TypeScript エラー修正
4. **[HIGH]** `app/screens/post-incident.tsx` の残 TypeScript エラー修正
5. **[HIGH]** `app/screens/report-guide.tsx` の TypeScript エラー修正
6. **[HIGH]** `lib/auth-guard.tsx` のリダイレクト先修正
7. **[MEDIUM]** `packages/api` の型チェック確認
8. **[MEDIUM]** テストカバレッジ確認・補完
9. **[LOW]** `docs/development-plan.md` 更新
