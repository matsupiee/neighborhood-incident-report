---
name: figma-to-code
description: Figma design → Next.js + React + Tailwind CSS v4 + shadcn/ui implementation (new-ticket-app)
version: 1.0.0
source: local-git-analysis
---

# Figma to Code (Automatic Implementation)

Figma デザインから Next.js + React + Tailwind CSS v4 + shadcn/ui の実装コードを**完全自動**で生成します。段階的なアプローチでコンテキスト消費を最小化しつつ、プロジェクト固有の規約（`app-*` トークン、shadcn/ui、type 使用など）を自動適用します。

## Overview

### 特徴

- **完全自動化**：Figma URL 入力 → React コンポーネント生成まで一気通貫
- **効率的なコンテキスト消費**：軽量 API（metadata）→ 重量 API（design_context）の段階的呼び出し
- **高精度**：token-mapping.json による一貫したトークン変換
- **既存コンポーネント再利用**：Code Connect で shadcn/ui コンポーネントを優先利用

### 基本的な使い方

```
Input:  Figma URL (例: https://figma.com/design/ABC123/Project?node-id=1-2)
Output: React コンポーネント（app-* トークン、shadcn/ui、type 使用）
```

---

## Implementation Flow

### Step 1: Parse Figma URL

Figma URL から `fileKey` と `nodeId` を抽出します。

```typescript
// URL 形式: https://figma.com/design/{fileKey}/...?node-id={nodeId}
// 例: https://figma.com/design/ABC123/Project?node-id=1-2
//   → fileKey: 'ABC123', nodeId: '1:2'

const parseFigmaUrl = (input: string) => {
  const urlMatch = input.match(
    /figma\.com\/design\/([a-z0-9]+).*node-id=([0-9\-]+)/i,
  );
  if (urlMatch) {
    const [_, fileKey, nodeId] = urlMatch;
    return {
      fileKey,
      nodeId: nodeId.replace('-', ':'),
    };
  }
  throw new Error('Invalid Figma URL format');
};
```

### Step 2: get_metadata - 構造把握（軽量）

**用途**：ノード階層、コンポーネント名、サイズを確認（XML 形式、最軽量）

```typescript
// ✅ CORRECT: metadata で構造を先に確認
await mcp__figma__get_metadata({ fileKey, nodeId });
// → 単純な Button なのか、複雑な Form なのか判定

// ❌ WRONG: いきなり design_context 呼び出し
await mcp__figma__get_design_context({ fileKey, nodeId }); // 重い
```

**判定基準**：

- 単純な単一コンポーネント → Step 3 へ
- 複雑なグループ構造 → Step 5 で `forceCode: true` 必要

### Step 3: get_variable_defs - トークン抽出（中量）

**用途**：Figma 内で定義されたカラー変数を取得し、`app-*` トークンにマッピング

```typescript
// Figma 変数例:
// {
//   'color/text/primary': '#231916',
//   'color/accent/primary': '#3c6bff',
//   ...
// }

// token-mapping.json でマッピング:
// 'color/text/primary' → 'app-text'
// 'color/accent/primary' → 'app-accent'

await mcp__figma__get_variable_defs({ fileKey, nodeId });
```

**Figma に変数がない場合の代替戦略**：

1. カラー値（例：#231916）から `colorValueMappings` で逆引き → `app-text`
2. 該当なし → shadcn デフォルト色（例：`text-gray-600`）で代替
3. 新規トークン提案を出力（実装時に選択）

### Step 4: get_code_connect_map - 既存マッピング確認

**用途**：Figma ノード ID → コンポーネント実装のマッピング確認

```typescript
// ✅ CORRECT: 既存マッピングを確認して再利用
const mapping = await mcp__figma__get_code_connect_map({ fileKey, nodeId });
if (mapping['1:2']) {
  // 既存: src/shared/components/ui/Button.tsx
  // → 新規コード生成せず、既存コンポーネント使用を推奨
}

// ❌ WRONG: マッピングを無視して毎回新規生成
await mcp__figma__get_design_context({
  fileKey,
  nodeId,
  disableCodeConnect: true, // 既存を無視（非推奨）
});
```

