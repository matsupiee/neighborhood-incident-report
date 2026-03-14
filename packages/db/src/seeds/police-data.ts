import { readFileSync } from "node:fs";
import { join } from "node:path";

import prisma from "../index";
import { SYSTEM_USER_ID } from "./system-user";

const SAMPLE_CSV_PATH = join(import.meta.dir, "data/police-sample.csv");
const GEOCODE_DELAY_MS = 500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// CSV パース（parser.ts のロジックをシード用にインライン化）
// ---------------------------------------------------------------------------

type TimeRange = "MIDNIGHT" | "MORNING" | "DAYTIME" | "EVENING" | "NIGHT_EARLY" | "NIGHT_LATE";

interface SampleIncident {
  externalId: string;
  address: string;
  timeRange: TimeRange;
  crimeType: string;
  occurredAt: Date;
  description: string;
}

function toTimeRange(hour: number): TimeRange {
  if (hour < 6) return "MIDNIGHT";
  if (hour < 10) return "MORNING";
  if (hour < 16) return "DAYTIME";
  if (hour < 20) return "EVENING";
  if (hour < 22) return "NIGHT_EARLY";
  return "NIGHT_LATE";
}

function mapCrimeTypeToCategory(crimeType: string): string {
  if (/ひったくり|強盗|暴行|脅迫|恐喝|不審者|声かけ|つきまとい/.test(crimeType)) {
    return "cat_dangerous";
  }
  return "cat_other";
}

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

function extractLocation(body: string): string | null {
  const match = body.match(/発生場所[　\s:：]*([^\n●▼◆]+)/);
  return match?.[1]?.trim() ?? null;
}

function extractCrimeType(body: string): string {
  const match = body.match(/犯行の手口[　\s:：]*([^\n●▼◆]+)/);
  return match?.[1]?.trim() ?? "その他";
}

function extractHour(body: string): number {
  const match = body.match(/(\d{1,2})時/);
  return match?.[1] ? parseInt(match[1], 10) : 12;
}

function parseSampleCsv(csv: string): SampleIncident[] {
  const lines = csv.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]!).map((h) => h.trim());
  const incidents: SampleIncident[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]!);
    if (cols.length < 2) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });

    const dateStr = row["送信日時"] ?? cols[0] ?? "";
    if (!dateStr) continue;

    const isoMatch = dateStr.match(/(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})/);
    if (!isoMatch?.[1] || !isoMatch[2] || !isoMatch[3]) continue;
    const occurredAt = new Date(
      parseInt(isoMatch[1], 10),
      parseInt(isoMatch[2], 10) - 1,
      parseInt(isoMatch[3], 10),
    );

    const body = row["メール本文"] ?? cols[cols.length - 1] ?? "";
    const rawAddress = row["発生場所"] ?? extractLocation(body) ?? "";
    if (!rawAddress) continue;

    const crimeType = row["発生カテゴリ"] ?? extractCrimeType(body);
    const hour = extractHour(body);

    const externalId = `sample_${dateStr}_${rawAddress}_${crimeType}`
      .replace(/[\s\n\r]/g, "_")
      .slice(0, 200);

    incidents.push({
      externalId,
      address: rawAddress.startsWith("東京都") ? rawAddress : `東京都${rawAddress}`,
      timeRange: toTimeRange(hour),
      crimeType,
      occurredAt,
      description: `${crimeType}が発生しました。発生場所: ${rawAddress}`.slice(0, 200),
    });
  }

  return incidents;
}

// ---------------------------------------------------------------------------
// ジオコーディング（国土地理院 API）
// ---------------------------------------------------------------------------

interface GSIFeature {
  geometry: { coordinates: [number, number] };
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(address)}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const results = (await res.json()) as GSIFeature[];
  if (!results.length) return null;
  const [lng, lat] = results[0]!.geometry.coordinates;
  return { lat, lng };
}

// ---------------------------------------------------------------------------
// メッシュコード変換（lib/mesh/convert.ts と同ロジック）
// ---------------------------------------------------------------------------

function toMeshCode(lat: number, lng: number): string {
  const p = Math.floor(lat * 1.5);
  const u = Math.floor(lng) - 100;
  const q = Math.floor((lat * 1.5 - p) * 8);
  const v = Math.floor((lng - Math.floor(lng)) * 8);
  const r = Math.floor((lat * 1.5 - p - q / 8) * 80);
  const w = Math.floor((lng - Math.floor(lng) - v / 8) * 80);
  return `${p}${u}${q}${v}${r}${w}`;
}

// ---------------------------------------------------------------------------
// シード本体
// ---------------------------------------------------------------------------

export async function seedPoliceData() {
  const csv = readFileSync(SAMPLE_CSV_PATH, "utf-8");
  const incidents = parseSampleCsv(csv);

  console.log(`[seedPoliceData] Parsed ${incidents.length} incidents from sample CSV`);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const incident of incidents) {
    const existing = await prisma.post.findUnique({
      where: { externalId: incident.externalId },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }

    await sleep(GEOCODE_DELAY_MS);
    const coords = await geocodeAddress(incident.address);
    if (!coords) {
      console.warn(`[seedPoliceData] Geocoding failed: ${incident.address}`);
      failed++;
      continue;
    }

    const meshCode = toMeshCode(coords.lat, coords.lng);
    const categoryId = mapCrimeTypeToCategory(incident.crimeType);

    await prisma.post.create({
      data: {
        meshCode,
        description: incident.description,
        timeRange: incident.timeRange,
        status: "PUBLISHED",
        publishedAt: incident.occurredAt,
        userId: SYSTEM_USER_ID,
        externalId: incident.externalId,
        incidentCategoryPosts: {
          create: [{ incidentCategoryId: categoryId }],
        },
      },
    });
    imported++;
  }

  console.log(`[seedPoliceData] Done: imported=${imported} skipped=${skipped} failed=${failed}`);
}

if (import.meta.main) {
  seedPoliceData()
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
