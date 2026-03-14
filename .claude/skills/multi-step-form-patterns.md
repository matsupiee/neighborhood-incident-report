# Multi-Step Form Patterns

複数ページ（ステップ）にまたがるフォームを作成する際の実装パターンとベストプラクティス。

---

## ⚠️ 重要な設計原則

### 新規作成と編集のルートを分けない

**❌ 間違ったアプローチ:**

```
/feature/new/1          # 新規作成 Step 1
/feature/new/2          # 新規作成 Step 2
/feature/new/3          # 新規作成 Step 3

/feature/[id]/edit/1    # 編集 Step 1
/feature/[id]/edit/2    # 編集 Step 2
/feature/[id]/edit/3    # 編集 Step 3
```

**問題点:**

- 共通化しなかった場合、コードの重複が発生（新規作成用と編集用で同じフォームを2回実装）
- 共通化したとしても、新規作成と編集の両方に対応できるように、ロジックを分岐させる必要が生じて複雑化する。結果的に、開発スピードが落ちたりバグが発生したりする

**✅ 正しいアプローチ:**

```
/feature/[id]/edit/1    # 新規作成も編集もこのルートを使用
/feature/[id]/edit/2
/feature/[id]/edit/3
```

**実装方法:**

1. 新規作成ボタンクリック時に、空のデータでレコードを作成
2. 作成されたIDで編集画面（Step 1）にリダイレクト
3. 以降は編集フローと同じ処理

```typescript
// 一覧画面の新規作成ボタン
const { createDefault } = useCreate();

const handleCreate = async () => {
  const { id, error } = await createDefault();
  if (error) {
    // エラーハンドリング
    return;
  }
  // 編集画面（Step 1）にリダイレクト
  router.push(`/feature/${id}/edit/1`);
};

// hooks/use-create.ts
export const useCreate = () => {
  const [, executeCreate] = useMutation(CreateMutation);

  const createDefault = async () => {
    const { error, data } = await executeCreate({
      input: {
        // 最小限の必須フィールドのみ
        name: "",
        // その他デフォルト値
      },
    });

    if (error || !data) {
      return {
        id: null,
        error: error?.message ?? "作成に失敗しました",
      };
    }

    return {
      id: data.create.id,
      error: null,
    };
  };

  return { createDefault };
};
```

**メリット:**

- 1つのフォームで新規作成と編集の両方に完全対応
- ロジックがシンプルになり、無駄な条件分岐が発生しにくい
- テストケースも1セットで済む

---

## Architecture Overview

### Directory Structure

```
app/(authenticated)/feature/(form)/
├── layout.tsx                      # 共通レイアウト（ヘッダー、キャンセルボタン等）
├── _hooks/
│   └── useFormData.ts             # 全ステップ共通のデータ取得フック
├── _components/
│   └── xxx.tsx                   # 共通コンポーネント
└── [id]/edit/
    ├── 1/                         # Step 1
    │   ├── page.tsx
    │   ├── _components/
    │   │   └── step1-form.tsx     # フォームコンポーネント
    │   ├── _utils/
    │   │   ├── step1-schema.ts    # Zodバリデーションスキーマ
    │   │   └── build-step1-form-default-values.ts
    │   └── _hooks/
    │       └── use-submit-step1.ts # Submit処理
    ├── 2/                         # Step 2
    │   ├── page.tsx
    │   └── ...
    └── 3/                         # Step 3
        ├── page.tsx
        └── ...
```

### URL Structure

- ルート: `/feature/[id]/edit/[step]`
- 例: `/event/cm123/edit/1`, `/event/cm123/edit/2`

---

## Implementation Patterns

### 1. Data Fetching & Management

#### 共通データ取得フック

全ステップで同じデータソースを参照:

```typescript
// _hooks/useFormData.ts
import { graphql, ResultOf } from "@/libs/graphql/tada";
import { useQuery } from "urql";

const DataQuery = graphql(`
  query DataForEdit($id: ID!) {
    data(id: $id) {
      id
      field1
      field2
      nestedData {
        id
        name
      }
    }
  }