### Step 5: get_design_context - コード生成（重量、必要時のみ）

**用途**：最終的な UI コードとメタデータ取得

```typescript
// ✅ CORRECT: 既存マッピング活用、メタデータ優先
await mcp__figma__get_design_context({
  fileKey,
  nodeId,
  disableCodeConnect: false, // 既存コンポーネント活用
  forceCode: false, // メタデータのみで十分ならそれを返す
  clientLanguages: 'typescript',
  clientFrameworks: 'react,nextjs',
});

// ❌ WRONG: 常に forceCode: true（コンテキスト浪費）
await mcp__figma__get_design_context({
  fileKey,
  nodeId,
  forceCode: true, // 常に全コード生成（重い）
});
```

---

## Code Examples

### Example 1: Button Component

```typescript
// Figma: Button (Primary, State: Default)

// ✅ CORRECT: app-* トークン使用、shadcn Button を拡張
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PrimaryButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export function PrimaryButton({
  label,
  onClick,
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'bg-app-accent-gold text-white', // app-* トークン
        'hover:opacity-90 transition-opacity',
      )}
    >
      {label}
    </Button>
  );
}

// ❌ WRONG: hardcoded 色、interface 使用
interface ButtonProps { // interface は禁止
  label: string;
}

function WrongButton({ label }: ButtonProps) {
  return (
    <button className="bg-[#f9bb00] text-white"> {/* hardcoded 色 */}
      {label}
    </button>
  );
}
```

### Example 2: Form Field with React Hook Form

```typescript
// Figma: TextField with Label + Error Message

// ✅ CORRECT: shadcn Form + app-* トークン、items-start
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type EventNameFieldProps = {
  form: any; // UseFormReturn<T> from react-hook-form
  name?: string;
};

export function EventNameField({
  form,
  name = 'eventName',
}: EventNameFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="items-start"> {/* CRITICAL: 横並びフィールドで必須 */}
          <FormLabel className="text-app-text font-semibold">
            イベント名
          </FormLabel>
          <FormControl>
            <Input
              placeholder="例: Hype Idol Live 2024"
              className={cn(
                'bg-app-surface',
                'border-app-border',
                'text-app-text placeholder:text-app-text-placeholder',
              )}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ❌ WRONG: shadcn Form を使わない、items-start なし
function WrongField() {
  return (
    <div> {/* FormItem の代わりに div */}
      <label>イベント名</label>
      <input /> {/* Input コンポーネント使わない */}
    </div>
  );
}
```

### Example 3: Badge Component with Design Tokens

```typescript
// Figma: Status Badge (Published/Draft/Scheduled/Ended)

// ✅ CORRECT: app-* トークン活用、type 使用
import { cn } from '@/lib/utils';

type BadgeType = 'published' | 'draft' | 'scheduled' | 'ended';

type BadgeConfig = {
  bg: string;
  text: string;
  label: string;
};

const badgeConfig: Record<BadgeType, BadgeConfig> = {
  published: {
    bg: 'bg-app-badge-blue-bg',
    text: 'text-app-badge-blue-text',
    label: '公開中',
  },
  draft: {
    bg: 'bg-app-badge-yellow-bg',
    text: 'text-app-badge-yellow-text',
    label: '下書き',
  },
  scheduled: {
    bg: 'bg-app-badge-yellow-bg',
    text: 'text-app-badge-yellow-text',
    label: '公開予約済',
  },
  ended: {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    label: '終了',
  },
};

type StatusBadgeProps = {
  type: BadgeType;
};

export function StatusBadge({ type }: StatusBadgeProps) {
  const config = badgeConfig[type];
  return (
    <div className={cn('px-3 py-1.5 rounded-full', config.bg)}>
      <span className={cn('text-xs font-semibold', config.text)}>
        {config.label}
      </span>
    </div>
  );
}
```

