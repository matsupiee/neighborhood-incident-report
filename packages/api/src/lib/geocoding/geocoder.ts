const GSI_GEOCODING_URL = "https://msearch.gsi.go.jp/address-search/AddressSearch";

interface GSIFeature {
  geometry: {
    coordinates: [number, number]; // [longitude, latitude]
    type: "Point";
  };
  type: "Feature";
  properties: {
    addressCode: string;
    title: string;
  };
}

/**
 * 住所文字列を緯度経度に変換する。
 * 国土地理院 住所検索 API を使用（無料・登録不要）。
 * @see https://msearch.gsi.go.jp/
 *
 * @returns 緯度経度、または変換できなかった場合は null
 */
export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const url = `${GSI_GEOCODING_URL}?q=${encodeURIComponent(address)}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const results = (await res.json()) as GSIFeature[];
  if (!results.length) return null;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const [lng, lat] = results[0]!.geometry.coordinates;
  return { lat, lng };
}
