export interface ParsedPoliceIncident {
  externalId: string;
  address: string;
  timeRange: "MIDNIGHT" | "MORNING" | "DAYTIME" | "EVENING" | "NIGHT_EARLY" | "NIGHT_LATE";
  crimeType: string;
  occurredAt: Date;
  description: string;
}

/** 時刻（hour）を TimeRange enum 値に変換 */
function toTimeRange(hour: number): ParsedPoliceIncident["timeRange"] {
  if (hour < 6) return "MIDNIGHT";
  if (hour < 10) return "MORNING";
  if (hour < 16) return "DAYTIME";
  if (hour < 20) return "EVENING";
  if (hour < 22) return "NIGHT_EARLY";
  return "NIGHT_LATE";
}

/**
 * 警察の犯罪種別を IncidentCategory ID にマッピングする。
 * シードデータ（packages/db/src/seeds/categories.ts）の ID と一致させること。
 */
export function mapCrimeTypeToCategory(crimeType: string): string {
  if (/ひったくり|強盗|暴行|脅迫|恐喝|不審者|声かけ|つきまとい/.test(crimeType)) {
    return "cat_dangerous";
  }
  return "cat_other";
}

/** CSV の1行をカンマ区切りでパース（ダブルクォート対応） */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ""));
  return result;
}

/** メール本文から発生場所を抽出 */
function extractLocation(body: string): string | null {
  const patterns = [
    /発生場所[　\s:：]*([^\n●▼◆]+)/,
    /場所[　\s:：]*([^\n●▼◆]+)/,
    /住所[　\s:：]*([^\n●▼◆]+)/,
  ];
  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return null;
}

/** メール本文から犯行の手口を抽出 */
function extractCrimeType(body: string): string {
  const patterns = [
    /犯行の手口[　\s:：]*([^\n●▼◆]+)/,
    /手口[　\s:：]*([^\n●▼◆]+)/,
    /種別[　\s:：]*([^\n●▼◆]+)/,
  ];
  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return "その他";
}

/** メール本文から時刻（hour）を抽出。不明な場合は昼12時を返す */
function extractHour(body: string): number {
  const match = body.match(/(\d{1,2})時/);
  return match?.[1] ? parseInt(match[1], 10) : 12;
}

/**
 * 日付文字列を Date に変換する。
 * 対応フォーマット: YYYY/MM/DD, YYYY-MM-DD, R6年8月3日（令和）, 令和6年8月3日
 */
function parseJapaneseDate(dateStr: string): Date | null {
  // ISO系: YYYY/MM/DD または YYYY-MM-DD
  const isoMatch = dateStr.match(/(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})/);
  if (isoMatch?.[1] && isoMatch[2] && isoMatch[3]) {
    return new Date(
      parseInt(isoMatch[1], 10),
      parseInt(isoMatch[2], 10) - 1,
      parseInt(isoMatch[3], 10),
    );
  }

  // 令和 (R 表記): R6年8月3日
  const reiwaShortMatch = dateStr.match(/R(\d+)年(\d+)月(\d+)日/);
  if (reiwaShortMatch?.[1] && reiwaShortMatch[2] && reiwaShortMatch[3]) {
    const year = 2018 + parseInt(reiwaShortMatch[1], 10);
    return new Date(year, parseInt(reiwaShortMatch[2], 10) - 1, parseInt(reiwaShortMatch[3], 10));
  }

  // 令和 (漢字表記): 令和6年8月3日
  const reiwaKanjiMatch = dateStr.match(/令和(\d+)年(\d+)月(\d+)日/);
  if (reiwaKanjiMatch?.[1] && reiwaKanjiMatch[2] && reiwaKanjiMatch[3]) {
    const year = 2018 + parseInt(reiwaKanjiMatch[1], 10);
    return new Date(year, parseInt(reiwaKanjiMatch[2], 10) - 1, parseInt(reiwaKanjiMatch[3], 10));
  }

  return null;
}

/**
 * 警察オープンデータ CSV をパースして構造化データに変換する。
 *
 * メールけいしちょう形式（東京都オープンデータカタログ）を想定:
 * カラム例: 送信日時, 発生カテゴリ, メール本文
 *
 * 発生場所・手口はメール本文から正規表現で抽出するため、
 * 本文フォーマットが変わった場合は extractLocation / extractCrimeType を更新すること。
 */
export function parsePoliceDataCsv(csv: string): ParsedPoliceIncident[] {
  const lines = csv.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]!).map((h) => h.trim());
  const incidents: ParsedPoliceIncident[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]!);
    if (cols.length < 2) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });

    // 日時: 送信日時 / 発生年月日 などを試みる
    const dateStr = row["送信日時"] || row["発生年月日"] || row["date"] || cols[0] || "";
    if (!dateStr) continue;

    const occurredAt = parseJapaneseDate(dateStr);
    if (!occurredAt) continue;

    // 発生場所: 専用カラム優先、なければメール本文から抽出
    const body = row["メール本文"] || row["内容"] || cols[cols.length - 1] || "";
    const rawAddress =
      row["発生場所"] || row["場所"] || row["address"] || extractLocation(body) || "";
    if (!rawAddress) continue;

    // 犯罪種別
    const crimeType = row["発生カテゴリ"] || row["手口"] || row["種別"] || extractCrimeType(body);

    const hour = extractHour(body);

    // 重複排除キー（200文字以内）
    const externalId = `police_${dateStr}_${rawAddress}_${crimeType}`
      .replace(/[\s\n\r]/g, "_")
      .slice(0, 200);

    const description = `${crimeType}が発生しました。発生場所: ${rawAddress}`.slice(0, 200);

    incidents.push({
      externalId,
      address: rawAddress.startsWith("東京都") ? rawAddress : `東京都${rawAddress}`,
      timeRange: toTimeRange(hour),
      crimeType,
      occurredAt,
      description,
    });
  }

  return incidents;
}