---

## Pre-Implementation Checklist

実装前に以下を確認してください：

### トークン命名規則

- [ ] トークン名は `app-*` プレフィックスのみ使用
- [ ] `td-`, `ticketdive-` など product-specific 名は使用していない
- [ ] 新トークン必要時は globals.css に追加予定を確認

### TypeScript 型チェック

- [ ] `any` 型は使用していない（必要なら `unknown` を検討）
- [ ] 生成型は正確か確認

### shadcn/ui コンポーネント

- [ ] shadcn コンポーネントを優先利用
- [ ] カスタマイズは `_components/` で wrapping
- [ ] `src/shared/components/ui/` は編集していない

### React Hook Form + Zod

- [ ] Form フィールドは `FormField` でラップ
- [ ] `items-start` は横並びフィールドに必須
- [ ] エラーメッセージは `FormMessage` で表示

### テーマシステム

- [ ] `data-product` 属性での切り替えに対応
- [ ] layout.tsx で `NEXT_PUBLIC_PRODUCT` の設定確認

### レスポンシブ対応

- [ ] モバイル / タブレット / デスクトップの breakpoint 確認
- [ ] grid / flex の `items-start`、`justify-between` 等を確認

### アクセシビリティ

- [ ] `alt` text（画像）
- [ ] `aria-label`（ボタン）
- [ ] `label` の `htmlFor` 属性（フォーム）

---

## Validation Flow

### 1. TypeScript Compile Check

```bash
pnpm build
# エラーなし → OK
```

### 2. Visual Verification

```bash
# ui-auto-test スキルとの連携
./.claude/skills/ui-auto-test/test.sh \
  --port 4022 \
  --page /your-page \
  --name figma-validation
```

### 3. Console Error Check

```
ブラウザの Developer Tools → Console で:
  ✓ エラーなし
  ✓ 警告なし（または既知の警告のみ）
  ✓ GraphQL queries/mutations 成功
```

---

## Troubleshooting

| 問題                                    | 原因                                                    | 対策                                                                        |
| --------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------- |
| **URL パースエラー**                    | URL 形式が異なる                                        | 正しい形式を確認：`https://figma.com/design/{fileKey}/...?node-id={nodeId}` |
| **トークンマッピング不完全**            | Figma に対応変数がない                                  | unmapped_colors 出力確認、手動マッピングまたは新規トークン追加              |
| **Code Connect マッピング古い**         | 既存実装が変更されている                                | `get_code_connect_suggestions` で最新の推奨確認                             |
| **生成コードが Figma デザインと異なる** | `disableCodeConnect: true` で既存コンポーネントスキップ | `disableCodeConnect: false` に変更、既存コンポーネント活用                  |
| **TypeScript 型エラー**                 | Generated type が古い                                   | バックエンドサーバー再起動して schema 再生成                                |
| **items-start が抜けている**            | 横並びフィールドで items-start なし                     | FormItem に `className="items-start"` を追加                                |

---

## Token Mapping Reference

詳細な Figma 変数 → `app-*` トークンのマッピングは [token-mapping.json](./token-mapping.json) を参照してください。

**主要なマッピング例**：

| Figma 変数             | app-\* トークン     | 用途                     |
| ---------------------- | ------------------- | ------------------------ |
| `color/text/primary`   | `app-text`          | メインテキスト           |
| `color/text/secondary` | `app-text-sub`      | 副テキスト（日付、住所） |
| `color/link`           | `app-link`          | リンク                   |
| `color/accent/primary` | `app-accent`        | CTA、ボタン（標準）      |
| `color/accent/gold`    | `app-accent-gold`   | ゴールド（CTA）          |
| `color/bg/surface`     | `app-surface`       | 入力フィールド背景       |
| `color/border/primary` | `app-border`        | 標準ボーダー             |
| `color/badge/blue/bg`  | `app-badge-blue-bg` | ステータスバッジ背景     |

---

Generated from git history analysis - 2026-02-18
