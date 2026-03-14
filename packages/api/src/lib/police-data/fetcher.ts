/** 東京都オープンデータカタログ CKAN API ベースURL */
const TOKYO_OPEN_DATA_BASE = "https://catalog.data.metro.tokyo.lg.jp/api/3/action";

/** メールけいしちょう犯罪発生情報 データセット ID */
const MAIL_KEISHICHO_DATASET_ID = "t000022d0000000033";

interface CKANResource {
  id: string;
  name: string;
  format: string;
  url: string;
  created: string;
}

interface CKANPackageShowResponse {
  success: boolean;
  result: {
    resources: CKANResource[];
  };
}

/**
 * 東京都オープンデータカタログから最新のメールけいしちょう CSV を取得する。
 * CSV が Shift-JIS エンコードの場合は自動的に UTF-8 に変換する。
 */
export async function fetchLatestPoliceDataCsv(): Promise<string> {
  const metaUrl = `${TOKYO_OPEN_DATA_BASE}/package_show?id=${MAIL_KEISHICHO_DATASET_ID}`;
  const metaRes = await fetch(metaUrl);

  if (!metaRes.ok) {
    throw new Error(`Tokyo Open Data API error: ${metaRes.status} ${metaRes.statusText}`);
  }

  const meta = (await metaRes.json()) as CKANPackageShowResponse;
  if (!meta.success) {
    throw new Error("Tokyo Open Data API returned success: false");
  }

  const csvResources = meta.result.resources
    .filter((r) => r.format.toUpperCase() === "CSV")
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

  if (!csvResources.length) {
    throw new Error("No CSV resources found in メールけいしちょう dataset");
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const csvUrl = csvResources[0]!.url;
  const csvRes = await fetch(csvUrl);

  if (!csvRes.ok) {
    throw new Error(`CSV download failed: ${csvRes.status} from ${csvUrl}`);
  }

  const buffer = await csvRes.arrayBuffer();

  // 政府系CSVはShift-JISが多いため先に試みる
  try {
    return new TextDecoder("shift-jis").decode(buffer);
  } catch {
    return new TextDecoder("utf-8").decode(buffer);
  }
}
