import prisma from "@neighborhood-incident-report/db";
import { ORPCError } from "@orpc/server";

import { toMeshCode } from "../../lib/mesh/convert";
import { filterText } from "../../lib/moderation/text-filter";
import { calculateTrustScore, isHighTrust } from "../../lib/trust/scoring";
import { checkPostRateLimit } from "../../middleware/rate-limit";
import type {
  IncidentCreateInput,
  IncidentHeatmapInput,
  IncidentListInput,
  IncidentReportAbuseInput,
} from "./_schemas";

// ヒートマップのキャッシュ遅延（6時間）
const HEATMAP_DELAY_MS = 6 * 60 * 60 * 1000;

// 通報3件で自動非表示
const ABUSE_AUTO_HIDE_THRESHOLD = 3;

export async function createIncident(
  input: IncidentCreateInput,
  userId: string,
) {
  // 1. レートリミット確認（1日5件）
  await checkPostRateLimit(userId);

  // 2. 緯度経度 → meshCode 変換（生座標はここで破棄）
  const meshCode = toMeshCode(input.latitude, input.longitude);

  // 3. NGワード・個人情報フィルタ
  const filterResult = filterText(input.description);
  if (!filterResult.ok) {
    throw new ORPCError("BAD_REQUEST", { message: filterResult.reason });
  }

  // 4. トラストスコアを計算
  const trustScore = await calculateTrustScore(userId);

  // 5. trustScore >= 80 の場合は6時間後に自動公開予定、< 80 ならモデレーター確認待ち
  const publishedAt = isHighTrust(trustScore)
    ? new Date(Date.now() + 6 * 60 * 60 * 1000)
    : null;

  // 6. Post を作成
  return await prisma.post.create({
    data: {
      meshCode,
      description: filterResult.filtered,
      timeRange: input.timeRange,
      imageUrl: input.imageUrl,
      status: "PENDING",
      publishedAt,
      userId,
      incidentCategoryPosts: {
        create: input.categoryIds.map((categoryId) => ({
          incidentCategoryId: categoryId,
        })),
      },
    },
    select: {
      id: true,
      meshCode: true,
      description: true,
      timeRange: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function listIncidents(input: IncidentListInput) {
  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      ...(input.categoryId && {
        incidentCategoryPosts: {
          some: { incidentCategoryId: input.categoryId },
        },
      }),
    },
    orderBy: { publishedAt: "desc" },
    take: input.limit + 1,
    ...(input.cursor && {
      cursor: { id: input.cursor },
      skip: 1,
    }),
    select: {
      id: true,
      meshCode: true,
      description: true,
      timeRange: true,
      publishedAt: true,
      incidentCategoryPosts: {
        select: {
          incidentCategory: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  const hasMore = posts.length > input.limit;
  const items = hasMore ? posts.slice(0, input.limit) : posts;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return { items, nextCursor };
}

export async function getHeatmap(input: IncidentHeatmapInput) {
  // 最低6時間前に公開されたデータのみ集計
  const cutoff = new Date(Date.now() - HEATMAP_DELAY_MS);
  const sinceDate = input.since ? new Date(input.since) : undefined;

  const grouped = await prisma.post.groupBy({
    by: ["meshCode"],
    where: {
      status: "PUBLISHED",
      publishedAt: {
        lte: cutoff,
        ...(sinceDate && { gte: sinceDate }),
      },
    },
    _count: { meshCode: true },
  });

  return grouped.map(
    (row: { meshCode: string; _count: { meshCode: number } }) => ({
      meshCode: row.meshCode,
      count: row._count.meshCode,
    }),
  );
}

export async function listCategories() {
  return await prisma.incidentCategory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function reportAbuse(
  input: IncidentReportAbuseInput,
  userId: string,
) {
  // 投稿の存在確認
  const post = await prisma.post.findUnique({
    where: { id: input.postId },
    select: { id: true, status: true },
  });

  if (!post) {
    throw new ORPCError("NOT_FOUND", { message: "投稿が見つかりません" });
  }

  if (post.status === "HIDDEN") {
    throw new ORPCError("BAD_REQUEST", {
      message: "この投稿はすでに非表示です",
    });
  }

  // AbuseReport を作成（同一ユーザーは1投稿につき1回のみ）
  await prisma.abuseReport.create({
    data: {
      postId: input.postId,
      userId,
      reason: input.reason,
    },
  });

  // 通報件数を確認し、閾値を超えたら自動非表示
  const abuseCount = await prisma.abuseReport.count({
    where: { postId: input.postId },
  });

  if (abuseCount >= ABUSE_AUTO_HIDE_THRESHOLD) {
    await prisma.post.update({
      where: { id: input.postId },
      data: { status: "HIDDEN" },
    });
  }

  return { reported: true };
}
