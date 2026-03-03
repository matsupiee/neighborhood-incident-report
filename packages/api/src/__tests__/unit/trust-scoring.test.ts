import { describe, expect, it } from "bun:test";
import { isHighTrust } from "../../lib/trust/scoring";

describe("Trust Scoring - isHighTrust", () => {
  it("score=80はtrueを返す（境界値テスト）", () => {
    expect(isHighTrust(80)).toBe(true);
  });

  it("score=79はfalseを返す", () => {
    expect(isHighTrust(79)).toBe(false);
  });

  it("score=100はtrueを返す", () => {
    expect(isHighTrust(100)).toBe(true);
  });

  it("score=0はfalseを返す", () => {
    expect(isHighTrust(0)).toBe(false);
  });

  it("score=81はtrueを返す", () => {
    expect(isHighTrust(81)).toBe(true);
  });

  it("負のスコアはfalseを返す", () => {
    expect(isHighTrust(-1)).toBe(false);
  });

  it("高いスコア（100以上）もtrueを返す", () => {
    expect(isHighTrust(150)).toBe(true);
  });
});
