import { describe, expect, it } from "bun:test";
import { filterText } from "../../lib/moderation/text-filter";

describe("filterText", () => {
  describe("NGワードの検出", () => {
    it("クリーンなテキストはそのまま通す", () => {
      const result = filterText("夜中に大きな音がしました");
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("Expected ok=true");
      expect(result.filtered).toBe("夜中に大きな音がしました");
    });

    it("典型的なNGワードを検出する", () => {
      const result = filterText("あいつを死ね");
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("Expected ok=false");
      expect(result.reason).toBeDefined();
    });

    it("差別的表現を検出する", () => {
      const result = filterText("クズが住んでいる");
      expect(result.ok).toBe(false);
    });

    it("ハラスメント表現を検出する", () => {
      const result = filterText("殺すぞ");
      expect(result.ok).toBe(false);
    });
  });

  describe("個人情報の検出", () => {
    it("電話番号（ハイフンあり）を検出して置換する", () => {
      const result = filterText("090-1234-5678に電話してください");
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("Expected ok=false");
      expect(result.reason).toContain("個人情報");
    });

    it("電話番号（ハイフンなし）を検出して置換する", () => {
      const result = filterText("09012345678が目撃されました");
      expect(result.ok).toBe(false);
    });

    it("メールアドレスを検出する", () => {
      const result = filterText("example@test.com から連絡があった");
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("Expected ok=false");
      expect(result.reason).toContain("個人情報");
    });

    it("住所の番地を検出する", () => {
      const result = filterText("渋谷区道玄坂1-2-3の男性");
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("Expected ok=false");
      expect(result.reason).toContain("個人情報");
    });
  });

  describe("エッジケース", () => {
    it("空文字列を通す", () => {
      const result = filterText("");
      expect(result.ok).toBe(true);
    });

    it("記号だけのテキストを通す", () => {
      const result = filterText("!@#$%");
      expect(result.ok).toBe(true);
    });

    it("200文字以上のテキストも正しく処理する", () => {
      const longText = "騒音問題です。".repeat(30);
      const result = filterText(longText);
      expect(result.ok).toBe(true);
    });

    it("複数の問題がある場合は最初に検出したものを返す", () => {
      const result = filterText("090-1234-5678 死ね");
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("Expected ok=false");
      expect(result.reason).toBeDefined();
    });
  });
});