`);

export type DataForEdit = NonNullable<ResultOf<typeof DataQuery>["data"]>;

export function useFormData(id: string) {
  const [{ data, fetching }] = useQuery({
    query: DataQuery,
    variables: { id },
  });

  return {
    fetching,
    data: data?.data,
  };
}
```

**重要**: 全ステップで同じフックを使用し、データの一貫性を保つ

---

### 2. Step Schema & Validation

#### ステップごとの独立したスキーマ

```typescript
// _utils/step1-schema.ts
import { z } from "zod";

const nestedSchema = z.object({
  id: z.string().optional(), // 編集時に必要
  name: z.string().min(1, "Name is required"),
  value: z.number(),
});

export const step1Schema = z.object({
  field1: z.string().min(1, "Field1 is required"),
  field2: z.string(),
  items: z.array(nestedSchema).min(1, "At least one item required"),
});

export type Step1FormData = z.infer<typeof step1Schema>;
```

---

### 3. Form Default Values

#### GraphQLデータ → フォーム形式への変換

```typescript
// _utils/build-step1-form-default-values.ts
import { DataForEdit } from "../../_hooks/useFormData";
import { Step1FormData } from "./step1-schema";

export const buildStep1FormDefaultValues = (data: DataForEdit): Step1FormData => {
  return {
    field1: data.field1,
    field2: data.field2,
    items: data.nestedData.map((item) => ({
      id: item.id,
      name: item.name,
      // 日時のフォーマット変換例
      date: new Date(item.timestamp).toISOString().split("T")[0],
      time: new Date(item.timestamp).toISOString().split("T")[1].slice(0, 5),
    })),
  };
};
```

---

### 4. Form Component

#### Step Form Implementation

```typescript
// _components/step1-form.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useFormData } from '../../_hooks/useFormData';
import { buildStep1FormDefaultValues } from '../_utils/build-step1-form-default-values';
import { step1Schema, type Step1FormData } from '../_utils/step1-schema';
import { useSubmitStep1 } from '../_hooks/use-submit-step1';
import { FooterButtons } from '../../_components/footer-buttons';

export function Step1Form({ id }: { id: string }) {
  // 1. APIからデータ取得
  const { data, fetching } = useFormData(id);

  // 2. フォーム初期化
  const form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    // デフォルト値はuseEffectでセット（データ取得後）
  });

  // 3. 動的フィールド管理
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // 4. データ取得後にフォームのデフォルト値をセット
  useEffect(() => {
    if (!data) return;
    const defaultValues = buildStep1FormDefaultValues(data);
    form.reset(defaultValues);
  }, [data, form]);

  // 5. Submit処理
  const { onSubmit } = useSubmitStep1(id);

  // 6. ローディング状態
  if (fetching) {
    return <div>読み込み中...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* フォームフィールド */}
        <FormField
          control={form.control}
          name="field1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field 1</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        ...
      </form>
    </Form>
  );
}
```

**重要な実装ポイント**:

1. **データ取得後にreset()**: デフォルト値は `useEffect` でセット
2. **useFieldArray**: 動的フィールドは専用フックで管理
3. **ローディング状態**: APIからデータ取得中は適切にハンドリング
4. **Submit中の状態管理**: `isSubmitting` でボタンを無効化

---

### 5. Submit Logic

#### Mutation & Navigation

```typescript
// _hooks/use-submit-step1.ts
import { graphql } from "@/libs/graphql/tada";
import { useRouter } from "next/navigation";
import { useMutation } from "urql";
import { Step1FormData } from "../_utils/step1-schema";

const UpdateMutation = graphql(`
  mutation Update($input: UpdateInput!) {
    update(input: $input) {
      data {
        id
      }
    }
  }
`);

const CreateNestedMutation = graphql(`
  mutation CreateNested($input: CreateNestedInput!) {
    createNested(input: $input) {
      items {
        id
      }
    }
  }
`);

const UpdateNestedMutation = graphql(`
  mutation UpdateNested($input: UpdateNestedInput!) {
    updateNested(input: $input) {
      items {
        id
      }
    }
  }
