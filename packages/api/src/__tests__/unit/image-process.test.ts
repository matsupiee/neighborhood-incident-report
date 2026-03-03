import { describe, expect, it } from "bun:test";
import { processImage } from "../../lib/image/process";

describe("Image Processing - processImage", () => {
  it("URLを受け取って文字列を返す", async () => {
    const imageUrl = "https://example.com/image.jpg";
    const result = await processImage(imageUrl);
    expect(typeof result).toBe("string");
  });

  it("入力URLと同じURLを返す（開発環境簡易実装）", async () => {
    const imageUrl = "https://example.com/image.jpg";
    const result = await processImage(imageUrl);
    expect(result).toBe(imageUrl);
  });

  it("異なるURLを処理してもそれぞれ異なる結果を返す", async () => {
    const url1 = "https://example.com/image1.jpg";
    const url2 = "https://example.com/image2.jpg";

    const result1 = await processImage(url1);
    const result2 = await processImage(url2);

    expect(result1).toBe(url1);
    expect(result2).toBe(url2);
    expect(result1).not.toBe(result2);
  });

  it("空文字列をハンドルできる", async () => {
    const result = await processImage("");
    expect(typeof result).toBe("string");
  });

  it("異なるフォーマットのURLをハンドルできる", async () => {
    const urls = [
      "https://example.com/image.jpg",
      "https://example.com/image.png",
      "https://example.com/image.webp",
      "https://example.com/image",
    ];

    for (const url of urls) {
      const result = await processImage(url);
      expect(typeof result).toBe("string");
    }
  });
});
