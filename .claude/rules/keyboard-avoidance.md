# Keyboard Avoidance in React Native (Expo)

## ルール

TextInput を含む画面では、キーボードが表示された際に入力欄が隠れないよう `KeyboardAwareScrollView` を使うこと。

## セットアップ

`react-native-keyboard-controller` がインストール済み。`_layout.tsx` で `<KeyboardProvider>` がアプリ全体をラップしているため、追加の設定は不要。

## パターン

```tsx
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

// ScrollView の代わりに KeyboardAwareScrollView を使う
<KeyboardAwareScrollView
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: 120 }}
  bottomOffset={80} // キーボード上端からの余白（スティッキーボタンがある場合はその高さ以上）
>
  {/* ...フォーム要素... */}
</KeyboardAwareScrollView>;
```

## `bottomOffset` の目安

- スティッキーボタンなし: `16`
- スティッキーボタンあり（高さ約56px）: `80` 以上

## NG パターン

```tsx
// ❌ 素の ScrollView はキーボードを考慮しない
<ScrollView>
  <TextInput ... />
</ScrollView>

// ❌ KeyboardAvoidingView は挙動がプラットフォームにより不安定
<KeyboardAvoidingView behavior="padding">
  <ScrollView>
    <TextInput ... />
  </ScrollView>
</KeyboardAvoidingView>
```

## 適用箇所

- `apps/native/app/screens/post-incident.tsx` — 詳細入力欄
- `apps/native/app/(auth)/sign-in.tsx` — ログインフォーム
- `apps/native/app/(auth)/sign-up.tsx` — 登録フォーム