`);

export const useSubmitStep1 = (id: string) => {
  const router = useRouter();
  const [, executeUpdate] = useMutation(UpdateMutation);
  const [, executeCreateNested] = useMutation(CreateNestedMutation);
  const [, executeUpdateNested] = useMutation(UpdateNestedMutation);

  const onSubmit = async (formData: Step1FormData) => {
    // 1. メインデータの更新
    const { items, ...mainData } = formData;
    const { error } = await executeUpdate({
      input: {
        id,
        ...mainData,
      },
    });

    if (error) {
      // エラーハンドリング
      console.error("Update failed:", error);
      return;
    }

    // 2. ネストデータの更新/作成を分離
    const itemsInput = items.map((item) => ({
      id: item.id,
      name: item.name,
      // 日時フィールドの再結合
      timestamp: new Date(`${item.date}T${item.time}:00`),
    }));

    // 既存アイテムと新規アイテムを分離
    const existingItems = itemsInput.filter((item) => item.id);
    const newItems = itemsInput.filter((item) => !item.id);

    // 3. 既存アイテムの更新
    if (existingItems.length > 0) {
      const { error: updateError } = await executeUpdateNested({
        input: {
          parentId: id,
          items: existingItems,
        },
      });

      if (updateError) {
        console.error("Update nested failed:", updateError);
        return;
      }
    }

    // 4. 新規アイテムの作成
    if (newItems.length > 0) {
      const { error: createError } = await executeCreateNested({
        input: {
          parentId: id,
          items: newItems.map(({ id, ...rest }) => rest),
        },
      });

      if (createError) {
        console.error("Create nested failed:", createError);
        return;
      }
    }

    // 5. 次のステップへ遷移
    router.push(`/feature/${id}/edit/2`);
  };

  return { onSubmit };
};
```

**重要なポイント**:

1. **データの分解**: メインデータとネストデータを分離
2. **Create vs Update**: `id` の有無で新規作成と更新を判定
3. **エラーハンドリング**: 各mutationでエラーチェック
4. **日時フィールドの再結合**: フォーム形式（date + time）→ ISO string
5. **成功後にナビゲート**: 全てのmutationが成功してから遷移

---

### 7. Shared Components

## Common Pitfalls & Solutions

### ❌ 間違った実装

#### 1. データの二重管理

```typescript
// BAD: Step間でデータを独自に管理
const [formData, setFormData] = useState({
  step1: {},
  step2: {},
  step3: {},
});

// Step2で参照
const form = useForm({
  defaultValues: formData.step2, // ❌ ローカル状態を参照
});
```

**問題点**:

- データの不整合が発生しやすい
- バックエンドの最新データと乖離する可能性

#### ✅ 正しい実装

```typescript
// GOOD: 全ステップで共通のデータフックを使用
const { data, fetching } = useFormData(id);

const form = useForm();

useEffect(() => {
  if (!data) return;
  const defaultValues = buildFormDefaultValues(data);
  form.reset(defaultValues);
}, [data, form]);
```

---

#### 2. デフォルト値のタイミング

```typescript
// BAD: useFormの初期化時にデフォルト値をセット
const form = useForm({
  defaultValues: buildFormDefaultValues(data), // ❌ dataがundefinedの可能性
});
```

**問題点**:

- データ取得前にフォームが初期化される
- デフォルト値が反映されない

#### ✅ 正しい実装

```typescript
// GOOD: useEffectでデータ取得後にセット
const form = useForm({
  resolver: zodResolver(schema),
  // defaultValuesは指定しない
});

useEffect(() => {
  if (!data) return;
  form.reset(buildFormDefaultValues(data));
}, [data, form]);
```

---

#### 3. エラーハンドリングの不足

```typescript
// BAD: エラーを無視
const { error } = await executeUpdate(input);
// エラーチェックなし
router.push("/next-step"); // ❌ エラー時も遷移してしまう
```

#### ✅ 正しい実装

```typescript
// GOOD: 各mutationでエラーチェック
const { error } = await executeUpdate(input);

if (error) {
  // エラーメッセージを表示
  form.setError("root", {
    message: error.message || "更新に失敗しました",
  });
  return; // ここで処理を中断
}

// 成功時のみ遷移
router.push("/next-step");
```

