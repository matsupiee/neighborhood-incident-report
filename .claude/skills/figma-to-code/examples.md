# Figma to Code - Conversion Examples

このファイルには、実際の Figma デザインから実装コードへの変換例を記載します。

---

## Example 1: Simple Button Component

### Figma デザイン

```
Component: Button/Primary
  ├─ Properties:
  │   ├─ Size: Medium
  │   ├─ State: Default
  │   └─ Label: "購入する"
  └─ Styles:
      ├─ Background: color/accent/gold (#f9bb00)
      ├─ Text: #FFFFFF
      ├─ Padding: 16px 32px
      └─ Border Radius: 10px
```

### Implementation Flow

#### Step 1: Parse Figma URL

```
Input: https://figma.com/design/ABC123/TicketApp?node-id=1-2
Output: { fileKey: 'ABC123', nodeId: '1:2' }
```

#### Step 2: get_metadata

```xml
<node id="1:2" name="Button/Primary" type="COMPONENT">
  <properties>
    <property name="Size" value="Medium" />
    <property name="State" value="Default" />
  </properties>
</node>
```

**判定**：単純な Button コンポーネント → 既存の shadcn Button 使用可能

#### Step 3: get_variable_defs

```json
{
  "color/accent/gold": "#f9bb00",
  "color/text/white": "#ffffff"
}
```

**マッピング**：

- `color/accent/gold` → `app-accent-gold`
- `color/text/white` → `white`（標準色）

#### Step 4: get_code_connect_map

```json
{
  "1:2": {
    "codeConnectSrc": "src/shared/components/ui/button.tsx",
    "codeConnectName": "Button"
  }
}
```

**判定**：既存の shadcn Button を拡張する方針

#### Step 5: 生成コード

```typescript
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PurchaseButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export function PurchaseButton({
  onClick,
  disabled = false,
}: PurchaseButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'bg-app-accent-gold text-white',
        'px-8 py-4 rounded-[10px]',
        'hover:opacity-90 transition-opacity',
      )}
    >
      購入する
    </Button>
  );
}
```

---

## Example 2: Complex Form Section

### Figma デザイン

```
Section: Event Basic Info Form
  ├─ Field 1: Event Name
  │   ├─ Label: "イベント名" (color/text/primary)
  │   ├─ Input: TextField (bg: color/bg/surface, border: color/border/primary)
  │   └─ Placeholder: "例: Hype Idol Live 2024"
  ├─ Field 2: Event Date
  │   ├─ Label: "開催日時"
  │   ├─ Input: DatePicker
  │   └─ Helper: "開始日時を選択してください"
  └─ Field 3: Venue
      ├─ Label: "会場"
      ├─ Input: TextField
      └─ Placeholder: "例: 東京ドーム"
```

### Implementation Flow

#### Step 1-2: Parse + get_metadata

```xml
<node id="5:10" name="Event Basic Info Form" type="FRAME">
  <children>
    <node id="5:11" name="Event Name Field" type="FRAME">
      <node id="5:12" name="Label" type="TEXT">イベント名</node>
      <node id="5:13" name="Input" type="FRAME">...</node>
    </node>
    <node id="5:14" name="Event Date Field" type="FRAME">...</node>
    <node id="5:15" name="Venue Field" type="FRAME">...</node>
  </children>
</node>
```

**判定**：複雑なフォーム構造 → 個別フィールドに分割

#### Step 3: get_variable_defs

```json
{
  "color/text/primary": "#231916",
  "color/bg/surface": "#f7f7f7",
  "color/border/primary": "#d8dde5",
  "color/text/placeholder": "#a7a3a2"
}
```

**マッピング**：

- `color/text/primary` → `app-text`
- `color/bg/surface` → `app-surface`
- `color/border/primary` → `app-border`
- `color/text/placeholder` → `app-text-placeholder`

#### Step 5: 生成コード

```typescript
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { UseFormReturn } from 'react-hook-form';

type EventBasicInfoFormData = {
  eventName: string;
  eventDate: Date;
  venue: string;
};

type EventBasicInfoFormProps = {
  form: UseFormReturn<EventBasicInfoFormData>;
};

export function EventBasicInfoForm({ form }: EventBasicInfoFormProps) {
  return (
    <div className="space-y-6">
      {/* Event Name Field */}
      <FormField
        control={form.control}
        name="eventName"
        render={({ field }) => (
          <FormItem className="items-start">
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

      {/* Event Date Field */}
      <FormField
        control={form.control}
        name="eventDate"
        render={({ field }) => (
          <FormItem className="items-start">
            <FormLabel className="text-app-text font-semibold">
              開催日時
            </FormLabel>
            <FormControl>
              {/* DatePicker implementation here */}
              <Input
                type="datetime-local"
                className={cn(
                  'bg-app-surface',
                  'border-app-border',
                  'text-app-text',
                )}
                {...field}
                value={field.value?.toISOString().slice(0, 16)}
                onChange={(e) => field.onChange(new Date(e.target.value))}
              />
            </FormControl>
            <FormDescription className="text-app-text-muted">
              開始日時を選択してください
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Venue Field */}
      <FormField
        control={form.control}
        name="venue"
        render={({ field }) => (
          <FormItem className="items-start">
            <FormLabel className="text-app-text font-semibold">
              会場
            </FormLabel>
            <FormControl>
              <Input
                placeholder="例: 東京ドーム"
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
    </div>
  );
}
```

