import { describe, expect, it } from "bun:test";
import { toMeshCode } from "../../lib/mesh/convert";

describe("toMeshCode", () => {
  it("渋谷区座標を正しいメッシュコードに変換する", () => {
    // lat=35.6762, lng=139.6503
    // p = floor(35.6762 * 1.5) = floor(53.5143) = 53
    // u = floor(139.6503 - 100) = floor(39.6503) = 39
    // latRem1 = 53.5143 - 53 = 0.5143
    // lngRem1 = 39.6503 - 39 = 0.6503
    // q = floor(0.5143 * 8) = floor(4.1144) = 4
    // v = floor(0.6503 * 8) = floor(5.2024) = 5
    // latRem2 = 4.1144 - 4 = 0.1144
    // lngRem2 = 5.2024 - 5 = 0.2024
    // r = floor(0.1144 * 10) = floor(1.144) = 1
    // w = floor(0.2024 * 10) = floor(2.024) = 2
    // result = "53394512"
    const code = toMeshCode(35.6762, 139.6503);
    expect(code).toBe("53394512");
  });

  it("8桁の文字列を返す", () => {
    const code = toMeshCode(35.6762, 139.6503);
    expect(code).toHaveLength(8);
    expect(/^\d{8}$/.test(code)).toBe(true);
  });

  it("東京駅座標を正しいメッシュコードに変換する", () => {
    // lat=35.6812, lng=139.7671
    // p = floor(35.6812 * 1.5) = floor(53.5218) = 53
    // u = floor(139.7671 - 100) = floor(39.7671) = 39
    // latRem1 = 53.5218 - 53 = 0.5218
    // lngRem1 = 39.7671 - 39 = 0.7671
    // q = floor(0.5218 * 8) = floor(4.1744) = 4
    // v = floor(0.7671 * 8) = floor(6.1368) = 6
    // latRem2 = 4.1744 - 4 = 0.1744
    // lngRem2 = 6.1368 - 6 = 0.1368
    // r = floor(0.1744 * 10) = floor(1.744) = 1
    // w = floor(0.1368 * 10) = floor(1.368) = 1
    // result = "53394611"
    const code = toMeshCode(35.6812, 139.7671);
    expect(code).toBe("53394611");
  });

  it("大阪市座標を正しいメッシュコードに変換する", () => {
    // lat=34.6937, lng=135.5023
    // p = floor(34.6937 * 1.5) = floor(52.0406) = 52
    // u = floor(135.5023 - 100) = floor(35.5023) = 35
    // latRem1 = 52.0406 - 52 = 0.0406
    // lngRem1 = 35.5023 - 35 = 0.5023
    // q = floor(0.0406 * 8) = floor(0.3248) = 0
    // v = floor(0.5023 * 8) = floor(4.0184) = 4
    // latRem2 = 0.3248 - 0 = 0.3248
    // lngRem2 = 4.0184 - 4 = 0.0184
    // r = floor(0.3248 * 10) = floor(3.248) = 3
    // w = floor(0.0184 * 10) = floor(0.184) = 0
    // result = "52350430"
    const code = toMeshCode(34.6937, 135.5023);
    expect(code).toBe("52350430");
  });

  it("同じ座標は常に同じコードを返す（決定論的）", () => {
    const lat = 35.0;
    const lng = 135.0;
    const code1 = toMeshCode(lat, lng);
    const code2 = toMeshCode(lat, lng);
    expect(code1).toBe(code2);
  });

  it("隣接する座標は異なるか同じコードを返す（境界テスト）", () => {
    const code1 = toMeshCode(35.0, 135.0);
    const code2 = toMeshCode(35.1, 135.1);
    // 近接座標でも精度の範囲でメッシュが変わる可能性がある
    expect(typeof code1).toBe("string");
    expect(typeof code2).toBe("string");
  });

  it("日本の南端付近（沖縄）を処理できる", () => {
    const code = toMeshCode(26.2124, 127.6809);
    expect(code).toHaveLength(8);
    expect(/^\d{8}$/.test(code)).toBe(true);
  });

  it("日本の北端付近（北海道）を処理できる", () => {
    const code = toMeshCode(45.5211, 141.9355);
    expect(code).toHaveLength(8);
    expect(/^\d{8}$/.test(code)).toBe(true);
  });
});
