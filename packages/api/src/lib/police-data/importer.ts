import prisma from "@neighborhood-incident-report/db";

import { geocodeAddress } from "../geocoding/geocoder";
import { toMeshCode } from "../mesh/convert";
import { fetchLatestPoliceDataCsv } from "./fetcher";
import { mapCrimeTypeToCategory, parsePoliceDataCsv } from "./parser";

/** packages/db/src/seeds/system-user.ts の SYSTEM_USER_ID と一致させること */
const SYSTEM_USER_ID = "system_police_data_user";

/** 国土地理院 API へのリクエスト間隔（レートリミット対策） */
const GEOCODE_DELAY_MS = 500;

export interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 東京都オープンデータから警察犯罪情報を取得し、Post として保存する。
 *
 * - externalId が既に存在する場合はスキップ（冪等）
 * - ジオコーディングに失敗した場合はその行をスキップ
 * - システムユーザーが存在しない場合は全件スキップ（要: bun run db:seed）
 */
export async function runPoliceDataImport(): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, failed: 0, errors: [] };

  // 1. CSV 取得
  let csv: string;
  try {
    csv = await fetchLatestPoliceDataCsv();
  } catch (err) {
    result.errors.push(`CSV fetch failed: ${String(err)}`);
    result.failed++;
    return result;
  }

  // 2. パース
  const incidents = parsePoliceDataCsv(csv);
  console.log(`[PoliceDataImport] Parsed ${incidents.length} incidents`);

  if (!incidents.length) return result;

  // 3. システムユーザーの存在確認
  const systemUser = await prisma.user.findUnique({
    where: { id: SYSTEM_USER_ID },
    select: { id: true },
  });
  if (!systemUser) {
    const msg = `System user not found: ${SYSTEM_USER_ID}. Run: bun run db:seed`;
    console.error(`[PoliceDataImport] ${msg}`);
    result.errors.push(msg);
    result.failed = incidents.length;
    return result;
  }

  // 4. 各インシデントをインポート
  for (const incident of incidents) {
    // 重複チェック（externalId が一致するものは skip）
    const existing = await prisma.post.findUnique({
      where: { externalId: incident.externalId },
      select: { id: true },
    });
    if (existing) {
      result.skipped++;
      continue;
    }

    // ジオコーディング（国土地理院 API）
    await sleep(GEOCODE_DELAY_MS);
    const coords = await geocodeAddress(incident.address);
    if (!coords) {
      result.failed++;
      result.errors.push(`Geocoding failed: ${incident.address}`);
      continue;
    }

    const meshCode = toMeshCode(coords.lat, coords.lng);
    const categoryId = mapCrimeTypeToCategory(incident.crimeType);

    try {
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
      result.imported++;
    } catch (err) {
      result.failed++;
      result.errors.push(`DB insert failed for ${incident.externalId}: ${String(err)}`);
    }
  }

  console.log(
    `[PoliceDataImport] Done: imported=${result.imported} skipped=${result.skipped} failed=${result.failed}`,
  );
  return result;
}
