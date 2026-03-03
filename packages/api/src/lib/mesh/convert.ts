/**
 * 緯度経度を日本の標準地域メッシュコード（3次メッシュ、8桁）に変換する。
 *
 * JIS X 0410 準拠。約1km×1km の精度。
 * プライバシー保護のため、生座標の代わりにメッシュコードをDBに保存すること。
 *
 * @see https://www.stat.go.jp/data/mesh/pdf/gaiyo1.pdf
 */
export function toMeshCode(lat: number, lng: number): string {
  // 1次メッシュ（約80km×80km）
  const p = Math.floor(lat * 1.5);
  const u = Math.floor(lng - 100);

  const latRem1 = lat * 1.5 - p;
  const lngRem1 = lng - 100 - u;

  // 2次メッシュ（約10km×10km）
  const q = Math.floor(latRem1 * 8);
  const v = Math.floor(lngRem1 * 8);

  const latRem2 = latRem1 * 8 - q;
  const lngRem2 = lngRem1 * 8 - v;

  // 3次メッシュ（約1km×1km）
  const r = Math.floor(latRem2 * 10);
  const w = Math.floor(lngRem2 * 10);

  return `${p}${u}${q}${v}${r}${w}`;
}

/**
 * 3次メッシュコード（8桁）からメッシュセルの中心座標（緯度経度）を返す。
 *
 * toMeshCode の逆変換。マップ上にヒートマップを描画する際に使用する。
 */
export function meshCodeToCenter(meshCode: string): {
  lat: number;
  lng: number;
} {
  const p = parseInt(meshCode.slice(0, 2), 10);
  const u = parseInt(meshCode.slice(2, 4), 10);
  const q = parseInt(meshCode.slice(4, 5), 10);
  const v = parseInt(meshCode.slice(5, 6), 10);
  const r = parseInt(meshCode.slice(6, 7), 10);
  const w = parseInt(meshCode.slice(7, 8), 10);

  // 各メッシュ区画の中心を計算（+0.5 で区画の中心に）
  const lat = (p + (q + (r + 0.5) / 10) / 8) / 1.5;
  const lng = u + 100 + (v + (w + 0.5) / 10) / 8;

  return { lat, lng };
}