---

#### 4. フォームの過剰な分割

**❌ 間違ったアプローチ:**

```typescript
// BAD: フォーム項目を細かくコンポーネント化
// TitleSection.tsx
export function TitleSection() {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name="title"
      render={({ field }) => <Input {...field} />}
    />
  );
}

// DateSection.tsx
export function DateSection() {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name="date"
      render={({ field }) => <Input type="date" {...field} />}
    />
  );
}

// step1-form.tsx
export function Step1Form() {
  const form = useForm();

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <TitleSection />    {/* どこで何してるか分からない */}
        <DateSection />     {/* submitはどこ？ */}
        <TicketSection />   {/* validationは？ */}
      </form>
    </FormProvider>
  );
}
```

**問題点:**

##### ① フォームは「1つの思考単位」

フォームの本質:

- 1つの state
- 1つの validation
- 1つの submit

ファイル分割すると、読む側は:

- どこで最終submitしてるの？
- validationどこ？

と迷う。

##### ② 状態の流れが追いにくくなる

フォームの本質的な流れ:

```
input → state → validation → submit
```

これが1ファイルにあれば**スクロールするだけで理解できる**。

分割すると:

- propsで渡る
- context経由
- custom hook経由

追うのが面倒。

##### ③ 分割すると"UIコンポーネント化"しすぎる

フォーム項目は**再利用しないことが多い**。

でも分けると:

```tsx
<FormTitle />
<FormDate />
```

って再利用前提っぽくなる。

実際は**そのページ専用**。抽象化コストが無駄。

##### ④ Reactは「構造」より「流れ」が重要

- **UIコンポーネント** → 分割OK
- **フォームのロジック** → 1ファイルが読みやすい

だから:

- **UI部品は分割**（Button, Input等）
- **フォームの流れは1ファイル**

が一番読みやすい。

##### ⑤ ファイルジャンプ回数が減る

読解コストの大半は:

- **何回ファイルを行き来するか**

1ファイル完結だと脳が楽。

**✅ 正しい実装:**

```typescript
// step1-form.tsx - 1ファイルで完結
export function Step1Form({ id }: { id: string }) {
  const { data, fetching } = useFormData(id);

  const form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
  });

  useEffect(() => {
    if (!data) return;
    form.reset(buildStep1FormDefaultValues(data));
  }, [data, form]);

  const { onSubmit } = useSubmitStep1(id);

  if (fetching) {
    return <div>読み込み中...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* タイトル - スクロールで流れが分かる */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>タイトル</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 日付 - 同じファイル内で完結 */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>日付</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* チケット情報 - 全体の流れが見える */}
        <div className="space-y-4">
          <h3>チケット情報</h3>
          {/* ... */}
        </div>

        {/* submit - 最後までスクロールすれば到達 */}
        <FooterButtons
          isSubmitting={form.formState.isSubmitting}
          onBack={() => window.history.back()}
        />
      </form>
    </Form>
  );
}
```

**じゃあ分けるべき時は？**

以下の場合**のみ**分割を検討:

1. **明確に複数ページで再利用する**
   - 例: アドレス入力フォーム（ユーザー登録、注文、設定で使う）

2. **完全に独立したセクション**
   - 例: モーダル内のフォーム（親フォームとは別のsubmit）

それ以外は**1ファイルで完結させる**のが読みやすい。

---

## Checklist

実装前に確認:

- [ ] 全ステップで共通のデータ取得フックを使用
- [ ] ステップごとに独立したZodスキーマを定義
- [ ] GraphQLデータ→フォーム形式の変換ヘルパーを作成
- [ ] `useEffect`でデータ取得後にデフォルト値をセット
- [ ] 成功時のみ次のステップへ遷移
- [ ] ローディング状態を適切に表示
- [ ] `isSubmitting`でボタンを無効化

---

## References

- [React Hook Form - useFieldArray](https://react-hook-form.com/api/usefieldarray)
- [Zod - Schema Validation](https://zod.dev/)
- [Next.js - Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [urql - Mutations](https://formidable.com/open-source/urql/docs/basics/mutations/)
