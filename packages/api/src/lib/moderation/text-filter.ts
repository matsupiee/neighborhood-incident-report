/**
 * NGワード・個人情報フィルター
 * インシデント投稿テキストの安全性検証を行う。
 */

export type FilterResult = { ok: true; filtered: string } | { ok: false; reason: string };

// 暴力・脅迫・差別的表現
const NG_WORDS = [
  "死ね",
  "殺す",
  "殺せ",
  "死んでしまえ",
  "クズ",
  "ゴミ",
  "消えろ",
  "氏ね",
] as const;

// 個人情報パターン
const PERSONAL_INFO_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  // 電話番号（ハイフンあり）例: 090-1234-5678, 03-1234-5678
  {
    pattern: /0\d{1,4}-\d{1,4}-\d{4}/,
    label: "電話番号",
  },
  // 電話番号（ハイフンなし）例: 09012345678
  {
    pattern: /0[789]0\d{8}/,
    label: "電話番号",
  },
  // メールアドレス
  {
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    label: "メールアドレス",
  },
  // 番地（数字-数字-数字 パターン）例: 1-2-3
  {
    pattern: /\d{1,4}-\d{1,4}-\d{1,4}/,
    label: "住所の番地",
  },
];

/**
 * テキストにNGワードや個人情報が含まれていないか検証する。
 *
 * @param text - 検証するテキスト
 * @returns FilterResult - ok=true なら通過、ok=false なら理由付きで拒否
 */
export function filterText(text: string): FilterResult {
  if (text.length === 0) {
    return { ok: true, filtered: text };
  }

  // 個人情報チェック
  for (const { pattern, label } of PERSONAL_INFO_PATTERNS) {
    if (pattern.test(text)) {
      return {
        ok: false,
        reason: `個人情報（${label}）が含まれています。個人を特定できる情報は投稿できません。`,
      };
    }
  }

  // NGワードチェック
  for (const word of NG_WORDS) {
    if (text.includes(word)) {
      return {
        ok: false,
        reason: "不適切な表現が含まれています。投稿内容を見直してください。",
      };
    }
  }

  return { ok: true, filtered: text };
}