---

## Example 3: Badge Component with Multiple Variants

### Figma デザイン

```
Component Set: Status Badge
  ├─ Variant 1: Published
  │   ├─ Background: color/badge/blue/bg (#e8f0fe)
  │   ├─ Text: color/badge/blue/text (#3c6bff)
  │   └─ Label: "公開中"
  ├─ Variant 2: Draft
  │   ├─ Background: color/badge/yellow/bg (#fef3e2)
  │   ├─ Text: color/badge/yellow/text (#d48806)
  │   └─ Label: "下書き"
  ├─ Variant 3: Scheduled
  │   ├─ Background: color/badge/yellow/bg (#fef3e2)
  │   ├─ Text: color/badge/yellow/text (#d48806)
  │   └─ Label: "公開予約済"
  └─ Variant 4: Ended
      ├─ Background: #f5f5f5
      ├─ Text: #828282
      └─ Label: "終了"
```

### Implementation Flow

#### Step 3: get_variable_defs

```json
{
  "color/badge/blue/bg": "#e8f0fe",
  "color/badge/blue/text": "#3c6bff",
  "color/badge/yellow/bg": "#fef3e2",
  "color/badge/yellow/text": "#d48806"
}
```

**マッピング**：

- `color/badge/blue/bg` → `app-badge-blue-bg`
- `color/badge/blue/text` → `app-badge-blue-text`
- `color/badge/yellow/bg` → `app-badge-yellow-bg`
- `color/badge/yellow/text` → `app-badge-yellow-text`
- `#f5f5f5` → `gray-100`（shadcn デフォルト）
- `#828282` → `gray-500`（shadcn デフォルト）

#### Step 5: 生成コード

```typescript
import { cn } from '@/lib/utils';

type EventStatus = 'published' | 'draft' | 'scheduled' | 'ended';

type BadgeConfig = {
  bg: string;
  text: string;
  label: string;
};

const badgeConfig: Record<EventStatus, BadgeConfig> = {
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

type EventStatusBadgeProps = {
  status: EventStatus;
};

export function EventStatusBadge({ status }: EventStatusBadgeProps) {
  const config = badgeConfig[status];
  return (
    <div
      className={cn(
        'inline-flex items-center px-3 py-1.5 rounded-full',
        config.bg
      )}
    >
      <span className={cn('text-xs font-semibold', config.text)}>
        {config.label}
      </span>
    </div>
  );
}
```

---

## Troubleshooting Examples

### Case 1: Unmapped Figma Variable

**問題**：Figma 変数 `color/brand/secondary` が token-mapping.json にない

**出力**：

```
UNMAPPED_COLORS_FOUND:
  color/brand/secondary: #ff6b9d → Consider adding to app-* tokens
```

**対策**：

1. **新規トークン追加**：globals.css に `--app-brand-secondary: #ff6b9d` を追加
2. **既存トークン使用**：`app-accent-pink` (#f19ec2) が近い → 代用
3. **shadcn デフォルト**：`pink-500` を使用

### Case 2: Hardcoded Color in Figma

**問題**：Figma デザインに直接 `#231916` が使われている（変数なし）

**対策**：

- `colorValueMappings` で逆引き：`#231916` → `app-text`
- 該当なし → `text-gray-900` で代替 + 提案出力

### Case 3: Complex Nested Component

**問題**：Card コンポーネントが複雑にネスト（10+ 子要素）

**Step 2 判定**：

```
Output: Complex nested structure detected
Recommendation: Use forceCode: true for full code generation
```

**対策**：

```typescript
await mcp__figma__get_design_context({
  fileKey,
  nodeId,
  forceCode: true, // 完全なコード生成を強制
  disableCodeConnect: false,
});
```

---

## Best Practices

### 1. トークン一貫性の確保

```typescript
// ✅ CORRECT: 同じ用途には同じトークンを使用
<p className="text-app-text">メインテキスト</p>
<span className="text-app-text">別のメインテキスト</span>

// ❌ WRONG: 同じ用途で異なる色を使用
<p className="text-app-text">メインテキスト</p>
<span className="text-gray-900">別のメインテキスト</span> {/* 不一致 */}
```

### 2. レスポンシブ対応

```typescript
// ✅ CORRECT: モバイル / デスクトップの breakpoint 指定
<div className="flex flex-col md:flex-row gap-4 md:gap-6">
  <FormField /> {/* モバイル: 縦並び、デスクトップ: 横並び */}
</div>

// ❌ WRONG: レスポンシブ考慮なし
<div className="flex flex-row gap-6">
  <FormField /> {/* モバイルで崩れる */}
</div>
```

### 3. アクセシビリティ

```typescript
// ✅ CORRECT: alt, aria-label, label htmlFor 指定
<img src="..." alt="イベント画像" />
<button aria-label="閉じる"><X /></button>
<label htmlFor="eventName">イベント名</label>

// ❌ WRONG: アクセシビリティ属性なし
<img src="..." /> {/* alt なし */}
<button><X /></button> {/* aria-label なし */}
```

---

**Note**: これらの例は実際のプロジェクトで遭遇する典型的なパターンです。新しい Figma デザインを実装する際の参考にしてください。
